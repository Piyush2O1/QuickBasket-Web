import { env, hasEnvValue } from "../config/env.js";

const PULSEIQ_API_KEY = env.pulseiqApiKey;
const PULSEIQ_PROJECT_ID = env.pulseiqProjectId;
const PULSEIQ_ENDPOINT = env.pulseiqEndpoint;

const toUserId = (userId) => userId?.toString?.() || userId || undefined;
const hasPulseIqKey = () =>
  hasEnvValue(PULSEIQ_API_KEY) && PULSEIQ_API_KEY !== "your_pulseiq_api_key";

export async function track(eventName, userId = null, properties = {}) {
  if (!eventName || !hasPulseIqKey()) return;

  try {
    await fetch(PULSEIQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PULSEIQ_API_KEY,
      },
      body: JSON.stringify({
        projectId: PULSEIQ_PROJECT_ID,
        eventName,
        userId: toUserId(userId),
        anonymousId: "server_event",
        properties,
      }),
    });
  } catch {}
}
