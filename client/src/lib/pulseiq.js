const PULSEIQ_API_KEY = import.meta.env.VITE_PULSEIQ_API_KEY;
const PULSEIQ_PROJECT_ID =
  import.meta.env.VITE_PULSEIQ_PROJECT_ID || "69ee438f5451251bff0e55e3";
const PULSEIQ_ENDPOINT =
  import.meta.env.VITE_PULSEIQ_ENDPOINT || "https://pulseiq-ffio.onrender.com/api/ingest/event";

const anonymousIdKey = "quickbasket_pulseiq_anonymous_id";
const hasPulseIqKey = () => PULSEIQ_API_KEY && PULSEIQ_API_KEY !== "your_pulseiq_api_key";

const getAnonymousId = () => {
  if (typeof window === "undefined") return "browser_event";

  try {
    const existing = window.localStorage.getItem(anonymousIdKey);
    if (existing) return existing;

    const next =
      window.crypto?.randomUUID?.() ||
      `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(anonymousIdKey, next);
    return next;
  } catch {
    return "browser_event";
  }
};

const compactProperties = (properties = {}) =>
  Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined && value !== null),
  );

const resolveUserId = (user) => {
  if (!user) return undefined;
  if (typeof user === "object") return user.id || user._id;
  return user;
};

export async function trackPulseIq(eventName, { userId = null, properties = {} } = {}) {
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
        userId: userId || undefined,
        anonymousId: getAnonymousId(),
        properties: compactProperties(properties),
      }),
    });
  } catch {}
}

export function trackPageView(location, user = null) {
  return trackPulseIq("page_view", {
    userId: resolveUserId(user),
    properties: {
      path: location.pathname,
      search: location.search,
      hash: location.hash,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      title: typeof document !== "undefined" ? document.title : undefined,
      role: user?.role,
    },
  });
}

export function identifyPulseIq(user, properties = {}) {
  const userId = resolveUserId(user);
  if (!userId) return undefined;

  return trackPulseIq("identify", {
    userId,
    properties: {
      name: user?.name,
      email: user?.email,
      role: user?.role,
      ...properties,
    },
  });
}

export const identify = identifyPulseIq;
export const track = (eventName, properties = {}, userId = null) =>
  trackPulseIq(eventName, { userId, properties });
