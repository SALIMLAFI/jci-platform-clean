import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { buildPasswordEmail, sendPasswordEmail } from '@/lib/mailer';

async function verifyRecaptcha(token) {
  if (!token) {
    return true;
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secretKey}&response=${token}`,
  });

  const data = await response.json();
  return Boolean(data.success);
}

export async function POST(request) {
  await dbConnect();

  try {
    const { email, recaptchaToken } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!(await verifyRecaptcha(recaptchaToken))) {
      return NextResponse.json({ error: 'Invalid reCAPTCHA token' }, { status: 400 });
    }

    // Find user by email
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Always respond with 200 to avoid user enumeration
    const genericResponse = { message: 'If an account with that email exists, a reset link has been sent.' };

    if (!user) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Generate secure token (raw token will be sent in email)
    const token = crypto.randomBytes(32).toString('hex');

    // Store only the hash of the token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpiry = new Date(expiry);
    await user.save();

    // Build reset URL
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || `${forwardedProto}://${request.headers.get('host')}`;
    const appUrl = String(host).replace(/\/$/, '');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Build and send email (uses Resend if RESEND_API_KEY exists)
    const emailPayload = buildPasswordEmail({ name: user.name, resetUrl, googleLinked: !user.hasLocalPassword });

    let emailDeliveryError = null;
    try {
      await sendPasswordEmail({
        to: user.email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
      });
    } catch (sendError) {
      emailDeliveryError = sendError instanceof Error ? sendError.message : String(sendError);
      console.error('[ForgotPassword] Email delivery failed:', sendError);
    }

    const responseBody = {
      ...genericResponse,
    };

    if (process.env.NODE_ENV !== 'production') {
      responseBody.resetUrl = resetUrl;
      if (emailDeliveryError) {
        responseBody.emailDeliveryError = emailDeliveryError;
      }
    }

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error('[API forgot-password] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
