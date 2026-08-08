import User from "../models/User.js";
import Message from "../models/Message.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { MESSAGE_MAX_LENGTH, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

export const getMessages = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("content createdAt anonymous")
      .lean(),
    Message.countDocuments({ recipient: req.user._id }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Messages fetched"
    )
  );
});

export const toggleAccept = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isAcceptingMessages = !user.isAcceptingMessages;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isAcceptingMessages: user.isAcceptingMessages },
        "Preference updated"
      )
    );
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.recipient.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this message");
  }

  await Message.findByIdAndDelete(messageId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message deleted"));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Message content required");
  }

  if (content.length > MESSAGE_MAX_LENGTH) {
    throw new ApiError(400, "Message too long, max 500 chars");
  }

  const user = await User.findOne({ username, isVerified: true })
    .select("_id isAcceptingMessages")
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.isAcceptingMessages) {
    throw new ApiError(403, "User not accepting messages currently");
  }

  const message = await Message.create({
    content: content.trim(),
    recipient: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { messageId: message._id }, "Message sent"));
});
