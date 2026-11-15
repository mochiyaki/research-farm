# 🐾 Research Farm

A visual deep-research and fact-checking pipeline where five animal agents plan, search, read, verify and write a cited report — live, in a Three.js scene.

Built for SearchHack ("agents that plan, search, verify, and synthesize across sources" + "new interfaces for working with information"). Search and page reading are powered by the [Telem](https://docs.telem.ai) API.

## Run it

Requires Node.js 18+ and an internet connection. No dependencies to install.

```bash
export TELEM_API_KEY=tlm_your_key   # optional if a key is already set in server.js
node server.js
```

Open http://localhost:8787, type a question or a claim, and press Enter.

Set `PORT` to use a different port.

## The agents

| Agent | Stage | What it does |
|---|---|---|
| 🦛 Professor Hippo | Plan | Detects the mode (fact-check for a claim, deep research for a question) and splits the prompt into 4 sub-queries: core, background or fact checks, evidence, counterpoints |
| 🦊 Explorer Fox | Search | Runs all sub-queries in parallel through Telem across two providers (Exa + Brave), dedupes URLs, and ranks sources by credibility × relevance × cross-query agreement, keeping at most 2 per domain |
| 🐱 Doctor Cat | Read | Fetches the top 6 full pages through Telem, strips boilerplate, and extracts the sentences most relevant to the prompt |
| 🐮 Judge Cow | Verify | Checks each extracted sentence against every other source and labels it single-source, corroborated ×1 or corroborated ×2+ by independent domains; then issues an overall verdict |
| 🐷 Summarizer Pig | Write | Assembles the report: verdict, key findings, per-facet evidence, caveats and counterpoints, and a source list — every statement cited |

Each handoff is animated: agents walk to each other, documents fly between them, and the log panel shows what each one actually did.

## How it works

```
browser (index.html, Three.js)
   │  POST /api/search, /api/fetch
   ▼
server.js (static file + proxy, holds the API key)
   │  POST https://router.telem.ai/v1/search, /v1/fetch
   ▼
Telem → Exa, Brave, page fetch
```

- `index.html` — the 3D scene, the pipeline logic and the report UI, in one file. Three.js loads from a CDN.
- `server.js` — a zero-dependency Node server. It exists because the Telem API does not accept direct browser calls (no CORS), and it keeps the key out of the page.

## Limitations

- **No LLM is used.** The report is extractive: findings are verbatim sentences from the sources, selected and ranked by term overlap.
- **The verdict is a heuristic.** It is based on cross-domain agreement, a simple domain credibility score, and refutation wording ("myth", "debunked", "no evidence"…) in the sources. Treat it as a signal, not a judgement.
- Corroboration is measured by shared key terms, so it can miss paraphrases and can match sentences that share vocabulary but disagree.

## Next steps

- Add an LLM for query planning, stance detection and abstractive synthesis.
- Use Telem monitors to re-run a report on a schedule and flag when the verdict changes.
- Keep a memory of past reports so follow-up questions reuse already-read sources.
