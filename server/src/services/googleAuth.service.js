import { OAuth2Client } from "google-auth-library";
import { env, hasEnvValue } from "../config/env.js";
import { badRequest, unauthorized } from "../utils/httpError.js";

let googleClient;

const getGoogleClient = () => {
  if (!hasEnvValue(env.googleClientId)) {
    throw badRequest("Google sign-in is not configured");
  }

  if (!googleClient) {
    googleClient = new OAuth2Client(env.googleClientId);
  }

  return googleClient;
};

export const verifyGoogleCredential = async (credential) => {
  const client = getGoogleClient();

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
      throw unauthorized("Google account email must be verified");
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name || payload.given_name || payload.email.split("@")[0],
      image: payload.picture,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw unauthorized("Google sign-in could not be verified");
  }
};
