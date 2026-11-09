import { NextResponse } from "next/server";
import { cache } from "../../../lib/cache.js";
import { limitStats } from "../../../lib/limit.js";

/** What the cache has saved. The whole cost argument for this product rests
 *  on this number, so it is worth being able to read it. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, cache: await cache().stats(), limits: limitStats() });
  } catch {
    return NextResponse.json({ ok: false, error: "Cache unavailable." }, { status: 503 });
  }
}
