import jwt from "jsonwebtoken";
import { env, requireEnv } from "../config/env.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unauthorized } from "../utils/httpError.js";

export const signAuthToken = (user) => {
  const secret = requireEnv(env.jwtSecret, "JWT_SECRET");

  return jwt.sign({ id: user._id.toString(), role: user.role }, secret, {
    expiresIn: "10d",
  });
};

const isProduction = env.nodeEnv === "production";
const sameSite = isProduction ? "none" : "lax";

export const authCookieOptions = {
  httpOnly: true,
  sameSite,
  secure: isProduction,
  maxAge: 10 * 24 * 60 * 60 * 1000,
};

export const setAuthCookie = (res, token) => {
  res.cookie(env.cookieName, token, authCookieOptions);
};

export const clearAuthCookie = (res) => {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    sameSite,
    secure: isProduction,
  });
};

const parseCookieHeader = (cookieHeader) => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((cookies, chunk) => {
      const separatorIndex = chunk.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();

      if (key) {
        cookies[key] = decodeURIComponent(value);
      }

      return cookies;
    }, {});
};

export const readAuthToken = (requestLike = {}) => {
  const cookies =
    requestLike.cookies || parseCookieHeader(requestLike.headers?.cookie || requestLike.handshake?.headers?.cookie);
  const cookieToken = cookies?.[env.cookieName];
  const authHeader = requestLike.headers?.authorization || requestLike.handshake?.headers?.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  return cookieToken || bearerToken || null;
};

export const verifyAuthToken = (token) =>
  jwt.verify(token, requireEnv(env.jwtSecret, "JWT_SECRET"));

export const resolveAuthUser = async (requestLike = {}) => {
  const token = readAuthToken(requestLike);

  if (!token) {
    throw unauthorized("Please login first");
  }

  const payload = verifyAuthToken(token);
  const user = await User.findById(payload.id);

  if (!user) {
    throw unauthorized("Session user no longer exists");
  }

  return user;
};

export const protect = asyncHandler(async (req, _res, next) => {
  req.user = await resolveAuthUser(req);
  next();
});
