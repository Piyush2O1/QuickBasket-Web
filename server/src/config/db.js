import mongoose from "mongoose";
import { env, localMongoUrl, requireEnv } from "./env.js";

const connectWithUrl = async (mongoUrl) =>
  mongoose.connect(mongoUrl, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 10000,
  });

const buildMongoConnectionMessage = (mongoUrl, error) => {
  const isAtlas = mongoUrl.includes("mongodb.net") || mongoUrl.startsWith("mongodb+srv://");

  if (isAtlas) {
    return [
      "Could not connect to MongoDB Atlas.",
      "Add this machine's IP address to Atlas Network Access, or switch MONGODB_URL to a local server",
      "such as mongodb://127.0.0.1:27017/quickbasket for development.",
      `Original error: ${error.message}`,
    ].join(" ");
  }

  return [
    "Could not connect to MongoDB.",
    "Make sure your local MongoDB server is running, or update MONGODB_URL to a reachable instance.",
    `Original error: ${error.message}`,
  ].join(" ");
};

export const connectDb = async () => {
  const mongoUrl = requireEnv(env.mongoUrl, "MONGODB_URL");
  const canFallbackToLocal =
    env.nodeEnv !== "production" &&
    localMongoUrl &&
    mongoUrl !== localMongoUrl &&
    (mongoUrl.includes("mongodb.net") || mongoUrl.startsWith("mongodb+srv://"));

  mongoose.set("strictQuery", true);
  try {
    const conn = await connectWithUrl(mongoUrl);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (canFallbackToLocal) {
      try {
        console.warn(
          `MongoDB Atlas unreachable, falling back to local MongoDB at ${localMongoUrl}`,
        );
        const localConn = await connectWithUrl(localMongoUrl);
        console.log(`MongoDB connected: ${localConn.connection.host} (local fallback)`);
        return localConn;
      } catch (localError) {
        const startupError = new Error(
          [
            buildMongoConnectionMessage(mongoUrl, error),
            `Local fallback also failed: ${localError.message}`,
          ].join(" "),
        );
        startupError.cause = localError;
        throw startupError;
      }
    }

    const startupError = new Error(buildMongoConnectionMessage(mongoUrl, error));
    startupError.cause = error;
    throw startupError;
  }
};
