# Halcy: a web2app quiz funnel for an AI companion

A quiz funnel for **Halcy**, a fictional romantic AI companion app for the US market. I built it as a job application project for a Junior Product Marketing Manager role, with Claude as my AI pair.

Halcy doesn't exist. The paywall is a fake door: no payments, no stored emails.

## What's inside

| | |
|---|---|
| Funnel | 16 screens: hook → intent → 8 questions with a micro-reward and a self-identification statement → matching with a micro-commitment → personalized result → email → paywall → feedback |
| Personalization | Companion name, preview texts, first message and chips are built from the answers. Rules are data in [`funnels/halcy.json`](funnels/halcy.json) |
| Analytics | PostHog, events named in Amplitude style (`Quiz Started`, `Step Viewed`, `Paywall Viewed`…). Plan: [`docs/04-analytics-plan.md`](docs/04-analytics-plan.md) |
| A/B test | Result screen with or without a "why this match" block, via PostHog experiment on flag `result-screen` |
| Quality | Zod schema for the funnel JSON, 20 unit tests and 10 end-to-end tests on mobile and desktop: full paths for both variants, double taps, refresh, browser back, every screen firing `Step Viewed` exactly once, and no email address reaching analytics |

## How I worked

The process is in the docs, in the order I did it:

1. [Brief](docs/00-brief.md)
2. [Market research](docs/01-market-research.md)
3. [Marketing strategy](docs/02-marketing-strategy.md)
4. [Quiz specification](docs/03-quiz-specification.md)
5. [Analytics plan](docs/04-analytics-plan.md)
6. Test readout on real testers (after the test)
7. AI workflow: how Claude was used (after the test)

The AI setup lives in [`CLAUDE.md`](CLAUDE.md) and [`.claude/`](.claude): three skills (strategy, engine, analyst) and two independent reviewers (CRO and QA).

## Run it

```bash
npm install
npm run dev          # local
npm test             # unit tests
npm run e2e          # end-to-end, needs Playwright's Chromium
```

Add `?qa=1&nosend=1` to the URL to test without sending events, and `?variant=match_score` to force a variant.

## Stack

React, TypeScript, Vite, Zod, Vitest, Playwright, PostHog, Vercel.
