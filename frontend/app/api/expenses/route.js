import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Expense from "@/models/Expense";
import Project from "@/models/Project"; // Import required for populate
import { requireAuth, requireRole } from "@/lib/middleware";

export async function GET(request) {
  await dbConnect();
  const user = await requireAuth(request);

  try {
    const expenses = await Expense.find({}).populate("projectId", "name");
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  const user = await requireRole(request, ["treasurer", "admin", "director"]);

  try {
    const { amount, date, description, projectId, proof } = await request.json();

    if (!amount || !description || !proof) {
      return NextResponse.json({ error: "Amount, description, and proof are required" }, { status: 400 });
    }

    const expense = await Expense.create({
      amount,
      date: date || Date.now(),
      description,
      projectId: projectId || null,
      proof,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  await dbConnect();
  const user = await requireRole(request, ["treasurer", "admin"]);

  try {
    const { id, amount, date, description, projectId, proof } = await request.json();

    if (!id || !amount || !description || !proof) {
      return NextResponse.json({ error: "Id, amount, description, and proof are required" }, { status: 400 });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        amount,
        date: date || Date.now(),
        description,
        projectId: projectId || null,
        proof,
      },
      { new: true }
    ).populate("projectId", "name");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ expense }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  const user = await requireRole(request, ["admin"]);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing expense id" }, { status: 400 });
    }

    const deletedExpense = await Expense.findByIdAndDelete(id);
    if (!deletedExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Expense deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
