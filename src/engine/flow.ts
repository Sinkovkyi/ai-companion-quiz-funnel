import type { Step } from "./schema";

const SKIPPED_ON_BACK: Step["type"][] = ["info", "reward", "loader"];
const NO_BACK: Step["type"][] = ["landing", "loader", "result", "paywall", "finale"];
const NOT_COUNTED: Step["type"][] = ["landing", "info", "reward", "loader", "result", "email", "paywall", "finale"];

export function nextIndex(steps: Step[], i: number): number {
  return Math.min(i + 1, steps.length - 1);
}

export function backIndex(steps: Step[], i: number): number {
  let j = i - 1;
  while (j > 0 && SKIPPED_ON_BACK.includes(steps[j].type)) j--;
  return Math.max(0, j);
}

export function canGoBack(steps: Step[], i: number): boolean {
  // No Back from the first question: going back to the landing would count "Quiz Started" twice.
  return i > 1 && !NO_BACK.includes(steps[i].type);
}

/** "3 / 9" style counter over question screens only. */
export function questionCounter(steps: Step[], i: number): { current: number; total: number } | null {
  const questions = steps.map((s, idx) => ({ s, idx })).filter(({ s }) => !NOT_COUNTED.includes(s.type));
  const pos = questions.findIndex(({ idx }) => idx === i);
  return pos === -1 ? null : { current: pos + 1, total: questions.length };
}

export function progress(steps: Step[], i: number): number {
  return Math.round((i / (steps.length - 1)) * 100);
}
