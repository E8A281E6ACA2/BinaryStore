import nodemailer from 'nodemailer';

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function getTransporter() {
  // Prefer explicit SMTP settings
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || false;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  // If SMTP not configured, try sendmail on the host
  return nodemailer.createTransport({ sendmail: true });
}

export async function sendMail(opts: MailOptions) {
  try {
    const transporter = getTransporter();
    const from = process.env.MAIL_FROM || `no-reply@${process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'localhost'}`;
    const info = await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    // eslint-disable-next-line no-console
    console.info('Mail sent', { messageId: info.messageId, accepted: (info as any).accepted });
    return info;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to send mail', e);
    throw e;
  }
}
