import mongoose from "mongoose";

const ContributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide the User ID"],
    },
    amount: {
      type: Number,
      required: [true, "Please provide the contribution amount"],
    },
    proof: {
      type: String,
      required: [true, "Proof of payment is mandatory"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Contribution || mongoose.model("Contribution", ContributionSchema);
