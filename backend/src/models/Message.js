import mongoose, { Schema } from "mongoose";
import { MESSAGE_MAX_LENGTH } from "../constants.js";

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, "Message content required"],
      trim: true,
      minlength: 1,
      maxlength: MESSAGE_MAX_LENGTH,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    anonymous: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
