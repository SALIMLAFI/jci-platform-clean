import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    hasLocalPassword: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["member", "treasurer", "director", "admin"],
      default: "member",
    },
    membershipDate: {
      type: Date,
      default: Date.now,
    },
    photo: {
      type: String,
      default: "",
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
