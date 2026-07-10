import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Contribution from "@/models/Contribution";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(request, { params }) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || !["treasurer", "admin"].includes(userPayload.role)) {
    return NextResponse.json({ error: "Unauthorized. Treasurer or Admin only." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const contribution = await Contribution.findById(id);

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    if (contribution.status !== "pending") {
      return NextResponse.json({ error: "Cette cotisation a déjà été traitée." }, { status: 400 });
    }

    contribution.status = status;
    await contribution.save();

    return NextResponse.json({ success: true, contribution });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
