-- Cache for the one part of this app that costs money.
--
-- Everything upstream is deterministic: parsing, profiling, the gap and the
-- match never call a model. Only the closing paragraphs do, and two people
-- whose markets look the same deserve the same paragraphs. So the key is the
-- profile bucket, not the user and not the raw paste.
--
--   mysql -u root -p jobfit < db/schema.sql

CREATE TABLE IF NOT EXISTS framing (
  -- SHA-256 of the bucket string. Fixed width, so it indexes properly, and
  -- the readable bucket is kept beside it for debugging.
  bucket_key   CHAR(64)     NOT NULL PRIMARY KEY,
  bucket       VARCHAR(1024) NOT NULL,
  market       VARCHAR(32)  NOT NULL,

  -- Exactly what was sent, so a cached answer can always be traced back to
  -- the input that produced it.
  digest_json  JSON         NOT NULL,
  prose        TEXT         NOT NULL,

  model        VARCHAR(64)  NOT NULL,
  tokens_in    INT UNSIGNED NOT NULL DEFAULT 0,
  tokens_out   INT UNSIGNED NOT NULL DEFAULT 0,

  hits         INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_hit_at  TIMESTAMP    NULL DEFAULT NULL,

  KEY idx_market (market),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What the cache is actually saving, in one query.
CREATE OR REPLACE VIEW framing_savings AS
SELECT
  market,
  COUNT(*)                        AS cached_buckets,
  SUM(hits)                       AS cache_hits,
  SUM(tokens_in  * hits)          AS input_tokens_avoided,
  SUM(tokens_out * hits)          AS output_tokens_avoided,
  ROUND(SUM(hits) / NULLIF(COUNT(*) + SUM(hits), 0) * 100, 1) AS hit_rate_pct
FROM framing
GROUP BY market;
