import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateOtp from "../utils/generateOtp.js";
import safeCompare from "../utils/safeCompare.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/mailer.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { OTP_EXPIRY_MS, BCRYPT_SALT_ROUNDS, REFRESH_TOKEN_COOKIE_MAX_AGE } from "../constants.js";

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(409, "User already verified");
  }

  if (!safeCompare(user.verifyCode || "", otp)) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.verifyCodeExpiry < new Date()) {
    throw new ApiError(400, "OTP expired");
  }

  user.isVerified = true;
  user.verifyCode = undefined;
  user.verifyCodeExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { userId: user._id }, "Account verified"));
});

export const signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "All fields required");
  }

  const existingUsername = await User.findOne({ username, isVerified: true });
  if (existingUsername) {
    throw new ApiError(409, "Username already taken");
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail && existingEmail.isVerified) {
    throw new ApiError(409, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  let user;

  if (existingEmail && !existingEmail.isVerified) {
    existingEmail.username = username;
    existingEmail.password = hashedPassword;
    existingEmail.verifyCode = otp;
    existingEmail.verifyCodeExpiry = otpExpiry;
    user = await existingEmail.save();
  } else {
    user = await User.create({
      username,
      email,
      password: hashedPassword,
      verifyCode: otp,
      verifyCodeExpiry: otpExpiry,
    });
  }

  await sendVerificationEmail(email, otp);

  return res
    .status(201)
    .json(new ApiResponse(201, { userId: user._id }, "Signup success. Check email for OTP"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Account not verified. Check email for OTP");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_SALT_ROUNDS);
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
          },
          accessToken,
        },
        "Login success"
      )
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id).select("+refreshTokenHash");

  if (!user) {
    throw new ApiError(401, "User no longer exist");
  }

  if (!user.refreshTokenHash) {
    throw new ApiError(401, "Session revoked, please log in again");
  }

  const isTokenValid = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);

  if (!isTokenValid) {
    // token reuse detected (stolen/old token replayed) - kill session
    user.refreshTokenHash = undefined;
    await user.save();
    throw new ApiError(401, "Session invalid, please log in again");
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_SALT_ROUNDS);
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  };

  return res
    .status(200)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
          user: { _id: user._id, username: user.username, email: user.email },
        },
        "Token refreshed"
      )
    );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshTokenHash: 1 } });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out"));
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isVerified) {
    throw new ApiError(409, "User already verified");
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  user.verifyCode = otp;
  user.verifyCodeExpiry = otpExpiry;
  await user.save();

  await sendVerificationEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "New OTP sent"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email required");
  }

  const user = await User.findOne({ email });

  // don't reveal if email exist or not - block user enumeration
  if (!user) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "If account exists, reset code sent"));
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  user.resetPasswordCode = otp;
  user.resetPasswordExpiry = otpExpiry;
  await user.save();

  await sendResetPasswordEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "If account exists, reset code sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP and new password required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.resetPasswordCode || !safeCompare(user.resetPasswordCode, otp)) {
    throw new ApiError(400, "Invalid reset code");
  }

  if (user.resetPasswordExpiry < new Date()) {
    throw new ApiError(400, "Reset code expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  user.password = hashedPassword;
  user.resetPasswordCode = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset success"));
});
