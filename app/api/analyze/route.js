import { NextResponse } from "next/server";
import { analyze, analyzeAgainstReference } from "../../../lib/engine.js";
import { framingFor } from "../../../lib/framing.js";
import { allowFraming, clientIp } from "../../../lib/limit.js";

/** Attach the prose if it is available. It never decides whether a response
 *  is sent, and it never delays one past its own timeout. */
async function withFraming(result, req) {
  if (!result.ok) return result;
  // Serve a cached answer without touching the budget. A cache hit costs
  // nothing, so counting it against the daily cap would let a popular market
  // exhaust the day on free lookups.
  const cached = await framingFor(result, { cacheOnly: true });
  if (cached) return { ...result, framing: cached };

  // Only a genuine model call is gated.
  if (!allowFraming(clientIp(req)).ok) return result;

  const framing = await framingFor(result);
  return framing ? { ...result, framing } : result;
}

/** Cap the paste so one person cannot wedge the process with a novel. */
const MAX_CHARS = 4_000_000;
const MIN_CHARS = 200;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }
  const text = typeof body?.text === "string" ? body.text : "";
  const evidenced = Array.isArray(body?.evidenced) ? body.evidenced : [];
  const experience = typeof body?.experience === "string" ? body.experience : "";
  const hasText = text.trim().length > 0;

  // Evidence on its own is a valid way in: the market is then the reference
  // corpus rather than a paste.
  if (!hasText) {
    if (!evidenced.length && experience.trim().length < 80) {
      return NextResponse.json(
        { ok: false, error: "Paste some postings, paste your experience, tick what you can evidence, or any mix of the three." },
        { status: 400 });
    }
    const started = Date.now();
    const result = await withFraming(analyzeAgainstReference(evidenced, experience), req);
    return NextResponse.json({ ...result, mode: "reference", ms: Date.now() - started });
  }

  if (text.trim().length < MIN_CHARS) {
    return NextResponse.json(
      { ok: false, error: `Paste at least one full job posting, or leave the box empty and just tick your evidence.` },
      { status: 400 });
  }
  if (experience.length > MAX_CHARS) {
    return NextResponse.json(
      { ok: false, error: "That experience text is over the character limit." },
      { status: 413 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { ok: false, error: `That is over the ${MAX_CHARS.toLocaleString()} character limit.` },
      { status: 413 });
  }

  const started = Date.now();
  try {
    const result = await withFraming(analyze(text, evidenced, experience), req);
    return NextResponse.json({ ...result, mode: "postings", ms: Date.now() - started },
                             { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error("analyze failed:", err);
    return NextResponse.json({ ok: false, error: "Could not read those postings." },
                             { status: 500 });
  }
}
