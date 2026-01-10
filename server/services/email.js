let nodemailer = null;
let transporter = null;

// Initialize email transporter
export async function initEmailService() {
  // Try to import nodemailer, but don't fail if it's not installed
  try {
    nodemailer = await import('nodemailer');
  } catch (error) {
    console.warn('Nodemailer package not found, email features disabled');
    return;
  }

  try {
    // Use environment variables or default to console logging for development
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('Email service initialized with SMTP');
    } else {
      // Development mode - use console transport
      transporter = nodemailer.default.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
      console.log('Email service initialized in development mode (console)');
    }
  } catch (error) {
    console.error('Failed to initialize email service:', error);
  }
}

// Get frontend URL from environment variable
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 
         process.env.APP_URL || 
         (process.env.VITE_API_URL ? process.env.VITE_API_URL.replace(/\/api\/?$/, '') : null) ||
         'http://localhost:5173';
};

// Email templates
const templates = {
  welcome: (data) => ({
    subject: `Welcome to YUR Finance, ${data.name || 'User'}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to YUR Finance!</h2>
        <p>Hi ${data.name || 'there'},</p>
        <p>Thank you for joining YUR Finance. We're excited to help you manage your finances.</p>
        <p>Get started by adding your first client or recording your income.</p>
        <a href="${data.appUrl || getFrontendUrl()}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Dashboard</a>
      </div>
    `,
  }),
  notification: (data) => ({
    subject: data.title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">${data.title}</h2>
        <p>${data.message}</p>
        ${data.actionUrl ? `<a href="${data.actionUrl}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">${data.actionText || 'View'}</a>` : ''}
      </div>
    `,
  }),
  passwordReset: (data) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${data.resetUrl}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
      </div>
    `,
  }),
};

/**
 * Send email
 */
export async function sendEmail({ to, subject, html, text, from = null }) {
  if (!transporter) {
    console.log('Email service not initialized. Email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('Body:', html || text);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: from || process.env.SMTP_FROM || 'noreply@yurfinance.com',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.SMTP_HOST) {
      console.log('Email sent:', info.messageId);
    } else {
      console.log('Email (dev mode):', mailOptions);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email using template
 */
export async function sendTemplatedEmail(templateName, to, data) {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  const emailData = template(data);
  return await sendEmail({
    to,
    subject: emailData.subject,
    html: emailData.html,
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(userEmail, notification) {
  return await sendTemplatedEmail('notification', userEmail, {
    title: notification.title,
    message: notification.message,
    actionUrl: notification.actionUrl,
    actionText: notification.actionText,
  });
}
