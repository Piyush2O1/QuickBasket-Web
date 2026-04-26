import bcrypt from "bcryptjs";
import { EmailOtp } from "../models/emailOtp.model.js";
import { User } from "../models/user.model.js";
import { buildRegisterOtpEmail, createOtpCode, hashOtp } from "../services/authOtp.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest, unauthorized } from "../utils/httpError.js";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "../middleware/auth.js";
import { verifyGoogleCredential } from "../services/googleAuth.service.js";
import { sendMail } from "../services/mail.service.js";
import { track } from "../utils/pulseiq.js";

const allowedSelfRoles = ["user", "deliveryBoy"];
const loginRoles = ["user", "deliveryBoy", "admin"];
const registerOtpPurpose = "register";
const registerOtpExpiryMs = 10 * 60 * 1000;

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  image: user.image,
});

export const sendRegisterOtp = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, role = "user" } = req.body;

  if (!name || !email || !password) {
    throw badRequest("Name, email and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw badRequest("Email is already registered");
  }

  const otp = createOtpCode();
  const passwordHash = await bcrypt.hash(password, 10);
  const selectedRole = allowedSelfRoles.includes(role) ? role : "user";

  await EmailOtp.findOneAndUpdate(
    { email: normalizedEmail, purpose: registerOtpPurpose },
    {
      email: normalizedEmail,
      purpose: registerOtpPurpose,
      codeHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + registerOtpExpiryMs),
      name: String(name).trim(),
      passwordHash,
      mobile: mobile || "",
      role: selectedRole,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const emailContent = buildRegisterOtpEmail({
    name: String(name).trim(),
    otp,
  });

  await sendMail({
    to: normalizedEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  res.json({
    success: true,
    message: `OTP sent to ${normalizedEmail}`,
  });
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, role = "user" } = req.body;

  if (!name || !email || !password) {
    throw badRequest("Name, email and password are required");
  }
  if (String(password).length < 6) {
    throw badRequest("Password must be at least 6 characters");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw badRequest("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const selectedRole = allowedSelfRoles.includes(role) ? role : "user";

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: passwordHash,
    mobile: mobile || "",
    role: selectedRole,
    emailVerified: true,
  });

  await EmailOtp.deleteMany({ email: normalizedEmail, purpose: registerOtpPurpose });

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  await track("user_registered", user._id, {
    email: user.email,
    role: user.role,
    method: "password",
  });

  res.status(201).json({ user: sanitizeUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role = "user" } = req.body;

  if (!email || !password) {
    throw badRequest("Email and password are required");
  }
  if (!loginRoles.includes(role)) {
    throw badRequest("Please select a valid role");
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    throw unauthorized("Account not found. Please sign up before logging in");
  }
  if (user.role !== role) {
    throw unauthorized("Wrong role selected");
  }
  if (!user.password) {
    throw unauthorized("Use Google sign-in for this account");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw unauthorized("Invalid email or password");
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  await track("user_login", user._id, {
    role: user.role,
    method: "password",
  });

  res.json({ user: sanitizeUser(user) });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential, role = "user", mode = "login" } = req.body;

  if (!credential) {
    throw badRequest("Google credential is required");
  }
  if (!loginRoles.includes(role)) {
    throw badRequest("Please select a valid role");
  }

  const googleUser = await verifyGoogleCredential(credential);
  let user = await User.findOne({ googleId: googleUser.googleId });

  if (!user) {
    user = await User.findOne({ email: googleUser.email });
  }

  const isRegisterMode = mode === "register";
  const selectedRole = allowedSelfRoles.includes(role) ? role : "user";
  const statusCode = user ? 200 : 201;
  const isNewUser = !user;

  if (!user) {
    if (!isRegisterMode) {
      throw unauthorized("Account not found. Please sign up before logging in");
    }
    if (!allowedSelfRoles.includes(role)) {
      throw badRequest("Admin accounts must be created from seed");
    }

    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.googleId,
      emailVerified: true,
      image: googleUser.image,
      role: selectedRole,
    });
  } else {
    if (isRegisterMode) {
      throw badRequest("Account already exists. Please login");
    }
    if (user.role !== role) {
      throw unauthorized("Wrong role selected");
    }
    if (user.googleId && user.googleId !== googleUser.googleId) {
      throw unauthorized("This email is linked with a different Google account");
    }

    user.googleId = googleUser.googleId;
    user.emailVerified = true;
    if (!user.name) user.name = googleUser.name;
    if (!user.image && googleUser.image) user.image = googleUser.image;
    await user.save();
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  await track(isNewUser ? "user_registered" : "user_login", user._id, {
    email: user.email,
    role: user.role,
    method: "google",
  });

  res.status(statusCode).json({ user: sanitizeUser(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile, role } = req.body;

  if (name) req.user.name = name;
  if (mobile !== undefined) {
    const normalizedMobile = String(mobile).replace(/\D/g, "").slice(0, 10);

    if (normalizedMobile.length !== 10) {
      throw badRequest("Please enter a valid 10-digit mobile number");
    }

    req.user.mobile = normalizedMobile;
  }
  if (role && allowedSelfRoles.includes(role)) req.user.role = role;

  await req.user.save();
  res.json({ user: sanitizeUser(req.user) });
});
