export const STYLES = `
.picker{position:sticky;top:0;z-index:50;display:flex;gap:.5rem;align-items:center;
  padding:.65rem 1.25rem;background:#111;color:#eee;font:500 13px/1 ui-sans-serif,system-ui,sans-serif}
.pick{padding:.45rem .8rem;background:transparent;color:#aaa;border:1px solid #333;border-radius:3px;
  font:inherit;cursor:pointer}
.pick:hover{color:#fff;border-color:#666}
.pick.on{background:#eee;color:#111;border-color:#eee}
.pick-note{margin-left:.75rem;color:#888;font-weight:400}
.v{min-height:100vh}

/* ============================== A. TERMINAL ============================== */
.v-terminal{--bg:#0c0f14;--panel:#141922;--line:#222a36;--ink:#dfe5ee;--dim:#7d8799;
  --on:#5ad6c4;--hot:#ffb454;--bad:#ff6b7a;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  background:var(--bg);color:var(--ink);font-family:var(--mono);font-size:13px}
.t-wrap{max-width:1180px;margin:0 auto;padding:1.75rem 1.5rem 5rem}
.t-head{display:flex;justify-content:space-between;align-items:baseline;
  padding-bottom:.75rem;border-bottom:1px solid var(--line);margin-bottom:1.75rem}
.t-title{color:var(--on);font-size:15px;letter-spacing:.22em;text-transform:uppercase}
.t-meta{color:var(--dim);font-size:12px}
.t-top{display:flex;gap:2.5rem;align-items:flex-end;flex-wrap:wrap;
  padding:1.25rem 0 1.5rem;border-bottom:1px solid var(--line);margin-bottom:1.75rem}
.t-num{font-size:84px;line-height:.8;color:var(--on);font-variant-numeric:tabular-nums}
.t-pc{font-size:30px;color:var(--on);opacity:.6}
.t-lab{margin-top:.6rem;color:var(--dim)}
.t-kpis{display:flex;gap:2rem;margin-bottom:.4rem}
.t-kpis div{display:flex;flex-direction:column;gap:.25rem}
.t-kpis b{font-size:28px;font-weight:400;font-variant-numeric:tabular-nums}
.t-kpis span{color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.1em}
.t-bad{color:var(--bad)}
.t-h{margin:0 0 .85rem;color:var(--hot);font-size:11px;font-weight:400;
  letter-spacing:.2em;text-transform:uppercase}
.t-h-bad{color:var(--bad)}
.t-table{width:100%;border-collapse:collapse;margin-bottom:2.25rem}
.t-table td{padding:.3rem 0;border-bottom:1px solid var(--line);vertical-align:middle}
.t-name{width:300px;padding-right:1rem!important}
.t-bar{width:auto}
.t-bar span{display:block;height:9px;background:var(--hot);opacity:.85}
.t-have .t-bar span{background:var(--on)}
.t-have .t-name{color:var(--dim)}
.t-pct{width:64px;text-align:right;font-variant-numeric:tabular-nums;color:var(--dim)}
.t-flag{width:50px;text-align:right;color:var(--on);font-size:10px;letter-spacing:.1em}
.t-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:2.5rem;margin-bottom:2rem}
.t-list{margin:0;padding:0;list-style:none}
.t-list li{display:flex;justify-content:space-between;gap:1rem;padding:.4rem 0;
  border-bottom:1px solid var(--line);color:var(--bad)}
.t-list em{font-style:normal;color:var(--dim);font-variant-numeric:tabular-nums}
.t-proj{padding:1rem;margin-bottom:.9rem;background:var(--panel);border-left:2px solid var(--on)}
.t-proj h3{margin:0 0 .6rem;font-size:14px;font-weight:400;color:var(--ink)}
.t-closes{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.8rem}
.t-closes span{padding:.15rem .4rem;background:#1d2634;color:var(--on);font-size:11px}
.t-proj dl{display:grid;grid-template-columns:74px 1fr;gap:.25rem .9rem;margin:0;font-size:12px}
.t-proj dt{color:var(--dim);text-transform:uppercase;font-size:10px;letter-spacing:.1em;padding-top:.15rem}
.t-proj dd{margin:0;color:var(--ink)}
.t-prose{max-width:76ch;padding:1.25rem 0 0;border-top:1px solid var(--line)}
.t-prose p{margin:0 0 .85rem;color:var(--ink);font-family:ui-sans-serif,system-ui,sans-serif;
  font-size:15px;line-height:1.6}
.t-foot{margin-top:2rem;padding-top:.9rem;border-top:1px solid var(--line);color:var(--dim);font-size:11px}

/* =============================== B. REPORT =============================== */
.v-report{--ink:#14161a;--dim:#6b7280;--line:#e3e2dd;--accent:#1b4ed8;
  background:#fff;color:var(--ink);
  font-family:"Iowan Old Style",Georgia,"Times New Roman",serif}
.r-wrap{max-width:720px;margin:0 auto;padding:4.5rem 1.5rem 6rem}
.r-kicker{margin:0 0 1.5rem;color:var(--accent);font:500 12px/1 ui-sans-serif,system-ui,sans-serif;
  letter-spacing:.18em;text-transform:uppercase}
.r-head h1{margin:0 0 1.1rem;font-size:46px;line-height:1.08;font-weight:400;letter-spacing:-.025em}
.r-sub{margin:0 0 3rem;color:var(--dim);font-size:18px;line-height:1.55}
.r-lede{margin:0 0 3.5rem;padding-left:1.4rem;border-left:2px solid var(--accent)}
.r-lede p{margin:0 0 1rem;font-size:20px;line-height:1.62}
.v-report h2{margin:0 0 1.4rem;font-size:13px;font-weight:500;letter-spacing:.16em;
  text-transform:uppercase;font-family:ui-sans-serif,system-ui,sans-serif;color:var(--dim)}
.r-rank{margin:0 0 1rem;padding:0;list-style:none;counter-reset:r}
.r-rank li{display:flex;align-items:baseline;gap:.75rem;padding:.55rem 0;border-bottom:1px solid var(--line)}
.r-i{width:1.4rem;color:var(--dim);font-size:13px;font-variant-numeric:tabular-nums}
.r-n{font-size:19px}
.r-rule{flex:1;border-bottom:1px dotted #c9c8c2;transform:translateY(-4px)}
.r-p{font-size:19px;font-variant-numeric:tabular-nums}
.r-have .r-n,.r-have .r-p{color:#a8a7a1}
.r-note{margin:0 0 3.5rem;color:var(--dim);font:400 14px/1.5 ui-sans-serif,system-ui,sans-serif}
.r-warn{margin:0 0 3.5rem;padding:1.5rem 0;border-top:2px solid var(--ink);border-bottom:1px solid var(--line)}
.r-warn h2{color:var(--ink)}
.r-warn p{margin:0;font-size:19px;line-height:1.6}
.r-h2{margin-bottom:1.75rem!important}
.r-proj{margin-bottom:2.5rem}
.r-proj h3{margin:0 0 .5rem;font-size:25px;font-weight:400;line-height:1.25;letter-spacing:-.015em}
.r-proj h3 span{color:var(--accent)}
.r-art{margin:0 0 .4rem;font-size:18px;line-height:1.55}
.r-spec{margin:0;color:var(--dim);font:400 14px/1.5 ui-sans-serif,system-ui,sans-serif}
.r-foot{margin-top:4rem;padding-top:1.1rem;border-top:1px solid var(--line);
  color:var(--dim);font:400 13px/1.6 ui-sans-serif,system-ui,sans-serif}

/* ============================== C. PRODUCT =============================== */
.v-product{--bg:#f1f4f8;--card:#fff;--ink:#0f172a;--dim:#64748b;--line:#e2e8f0;
  --blue:#2563eb;--green:#059669;--red:#dc2626;
  background:var(--bg);color:var(--ink);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:14px}
.p-wrap{max-width:1240px;margin:0 auto;padding:1.5rem 1.5rem 5rem}
.p-bar{display:flex;justify-content:space-between;align-items:center;gap:1rem;
  padding:.85rem 1.1rem;margin-bottom:1.25rem;background:var(--card);
  border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.p-chip{margin-left:.5rem;padding:.2rem .55rem;background:#eef2f7;color:var(--dim);
  border-radius:999px;font-size:12px}
.p-ghost{padding:.45rem .8rem;background:#fff;color:var(--ink);border:1px solid var(--line);
  border-radius:7px;font:inherit;cursor:pointer}
.p-cards{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.9rem;margin-bottom:.9rem}
.p-card{background:var(--card);border:1px solid var(--line);border-radius:10px;
  box-shadow:0 1px 2px rgba(15,23,42,.05)}
.p-cards .p-card{padding:1.1rem 1.2rem}
.p-cards .p-card b{display:block;font-size:30px;font-weight:600;letter-spacing:-.02em}
.p-cards .p-card span{color:var(--dim)}
.p-card-bad b{color:var(--red)}
.p-hero{display:flex;align-items:center;gap:1.25rem}
.p-ring{position:relative;flex:0 0 86px;width:86px;height:86px;border-radius:50%;
  background:conic-gradient(var(--blue) var(--v),#e8edf4 0)}
.p-ring::after{content:"";position:absolute;inset:9px;background:var(--card);border-radius:50%}
.p-ring span{position:absolute;inset:0;display:grid;place-items:center;z-index:1;
  font-size:19px;font-weight:600}
.p-hero h3{margin:0 0 .25rem;font-size:15px}
.p-hero p{margin:0;color:var(--dim)}
.p-two{display:grid;grid-template-columns:1fr 1fr;gap:.9rem;align-items:start}
.p-pad{padding:1.2rem 1.3rem;margin-bottom:.9rem}
.p-h{margin:0 0 1rem;font-size:15px}
.p-row{display:flex;align-items:center;gap:.6rem;padding:.42rem 0}
.p-label{flex:0 0 46%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.p-track{flex:1;height:7px;background:#eef2f7;border-radius:999px;overflow:hidden}
.p-track span{display:block;height:100%;background:var(--blue);border-radius:999px}
.p-val{width:46px;text-align:right;color:var(--dim);font-variant-numeric:tabular-nums}
.p-pill{display:inline-block;padding:.18rem .5rem;background:#eef2f7;color:var(--dim);
  border-radius:999px;font-size:12px}
.p-ok{background:#dcfce7;color:var(--green)}
.p-bad{border-color:#fecaca;background:#fffafa}
.p-bad h3{color:var(--red)}
.p-bad ul{margin:0;padding-left:1.1rem;color:var(--ink)}
.p-bad li{margin-bottom:.3rem}
.p-bad em{font-style:normal;color:var(--dim)}
.p-proj h3{margin:0 0 .7rem;font-size:16px;line-height:1.35}
.p-pills{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.9rem}
.p-proj table{width:100%;border-collapse:collapse}
.p-proj th{width:72px;padding:.25rem .8rem .25rem 0;text-align:left;color:var(--dim);font-weight:400;vertical-align:top}
.p-proj td{padding:.25rem 0;vertical-align:top}
.p-prose{margin-top:.9rem;border-left:3px solid var(--blue)}
.p-prose p{margin:0 0 .75rem;font-size:15px;line-height:1.6}
.p-prose p:last-child{margin:0}
.p-foot{margin-top:1.25rem;color:var(--dim);font-size:13px}

@media(max-width:900px){
  .t-grid,.p-two,.p-cards{grid-template-columns:1fr}
  .t-name{width:150px}
  .r-head h1{font-size:34px}
}
`;
