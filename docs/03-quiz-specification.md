# 03. Quiz specification

The funnel lives in [`funnels/halcy.json`](../funnels/halcy.json) and is validated by a Zod schema at build time and in tests. This doc explains why each screen is there.

## Flow (16 screens)

| # | id | Type | Why it is here |
|---|---|---|---|
| 1 | `landing` | landing | Hook: a 2 a.m. chat. The ad that brings people here shows the same moment. |
| 2 | `intent` | single | Segments the user. Everything after it reads differently per segment. |
| 3 | `age` | single | One-tap warm-up and segmentation. The 18+ rule is stated on the landing; this is not a real age gate. |
| 4 | `partner` | single | Who they want to meet. Picks the companion's name. |
| 5 | `traits` | multi (max 3) | Personality. Shows up as chips on the result and in the first message. |
| 6 | `style` | single | How they want to be texted. Drives the preview and the first message length. |
| 7 | `when` | single | When they want to hear from the companion. Opens the first message. |
| 8 | `preview` | reward | Micro-reward: "here's how they'd text you" in the chosen style. |
| 9 | `ask_how` | likert | Self-identification: want to be asked how I am, not what I did. 4–5 changes the first message. |
| 10 | `stat` | info | One real number: about 1 in 2 US adults report feeling lonely (Surgeon General, 2023). |
| 11 | `pace` | single | How fast things should move. Adds a line to the first message. |
| 12 | `matching` | loader | "Creating your companion" with one question inside: should they remember your day? |
| 13 | `result` | result | Companion card + first message. A/B: with or without the "why this match" block. |
| 14 | `email` | email | Save the companion. Can be skipped. Only the domain is tracked. |
| 15 | `paywall` | paywall | Plans with renewal terms, FAQ incl. 988. "Start" is a fake door, "Not now" is a real exit. |
| 16 | `finale` | finale | "This was a demo" + multi-select feedback. |

v1.1 cut a second self-identification statement (`open_up`): it didn't change anything the user saw. Flagged by the CRO review.

Back is allowed on question screens from the second question on, both as a button and as the browser / swipe back. It skips over info, reward and loader screens. Progress survives a page refresh (sessionStorage). A new screen ignores taps for its first 350 ms, so a double tap can't answer the next question. The memory question in the loader moves on by itself after 8 s.

v1.2 fixes come from the QA review: double taps, refresh, browser back, duplicate top-of-funnel events, exposure timing, loader timeout, email validation, and an email address leaking through the feedback comment.

## Personalization rules

All rules are data in the JSON, not code:

- **Name:** `partner` × `style` → one of 9 names.
- **First message:** opening by `when` + middle by `intent` + a line for a strong `ask_how` answer (or else the first trait) + a line by `pace` + a memory line if they chose memory.
- **Match explanation (variant B):** the count of answers that fed the name or message, plus those answers as chips.
- **Preview:** two sample messages per `style`.
- **Chips on the result:** chosen traits + `when`.

No scoring. Every answer either changes what the user sees later or is used for segmentation in analytics. A question that does neither should be cut.

## Copy rules

- US English. Short sentences. Warm, a bit playful, never explicit.
- No invented numbers. The one statistic has a source on the screen.
- Paywall and landing both say Halcy is an AI.
- Errors say what went wrong and how to fix it.
