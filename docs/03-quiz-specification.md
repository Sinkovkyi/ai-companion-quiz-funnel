# 03. Quiz specification

The funnel lives in [`funnels/halcy.json`](../funnels/halcy.json) and is validated by a Zod schema at build time and in tests. This doc explains why each screen is there.

## Flow (17 screens)

| # | id | Type | Why it is here |
|---|---|---|---|
| 1 | `landing` | landing | Hook: a 2 a.m. chat. The ad that brings people here shows the same moment. |
| 2 | `intent` | single | Segments the user. Everything after it reads differently per segment. |
| 3 | `age` | single | 18+ gate and a one-tap warm-up. |
| 4 | `partner` | single | Who they want to meet. Picks the companion's name. |
| 5 | `traits` | multi (max 3) | Personality. Shows up as chips on the result and in the first message. |
| 6 | `style` | single | How they want to be texted. Drives the preview and the first message length. |
| 7 | `when` | single | When they want to hear from the companion. Opens the first message. |
| 8 | `preview` | reward | Micro-reward: "here's how they'd text you" in the chosen style. |
| 9 | `open_up` | likert | Self-identification: easier to open up when no one interrupts. |
| 10 | `ask_how` | likert | Self-identification: want to be asked how I am, not what I did. |
| 11 | `stat` | info | One real number: 1 in 2 US adults report loneliness (Surgeon General, 2023). |
| 12 | `pace` | single | How fast things should move. Personalization and a safety signal. |
| 13 | `matching` | loader | "Creating your companion" with one question inside: should they remember your day? |
| 14 | `result` | result | Companion card + first message. A/B: chat preview vs match score. |
| 15 | `email` | email | Save the companion. Only the domain is tracked, the email is not stored. |
| 16 | `paywall` | paywall | Plans, cancel anytime, FAQ. "Start" is a fake door. |
| 17 | `finale` | finale | "This was a demo" + one feedback question. |

Back is allowed on question screens. It skips over info, reward and loader screens.

## Personalization rules

All rules are data in the JSON, not code:

- **Name:** `partner` × `style` → one of 9 names.
- **First message:** opening by `when` + middle by `intent` + a line by the first chosen trait, plus a memory line if they chose memory.
- **Preview:** two sample messages per `style`.
- **Chips on the result:** chosen traits + `when`.

No scoring. Every answer either changes what the user sees later or is used for segmentation in analytics. A question that does neither should be cut.

## Copy rules

- US English. Short sentences. Warm, a bit playful, never explicit.
- No invented numbers. The one statistic has a source on the screen.
- Paywall and landing both say Halcy is an AI.
- Errors say what went wrong and how to fix it.
