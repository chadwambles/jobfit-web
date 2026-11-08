# jobfit-web

The web front end for jobfit-engine. Paste job postings, get a capability
profile, a three-way gap, and matched portfolio projects.

## The rule that governs this repo

**No model call anywhere in E.1.** Not in the API route, not in the engine,
not in a helper. The whole product is regular expressions and arithmetic.

E.2 will add exactly one model call, for writing the framing of three already
chosen projects, cached by profile bucket in MySQL. If you are adding an LLM
call anywhere other than that one place, stop.

Why it matters in numbers: a 201 posting paste is roughly 370,000 tokens of
raw text and about 139 tokens of digest. The cost of a request scales with
users, never with the size of what they paste.

## Stack

- Next.js App Router, plain JavaScript, ESM. No TypeScript.
- React 19, Next 15. No CSS framework; `app/globals.css` is hand written.
- `jobfit-engine` is a `file:../jobfit-engine` dependency, so the two folders
  must sit side by side. `transpilePackages` in next.config.mjs is required,
  because the engine ships unbuilt ESM.
- Deploys to DigitalOcean behind PM2 and Nginx, same as Chronos.
- Never use em dashes, anywhere, including code comments and UI copy.

## Layout

```
app/page.js              the whole UI, one client component
app/api/analyze/route.js the only endpoint
lib/engine.js            the single place the app touches the engine
lib/capabilities.client.js  GENERATED, see below
```

`lib/capabilities.client.js` is generated from
`jobfit-engine/data/capabilities.json`. The browser needs capability names for
the checklist, and shipping the regex patterns to the client would be dead
weight. Regenerate it whenever the vocabulary changes; there is a snippet in
the README.

## Things already learned the hard way

- Importing the catalog JSON directly (`with { type: "json" }`) breaks under
  the bundler. The engine exports `seedCatalog` instead. Do not go back.
- The engine's capability names are the contract between the checklist, the
  matcher and the catalog. A typo in any one of them scores zero in silence.
- `console.log` in Node has no width specifiers, which bit the engine's CLI.
  Irrelevant in React, listed here so nobody rediscovers it.

## Phase position

A is skipped. B published. C is the engine, D the catalog, both done.
This is E.1. E.2 is MySQL plus the cached framing layer.
