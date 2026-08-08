import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyCode: {
      type: String,
    },
    verifyCodeExpiry: {
      type: Date,
    },
    isAcceptingMessages: {
      type: Boolean,
      default: true,
    },
    resetPasswordCode: {
      type: String,
    },
    resetPasswordExpiry: {
      type: Date,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
