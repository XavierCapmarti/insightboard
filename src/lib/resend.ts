/**
 * Resend email client
 * Requires RESEND_API_KEY env var
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string; statusCode: number };
}

export async function sendEmail(options: SendEmailOptions): Promise<ResendResponse> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { error: { message: 'RESEND_API_KEY is not configured', statusCode: 500 } };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Resend API error:', data);
    return { error: { message: data.message || 'Failed to send email', statusCode: response.status } };
  }

  return { id: data.id };
}

export { EMAIL_FROM };


