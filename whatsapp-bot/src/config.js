import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER',
  'OWNER_WHATSAPP_NUMBER',
  'ANTHROPIC_API_KEY',
  'PUBLIC_BASE_URL',
];

function loadConfig() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(
      `Warning: missing environment variables: ${missing.join(', ')}. ` +
        'See .env.example — the server will start but WhatsApp/Claude calls will fail.'
    );
  }

  return {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    ownerWhatsappNumber: process.env.OWNER_WHATSAPP_NUMBER,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    publicBaseUrl: process.env.PUBLIC_BASE_URL,
    port: Number(process.env.PORT) || 3000,
  };
}

export const config = loadConfig();
