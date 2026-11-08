/**
 * Storage for cached framing.
 *
 * Two implementations behind one interface. MySQL when MYSQL_URL is set, and
 * an in-process map otherwise, so the app runs on a laptop with no database
 * and the tests need no server. Nothing above this file knows which is in use.
 *
 * The cache is best effort throughout. A database that is down must never
 * cost anyone their result, so every method swallows its own errors and
 * reports a miss.
 */
import { createHash } from "node:crypto";

export const keyFor = (bucket) => createHash("sha256").update(bucket).digest("hex");

function memoryCache() {
  const rows = new Map();
  return {
    kind: "memory",
    async get(key) {
      const r = rows.get(key);
      if (r) { r.hits += 1; r.last_hit_at = new Date(); }
      return r ?? null;
    },
    async put(row) {
      rows.set(row.bucket_key, { ...row, hits: 0, created_at: new Date() });
    },
    async stats() {
      const all = [...rows.values()];
      return {
        kind: "memory",
        buckets: all.length,
        hits: all.reduce((n, r) => n + r.hits, 0),
        tokensAvoided: all.reduce((n, r) => n + (r.tokens_in + r.tokens_out) * r.hits, 0),
      };
    },
    async close() {},
  };
}

function mysqlCache(url) {
  let poolPromise = null;
  const pool = async () => {
    if (!poolPromise) {
      poolPromise = import("mysql2/promise")
        .then((m) => m.createPool(url))
        .catch((err) => { console.error("cache: mysql unavailable:", err.message); return null; });
    }
    return poolPromise;
  };

  return {
    kind: "mysql",
    async get(key) {
      try {
        const p = await pool();
        if (!p) return null;
        const [rows] = await p.query("SELECT * FROM framing WHERE bucket_key = ? LIMIT 1", [key]);
        if (!rows.length) return null;
        // Fire and forget: a failed counter must not fail a cache hit.
        p.query("UPDATE framing SET hits = hits + 1, last_hit_at = NOW() WHERE bucket_key = ?",
                [key]).catch(() => {});
        return rows[0];
      } catch (err) {
        console.error("cache: read failed:", err.message);
        return null;
      }
    },
    async put(row) {
      try {
        const p = await pool();
        if (!p) return;
        await p.query(
          `INSERT INTO framing
             (bucket_key, bucket, market, digest_json, prose, model, tokens_in, tokens_out)
           VALUES (?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE prose = VALUES(prose), model = VALUES(model)`,
          [row.bucket_key, row.bucket.slice(0, 1024), row.market,
           JSON.stringify(row.digest_json), row.prose, row.model,
           row.tokens_in, row.tokens_out]);
      } catch (err) {
        console.error("cache: write failed:", err.message);
      }
    },
    async stats() {
      try {
        const p = await pool();
        if (!p) return { kind: "mysql", unavailable: true };
        const [rows] = await p.query("SELECT * FROM framing_savings");
        return { kind: "mysql", byMarket: rows };
      } catch {
        return { kind: "mysql", unavailable: true };
      }
    },
    async close() {
      const p = await poolPromiseSafe(poolPromise);
      if (p) await p.end().catch(() => {});
    },
  };
}

async function poolPromiseSafe(p) { try { return await p; } catch { return null; } }

let shared = null;
export function cache() {
  if (!shared) shared = process.env.MYSQL_URL ? mysqlCache(process.env.MYSQL_URL) : memoryCache();
  return shared;
}

/** Tests supply their own. */
export function setCache(c) { shared = c; }
export { memoryCache };
