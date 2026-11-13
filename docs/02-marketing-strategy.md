# 02. Marketing strategy

## Who it is for

Adults in the US, 25–44 at the core, who come home to a quiet apartment. They are not looking for a replacement for people. They want someone who is glad they texted, remembers what happened yesterday, and doesn't judge.

Three segments, picked by the first question:

| Segment | What they want | What the funnel promises |
|---|---|---|
| **Real connection** | Something that feels like a relationship | Memory, attention, a companion who asks how you are |
| **Light and flirty** | Fun, compliments, no pressure | Playful texting at your pace |
| **Daily company** | Someone to talk to every day | Good-morning texts, check-ins, someone who remembers your day |

"Not sure yet" goes to the daily-company path, which is the softest.

## Value proposition

**Someone who is glad you texted.** Halcy remembers your day, texts the way you like, and moves at your pace.

Proof points in the funnel, not in claims:
1. The companion's first message uses the user's answers (time of day, style, intent).
2. The preview screen shows how they would text in the chosen style.
3. The memory question in the matching screen makes "remembers your day" a choice the user made.

## Tone

Warm, a bit playful, never explicit. Short sentences. No "revolutionary AI". No fake statistics: one real number from a public source. Every paywall says Halcy is an AI, not a person.

## The offer

Demo prices, chosen to look like the category, not taken from any real app:

| Plan | Price | Framing |
|---|---|---|
| 1 week | $6.99 | then $19.99 / month |
| 1 month | $19.99 | default, "Most picked" |
| 3 months | $39.99 | "Save 33%" |

Risk reversal: cancel anytime. FAQ under the plans answers the three questions I expect: is it a real person, is my chat private, can I cancel.

## The funnel as a business

What I would watch, in this order:
1. **Quiz start → paywall view.** Is the quiz too long or too personal for this traffic?
2. **Paywall view → trial intent.** Does the result make people want to reply?
3. **Trial → first renewal** (real product only). The metric I'd judge pricing tests on. A cheap trial can win on starts and lose on money.

Guardrails: refund rate, chargebacks, complaints that the companion felt fake.

## The first test

**Hypothesis:** a result screen that shows the companion's first message (chat preview) makes more people click "Start" on the paywall than a result screen that shows a compatibility score ("94% match").

- Primary metric: Paywall Viewed → Trial Intent Clicked.
- Guardrail: Email Submitted rate (the chat preview must not scare people off before the email).
- Split: 50/50 through a PostHog feature flag `result-screen`.

With 20–50 testers this test can't pick a winner. To detect a +10 p.p. lift from a 20% baseline at α = 0.05 and 80% power you need about 290 people per group. I run it anyway to show the setup works end to end, and I use the real data for step-by-step drop-off, not for a winner.

## Next tests (for real traffic)

| Hypothesis | Primary metric | Guardrail |
|---|---|---|
| Asking for email before the result loses fewer people than after it | Quiz start → paywall view | Email open rate |
| A $1 3-day trial beats the $6.99 week | Trial → first paid renewal | Chargeback rate |
| Removing the "pace" question shortens the quiz without hurting paywall conversion | Quiz start → paywall view | Trial intent rate |
