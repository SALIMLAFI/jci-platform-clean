import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a project name"],
    },
    description: {
      type: String,
      required: false,
    },
    directorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    budget: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on-hold'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
