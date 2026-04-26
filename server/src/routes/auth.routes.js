import { Router } from "express";
import {
  getMe,
  googleLogin,
  login,
  logout,
  register,
  sendRegisterOtp,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register/otp", sendRegisterOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);

export default router;
