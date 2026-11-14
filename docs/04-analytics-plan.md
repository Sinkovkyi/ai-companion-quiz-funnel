# 04. Analytics plan

## Tool

PostHog (EU cloud, free tier). The event names follow Amplitude's "Object Action" convention in Title Case, so the same tracking plan would work in Amplitude without renaming. Code calls one wrapper, `track()`, in `src/analytics.ts`, so switching vendors is one file.

## Events

| Event | When | Properties |
|---|---|---|
| `Landing Viewed` | Landing renders | — |
| `Quiz Started` | CTA on landing | — |
| `Step Viewed` | Any screen renders (once per screen per session) | `step_id`, `step_index`, `step_type` |
| `Question Answered` | An answer is chosen | `step_id`, `answer` (string or list) |
| `Back Clicked` | Back button | `from_step` |
| `Micro Commitment Answered` | Memory question in the loader | `memory` |
| `Result Viewed` | Result screen | `companion_name`, `result_variant` |
| `Email Submitted` | Valid email | `email_domain` |
| `Email Error` | Invalid email | — |
| `Email Skipped` | Skip link | — |
| `Paywall Viewed` | Paywall renders | `default_plan` |
| `Plan Selected` | Plan tapped | `plan` |
| `Start Clicked` | "Start talking" on the paywall (fake door) | `plan` |
| `Paywall Dismissed` | "Not now" | `plan` |
| `Feedback Submitted` | Finale form | `reasons` (list), `paywall_outcome`, `comment` |

Super properties on every event: `funnel_version`, `result_variant`, `utm_source`, `utm_campaign`, `intent` (after Q1).

## Funnel

`Quiz Started → Question Answered (intent) → Result Viewed → Paywall Viewed → Start Clicked`, broken down by `utm_source` and `result_variant`. Email is reported separately as a rate, because it can be skipped.

## Data quality checks before I trust a number

1. **Duplicates.** `Step Viewed` fires once per step per session by design. I check it with SQL: count of events per `$session_id` + `step_id` must be 1. I learned this the hard way on billing data, where one payment was counted twice.
2. **My own sessions.** QA runs add `?qa=1`; those sessions are filtered out. PostHog drops headless browsers by default, so `qa=1` also turns that filter off: automated tests reach the project but stay tagged.
3. **Split balance.** If the 50/50 flag gives 70/30, something is broken (SRM check) and the test result is not usable.
4. **Day by day.** Conversion per group per day, not only the total. One bad day can flip a small test.

## A/B test

PostHog experiment on flag `result-screen`, variants `chat_preview` (control: companion + first message) and `match_score` (the same plus a "why this match" block), 50/50. Primary metric: Result Viewed → Start Clicked. The variant is also stored as a super property, so every event carries it. A `?variant=` URL parameter forces a variant for QA.

## Privacy

- Emails are never sent to analytics: only `email_domain`.
- IP anonymization is on in the project.
- No session recording for this test.
- Testers are told it is a demo before they start.
