---
name: funnel-strategy
description: Use when researching a product or audience for a quiz funnel, writing the funnel strategy, designing quiz screens, or writing funnel copy.
---

# Funnel strategy

## Order

1. **Research.** Who sells this, how their funnels look, what the audience says. Save sources with dates in `docs/01-market-research.md`. Facts only; mark guesses as hypotheses.
2. **Segments.** 2–4 segments by intent, not by demographics. The first question picks the segment.
3. **Value proposition.** One sentence. Then 2–3 proof points that the funnel *shows*, not claims.
4. **Screens.** For each screen write why it exists. A question that neither changes what the user sees later nor segments analytics gets cut.
5. **Offer.** Plans, default plan, risk reversal, FAQ for the 3 most likely objections.
6. **Tests.** Hypothesis, primary metric, guardrail, sample size. Pricing is judged on first renewal, not trial starts.

## Screen patterns that work

- Intent first, easy questions next, personal ones after the user has invested a few taps.
- A micro-reward every 4–5 questions (preview, insight, social proof).
- Self-identification statements on a 1–5 scale.
- A loader with one question inside (micro-commitment).
- Show the result, lock the key part. Email before paywall.
- Paywall order: value reminder → plans → risk reversal → FAQ.

## Copy rules

- Short sentences after long ones. Plain words. US English for US funnels.
- No invented numbers. A statistic needs a source on the same screen.
- No "revolutionary", "seamless", "unlock your potential". No exclamation marks in a row.
- For companion apps: always say it is an AI. No explicit content. Respect pace and boundaries.
- Write errors as: what happened + how to fix it.

## Output

Docs in `docs/`, content in `funnels/<name>.json`. Run `npm test` after changing the JSON.
