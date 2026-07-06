import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  await dbConnect();
  
  const userPayload = getUserFromRequest(request);
  if (!userPayload || userPayload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const users = await User.find({}).select("-password");
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || userPayload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || userPayload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, password, role = "member", membershipDate } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const allowedRoles = ["member", "treasurer", "director", "admin"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      membershipDate: membershipDate || new Date(),
      authProvider: "local",
      hasLocalPassword: true,
    });

    const createdUser = user.toObject();
    delete createdUser.password;

    return NextResponse.json({ success: true, user: createdUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || userPayload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await User.findByIdAndDelete(userId);
    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
