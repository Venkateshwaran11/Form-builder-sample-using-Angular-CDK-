/**
 * WhatsApp Notification Service using Twilio WhatsApp API.
 */

const twilio = require('twilio');

async function sendWhatsAppAlert(message, variables = null) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+17372508034';
    let toNumber = process.env.MY_WHATSAPP_NUMBER || process.env.WHATSAPP_PHONE;
    const contentSid = process.env.TWILIO_CONTENT_SID;

    if (!accountSid || !authToken || !toNumber) {
      console.warn('[WhatsApp/Twilio] Skipped: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or MY_WHATSAPP_NUMBER not configured.');
      return false;
    }

    // Auto-format recipient with "whatsapp:" prefix and "+" if not present
    toNumber = toNumber.trim().replace(/\s+/g, '');
    if (!toNumber.startsWith('whatsapp:')) {
      const cleanPhone = toNumber.startsWith('+') ? toNumber : `+${toNumber}`;
      toNumber = `whatsapp:${cleanPhone}`;
    }

    const client = twilio(accountSid, authToken);

    // If ContentSid is available, use template sending (required by WhatsApp for outbound alerts)
    if (contentSid) {
      const contentVariables = variables || {
        '1': 'Cron Inactivity Check',
        '2': new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
      };

      const response = await client.messages.create({
        from: fromNumber,
        to: toNumber,
        contentSid: contentSid,
        contentVariables: JSON.stringify(contentVariables)
      });

      console.log(`📱 [WhatsApp/Twilio] Template alert sent successfully! SID: ${response.sid}`);
      return true;
    }

    // Otherwise standard message body
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber
    });

    console.log(`📱 [WhatsApp/Twilio] Alert sent successfully! SID: ${response.sid}`);
    return true;
  } catch (error) {
    console.error('❌ [WhatsApp/Twilio] Error sending message:', error.message);
    return false;
  }
}

module.exports = {
  sendWhatsAppAlert
};
