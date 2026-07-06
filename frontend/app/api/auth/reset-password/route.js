export { POST } from '../../reset-password/route.js';

export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request) {
  await dbConnect();
  
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.hasLocalPassword = true;
    if (!user.authProvider) {
      user.authProvider = "local";
    }
    user.resetPasswordToken = "";
    user.resetPasswordExpiry = null;
    await user.save();

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
