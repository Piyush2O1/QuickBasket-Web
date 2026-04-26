import dotenv from "dotenv";

dotenv.config();

const isPlaceholder = (value) => !value || /^add your .* here$/i.test(value);
const nodeEnv = process.env.NODE_ENV || "development";

export const localMongoUrl =
  nodeEnv === "development" ? "mongodb://127.0.0.1:27017/quickbasket" : undefined;

export const env = {
  nodeEnv,
  port: process.env.PORT || 3000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
  serverUrl: process.env.SERVER_URL || "http://localhost:3000",
  mongoUrl: process.env.MONGODB_URL || localMongoUrl,
  jwtSecret: process.env.JWT_SECRET || process.env.AUTH_SECRET,
  cookieName: process.env.COOKIE_NAME || "quickbasket_token",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  email: process.env.EMAIL,
  emailPass: process.env.PASS,
  adminName: process.env.ADMIN_NAME || "QuickBasket Admin",
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminMobile: process.env.ADMIN_MOBILE || "9999999999",
};

export const hasEnvValue = (value) => Boolean(value && !isPlaceholder(value));

export const requireEnv = (value, name) => {
  if (!hasEnvValue(value)) {
    throw new Error(`${name} is not configured`);
  }

  return value;
};
