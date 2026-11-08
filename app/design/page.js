"use client";

/**
 * Three visual directions over one real result.
 *
 * The data is a captured analysis, identical in all three, so the only thing
 * changing is the design. Pick one and it becomes the app; the others get
 * deleted. This route is a workbench, not part of the product.
 */
import { useState } from "react";
import data from "../../lib/sample.result.json";
import { STYLES } from "./styles.js";

const VARIANTS = [
  ["terminal", "Terminal", "Dark, dense, monospaced numbers. Reads like an instrument."],
  ["report", "Report", "White, large serif, wide margins. Reads like a published study."],
  ["product", "Product", "Neutral, carded, colour-coded. Reads like a tool you would pay for."],
];

const pct = (n) => `${n}%`;

export default function Design() {
  const [v, setV] = useState("terminal");
  const meta = VARIANTS.find((x) => x[0] === v);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="picker">
        {VARIANTS.map(([id, name]) => (
          <button key={id} className={v === id ? "pick on" : "pick"} onClick={() => setV(id)}>
            {name}
          </button>
        ))}
        <span className="pick-note">{meta[2]}</span>
      </div>
      <div className={`v v-${v}`}>
        {v === "terminal" && <Terminal />}
        {v === "report" && <Report />}
        {v === "product" && <Product />}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- A */

function Terminal() {
  const covered = new Set(data.covered);
  const max = Math.max(...data.capabilities.map((c) => c.pct));
  return (
    <div className="t-wrap">
      <header className="t-head">
        <div className="t-title">jobfit</div>
        <div className="t-meta">
          {data.market.name} &nbsp;|&nbsp; {data.postings} postings &nbsp;|&nbsp; {data.ms}ms
          &nbsp;|&nbsp; 0 model calls
        </div>
      </header>

      <section className="t-top">
        <div className="t-big">
          <span className="t-num">{data.gap.coverage}</span><span className="t-pc">%</span>
          <div className="t-lab">of weighted demand you can evidence</div>
        </div>
        <div className="t-kpis">
          <div><b>{data.gap.closableSolo}</b><span>closable solo</span></div>
          <div><b>{data.gap.closableByOutreach}</b><span>needs people</span></div>
          <div><b className="t-bad">{data.gap.needsEmployment.length}</b><span>needs a job</span></div>
        </div>
      </section>

      <section>
        <h2 className="t-h">demand</h2>
        <table className="t-table">
          <tbody>
            {data.capabilities.map((c) => (
              <tr key={c.name} className={covered.has(c.name) ? "t-have" : ""}>
                <td className="t-name">{c.name}</td>
                <td className="t-bar">
                  <span style={{ width: `${(c.pct / max) * 100}%` }} />
                </td>
                <td className="t-pct">{pct(c.pct)}</td>
                <td className="t-flag">{covered.has(c.name) ? "HAVE" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="t-grid">
        <div>
          <h2 className="t-h t-h-bad">cannot be closed by a project</h2>
          <ul className="t-list">
            {data.gap.needsEmployment.map((c) => (
              <li key={c.name}><span>{c.name}</span><em>{pct(c.pct)}</em></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="t-h">build</h2>
          {data.projects.map((p, i) => (
            <article className="t-proj" key={p.id}>
              <h3>{String(i + 1).padStart(2, "0")} {p.title}</h3>
              <div className="t-closes">{p.closes.map((c) => <span key={c}>{c}</span>)}</div>
              <dl>
                <dt>artifact</dt><dd>{p.artifact}</dd>
                <dt>effort</dt><dd>{p.effort}</dd>
                <dt>data</dt><dd>{p.dataSource}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="t-prose">
        {data.framing.split("\n\n").map((x, i) => <p key={i}>{x}</p>)}
      </section>
      <footer className="t-foot">
        {data.cost.rawTokens.toLocaleString()} tokens in &nbsp;/&nbsp; {data.cost.digestTokens} out
        &nbsp;/&nbsp; deterministic
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------- B */

function Report() {
  const covered = new Set(data.covered);
  return (
    <div className="r-wrap">
      <header className="r-head">
        <p className="r-kicker">{data.market.name}</p>
        <h1>You can evidence {data.gap.coverage}% of what this market weights.</h1>
        <p className="r-sub">
          Read from {data.postings} postings you pasted. {data.evidence.fromResume.length} of your
          capabilities came out of your own resume.
        </p>
      </header>

      <section className="r-lede">
        {data.framing.split("\n\n").map((x, i) => <p key={i}>{x}</p>)}
      </section>

      <section className="r-figure">
        <h2>What the postings ask for</h2>
        <ol className="r-rank">
          {data.capabilities.map((c, i) => (
            <li key={c.name} className={covered.has(c.name) ? "r-have" : ""}>
              <span className="r-i">{i + 1}</span>
              <span className="r-n">{c.name}</span>
              <span className="r-rule" />
              <span className="r-p">{pct(c.pct)}</span>
            </li>
          ))}
        </ol>
        <p className="r-note">
          Names in grey you already evidence. The rest is the gap, biggest demand first.
        </p>
      </section>

      <section className="r-warn">
        <h2>Eight of these no project can close</h2>
        <p>
          They need a real organisation. {data.gap.needsEmployment.slice(0, 3).map((c) => c.name).join(", ")}
          {" "}and five more. Building something will not help.
        </p>
      </section>

      <section>
        <h2 className="r-h2">What to build</h2>
        {data.projects.map((p, i) => (
          <article className="r-proj" key={p.id}>
            <h3><span>{i + 1}.</span> {p.title}</h3>
            <p className="r-art">{p.artifact}</p>
            <p className="r-spec">{p.effort}. {p.dataSource}.</p>
          </article>
        ))}
      </section>
      <footer className="r-foot">
        {data.cost.rawTokens.toLocaleString()} tokens of text read. {data.cost.digestTokens} tokens
        of profile produced. No model was called to measure any of this.
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------- C */

function Product() {
  const covered = new Set(data.covered);
  return (
    <div className="p-wrap">
      <header className="p-bar">
        <div>
          <strong>{data.market.name}</strong>
          <span className="p-chip">{data.postings} postings</span>
          <span className="p-chip">resume read</span>
        </div>
        <button className="p-ghost">Change inputs</button>
      </header>

      <section className="p-cards">
        <div className="p-card p-hero">
          <div className="p-ring" style={{ "--v": `${data.gap.coverage * 3.6}deg` }}>
            <span>{data.gap.coverage}%</span>
          </div>
          <div>
            <h3>Evidence coverage</h3>
            <p>of what this market weights, you can already prove</p>
          </div>
        </div>
        <div className="p-card"><b>{data.gap.closableSolo}</b><span>a project can close</span></div>
        <div className="p-card"><b>{data.gap.closableByOutreach}</b><span>need other people</span></div>
        <div className="p-card p-card-bad"><b>{data.gap.needsEmployment.length}</b><span>need a real job</span></div>
      </section>

      <div className="p-two">
        <section className="p-card p-pad">
          <h3 className="p-h">Demand</h3>
          {data.capabilities.map((c) => (
            <div className="p-row" key={c.name}>
              <span className="p-label">{c.name}</span>
              {covered.has(c.name) && <span className="p-pill p-ok">have</span>}
              <span className="p-track"><span style={{ width: pct(c.pct) }} /></span>
              <span className="p-val">{pct(c.pct)}</span>
            </div>
          ))}
        </section>

        <section>
          <section className="p-card p-pad p-bad">
            <h3 className="p-h">No project will close these</h3>
            <ul>
              {data.gap.needsEmployment.slice(0, 5).map((c) => (
                <li key={c.name}>{c.name} <em>{pct(c.pct)}</em></li>
              ))}
            </ul>
          </section>
          {data.projects.map((p, i) => (
            <section className="p-card p-pad p-proj" key={p.id}>
              <h3>{p.title}</h3>
              <div className="p-pills">{p.closes.map((c) => <span className="p-pill" key={c}>{c}</span>)}</div>
              <table><tbody>
                <tr><th>Artifact</th><td>{p.artifact}</td></tr>
                <tr><th>Effort</th><td>{p.effort}</td></tr>
                <tr><th>Data</th><td>{p.dataSource}</td></tr>
              </tbody></table>
            </section>
          ))}
        </section>
      </div>

      <section className="p-card p-pad p-prose">
        {data.framing.split("\n\n").map((x, i) => <p key={i}>{x}</p>)}
      </section>
      <p className="p-foot">
        {data.cost.rawTokens.toLocaleString()} tokens in, {data.cost.digestTokens} out, 0 model calls.
      </p>
    </div>
  );
}
