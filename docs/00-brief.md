# 00. Brief

## The task

Inception-1 asks candidates for the Junior Product Marketing Manager role to attach a marketing quiz funnel for any product, built with AI tools. It does not have to be perfect. They want to see how the candidate thinks and works with AI.

## What I am building

A web2app quiz funnel for **Halcy**, a fictional romantic AI companion app for the US market.

Halcy is not a real product. I picked the romantic companion niche on purpose: it is the core of Inception-1's portfolio (iGirl, iBoy, Anima), and the vacancies list Dating / Social Discovery as the domain. I don't use their brands anywhere in the funnel.

## What "done" means

1. A live funnel on a public link that works on a phone.
2. Real analytics: every step sends an event to PostHog, named the way I would name it in Amplitude.
3. One A/B test wired through a feature flag.
4. A short readout on real data from 20–50 testers: where people drop off, why, and what I would test next.
5. The repo shows the whole process: research → strategy → spec → code → tests → review, and how AI was used at each step.

## Constraints

- 1–2 days, $0 budget (free tiers only).
- No real payments. The paywall is a fake door: the click on "Start" is counted as purchase intent, then the tester sees that it is a demo.
- No explicit content. 18+ gate, clear note that Halcy is an AI.
- Testers' emails are not stored. Only the fact of submission and the email domain.

## Out of scope

Real chat with an LLM, a real app, a real checkout, paid traffic.
