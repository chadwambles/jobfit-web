import { NextResponse } from "next/server";
import { cache } from "../../../lib/cache.js";

/** What the cache has saved. The whole cost argument for this product rests
 *  on this number, so it is worth being able to read it. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...(await cache().stats()) });
  } catch {
    return NextResponse.json({ ok: false, error: "Cache unavailable." }, { status: 503 });
  }
}
