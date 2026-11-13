---
name: funnel-engine
description: Use when changing the funnel JSON schema, the step engine, screen components, personalization or analytics wiring in src/.
---

# Funnel engine

## Contract

- `funnels/halcy.json` is the only place for copy and steps.
- `src/engine/schema.ts` (Zod) defines the shape. A new step type means: add it to the schema union, add a renderer in `src/screens/`, add a unit test.
- `src/engine/personalize.ts` holds pure functions (name, first message, chips). They take the config and answers and return strings. No React, no side effects, fully unit-tested.
- `src/engine/flow.ts` handles next / back. Back skips `info`, `reward` and `loader` steps.
- `src/analytics.ts` is the only file that imports `posthog-js`.

## Checklist for any change

1. Schema still parses the JSON (`npm test` covers it).
2. Every reachable step renders on a 390 px wide screen.
3. Each step fires `Step Viewed` once, even after Back or a re-render.
4. No answer can leave the user stuck (Continue disabled forever, loader that never ends).
5. `npm run typecheck && npm test && npm run build && npm run e2e` pass.

## Don'ts

No `eval` or templates that run code. No copy in components. No email in event properties.
