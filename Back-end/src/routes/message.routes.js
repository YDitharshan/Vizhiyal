// routes/message.routes.js
import { Router } from "express";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markRead,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// All message routes require login
router.use(protect);

router.get  ("/",                          getConversations);
router.post ("/conversations",             getOrCreateConversation);
router.get  ("/conversations/:id",         getMessages);
router.post ("/conversations/:id",         sendMessage);
router.patch("/conversations/:id/read",    markRead);

export default router;
