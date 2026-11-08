"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import "./globals.css";
import { allCapabilities, families, marketMeta } from "../lib/capabilities.client.js";
import { EXAMPLE } from "../lib/example.js";

const MIN_CHARS = 200;
const MIN_EXP = 80;

/** One row of measured demand, drawn as a marker stroke over the phrase. */
function Mark({ label, pct, covered }) {
  return (
    <div className={covered ? "mk mk-cov" : "mk"}>
      <span className="mk-bar">
        <span
          className="mk-swipe"
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
          aria-hidden="true"
        />
        <span className="mk-txt">{label}</span>
      </span>
      <span className="mk-n">{pct}%</span>
    </div>
  );
}


/**
 * First-run walkthrough.
 *
 * Built phone first: full screen with a thumb-reachable control bar, becoming
 * a centred card only once there is room. It explains the three ways in and
 * the one thing the app refuses to do, because that refusal is the point of
 * the product and nobody would guess it.
 *
 * Shown once, then never again unless asked for. Storage is wrapped because a
 * private window throws on read and a tutorial must not take the page down.
 */
const TOUR_KEY = "jobfit.tour.seen";

const STEPS = [
  {
    kicker: "Step one",
    title: "Paste the jobs you are actually chasing",
    body: "Copy whole postings, bodies and all, not just the titles. Ten beats one: a single posting tells you what one hiring manager wrote on a Tuesday.",
    art: "postings",
  },
  {
    kicker: "Step two",
    title: "Or just say what you have done",
    body: "Paste your resume, or write a few lines. The same patterns that read a posting read this, so what it finds counts as evidence. You can also tick things by hand.",
    art: "resume",
  },
  {
    kicker: "Any one is enough",
    title: "You do not need all three",
    body: "Postings on their own show you the market. Your experience on its own is measured against a reference market. Both together give you the real gap.",
    art: "doors",
  },
  {
    kicker: "What you get",
    title: "A measured gap, then what to build",
    body: "Every number comes from counting, not guessing. No model is called to measure anything.",
    art: "result",
  },
  {
    kicker: "The honest part",
    title: "It will tell you what no project can fix",
    body: "On-call rotations, production incidents, leading a team. Those need a real job, and anything that sells you a weekend project for them is wasting your weekend.",
    art: "cannot",
  },
];

function Art({ kind }) {
  if (kind === "postings") {
    return (
      <div className="art art-post" aria-hidden="true">
        {[90, 70, 84, 55].map((w, i) => (
          <span key={i} style={{ width: `${w}%` }} className={i === 1 ? "lit" : ""} />
        ))}
      </div>
    );
  }
  if (kind === "resume") {
    return (
      <div className="art art-post" aria-hidden="true">
        {[60, 88, 74].map((w, i) => (
          <span key={i} style={{ width: `${w}%` }} className={i === 1 ? "lit" : ""} />
        ))}
      </div>
    );
  }
  if (kind === "doors") {
    return (
      <div className="art art-doors" aria-hidden="true">
        <span>Postings</span><span>Resume</span><span>Ticks</span>
      </div>
    );
  }
  if (kind === "cannot") {
    return (
      <div className="art art-cannot" aria-hidden="true">
        <s>On-call rotation</s><s>Production incidents</s><s>Lead a team</s>
      </div>
    );
  }
  return (
    <div className="art art-result" aria-hidden="true">
      {[100, 72, 48].map((w, i) => (
        <span key={i}><i style={{ width: `${w}%` }} /></span>
      ))}
    </div>
  );
}

