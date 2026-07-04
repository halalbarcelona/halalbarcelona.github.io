import { formatCurrency } from '../orders/orderCalculator.js';

export function createOwnerNotifier({ twilioClient, fromNumber, ownerNumber, restaurantName }) {
  return async function notifyOwner({ session, summary }) {
    const lines = summary.lines
      .map((line) => `${line.quantity}x ${line.name} — ${formatCurrency(line.lineTotal)}`)
      .join('\n');

    const customer = session.customerName ? `${session.customerName} (${session.phone})` : session.phone;
    const fulfilmentType = session.fulfilment?.type === 'delivery' ? 'Delivery' : 'Pickup';
    const fulfilmentNote = session.fulfilment?.note ? ` — ${session.fulfilment.note}` : '';

    const body = [
      `🧾 New order — ${restaurantName}`,
      `Customer: ${customer}`,
      `${fulfilmentType}${fulfilmentNote}`,
      '',
      lines,
      '',
      `Total: ${formatCurrency(summary.total)}`,
    ].join('\n');

    await twilioClient.messages.create({ from: fromNumber, to: ownerNumber, body });
  };
}
