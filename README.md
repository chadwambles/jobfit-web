# jobfit-web

Paste the job postings you are actually chasing. Find out what that market
demands, what you cannot yet evidence, and which portfolio projects would
close the most of the gap.

Nothing is guessed. Parsing, profiling, the gap and the project match are
pattern matching and arithmetic, so every number can be checked against the
code that produced it. One optional model call writes two closing paragraphs
from a 150-token summary, and it is cached.

## Running it

This app depends on [`jobfit-engine`](../jobfit-engine) as a local folder, so
the two must be siblings:

```
Portfolio Ideation Tool/
  jobfit-engine/
  jobfit-web/
```

Then:

```
npm install
npm run dev
```

and open http://localhost:3000.

It runs with no configuration. Copy `.env.example` to `.env.local` only if you
want the closing paragraphs or a cache that survives a restart.

## Two markets

The engine carries two vocabularies, derived from separate corpora:

| market | capabilities | derived from | projects |
|---|---|---|---|
| Business analysis and delivery | 45 | 201 LinkedIn BA postings | 17 |
| Software and data engineering | 54 | 2,639 technical postings | 18 |

They overlap by about eight concepts. Running the wrong one does not fail
loudly, it quietly reports a market the postings are not in, so the app scores
both and lets the postings choose. The signal is density: capabilities matched
per posting. A BA dump fires around 8 of the BA vocabulary per posting and
around 2 of the technical one. A software engineering dump inverts that.

Occupation inference was tried for this and abandoned. O\*NET reads a backend
posting as Earth Drillers at 0.71 while a real electrician posting reads as
Electricians at 0.74, and nothing can rest on scores that close. Counting what
actually matched needs no such guess.

A call is only reported as confident when three things hold: an absolute gap,
a gap proportional to the winner, and a floor under the winner itself. A QA
posting legitimately straddles both markets and is reported as a straddle.

## Three ways in

Any one is enough, and they combine.

- **The postings.** Whole bodies, not titles. Ten beats one.
- **Your experience.** A resume or a few lines of prose. The same patterns
  that read a posting read this, and what they find counts as evidence.
- **The checklist.** Tick anything the other two missed.

With no postings, you are measured against a reference corpus, chosen to match
whatever you described.

## What comes back

A profile of what the market wants, your coverage of it, and the gap split
three ways:

- gaps a solo project can close, which is what the matcher scores against
- gaps needing other people but not a job, such as open source maintainers,
  a volunteer organisation, or user interviews
- gaps needing a real organisation, which the app names and then tells you
  plainly that nothing it offers will fix

That third category is the point. A tool that recommends a weekend project for
"take part in an on-call rotation" is wasting your weekend. It is also where
the two markets differ most: 3 of the 45 BA capabilities need an employer,
against 11 of the 54 technical ones.

## The one model call

Only the closing paragraphs. They are written from the summary figures, never
from your postings, and cached on a key covering everything the output depends
on: the market, the top capabilities, the coverage decile and the projects
picked. Coverage is bucketed to the nearest ten so the cache has something to
hit while the paragraph stays true of everyone it is served to.

Every failure path returns nothing and the measured page renders unchanged. No
key, a 500, a 429, a dropped connection, a malformed body and a timeout are all
silent. The prose is a garnish and a garnish never takes the plate.

`db/schema.sql` has the MySQL table and a `framing_savings` view reporting
tokens avoided per market. `/api/cache` reads it.

## Regenerating the capability list

The checklist uses a generated client-side copy of both vocabularies, without
the regex patterns. After changing either market's capabilities:

```bash
node -e "
import('../jobfit-engine/src/index.js').then(m => {
  const fs = require('fs');
  const caps = [], meta = [];
  for (const mk of m.markets) {
    meta.push({ id: mk.id, name: mk.name,
                families: [...new Set(mk.capabilities.map(c => c.family))] });
    for (const c of mk.capabilities)
      caps.push({ id: c.id, name: c.name, family: c.family,
                  demonstrable: c.demonstrable, market: mk.id });
  }
  const header =
    '// Generated from the engine. The checklist needs the names in the browser,\n' +
    '// and shipping the regex patterns there would be dead weight.\n' +
    '//\n' +
    '// Both markets are here because evidence is ticked before a paste is read,\n' +
    '// so the app cannot know yet which vocabulary the postings will choose.\n';
  fs.writeFileSync('lib/capabilities.client.js',
    header +
    'export const allCapabilities = ' + JSON.stringify(caps, null, 1) + ';\n\n' +
    'export const marketMeta = ' + JSON.stringify(meta, null, 1) + ';\n\n' +
    '/** Families in display order, prefixed by market so the two never collide. */\n' +
    'export const families = ' +
    JSON.stringify(meta.flatMap(k => k.families.map(f => k.id + '/' + f)), null, 1) + ';\n');
});
"
```

## Known limits

- The vocabularies cover analyst and technical work. A nursing or trades paste
  is reported as thin rather than measured, because it is.
- Nine technical capabilities are closed by a single project each, so someone
  who cannot do that one project has no route to them.
- `app/design/` is a scratchpad of rejected visual directions, not part of the
  product.
