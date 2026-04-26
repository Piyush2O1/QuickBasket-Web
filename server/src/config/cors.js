import { env } from "./env.js";

const devOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?$/;

export const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;
  if (env.clientUrls.includes(origin)) return true;

  return env.nodeEnv !== "production" && devOriginPattern.test(origin);
};

export const corsOrigin = (origin, callback) => {
  if (isAllowedCorsOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
};
