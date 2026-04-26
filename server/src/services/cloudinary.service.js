import { v2 as cloudinary } from "cloudinary";
import { env, hasEnvValue } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

export const hasCloudinaryConfig = () =>
  hasEnvValue(env.cloudinaryCloudName) &&
  hasEnvValue(env.cloudinaryApiKey) &&
  hasEnvValue(env.cloudinaryApiSecret);

export const uploadBufferToCloudinary = async (buffer, folder = "quickbasket") => {
  if (!hasCloudinaryConfig()) {
    throw new Error("Cloudinary credentials are missing");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary did not return an image URL"));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
};
