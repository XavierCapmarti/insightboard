import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';

// Mark as dynamic since we use searchParams
export const dynamic = 'force-dynamic';

/**
 * Test email endpoint
 * GET /api/test-email?to=your@email.com
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to');

  if (!to) {
    return NextResponse.json(
      { error: 'Missing "to" query parameter. Usage: /api/test-email?to=your@email.com' },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject: '✅ InsightBoard Email Test',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Email Configuration Working!</h1>
        <p>This is a test email from your InsightBoard instance.</p>
        <p style="color: #64748b; font-size: 14px;">
          Sent at: ${new Date().toISOString()}
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">
          InsightBoard - Analytics Made Simple
        </p>
      </div>
    `,
    text: `Email Configuration Working!\n\nThis is a test email from your InsightBoard instance.\n\nSent at: ${new Date().toISOString()}`,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  return NextResponse.json({ 
    success: true, 
    message: `Test email sent to ${to}`,
    emailId: result.id 
  });
}

