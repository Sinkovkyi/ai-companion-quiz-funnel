# Halcy quiz funnel

A web2app quiz funnel for Halcy, a fictional romantic AI companion app (US market). Built as a job application project for a Junior Product Marketing Manager role. Read `docs/00-brief.md` first.

## How work is done here

Work in this order, and don't skip to code:

1. Research → `docs/01-market-research.md`
2. Strategy → `docs/02-marketing-strategy.md`
3. Spec → `docs/03-quiz-specification.md` and `funnels/halcy.json`
4. Analytics plan → `docs/04-analytics-plan.md`
5. Code → `src/`
6. Tests → `npm test` and `npm run e2e`
7. Review → `cro-reviewer` and `qa-auditor` agents
8. Data readout → `docs/05-test-readout.md`

Skills: `funnel-strategy` (steps 1–3, copy), `funnel-engine` (JSON schema and engine), `funnel-analyst` (PostHog queries and readout).

## Rules

- The funnel content is data. Copy, steps, options and personalization live in `funnels/halcy.json`. Code never hardcodes copy.
- The JSON must pass `src/engine/schema.ts`. No `eval`, no code in JSON.
- Every screen sends `Step Viewed` exactly once per session. Event names are Amplitude-style Title Case. Only `src/analytics.ts` talks to PostHog.
- Never send an email address to analytics. Only `email_domain`.
- No invented statistics. A number on screen needs a source on screen.
- No real brands of other companies in the funnel. No explicit content.
- Before saying a change is done: `npm run typecheck && npm test && npm run build && npm run e2e`.

## Autonomy

Free: research, docs, code, tests, branches, preview deploys, read-only PostHog queries.
Ask Oleh first: merge to `main`, production deploy, creating or changing PostHog flags and experiments, anything that sends messages or touches money.
