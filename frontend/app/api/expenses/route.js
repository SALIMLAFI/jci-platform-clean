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

    const numAmount = Number(amount);
    if (!amount || !description || !proof || !date) {
      return NextResponse.json({ error: "Le montant, la description, la date et le justificatif sont obligatoires." }, { status: 400 });
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Le montant de la dépense doit être strictement positif." }, { status: 400 });
    }

    // Anti-doublon basique (même jour, même description, même montant)
    const expenseDate = new Date(date);
    const startOfDay = new Date(expenseDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(expenseDate.setHours(23, 59, 59, 999));
    
    const duplicate = await Expense.findOne({
      amount: numAmount,
      description: description.trim(),
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (duplicate) {
      return NextResponse.json({ error: "Une dépense identique existe déjà pour cette journée (doublon possible)." }, { status: 409 });
    }

    const expense = await Expense.create({
      amount: numAmount,
      date: date,
      description: description.trim(),
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

    const numAmount = Number(amount);
    if (!id || !amount || !description || !proof || !date) {
      return NextResponse.json({ error: "Id, montant, date, description et justificatif sont obligatoires." }, { status: 400 });
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: "Le montant de la dépense doit être strictement positif." }, { status: 400 });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        amount: numAmount,
        date: date,
        description: description.trim(),
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
