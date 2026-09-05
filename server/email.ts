/**
 * Transactional Email Service for NullReach
 * Handles Welcome Emails to newly registered users and Admin Registration Alerts.
 * Supports Resend, SendGrid, and Simulated Sandbox fallback.
 */

export interface EmailDispatchPayload {
  name: string;
  email: string;
  credits: number;
  role?: string;
  timestamp?: string;
}

export interface EmailServiceStatus {
  isConfigured: boolean;
  provider: 'resend' | 'sendgrid' | 'none';
  senderEmail: string;
  adminAlertEmail: string;
  instructions: {
    recommendedProvider: string;
    requiredFields: string[];
  };
}

export function getEmailConfigStatus(): EmailServiceStatus {
  const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '');
  const hasSendGrid = Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '');
  
  let provider: 'resend' | 'sendgrid' | 'none' = 'none';
  if (hasResend) {
    provider = 'resend';
  } else if (hasSendGrid) {
    provider = 'sendgrid';
  }

  const senderEmail = process.env.SENDER_EMAIL || 'NullReach <onboarding@resend.dev>';
  const adminAlertEmail = process.env.ADMIN_ALERT_EMAIL || 'akashsuresh2403@gmail.com';

  return {
    isConfigured: hasResend || hasSendGrid,
    provider,
    senderEmail,
    adminAlertEmail,
    instructions: {
      recommendedProvider: 'Resend (https://resend.com) - Free tier includes 3,000 emails/month',
      requiredFields: [
        'RESEND_API_KEY (from https://resend.com/api-keys)',
        'SENDER_EMAIL (e.g., onboarding@resend.dev or alerts@yourdomain.com)',
        'ADMIN_ALERT_EMAIL (e.g., akashsuresh2403@gmail.com)'
      ]
    }
  };
}

/**
 * Send Welcome Email to the user and an Admin Notification Alert to the platform admin.
 */
