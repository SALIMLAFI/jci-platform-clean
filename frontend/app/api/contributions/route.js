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
    const numericAmount = Number(amount);
    if (!amount || !proof || isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: "Le montant doit être supérieur à 0 et le justificatif est obligatoire" }, { status: 400 });
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

