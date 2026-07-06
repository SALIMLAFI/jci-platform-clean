import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Contribution from "@/models/Contribution";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  await dbConnect();
  
  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const canSeeAll = userPayload.role === "admin" || userPayload.role === "treasurer";
    const filter = canSeeAll ? {} : { userId: userPayload.id };

    const contributions = await Contribution.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email");
    return NextResponse.json({ contributions }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { amount, proof } = await request.json();
    
    if (!amount || !proof) {
      return NextResponse.json({ error: "Amount and proof are required" }, { status: 400 });
    }

    const contribution = await Contribution.create({
      userId: userPayload.id,
      amount,
      proof,
      status: "pending",
    });

    return NextResponse.json({ contribution }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  await dbConnect();

  const userPayload = getUserFromRequest(request);
  if (!userPayload || (userPayload.role !== "treasurer" && userPayload.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. Treasurer access required." }, { status: 403 });
  }

  try {
    const { contributionId, status } = await request.json();
    
    if (!contributionId || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const contribution = await Contribution.findByIdAndUpdate(
      contributionId, 
      { status }, 
      { new: true }
    );

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    return NextResponse.json({ contribution }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
