import { Router } from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import { sendMessageLimiter } from "../middlewares/rateLimit.middleware.js";
import { sendMessage, getMessages, deleteMessage, toggleAccept } from "../controllers/message.controller.js";

const router = Router();

// public - anyone can send anon message, no login needed
router.post("/send/:username", sendMessageLimiter, sendMessage);

// protected - only logged-in owner see/manage own inbox
router.get("/", verifyJWT, getMessages);
router.delete("/:messageId", verifyJWT, deleteMessage);
router.patch("/toggle-accept", verifyJWT, toggleAccept);

export default router;
