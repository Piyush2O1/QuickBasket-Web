import nodemailer from "nodemailer";
import { env, hasEnvValue } from "../config/env.js";

export const sendMail = async ({ to, subject, html }) => {
  if (!hasEnvValue(env.email) || !hasEnvValue(env.emailPass)) {
    throw new Error("Email credentials are not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.email,
      pass: env.emailPass,
    },
  });

  await transporter.sendMail({
    from: `"Quick Basket" <${env.email}>`,
    to,
    subject,
    html,
  });
};
