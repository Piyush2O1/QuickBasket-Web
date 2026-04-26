import { Router } from "express";
import { connectSocket, notify, updateLocation } from "../controllers/socket.controller.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";

const router = Router();

router.use(protect);
router.post("/connect", connectSocket);
router.post("/update-location", updateLocation);
router.post("/notify", allowRoles("admin"), notify);

export default router;
