/**
 * The only part of this product that costs money.
 *
 * Everything upstream is arithmetic: parsing, profiling, the gap and the match
 * never call a model. This writes the closing paragraphs, and only those, from
 * the digest rather than the postings. A 201 posting paste is roughly 370,000
 * tokens of raw text and about 120 tokens of digest, so the model sees three
 * thousandths of what the user pasted.
 *
 * It is cached on the profile bucket, so two people whose markets look the
 * same are one call between them, not two.
 *
 * Every failure here is silent and returns null. The measured result is the
 * product; the prose is a garnish, and a garnish may never take the plate.
 */
import { profileBucket } from "jobfit-engine";
import { cache, keyFor } from "./cache.js";

// Overridable so the whole path, including the page, can be exercised against
// a stand-in. Production leaves it unset.
const ENDPOINT = process.env.JOBFIT_MODEL_ENDPOINT || "https://api.anthropic.com/v1/messages";
const MODEL = process.env.JOBFIT_MODEL || "claude-haiku-4-5-20251001";
const TIMEOUT_MS = Number(process.env.JOBFIT_FRAMING_TIMEOUT || 8000);

const SYSTEM = [
  "You write the closing note on a report that has already done its own analysis.",
  "You are given only summary figures, never the source postings.",
  "Write two short paragraphs, under 110 words in total.",
  "Say what this market is really asking for and what the person should do first.",
  "Use the figures you are given and invent none. Never state a number that is not present.",
  "Plain language, no bullet points, no headings, no em dashes, no exclamation marks.",
  "Do not greet, do not congratulate, do not restate the figures as a list.",
].join(" ");

/** The smallest thing that can produce a useful paragraph. */
export function payloadFor(result) {
  const { profile, gap, projects } = result;
  return {
    market: profile.market?.name ?? "business analysis",
    postings: profile.postings,
    demands: profile.capabilities.slice(0, 6).map((c) => `${c.name} ${c.pct}%`),
    coverageAbout: `${Math.round(gap.coverage / 10) * 10}%`,
    gapsAProjectCanClose: gap.closableSolo.length,
    gapsNeedingAJob: gap.needsEmployment.slice(0, 3).map((c) => c.name),
    suggested: projects.slice(0, 3).map((p) => p.title),
  };
}

/**
 * The cache key.
 *
 * profileBucket alone describes the market, and the first version used it
 * directly. That was wrong: the payload also carries this person's coverage,
 * their gap count and the projects picked for them, so two people in the same
 * market with different evidence would have been served each other's numbers.
 *
 * Coverage is bucketed to the nearest ten rather than kept exact, so the cache
 * still has something to hit. Someone at 31% and someone at 36% get the same
 * paragraph, and the paragraph is true of both.
 */
export function bucketFor(result) {
  const decile = Math.round((result.gap?.coverage ?? 0) / 10) * 10;
  const ids = result.projects.map((p) => p.id).join(",");
  return `${profileBucket(result.profile)} :: cov${decile} :: ${ids}`;
}

/**
 * @returns {{prose, cached, model, tokensIn, tokensOut}|null}
 */
export async function framingFor(result, { fetchImpl = fetch, store = cache() } = {}) {
  let bucket;
  try {
    bucket = bucketFor(result);
  } catch {
    return null;
  }
  const key = keyFor(bucket);

  const hit = await store.get(key);
  if (hit?.prose) {
    return { prose: hit.prose, cached: true, model: hit.model, tokensIn: 0, tokensOut: 0 };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;   // no key configured: the app simply has no prose

  const payload = payloadFor(result);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetchImpl(ENDPOINT, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
    });

    if (!res.ok) {
      console.error("framing: model returned", res.status);
      return null;
    }
    const body = await res.json();
    const prose = (body?.content ?? [])
      .filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    if (!prose) return null;

    const tokensIn = body?.usage?.input_tokens ?? 0;
    const tokensOut = body?.usage?.output_tokens ?? 0;

    await store.put({
      bucket_key: key, bucket, market: result.profile.market?.id ?? "ba",
      digest_json: payload, prose, model: MODEL,
      tokens_in: tokensIn, tokens_out: tokensOut,
    });

    return { prose, cached: false, model: MODEL, tokensIn, tokensOut };
  } catch (err) {
    console.error("framing:", err.name === "AbortError" ? "timed out" : err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
