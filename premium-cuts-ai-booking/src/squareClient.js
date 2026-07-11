import { randomUUID } from 'node:crypto';
import { SquareClient, SquareEnvironment, SquareError } from 'square';
import { VALID_SERVICES } from './bookingValidation.js';

// Keep these in sync with src/shopInfo.js — that's what the chat quotes
// customers, this is what actually gets created in Square's catalog.
const SERVICE_DEFINITIONS = {
  Haircut: { description: 'Classic haircut, wash and style.', priceCents: 1800, durationMinutes: 30 },
  'Beard Trim': { description: 'Beard shape-up and trim.', priceCents: 1000, durationMinutes: 15 },
  Both: { description: 'Haircut and beard trim together.', priceCents: 2500, durationMinutes: 45 },
};

const DEFAULT_TEAM_MEMBER = { givenName: 'Alex', familyName: 'Barber' };

function createClient() {
  const environment =
    (process.env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

  return new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN, environment });
}

const client = createClient();

// Cached after the first successful setup — locationId, currency, the
// resolved Haircut/Beard Trim/Both service variation ids, and a default
// team member id. Re-fetched only once per process lifetime.
let cachedState = null;

async function resolveLocation() {
  const configuredId = process.env.SQUARE_LOCATION_ID;
  if (configuredId) {
    const { location } = await client.locations.get({ locationId: configuredId });
    return location;
  }

  const { locations } = await client.locations.list();
  if (!locations || locations.length === 0) {
    throw new Error('No Square locations found for this account. Set SQUARE_LOCATION_ID explicitly.');
  }
  return locations[0];
}

async function findExistingServices(locationId) {
  const { items } = await client.catalog.searchItems({
    enabledLocationIds: [locationId],
    productTypes: ['APPOINTMENTS_SERVICE'],
  });

  const found = {};
  for (const item of items || []) {
    const name = item.itemData?.name;
    const variation = item.itemData?.variations?.[0];
    if (name && VALID_SERVICES.includes(name) && variation) {
      found[name] = {
        variationId: variation.id,
        version: variation.version,
        durationMinutes: Math.round(Number(variation.itemVariationData.serviceDuration) / 60000),
      };
    }
  }
  return found;
}

async function createMissingServices(locationId, currency, missingNames) {
  const objects = missingNames.map((name) => {
    const def = SERVICE_DEFINITIONS[name];
    const slug = name.replace(/\s+/g, '');
    return {
      type: 'ITEM',
      id: `#${slug}Item`,
      presentAtLocationIds: [locationId],
      itemData: {
        name,
        description: def.description,
        productType: 'APPOINTMENTS_SERVICE',
        variations: [
          {
            type: 'ITEM_VARIATION',
            id: `#${slug}Variation`,
            presentAtLocationIds: [locationId],
            itemVariationData: {
              name: 'Regular',
              pricingType: 'FIXED_PRICING',
              priceMoney: { amount: BigInt(def.priceCents), currency },
              serviceDuration: def.durationMinutes * 60000,
              availableForBooking: true,
              inventoryAlertType: 'NONE',
            },
          },
        ],
      },
    };
  });

  await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [{ objects }],
  });
}

async function resolveTeamMember(locationId) {
  const { teamMembers } = await client.teamMembers.search({
    query: { filter: { locationIds: [locationId], status: 'ACTIVE' } },
  });

  if (teamMembers && teamMembers.length > 0) {
    return teamMembers[0].id;
  }

  const { teamMember } = await client.teamMembers.create({
    idempotencyKey: randomUUID(),
    teamMember: {
      ...DEFAULT_TEAM_MEMBER,
      assignedLocations: { assignmentType: 'EXPLICIT_LOCATIONS', locationIds: [locationId] },
    },
  });
  return teamMember.id;
}

/**
 * Ensures the Square location has the Haircut / Beard Trim / Both services
 * and at least one team member set up, creating whatever's missing. Cached
 * for the life of the process so this only does real work once.
 */
