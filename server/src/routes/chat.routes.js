import { Router } from "express";
import { aiSuggestions, getMessages, saveMessage } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/messages/:roomId", getMessages);
router.post("/messages", saveMessage);
router.post("/ai-suggestions", aiSuggestions);

export default router;
