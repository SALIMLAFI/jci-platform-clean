import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const user = await User.findById(userPayload.id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let modules = [];
    switch (user.role) {
      case "member":
        modules = ["dashboard", "contributions"];
        break;
      case "treasurer":
        modules = ["dashboard", "contributions", "expenses", "reports"];
        break;
      case "director":
        modules = ["dashboard", "expenses", "reports", "projects"];
        break;
      case "admin":
        modules = ["dashboard", "members", "contributions", "expenses", "reports", "projects", "settings"];
        break;
      default:
        modules = ["dashboard"];
    }

    return NextResponse.json({ user, modules }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
