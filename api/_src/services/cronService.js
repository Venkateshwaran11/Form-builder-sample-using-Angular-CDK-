const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');
const { sendTelegramAlert } = require('./telegramService');

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

    // Send notification summary (Telegram)
    try {
      const timeStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const userListStr = deactivatedUsernames.length > 0
        ? `\n👤 Users: ${deactivatedUsernames.join(', ')}`
        : '\nℹ️ No users met the 7-day inactivity threshold.';

      const alertMessage = `🔔 Inactivity Cron Finished\n` +
        `⏰ Time: ${timeStr} (IST)\n` +
        `📉 Deactivated: ${result.deactivatedCount} user(s)` +
        userListStr;

      // Send to Telegram (100% Free, instant, exact formatting)
      await sendTelegramAlert(alertMessage);
    } catch (notifyErr) {
      console.error('[Inactivity Cron] Notification failed:', notifyErr.message);
    }

    return result;
  } catch (error) {
    console.error('[Inactivity Cron] Error checking inactive users:', error);

    // Attempt alert on cron failure
    try {
      const failMsg = `🚨 Inactivity Cron Failed\n❌ Error: ${error.message}`;
      await sendTelegramAlert(failMsg);
    } catch (_) {}

    throw error;
  }
}
async function dailyMonitorLoginUsers() {
  try {
    const yesterdayStartDatetime = new Date();
    const yesterdayEndDatetime = new Date();
    yesterdayStartDatetime.setDate(yesterdayStartDatetime.getDate() - 1);
    yesterdayStartDatetime.setHours(0, 0, 0, 0);
    yesterdayEndDatetime.setDate(yesterdayEndDatetime.getDate() - 1);
    yesterdayEndDatetime.setHours(23, 59, 59, 999);
    console.log(`[Monitor] Checking users who logged in between ${yesterdayStartDatetime.toISOString()} and ${yesterdayEndDatetime.toISOString()}.`);
    const yesterdayLoginUsers = await User.find({
      lastLogin: {
        $gte: yesterdayStartDatetime,
        $lte: yesterdayEndDatetime
      }
    });
    console.log(`[Monitor] Found ${yesterdayLoginUsers.length} users who logged in yesterday.`);
    let messageString = `${yesterdayLoginUsers.length > 1 ? '👥 ' + yesterdayLoginUsers.length + ' Users' : '👤 ' + yesterdayLoginUsers.length + ' User'} have been logged in Form Builder Application on ${yesterdayEndDatetime.toLocaleDateString('en-IN')}\n`;
    if (yesterdayLoginUsers.length > 0) {
      for (let user of yesterdayLoginUsers) {
        const userName = user.username;
        const emailId = user.email;
        const lastLogin = user.lastLogin.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        messageString += `
        😎 Name: ${userName}
        📧 Email: ${emailId}
        📅 Last Login: ${lastLogin}
        `
        messageString += "\n\n";
        messageString += "-----------------------------------------\n\n";
      }
    }
    await sendTelegramAlert(messageString);
  } catch (error) {
    console.log(`[Error - Daily Monitor]`, error);
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
      const yesterdayLoginUsers = await dailyMonitorLoginUsers();
      console.log('[Monitor] Completed checking yesterday login users.'+yesterdayLoginUsers.length+" users have been logged in");
    } catch (err) {
      console.error('❌ [Cron Error] Inactivity job failed:', err.message);
    }
  });
// dailyMonitorLoginUsers()
  console.log(`⏰ Inactivity cron job initialized with schedule: "${cronSchedule}"`);
}

module.exports = {
  initInactivityCron,
  checkAndDeactivateInactiveUsers,
  dailyMonitorLoginUsers
};