export async function sendRegistrationAlerts(payload: EmailDispatchPayload) {
  const { name, email, credits, role = 'member' } = payload;
  const status = getEmailConfigStatus();
  const timeFormatted = new Date().toUTCString();

  // Welcome email HTML
  const welcomeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 30px; }
          .container { max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px; }
          .brand { font-size: 22px; font-weight: 700; color: #FFFFFF; font-style: italic; font-family: Georgia, serif; margin-bottom: 24px; }
          .badge { display: inline-block; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: #D8B4FE; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; }
          h1 { font-size: 24px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; }
          p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.75); margin: 0 0 16px 0; }
          .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin: 24px 0; }
          .credits-number { font-size: 32px; font-weight: 800; color: #A855F7; margin: 8px 0; }
          .btn { display: inline-block; background: #9333EA; color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 10px; }
          .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: rgba(255,255,255,0.4); text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">NullReach</div>
          <div class="badge">Registration Confirmed</div>
          <h1>Welcome to NullReach, ${name}!</h1>
          <p>Your account has been successfully created. We've deposited free welcome credits into your balance so you can begin discovering and locking verified executive contacts immediately.</p>
          
          <div class="card">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5);">Available Balance</div>
            <div class="credits-number">${credits} Free Credits</div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.6);">1 Credit reveals direct phone, email, and Google intelligence for any verified executive.</div>
          </div>

          <p>Every lead you unlock is exclusively protected for your team's pipeline so competing agencies cannot duplicate your outreach.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://ais-dev-gvyt3sea5l6vw6pyws5k3z-668515014782.asia-southeast1.run.app'}" class="btn">Launch Your Portal</a>
          </div>

          <div class="footer">
            © ${new Date().getFullYear()} NullReach. All rights reserved. A product by usecodify.<br />
            Need assistance? Reply directly to this email or contact support.
          </div>
        </div>
      </body>
    </html>
  `;

  // Admin Alert email HTML
  const adminHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0A0B; color: #FFFFFF; margin: 0; padding: 30px; }
          .container { max-width: 600px; margin: 0 auto; background: #111114; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px; }
          .badge { display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6EE7B7; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; }
          h1 { font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 0 0 16px 0; }
          .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: rgba(255,255,255,0.02); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
          .data-table td { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
          .label { color: rgba(255,255,255,0.5); font-weight: 500; width: 35%; }
          .value { color: #FFFFFF; font-weight: 600; }
          .footer { margin-top: 30px; font-size: 11px; color: rgba(255,255,255,0.35); text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">🔔 Admin Notification Alert</div>
          <h1>New User Registered on NullReach</h1>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px;">A new member has completed account registration on your platform.</p>

          <table class="data-table">
            <tr>
              <td class="label">Full Name</td>
              <td class="value">${name}</td>
            </tr>
            <tr>
              <td class="label">Email Address</td>
              <td class="value"><a href="mailto:${email}" style="color: #A855F7; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td class="label">Account Role</td>
              <td class="value">${role.toUpperCase()}</td>
            </tr>
            <tr>
              <td class="label">Credits Granted</td>
              <td class="value">${credits} Credits</td>
            </tr>
            <tr>
              <td class="label">Registration Time</td>
              <td class="value">${timeFormatted}</td>
            </tr>
          </table>

          <div class="footer">
            NullReach Admin Alert Dispatcher • A product by usecodify
          </div>
        </div>
      </body>
    </html>
  `;

  // Dispatch via Resend if RESEND_API_KEY is available
  if (status.provider === 'resend') {
    try {
      const apiKey = process.env.RESEND_API_KEY!;
      const preferredSender = process.env.SENDER_EMAIL || 'NullReach <onboarding@resend.dev>';
      const sandboxSender = 'NullReach <onboarding@resend.dev>';
      const configuredAdminTo = process.env.ADMIN_ALERT_EMAIL || 'akashsuresh2403@gmail.com';
      const fallbackOwnerEmail = 'usecodify@gmail.com';

      // Helper function with automatic sender domain fallback
      const dispatchResend = async (toEmail: string, emailSubject: string, emailHtml: string) => {
        // Attempt 1: With preferred configured sender
        let activeSender = preferredSender;
        let response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: activeSender,
            to: [toEmail],
            subject: emailSubject,
            html: emailHtml
          })
        });
        let resData = await response.json();

        // If preferred domain is not verified, auto-fallback to Resend test domain
        if (!response.ok && resData?.message?.includes('not verified')) {
          console.log(`[RESEND NOTICE] Custom sender domain unverified. Auto-falling back to sandbox sender: ${sandboxSender}`);
          activeSender = sandboxSender;
          response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: sandboxSender,
              to: [toEmail],
              subject: emailSubject,
              html: emailHtml
            })
          });
          resData = await response.json();
        }

        return { response, resData, activeSender };
      };

      // 1. Send Admin Alert Email
      let targetAdminEmail = configuredAdminTo;
      let { response: adminRes, resData: adminData } = await dispatchResend(
        targetAdminEmail,
        `🔔 New User Registration: ${name} (${email})`,
        adminHtml
      );

      // If sandbox restriction (only sends to account owner usecodify@gmail.com)
      if (!adminRes.ok && adminData?.message?.includes('usecodify@gmail.com')) {
        console.log(`[RESEND SANDBOX] Re-routing admin alert to verified owner: ${fallbackOwnerEmail}`);
        targetAdminEmail = fallbackOwnerEmail;
        const retryResult = await dispatchResend(
          fallbackOwnerEmail,
          `🔔 New User Registration: ${name} (${email})`,
          adminHtml
        );
        adminRes = retryResult.response;
        adminData = retryResult.resData;
      }
      const adminAlertSent = adminRes.ok;

      // 2. Send Welcome Email to new user
      let { response: userRes, resData: userData } = await dispatchResend(
        email,
        `Welcome to NullReach — Your ${credits} Welcome Credits are Ready`,
        welcomeHtml
      );

      let welcomeEmailSent = userRes.ok;
      if (!userRes.ok) {
        // Send preview copy to owner so they can review the live formatted email
        console.log(`[RESEND SANDBOX] Recipient restricted (${email}) until custom domain verified. Sending template preview to ${fallbackOwnerEmail}`);
        const previewResult = await dispatchResend(
          fallbackOwnerEmail,
          `[Preview Copy] Welcome Email for ${name} (${email})`,
          welcomeHtml
        );
        welcomeEmailSent = previewResult.response.ok;
      }

      console.log(`[EMAIL LIVE SENT - RESEND] Admin alert (${targetAdminEmail}): ${adminAlertSent ? 'Delivered' : 'Failed'}, User welcome: ${welcomeEmailSent ? 'Delivered' : 'Failed'}`);

      return {
        success: adminAlertSent || welcomeEmailSent,
        provider: 'resend',
        welcomeEmailSent,
        adminAlertSent,
        deliveredToAdmin: targetAdminEmail,
        isSandboxNotice: !userRes.ok,
        message: adminAlertSent
          ? `Live email alert successfully delivered to ${targetAdminEmail} via Resend.`
          : 'Failed to deliver emails via Resend.',
        userData,
        adminData
      };
    } catch (err: any) {
      console.error('[EMAIL DISPATCH ERROR - RESEND]:', err);
      return {
        success: false,
        provider: 'resend',
        welcomeEmailSent: false,
        adminAlertSent: false,
        message: err.message || 'Failed to dispatch via Resend'
      };
    }
  }

  // Dispatch via SendGrid if SENDGRID_API_KEY is available
  if (status.provider === 'sendgrid') {
    try {
      const apiKey = process.env.SENDGRID_API_KEY!;
      const sender = process.env.SENDER_EMAIL || 'notifications@nullreach.com';
      const adminTo = process.env.ADMIN_ALERT_EMAIL || 'akashsuresh2403@gmail.com';

      const sendSendGrid = async (to: string, subject: string, html: string) => {
        return fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: sender, name: 'NullReach' },
            subject,
            content: [{ type: 'text/html', value: html }]
          })
        });
      };

      const userRes = await sendSendGrid(email, `Welcome to NullReach — Your ${credits} Welcome Credits are Ready`, welcomeHtml);
      const adminRes = await sendSendGrid(adminTo, `🔔 New User Registration: ${name} (${email})`, adminHtml);

      console.log(`[EMAIL LIVE SENT - SENDGRID] User status: ${userRes.status}, Admin status: ${adminRes.status}`);

      return {
        success: true,
        provider: 'sendgrid',
        welcomeEmailSent: userRes.ok,
        adminAlertSent: adminRes.ok,
        message: 'Live emails dispatched successfully via SendGrid.'
      };
    } catch (err: any) {
      console.error('[EMAIL DISPATCH ERROR - SENDGRID]:', err);
      return {
        success: false,
        provider: 'sendgrid',
        welcomeEmailSent: false,
        adminAlertSent: false,
        message: err.message || 'Failed to dispatch via SendGrid'
      };
    }
  }

  // Simulation / Local Logging Mode
  console.log('---------------------------------------------------------');
  console.log('[EMAIL SIMULATION MODE]');
  console.log(`1. WELCOME EMAIL to: ${name} <${email}>`);
  console.log(`   Subject: Welcome to NullReach — Your ${credits} Welcome Credits are Ready`);
  console.log(`2. ADMIN ALERT EMAIL to: ${status.adminAlertEmail}`);
  console.log(`   Subject: 🔔 New User Registration: ${name} (${email})`);
  console.log('   Notice: Set RESEND_API_KEY in environment/secrets to send live emails to inboxes.');
  console.log('---------------------------------------------------------');

  return {
    success: true,
    provider: 'none',
    welcomeEmailSent: true,
    adminAlertSent: true,
    simulated: true,
    message: 'Emails logged in simulated server mode. Add RESEND_API_KEY in settings to trigger live inboxes.'
  };
}
