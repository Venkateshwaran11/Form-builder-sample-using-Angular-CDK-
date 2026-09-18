/**
 * Telegram Notification Service
 * 100% Free, unlimited, and instant notifications via Telegram Bot API.
 */

async function sendTelegramAlert(message) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('[Telegram] Skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.');
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    const data = await response.json();
    if (data.ok) {
      console.log('✈️ [Telegram] Alert sent successfully!');
      return true;
    } else {
      console.error('❌ [Telegram] Failed to send message:', data.description);
      return false;
    }
  } catch (error) {
    console.error('❌ [Telegram] Error sending message:', error.message);
    return false;
  }
}

module.exports = {
  sendTelegramAlert
};
