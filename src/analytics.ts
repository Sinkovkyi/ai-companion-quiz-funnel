import posthog from "posthog-js";

/**
 * The only file that talks to the analytics vendor.
 * Event names follow Amplitude's "Object Action" convention, so the tracking plan
 * in docs/04-analytics-plan.md works in Amplitude without renaming.
 */

// Public client token (safe to ship in the browser, it can only send events).
const KEY = import.meta.env.VITE_POSTHOG_KEY ?? "phc_sP7o3G4f3mrqZGLGyhLnomqQrbK2JYQo92XFo4qj6pJy";
const HOST = import.meta.env.VITE_POSTHOG_HOST ?? "https://eu.i.posthog.com";

type Props = Record<string, string | number | boolean | string[] | undefined>;

declare global {
  interface Window {
    __events?: { event: string; props: Props }[];
  }
}

const params = new URLSearchParams(window.location.search);
const qa = params.get("qa") === "1";
const send = params.get("nosend") !== "1";
let ready = false;

export function initAnalytics(funnelVersion: string) {
  if (qa) window.__events = [];
  if (!send) return;
  posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    person_profiles: "identified_only",
    persistence: "localStorage",
    // PostHog drops events from headless browsers. QA runs (?qa=1) are automated,
    // so they opt out of that filter and are tagged qa=1 instead, to be excluded later.
    opt_out_useragent_filter: qa,
  });
  ready = true;
  posthog.register({
    funnel_version: funnelVersion,
    utm_source: params.get("utm_source") ?? "direct",
    utm_campaign: params.get("utm_campaign") ?? undefined,
    qa: qa ? 1 : 0,
  });
}

export function setSuper(props: Props) {
  if (ready) posthog.register(props);
}

export function track(event: string, props: Props = {}) {
  if (window.__events) window.__events.push({ event, props });
  if (ready) posthog.capture(event, props);
}

/** Session-scoped storage that never throws (private mode, blocked storage). */
export const session = {
  get<T>(key: string): T | undefined {
    try {
      const v = sessionStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : undefined;
    } catch {
      return undefined;
    }
  },
  set(key: string, value: unknown) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* the funnel still works, only refresh-safety is lost */
    }
  },
};

const seen = new Set<string>(session.get<string[]>("halcy_seen") ?? []);

/** Fires an event only once per browser session: survives Back, re-renders and page refresh. */
export function trackOnce(key: string, event: string, props: Props = {}) {
  if (seen.has(key)) return;
  seen.add(key);
  session.set("halcy_seen", [...seen]);
  track(event, props);
}

export function trackStepView(stepId: string, index: number, type: string) {
  trackOnce(`step:${stepId}`, "Step Viewed", { step_id: stepId, step_index: index, step_type: type });
}

/**
 * A/B variant: ?variant= forces one for QA, otherwise the PostHog feature flag decides.
 * Called when the user reaches the matching screen, right before the result, so only people
 * who can actually see the difference are counted as exposed.
 * Falls back to control if flags don't load within 1.5 s, so nobody waits on a slow network.
 */
export function getVariant(flag: string, variants: string[], control: string): Promise<string> {
  const forced = params.get("variant");
  if (forced && variants.includes(forced)) return Promise.resolve(forced);
  if (!ready) return Promise.resolve(control);
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: string) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    posthog.onFeatureFlags(() => {
      // Don't read the flag after the timeout: that would log an exposure the user never saw.
      if (done) return;
      const v = posthog.getFeatureFlag(flag);
      finish(typeof v === "string" && variants.includes(v) ? v : control);
    });
    setTimeout(() => finish(control), 1500);
  });
}
