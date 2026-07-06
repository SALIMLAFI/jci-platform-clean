import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const token = body.token;
    const newPassword = body.newPassword || body.password;

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ resetPasswordToken: tokenHash });
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (!user.resetPasswordExpiry || new Date() > new Date(user.resetPasswordExpiry)) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    user.password = hashed;
    user.hasLocalPassword = true;
    user.resetPasswordToken = '';
    user.resetPasswordExpiry = null;
    await user.save();

    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API reset-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
