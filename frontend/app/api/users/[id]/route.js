import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(request, { params }) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || userPayload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    const allowedRoles = ["member", "treasurer", "director", "admin"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || userPayload.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (userPayload.id === id) {
      return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
