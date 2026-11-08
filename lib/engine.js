/**
 * The only place the app talks to the engine.
 *
 * Everything here is deterministic. No model call appears in this file or
 * anywhere downstream of it, which is what keeps a request's cost at zero.
 */
import {
  buildProfile, digest, profileBucket, profileSize,
  computeGap, matchProjects, catalogBlindSpots, capabilities, seedCatalog,
  referenceProfile, referenceFor, vocabularyScope, assessScope, catalogFor, markets,
} from "jobfit-engine";

export const allCapabilities = markets.flatMap((mk) =>
  mk.capabilities.map((c) => ({
    id: c.id, name: c.name, family: c.family,
    demonstrable: c.demonstrable, market: mk.id,
  })));

/** Families in the order they should appear in the checklist, market first. */
export const families = markets.flatMap((mk) =>
  [...new Set(mk.capabilities.map((c) => c.family))].map((f) => `${mk.id}/${f}`));

export const scope = {
  derivedFrom: vocabularyScope.derivedFrom,
  describe: vocabularyScope.describe,
  reference: referenceProfile.reference,
  referencePostings: referenceProfile.postings,
};

/** Shared tail: the gap, the projects and what the whole thing cost. */
function assemble(profile, evidenced, rawChars) {
  const gap = computeGap(profile, evidenced);
  // The catalog has to follow the market. Scoring BA projects against a
  // software engineering gap would recommend a requirements traceability
  // matrix to a backend engineer.
  const catalog = catalogFor(profile);
  return {
    ok: true,
    profile,
    gap,
    projects: matchProjects(gap, catalog, { limit: 3 }),
    blindSpots: catalogBlindSpots(gap, catalog),
    cost: {
      rawTokens: Math.ceil(rawChars / 4),
      profileTokens: profileSize(profile),
      digestTokens: profileSize(digest(profile)),
      bucket: profileBucket(profile),
    },
  };
}

/**
 * Pull capabilities straight out of a resume or a description of experience.
 *
 * The same patterns that read a posting read a resume; only the role of the
 * text changes. A posting states demand, a resume states supply.
 *
 * These count as evidence without a confirmation step, which is the call Chad
 * made. The result labels them so the coverage figure still says where it came
 * from, since a resume line is a claim and a ticked box is a claim the person
 * made deliberately.
 */
function readExperience(text, marketId) {
  if (!text || text.trim().length < 80) return { names: [], market: marketId ?? null };
  const prof = buildProfile(text, { onet: false, market: marketId ?? "auto" });
  return {
    names: prof.capabilities.map((c) => c.name),
    market: prof.market.id,
    confident: prof.market.confident,
  };
}

/**
 * Evidence only. There is no paste of postings, so the market is whichever
 * reference corpus fits: the 201 behind the published study, or the 758
 * technical postings. A resume picks the market for itself.
 */
export function analyzeAgainstReference(evidenced = [], experience = "") {
  const read = readExperience(experience, "auto");
  const marketId = read.market && read.confident ? read.market : "ba";
  // Re-read against the settled market so the names line up with the profile.
  const resume = experience ? readExperience(experience, marketId).names : [];
  const all = [...new Set([...evidenced, ...resume])];

  const out = assemble(referenceFor(marketId), all, 0);
  out.evidence = { ticked: evidenced.length, fromResume: resume, total: all.length };
  return out;
}

export function analyze(text, evidenced = [], experience = "") {
  const profile = buildProfile(text);
  if (!profile.postings) {
    return { ok: false, error: "No postings found in that text." };
  }

  // Measure thinness against the market the postings actually chose, not
  // against a fixed 45.
  const scopeOf = assessScope(profile, { of: profile.capabilitiesConsidered ??
    markets.find((mk) => mk.id === profile.market?.id)?.capabilities.length ?? 45 });

  // Nothing fired at all, which is what a paste of something that is not a
  // job posting looks like. Anything above zero is shown, with a note when it
  // is thin: the vocabulary's silence is the honest signal, and unlike the
  // occupation guess it needs no inference to be trusted.
  if (scopeOf.fired === 0) {
    return {
      ok: false,
      error:
        "That does not read like job postings. Nothing in it matched any of the " +
        `${markets.reduce((n, mk) => n + mk.capabilities.length, 0)} capabilities ` +
        "in either market, not even once. Check you pasted the posting bodies " +
        "and not just the titles.",
    };
  }

  // The resume is read against the market the postings chose, so supply and
  // demand are counted in the same vocabulary.
  const resume = readExperience(experience, profile.market.id).names;
  const all = [...new Set([...evidenced, ...resume])];

  return {
    ...assemble(profile, all, text.length),
    scope: scopeOf,
    evidence: { ticked: evidenced.length, fromResume: resume, total: all.length },
  };
}
