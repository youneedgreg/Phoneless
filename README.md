# Phoneless

A two-minute drill for the day your phone is stolen. Starter project: tested core, four working screens, offline build.
Replace this file with the README outline in the roadmap before you submit.

## Commands

```bash
npm install
npm run dev         # dev server, http://localhost:5173
npm test            # 41 unit tests on the core
npm run typecheck   # tsc --noEmit
npm run build       # type-check, build, write sw.js, print sizes, enforce the 40 KB gzip budget
npm run e2e         # build, then 16 checks in headless Chrome, including offline
npm run preview     # serve dist/ at http://localhost:4173
```

If `npm run e2e` cannot find Chrome, set `CHROME_PATH` to the Chrome binary.

## What is done and what is left

Done and tested: `src/core/*` (data pack, drill engine, plan builder, go-link, fixes, storage, questions),
`Home`, `Drill`, `Result`, `Emergency`, the service worker, the size budget and the browser test.

To write: `src/ui/Card.tsx`, `src/ui/About.tsx`, styling, the accessibility pass and the README. See the roadmap.

## AI assistance

This starter was written with Claude (Anthropic) on 14 Nov 2026. Say so in the submission.
