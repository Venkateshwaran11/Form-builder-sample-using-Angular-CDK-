const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');
const { sendWhatsAppAlert } = require('./whatsappService');

/**
 * Checks all active users whose last login date is older than 7 days,
 * sets their status to inactive, and sends an email notification.
 * 
 * @returns {Promise<{ deactivatedCount: number, users: string[] }>}
 */
async function checkAndDeactivateInactiveUsers() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`[Inactivity Cron] Checking for users inactive since before: ${oneWeekAgo.toISOString()}`);

    // Find users who are active but haven't logged in for over 7 days
    const inactiveUsers = await User.find({
      isActive: true,
      $or: [
        { lastLogin: { $lt: oneWeekAgo } },
        { lastLogin: { $exists: false }, createdAt: { $lt: oneWeekAgo } },
        { lastLogin: null, createdAt: { $lt: oneWeekAgo } }
      ]
    });

    console.log(`[Inactivity Cron] Found ${inactiveUsers.length} user(s) to deactivate.`);

    const deactivatedUsernames = [];

    for (const user of inactiveUsers) {
      try {
        user.isActive = false;
        await user.save();
        deactivatedUsernames.push(user.username);
        console.log(`[Inactivity Cron] User "${user.username}" (${user.email}) marked as inactive.`);

        // Send email notice to the user
        await emailService.sendInactivityNoticeEmail({
          to: user.email,
          username: user.username,
          lastLoginDate: user.lastLogin || user.createdAt
        });
      } catch (err) {
        console.error(`[Inactivity Cron] Error processing user ${user.email}:`, err.message);
      }
    }

    const result = {
      deactivatedCount: deactivatedUsernames.length,
      users: deactivatedUsernames
    };

    // Send WhatsApp notification summary
    try {
      const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const userListStr = deactivatedUsernames.length > 0
        ? `\n👤 *Users:* ${deactivatedUsernames.join(', ')}`
        : '\nℹ️ No users met the 7-day inactivity threshold.';

      const alertMessage = `🔔 *Inactivity Cron Finished*\n` +
        `⏰ *Time:* ${timeStr} (IST)\n` +
        `📉 *Deactivated:* ${result.deactivatedCount} user(s)` +
        userListStr;

      await sendWhatsAppAlert(alertMessage, {
        '1': `${result.deactivatedCount} user(s) deactivated`,
        '2': timeStr
      });
    } catch (notifyErr) {
      console.error('[Inactivity Cron] WhatsApp notification failed:', notifyErr.message);
    }

    return result;
  } catch (error) {
    console.error('[Inactivity Cron] Error checking inactive users:', error);

    // Attempt WhatsApp alert on cron failure
    try {
      await sendWhatsAppAlert(`🚨 *Inactivity Cron Failed*\n❌ *Error:* ${error.message}`, {
        '1': 'Job Failed',
        '2': error.message.substring(0, 30)
      });
    } catch (_) {}

    throw error;
  }
}

/**
 * Initializes the scheduled cron job.
 * Default schedule: Every day at midnight ('0 0 * * *').
 * Can be overridden via INACTIVITY_CRON_SCHEDULE in .env.
 */
function initInactivityCron() {
  // Default: daily at midnight ('0 0 * * *')
  const cronSchedule = process.env.INACTIVITY_CRON_SCHEDULE || '0 0 * * *';

  cron.schedule(cronSchedule, async () => {
    console.log(`⏰ [Cron Triggered] Running daily inactivity check at ${new Date().toISOString()}...`);
    try {
      const result = await checkAndDeactivateInactiveUsers();
      console.log(`✅ [Cron Completed] Inactivity check finished. Deactivated ${result.deactivatedCount} user(s).`);
    } catch (err) {
      console.error('❌ [Cron Error] Inactivity job failed:', err.message);
    }
  });

  console.log(`⏰ Inactivity cron job initialized with schedule: "${cronSchedule}"`);
}

module.exports = {
  initInactivityCron,
  checkAndDeactivateInactiveUsers
};
