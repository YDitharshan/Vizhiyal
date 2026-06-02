// routes/notification.routes.js
import { Router } from "express";
import {
  getNotifications,
  getAnnouncementBanners,
  markOneRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get   ("/",                  getNotifications);
router.get   ("/announcements",     getAnnouncementBanners);
router.patch ("/read-all",     markAllRead);
router.patch ("/:id/read",     markOneRead);
router.delete("/:id",          deleteNotification);

export default router;
