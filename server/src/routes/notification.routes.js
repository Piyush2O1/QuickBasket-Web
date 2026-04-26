import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  listNotificationRecipients,
  markAllNotificationsRead,
  markNotificationRead,
  sendAdminNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.get("/recipients", allowRoles("admin"), listNotificationRecipients);
router.post("/", allowRoles("admin"), sendAdminNotification);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
