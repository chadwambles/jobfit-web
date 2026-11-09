/**
 * Spend limits for the one call that costs money.
 *
 * The site is public and the key is mine, so without this any visitor can run
 * up a bill. Three bounds, cheapest first:
 *
 *   a kill switch, so framing can be turned off without a redeploy
 *   a per-IP window, which stops one person looping
 *   a global daily cap, which bounds the worst day regardless of who is asking
 *
 * Honest limitation: this state lives in the process. On Vercel each serverless
 * instance keeps its own counters and a cold start resets them, so the real
 * ceiling is the cap times however many instances are warm. That is a soft
 * bound, not a hard one. It turns "unbounded" into "bounded by a small
 * multiple", which is the difference that matters. Making it exact needs
 * shared storage such as Vercel KV, and the limiter is written so that
 * swapping the store is the only change required.
 */

const PER_IP = Number(process.env.JOBFIT_FRAMING_PER_IP_PER_HOUR || 6);
const PER_DAY = Number(process.env.JOBFIT_FRAMING_PER_DAY || 250);
const HOUR = 3600_000;
const DAY = 86_400_000;

const ipHits = new Map();   // ip -> number[] of timestamps
let dayCount = 0;
let dayStarted = Date.now();

/** Trust only the header the platform sets. A client can send anything. */
export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function allowFraming(ip) {
  if (process.env.JOBFIT_FRAMING_ENABLED === "false") {
    return { ok: false, reason: "framing turned off" };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, reason: "no key configured" };
  }

  const now = Date.now();

  if (now - dayStarted > DAY) { dayCount = 0; dayStarted = now; }
  if (dayCount >= PER_DAY) return { ok: false, reason: "daily cap reached" };

  const seen = (ipHits.get(ip) ?? []).filter((t) => now - t < HOUR);
  if (seen.length >= PER_IP) {
    ipHits.set(ip, seen);
    return { ok: false, reason: "per-IP limit reached" };
  }

  seen.push(now);
  ipHits.set(ip, seen);
  dayCount += 1;

  // Keep the map from growing without bound on a long-lived instance.
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      if (!v.some((t) => now - t < HOUR)) ipHits.delete(k);
    }
  }

  return { ok: true };
}

export function limitStats() {
  const now = Date.now();
  return {
    perIpPerHour: PER_IP,
    perDay: PER_DAY,
    usedToday: dayCount,
    remainingToday: Math.max(0, PER_DAY - dayCount),
    windowResetsIn: Math.max(0, Math.round((DAY - (now - dayStarted)) / 60000)) + " min",
    note: "Per instance. Serverless runs several, so treat this as indicative.",
  };
}

/** Tests need a clean slate. */
export function resetLimits() { ipHits.clear(); dayCount = 0; dayStarted = Date.now(); }
