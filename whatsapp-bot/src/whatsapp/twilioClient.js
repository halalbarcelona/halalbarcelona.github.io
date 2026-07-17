import twilio from 'twilio';

export function createTwilioClient({ twilioAccountSid, twilioAuthToken }) {
  return twilio(twilioAccountSid, twilioAuthToken);
}

export function validateTwilioSignature({ authToken, signature, url, params }) {
  return twilio.validateRequest(authToken, signature, url, params);
}
