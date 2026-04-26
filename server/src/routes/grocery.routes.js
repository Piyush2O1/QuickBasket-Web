import { Router } from "express";
import {
  createGrocery,
  deleteGrocery,
  listGroceries,
  updateGrocery,
} from "../controllers/grocery.controller.js";
import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/roles.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.get("/", listGroceries);
router.post("/", protect, allowRoles("admin"), upload.single("image"), createGrocery);
router.patch("/:id", protect, allowRoles("admin"), upload.single("image"), updateGrocery);
router.delete("/:id", protect, allowRoles("admin"), deleteGrocery);

export default router;