export async function ensureSetup() {
  if (cachedState) {
    return cachedState;
  }

  const location = await resolveLocation();
  const locationId = location.id;
  const currency = location.currency || 'USD';

  let services = await findExistingServices(locationId);
  const missing = VALID_SERVICES.filter((name) => !services[name]);
  if (missing.length > 0) {
    console.log(`Creating missing Square services: ${missing.join(', ')}`);
    await createMissingServices(locationId, currency, missing);
    services = await findExistingServices(locationId);
  }

  const teamMemberId = await resolveTeamMember(locationId);

  cachedState = { locationId, currency, services, teamMemberId };
  console.log(
    `Square setup ready — location ${locationId}, team member ${teamMemberId}, services: ${Object.keys(services).join(', ')}`
  );
  return cachedState;
}

function splitName(fullName) {
  const parts = String(fullName).trim().split(/\s+/);
  const givenName = parts.shift() || fullName;
  const familyName = parts.join(' ') || '-';
  return { givenName, familyName };
}

async function resolveCustomerId({ name, phone }) {
  const { customers } = await client.customers.search({
    query: { filter: { phoneNumber: { exact: phone } } },
  });

  if (customers && customers.length > 0) {
    return customers[0].id;
  }

  const { givenName, familyName } = splitName(name);
  const { customer } = await client.customers.create({
    idempotencyKey: randomUUID(),
    givenName,
    familyName,
    phoneNumber: phone,
  });
  return customer.id;
}

// Combines the separate date/time inputs into a single timestamp, treated
// as the server's local time (see README for the timezone caveat — a real
// deployment should resolve this against the Square location's timezone).
function combineDateTime(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export async function createSquareBooking({ name, phone, service, date, time }) {
  const state = await ensureSetup();
  const serviceInfo = state.services[service];
  if (!serviceInfo) {
    return { success: false, error: `Service "${service}" is not set up in Square yet.` };
  }

  const startAt = combineDateTime(date, time);
  const customerId = await resolveCustomerId({ name, phone });

  try {
    const { booking } = await client.bookings.create({
      idempotencyKey: randomUUID(),
      booking: {
        locationId: state.locationId,
        startAt,
        customerId,
        customerNote: `Booked via the Premium Cuts website (${name}).`,
        appointmentSegments: [
          {
            durationMinutes: serviceInfo.durationMinutes,
            serviceVariationId: serviceInfo.variationId,
            serviceVariationVersion: serviceInfo.version,
            teamMemberId: state.teamMemberId,
          },
        ],
      },
    });
    return { success: true, bookingId: booking.id };
  } catch (err) {
    if (err instanceof SquareError) {
      console.error('Square createBooking failed:', err.statusCode, err.body);
      return { success: false, error: 'That time may not be available — please try a different date or time.' };
    }
    throw err;
  }
}

export async function listSquareBookings() {
  const state = await ensureSetup();
  const serviceNameByVariationId = Object.fromEntries(
    Object.entries(state.services).map(([name, info]) => [info.variationId, name])
  );

  const bookings = [];
  const pageable = await client.bookings.list({ locationId: state.locationId });
  for await (const booking of pageable) {
    bookings.push(booking);
  }

  const customerCache = new Map();
  const rows = [];

  for (const booking of bookings) {
    const segment = booking.appointmentSegments?.[0];
    let customerName = 'Unknown';
    let customerPhone = '';

    if (booking.customerId) {
      if (!customerCache.has(booking.customerId)) {
        try {
          const { customer } = await client.customers.get({ customerId: booking.customerId });
          customerCache.set(booking.customerId, customer);
        } catch (err) {
          customerCache.set(booking.customerId, null);
        }
      }
      const customer = customerCache.get(booking.customerId);
      if (customer) {
        customerName = [customer.givenName, customer.familyName].filter(Boolean).join(' ') || 'Unknown';
        customerPhone = customer.phoneNumber || '';
      }
    }

    const startAt = booking.startAt ? new Date(booking.startAt) : null;

    rows.push({
      id: booking.id,
      name: customerName,
      phone: customerPhone,
      service: (segment && serviceNameByVariationId[segment.serviceVariationId]) || 'Unknown',
      date: startAt ? startAt.toISOString().split('T')[0] : '',
      time: startAt ? startAt.toISOString().split('T')[1].slice(0, 5) : '',
      created_at: booking.createdAt || '',
    });
  }

  rows.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
  return rows;
}