function Tutorial({ onClose }) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const step = STEPS[i];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && !last) setI((n) => n + 1);
      if (e.key === "ArrowLeft" && i > 0) setI((n) => n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, last, onClose]);

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-label="How this works">
      <div className="tour-card">
        <div className="tour-body">
          <p className="tour-kicker">{step.kicker}</p>
          <h2 className="tour-h">{step.title}</h2>
          <Art kind={step.art} />
          <p className="tour-p">{step.body}</p>
        </div>

        <div className="tour-bar">
          <div className="tour-dots" aria-hidden="true">
            {STEPS.map((_, n) => <span key={n} className={n === i ? "on" : ""} />)}
          </div>
          <div className="tour-acts">
            {i > 0 && (
              <button className="ghost small" onClick={() => setI((n) => n - 1)}>Back</button>
            )}
            <button className="tour-next" onClick={() => (last ? onClose() : setI((n) => n + 1))}>
              {last ? "Start" : "Next"}
            </button>
          </div>
        </div>
        <button className="tour-skip" onClick={onClose}>
          {last ? "Close" : "Skip the walkthrough"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [exp, setExp] = useState("");
  const [have, setHave] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [openEvidence, setOpenEvidence] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tour, setTour] = useState(false);

  // First visit only. A private window throws on read, so a failure here must
  // simply mean no tutorial rather than no page.
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) setTour(true);
    } catch {}
  }, []);

  function closeTour() {
    setTour(false);
    try { localStorage.setItem(TOUR_KEY, "1"); } catch {}
  }
  const stageRef = useRef(null);

  // On phones the stage sits below a tall rail, so without this a result can
  // land entirely off screen and look like nothing happened.
  useEffect(() => {
    if (res && window.matchMedia("(max-width: 999px)").matches) {
      stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [res]);

  // Both markets are listed, because evidence is ticked before any paste is
  // read and the app cannot know yet which vocabulary the postings will choose.
  const shown = useMemo(() => {
    const key = (c) => `${c.market}/${c.family}`;
    const q = query.trim().toLowerCase();
    const pool = q
      ? allCapabilities.filter((c) => c.name.toLowerCase().includes(q))
      : allCapabilities;
    const fams = q || showAll ? families : families.slice(0, 3);
    return fams
      .map((f) => [f, pool.filter((c) => key(c) === f)])
      .filter(([, cs]) => cs.length);
  }, [query, showAll]);

  const matchCount = useMemo(() => shown.reduce((n, [, cs]) => n + cs.length, 0), [shown]);

  function toggle(name) {
    setHave((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function reset() {
    setText(""); setExp(""); setHave(new Set()); setQuery("");
    setRes(null); setErr(""); setShowAll(false); setOpenEvidence(false); setEditing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pasted = text.trim().length;
  const pastedEnough = pasted >= MIN_CHARS;
  const ticked = have.size;
  const told = exp.trim().length >= MIN_EXP;
  // Any one door is enough on its own.
  const ready = pastedEnough || (pasted === 0 && (ticked > 0 || told));

  async function run() {
    setBusy(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: pasted ? text : "",
          evidenced: [...have],
          experience: exp.trim(),
        }),
      });
      const data = await r.json();
      if (data.ok) { setRes(data); setEditing(false); }
      else setErr(data.error || "Something went wrong.");
    } catch {
      setErr("Could not reach the server. Check it is still running.");
    } finally {
      setBusy(false);
    }
  }

  const label = ticked || told ? "Measure the gap" : "Read the postings";

  const done = Boolean(res) && !editing;

  return (
    <div className="sheet">
      {tour && <Tutorial onClose={closeTour} />}

      <header className={done ? "top top-slim" : "top"}>
        <div className="band">
          <div className="top-row">
            <h1>What your postings actually ask for</h1>
            <button className="ghost small how" onClick={() => setTour(true)}>
              How it works
            </button>
          </div>
          <p className="lede">
            Paste the postings you are chasing and get what that market demands,
            measured. Tick what you can already prove and it becomes a gap, with the
            projects that close the most of it. Nothing here calls a language model.
          </p>
          <p className="excerpt">
            Partner with product owners to <span className="hl">elicit requirements</span>,
            {" "}<span className="hl">write user stories</span> with clear
            {" "}<span className="hl">acceptance criteria</span>, and keep traceability
            through delivery.
            <span className="src">
              One posting from the corpus, with three capabilities marked. The engine
              does this to everything you paste, against whichever of its two
              vocabularies your postings turn out to be written in.
            </span>
          </p>
        </div>
      </header>

      <div className={done ? "band stage-wide" : "band work"}>
        {done && (
          <button className="recap" onClick={() => setEditing(true)}>
            <span className="recap-what">
              {pasted > 0
                ? `${res.profile.postings} ${res.profile.postings === 1 ? "posting" : "postings"}`
                : "No postings"}
              {told && ", your experience"}
              {ticked > 0 && `, ${ticked} ticked`}
            </span>
            <span className="recap-edit">Change what you pasted</span>
          </button>
        )}

        <div className="rail" hidden={done}>
          <section className="door">
            <h2 className="door-h">The postings</h2>
            <p className="note">
              However many you have, in whatever shape you copied them. Paste the
              bodies, not just the titles.
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste job postings here"
              spellCheck={false}
              aria-label="Job postings"
            />
            <div className="row">
              <button className="ghost small" onClick={() => setText(EXAMPLE)}>
                Load an example
              </button>
              <span className="count">
                {text.length.toLocaleString()} characters
                {pasted > 0 && !pastedEnough && ` of ${MIN_CHARS}`}
              </span>
            </div>
          </section>

          <p className="or">Any one of these on its own, or all three.</p>

          <section className="door">
            <h2 className="door-h">Your experience</h2>
            <p className="note">
              Paste your resume, or just describe what you have done. The same patterns
              that read a posting read this, and what it finds counts as evidence.
            </p>
            <textarea
              className="shorter"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              placeholder="Paste a resume, or write a few lines about what you have built"
              spellCheck={false}
              aria-label="Your experience"
            />
            <div className="row">
              <span className="count">
                {exp.length.toLocaleString()} characters
                {exp.trim().length > 0 && !told && ` of ${MIN_EXP}`}
              </span>
            </div>
          </section>

          <section className="door">
            <div className="acc">
              <button
                className="acc-head"
                onClick={() => setOpenEvidence((o) => !o)}
                aria-expanded={openEvidence}
                aria-controls="evidence"
              >
                <span className="caret" aria-hidden="true">{openEvidence ? "−" : "+"}</span>
                <span className="acc-body-text">
                  <span className="acc-title">Your evidence</span>
                  <span className="acc-desc">
                    Tick anything your resume did not say. Leave the postings empty and
                    you are measured against a reference market instead, picked to match
                    whatever you described.
                  </span>
                </span>
                {ticked > 0 && <span className="tally">{ticked}</span>}
              </button>

              <div id="evidence" className="acc-open" hidden={!openEvidence}>
                <div className="row">
                  <input
                    className="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter capabilities"
                    aria-label="Filter capabilities"
                  />
                </div>
                {ticked > 0 && (
                  <div className="row">
                    <button className="ghost small" onClick={() => setHave(new Set())}>
                      Clear {ticked}
                    </button>
                  </div>
                )}

                {query && matchCount === 0 && (
                  <p className="note">Nothing matches &ldquo;{query}&rdquo;.</p>
                )}

                {shown.map(([fam, caps]) => (
                  <div className="fam" key={fam}>
                    <h3 className="fam-h">
                      {fam.split("/")[1]}
                      <span className="fam-m">
                        {marketMeta.find((m) => m.id === fam.split("/")[0])?.name}
                      </span>
                    </h3>
                    <div className="chips">
                      {caps.map((c) => (
                        <span
                          key={c.id}
                          className={have.has(c.name) ? "chip chip-on" : "chip"}
                          onClick={() => toggle(c.name)}
                          role="checkbox"
                          aria-checked={have.has(c.name)}
                          tabIndex={0}
                          onKeyDown={(e) =>
                            (e.key === "Enter" || e.key === " ") &&
                            (e.preventDefault(), toggle(c.name))
                          }
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {!query && (
                  <div className="row">
                    <button className="ghost small" onClick={() => setShowAll((s) => !s)}>
                      {showAll ? "Show fewer groups" : `Show all ${families.length} groups, both markets`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <button className="go" onClick={run} disabled={busy || !ready}>
            {busy ? "Reading" : label}
          </button>
          {busy && <div className="working" aria-hidden="true"><span /></div>}
          {!ready && (pasted > 0 || ticked > 0) && (
            <p className="note" style={{ marginTop: ".7rem" }}>
              {pasted > 0
                ? `That is ${pasted} characters. One full posting is usually ${MIN_CHARS} or more, or clear the box and tick your evidence instead.`
                : "Tick at least one capability, or paste some postings."}
            </p>
          )}
          {(text || res) && (
            <div className="row">
              <button className="ghost small" onClick={reset}>Start over</button>
            </div>
          )}
        </div>

        <div className={done ? "stage stage-full" : "stage"} ref={stageRef}>
          {err && <p className="err">{err}</p>}

          {!res && !err && (
            <div className="blank">
              <h2 className="blank-h">Nothing measured yet</h2>
              Paste the postings you are actually applying to. Ten is better than one,
              because one posting tells you what one hiring manager wrote on a Tuesday
              and ten tells you what the market wants.
            </div>
          )}

          {res && <Result res={res} ticked={ticked} />}
        </div>
      </div>
    </div>
  );
}

function Result({ res, ticked }) {
  const evidenced = res.evidence?.total ?? ticked;
  const { profile, gap, projects, cost, mode, ms, scope } = res;
  const reference = mode === "reference";
  const thin = scope?.status === "thin";
  const top = profile.capabilities.slice(0, 12);
  const covered = new Set(gap.covered.map((c) => c.name));

  return (
    <div>
      <h2>{reference ? "The reference market" : "What this market demands"}</h2>
      {!reference && profile.market && (
        <p className="market">
          Measured against <b>{profile.market.name}</b>, chosen because these postings
          name {profile.market.density} of its capabilities each against{" "}
          {profile.market.runnerUpDensity} of the other.
          {!profile.market.confident && (
            <span className="market-warn">
              {" "}That is close. These postings straddle both markets, so read the
              result as the better of two fits rather than a clean match.
            </span>
          )}
        </p>
      )}
      {!reference && profile.postings === 1 && (
        <p className="nudge">
          One posting makes every percentage 100, which tells you nothing about the
          market. Paste ten and the numbers start to mean something.
        </p>
      )}
      <p className="sub">
        {reference
          ? `Measured against ${profile.reference}, the corpus behind the study.`
          : `${profile.postings} ${profile.postings === 1 ? "posting" : "postings"} read in ${ms} ms.`}
      </p>

      {thin && (
        <p className="nudge">
          Only {scope.fired} of {scope.of} capabilities matched. This vocabulary was
          built from business analyst postings, so either these are from a field it
          does not cover, or they are shorter than a full posting. Everything below
          is real, and thin.
        </p>
      )}

      {res.evidence?.fromResume?.length > 0 && (
        <p className="market">
          <b>{res.evidence.fromResume.length}</b> of these came out of what you pasted
          about yourself{res.evidence.ticked > 0 && `, plus ${res.evidence.ticked} you ticked`}.
          A resume line is a claim, so treat the figure as what you say you can show.
        </p>
      )}

      {evidenced > 0 ? (
        <div className="verdict">
          <span className="verdict-n">{gap.coverage}%</span>
          <span className="verdict-t">
            of what this market weights, you can <b>already prove</b>. The rest is
            below, biggest demand first.
          </span>
        </div>
      ) : (
        <div className="verdict">
          <span className="verdict-n">{gap.demanded}</span>
          <span className="verdict-t">
            of the 45 capabilities appear at all. You ticked no evidence, so all of it
            reads as a gap. <b>Open your evidence and tick what you can prove</b> to
            narrow this.
          </span>
        </div>
      )}

      <dl className="counts">
        <div>
          <dt>{gap.closableSolo.length}</dt>
          <dd>gaps a project can close on your own</dd>
        </div>
        <div>
          <dt>{gap.closableByOutreach.length}</dt>
          <dd>need other people, but not a job</dd>
        </div>
        <div>
          <dt>{gap.needsEmployment.length}</dt>
          <dd>need a real organization</dd>
        </div>
      </dl>

      <div className="cols">
      <div className="col">
      <div className="marks">
        {top.map((c) => (
          <Mark key={c.name} label={c.name} pct={c.pct} covered={covered.has(c.name)} />
        ))}
      </div>
      {evidenced > 0 && gap.covered.length > 0 && (
        <p className="sub">
          Green marks are capabilities you already evidence
          {res.evidence?.fromResume?.length > 0 && ", from your resume or your ticks"}.
        </p>
      )}

      {gap.needsEmployment.length > 0 && (
        <div className="pen">
          <h3 className="pen-h">No portfolio project will fix these</h3>
          <p>
            They need a real organization. Building something will not help, and any
            tool that tells you otherwise is spending your weekend for you.
          </p>
          <ul>
            {gap.needsEmployment.map((c) => (
              <li key={c.name}>
                <span className="struck">{c.name}</span>{" "}
                <span className="pct-soft">{c.pct}% of postings</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      </div>
      <div className="col">
      <h2 className="col-top">{evidenced > 0 ? "Build these" : "What a project could prove"}</h2>
      {projects.length === 0 ? (
        <p className="nudge">
          Nothing in the catalog closes a gap you still have. That is a real answer:
          the catalog is 17 projects covering 36 capabilities, and you have the ones
          it can reach.
        </p>
      ) : (
        projects.map((p, i) => (
          <div className="proj" key={p.id}>
            <h3 className="proj-h">
              <span>{i + 1}</span> {p.title}
            </h3>
            <ul className="closes">
              {p.closes.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <dl className="spec">
              <dt>Artifact</dt><dd>{p.artifact}</dd>
              <dt>Effort</dt><dd>{p.effort}</dd>
              <dt>Data</dt><dd>{p.dataSource}</dd>
            </dl>
          </div>
        ))
      )}

      </div>
      </div>

      {res.framing?.prose && (
        <div className="framing">
          {res.framing.prose.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
          <p className="framing-src">
            {res.framing.cached
              ? "Written once for a market that looks like yours, and reused since."
              : "Written from the summary figures above, not from your postings."}
          </p>
        </div>
      )}

      <p className="cost">
        {reference
          ? "No text sent. "
          : `${cost.rawTokens.toLocaleString()} tokens of raw text in. `}
        {cost.digestTokens} tokens of profile out. 0 model calls.
      </p>
    </div>
  );
}
