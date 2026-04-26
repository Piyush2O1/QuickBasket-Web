import { env } from "./env.js";

const devOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?$/;

const normalizeOrigin = (value) => {
  if (!value) return "";

  const trimmed = value.trim().replace(/\/+$/, "");

  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return trimmed;
    }
  }
};

const allowedClientOrigins = new Set(env.clientUrls.map(normalizeOrigin).filter(Boolean));

export const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;

  const requestOrigin = normalizeOrigin(origin);
  if (allowedClientOrigins.has(requestOrigin)) return true;

  return env.nodeEnv !== "production" && devOriginPattern.test(requestOrigin);
};

export const corsOrigin = (origin, callback) => {
  if (isAllowedCorsOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
};
