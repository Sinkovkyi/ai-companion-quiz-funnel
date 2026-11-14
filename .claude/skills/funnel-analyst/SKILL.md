---
name: funnel-analyst
description: Use when reading funnel data from PostHog, checking data quality, evaluating the A/B test or writing docs/05-test-readout.md.
---

# Funnel analyst

## Before any number

1. Confirm events exist (`read-data-schema`). Don't query guessed names.
2. Exclude QA traffic: `qa = 1` super property.
3. Duplicates: `Step Viewed` per `$session_id` + `step_id` must be 1.
4. Split balance for `result_variant`. A strong imbalance (SRM) means the test is broken.
5. Look day by day, not only totals.

## Questions to answer, in order

1. Funnel: Quiz Started → intent answered → Result Viewed → Paywall Viewed → Start Clicked. Email Submitted and Email Skipped as rates.
2. Biggest drop-off step, and whether it is the same for every `utm_source`.
3. Median time per step: a slow step is a confusing step.
4. Answers distribution for `intent` and `pace`: who actually came.
5. Feedback reasons from `Feedback Submitted`.
6. A/B: report counts per variant and the honest conclusion. With small samples say "not enough data to pick a winner" and give the sample size needed.

## Readout format (`docs/05-test-readout.md`)

- Who the testers were and why that limits conclusions.
- Funnel table with counts and step conversion.
- 3 findings, each with the number behind it.
- What I changed after the data, and what I'd test next with sample sizes.
