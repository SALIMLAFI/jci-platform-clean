import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Please provide the expense amount"],
    },
    date: {
      type: Date,
      required: [true, "Please provide the expense date"],
      default: Date.now,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    proof: {
      type: String,
      required: [true, "Proof (receipt/invoice) is mandatory"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
