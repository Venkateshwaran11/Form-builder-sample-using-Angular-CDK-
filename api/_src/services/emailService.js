const nodemailer = require('nodemailer');

let cachedTransporter = null;

/**
 * Retrieves the nodemailer transporter configured with Gmail SMTP.
 */
function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
    }
  });

  return cachedTransporter;
}

/**
 * Sends a welcome email containing user credentials.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.username - User's username
 * @param {string} params.password - User's plain password
 */
async function sendCredentialsEmail({ to, username, password }) {
  const transporter = await getTransporter();

  const appUrl = process.env.CLIENT_URL || 'http://localhost:4200';
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Form Builder" <no-reply@formbuilder.com>';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Form Builder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Form Builder!</h1>
              <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">Your account has been successfully created.</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #334155;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #475569;">
                Thank you for joining us! Below are your login credentials to access your account and start building interactive forms:
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b; width: 110px;">Username:</td>
                        <td style="padding: 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b;">Email:</td>
                        <td style="padding: 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b;">Password:</td>
                        <td style="padding: 6px 0; font-size: 15px; font-family: monospace; font-weight: 700; color: #4f46e5; background-color: #eef2ff; padding: 4px 8px; border-radius: 6px; display: inline-block;">${password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Advice -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 19px;">
                  🔒 <strong>Security Tip:</strong> Please change your password after your first login to keep your account safe.
                </p>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                      Log In to Your Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
                If you did not request this account, please ignore this email or contact support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Form Builder. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
Welcome to Form Builder!

Hello ${username},

Your account has been created successfully. Here are your login credentials:

Username: ${username}
Email: ${to}
Password: ${password}

Log in at: ${appUrl}

Security Tip: Please change your password after logging in for the first time.

If you did not request this account, please ignore this email.
`;

  const mailOptions = {
    from: fromAddress,
    to: to,
    subject: 'Welcome to Form Builder - Your Account Credentials',
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Credentials email sent successfully to ${to}. Message ID: ${info.messageId}`);

  return {
    success: true,
    messageId: info.messageId
  };
}

/**
 * Sends a notification email when a user account is set to inactive due to 7+ days of inactivity.
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.username - User's username
 * @param {Date|string} params.lastLoginDate - Date of last login or account creation
 */
async function sendInactivityNoticeEmail({ to, username, lastLoginDate }) {
  const transporter = getTransporter();

  const appUrl = process.env.CLIENT_URL || 'http://localhost:4200';
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Form Builder" <no-reply@formbuilder.com>';

  const formattedDate = lastLoginDate 
    ? new Date(lastLoginDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'over a week ago';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #334155 0%, #1e293b 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                Account Status Update
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Account Marked as Inactive</h1>
              <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.85;">Notice regarding your Form Builder account</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #334155;">
                Hello <strong>${username}</strong>,
              </p>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #475569;">
                Our system detected that you haven't logged into your account in over a week (last active: <strong>${formattedDate}</strong>).
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: #475569;">
                To help protect your account and keep our platform clean, your status has been updated to <strong style="color: #d97706;">Inactive</strong>.
              </p>

              <!-- Status Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b; width: 120px;">Username:</td>
                        <td style="padding: 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${username}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b;">Account Email:</td>
                        <td style="padding: 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b;">Last Active:</td>
                        <td style="padding: 6px 0; font-size: 15px; color: #475569;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #64748b;">Current Status:</td>
                        <td style="padding: 6px 0;">
                          <span style="background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: 700;">
                            Inactive
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Reassurance info -->
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 6px; margin-bottom: 28px;">
                <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 21px;">
                  ✨ <strong>Good news:</strong> All of your created forms and collected responses remain completely safe. You can reactivate your account at any time simply by logging back in.
                </p>
              </div>

              <!-- Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                      Log In to Reactivate Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #64748b; text-align: center;">
                If you have any questions or need assistance, please contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} Form Builder. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
Account Status Notice - Form Builder

Hello ${username},

Our system noticed that you haven't logged into your account in over a week (last active: ${formattedDate}).
As part of our automated security policy, your account status has been temporarily changed to Inactive.

All your forms and responses remain completely safe. You can reactivate your account at any time simply by logging back in at:
${appUrl}

If you have questions, please reach out to our support team.
`;

  const mailOptions = {
    from: fromAddress,
    to: to,
    subject: 'Form Builder Account Notice: Status Set to Inactive',
    text: textContent,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Inactivity notice email sent to ${to}. Message ID: ${info.messageId}`);

  return {
    success: true,
    messageId: info.messageId
  };
}

module.exports = {
  sendCredentialsEmail,
  sendInactivityNoticeEmail,
  getTransporter
};

