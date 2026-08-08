import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const checkUsernameAvailable = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!/^[a-z0-9_]{3,}$/.test(username)) {
    return res
      .status(200)
      .json(new ApiResponse(200, { available: false, reason: "invalid format" }));
  }

  const existing = await User.findOne({ username, isVerified: true })
    .select("_id")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, { available: !existing }));
});

export const getPublicProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username, isVerified: true })
    .select("username isAcceptingMessages")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Profile fetched"));
});
