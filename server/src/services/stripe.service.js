import Stripe from "stripe";
import { env, requireEnv } from "../config/env.js";

let stripe;

export const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(requireEnv(env.stripeSecretKey, "STRIPE_SECRET_KEY"));
  }

  return stripe;
};
