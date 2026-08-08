import { Router } from "express";
import { getPublicProfile, checkUsernameAvailable } from "../controllers/user.controller.js";

const router = Router();

router.get("/check-username/:username", checkUsernameAvailable);
router.get("/:username", getPublicProfile);

export default router;
