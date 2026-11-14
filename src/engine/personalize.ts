import type { Answers, Funnel } from "./schema";

const str = (a: Answers, key: string): string | undefined => {
  const v = a[key];
  return typeof v === "string" ? v : undefined;
};

export function companionName(f: Funnel, a: Answers): string {
  const partner = str(a, "partner");
  const style = str(a, "style");
  return (partner && style && f.personalization.names[partner]?.[style]) || f.personalization.defaultName;
}

export function pronouns(f: Funnel, a: Answers) {
  return f.personalization.pronouns[str(a, "partner") ?? "surprise"] ?? { subject: "they", object: "them" };
}

/** Replaces {name}, {they} and {them} in copy. Nothing else is interpolated. */
export function fill(text: string, f: Funnel, a: Answers): string {
  const p = pronouns(f, a);
  return text
    .replaceAll("{name}", companionName(f, a))
    .replaceAll("{they}", p.subject)
    .replaceAll("{them}", p.object);
}

export function firstMessage(f: Funnel, a: Answers): string {
  const p = f.personalization;
  const traits = Array.isArray(a.traits) ? a.traits : [];
  const likert = Object.entries(p.likertLines)
    .filter(([id, rule]) => typeof a[id] === "number" && (a[id] as number) >= rule.min)
    .map(([, rule]) => rule.line);
  const parts = [
    p.opening[str(a, "when") ?? ""] ?? p.opening.me_first,
    p.middle[str(a, "intent") ?? ""] ?? p.middle.unsure,
    // A strong "ask how I am" answer replaces the trait line: it says the same thing, more personally.
    likert[0] ?? (traits[0] ? p.traitLine[traits[0]] : undefined),
    p.paceLine[str(a, "pace") ?? ""],
    a.memory === "yes" ? p.memoryLine : undefined,
  ];
  return parts.filter(Boolean).join(" ");
}

export function previewMessages(f: Funnel, a: Answers): string[] {
  return f.personalization.previews[str(a, "style") ?? "mix"] ?? f.personalization.previews.mix ?? [];
}

/** Answers that actually change who the companion is or what they say. Shown honestly as a count. */
const MATCH_INPUTS = ["intent", "partner", "traits", "style", "when", "ask_how", "pace", "memory"];

export function matchedCount(a: Answers): number {
  return MATCH_INPUTS.filter((k) => {
    const v = a[k];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
  }).length;
}

/** Labels of chosen options, for chips on the result screen. */
export function chips(f: Funnel, a: Answers): string[] {
  const labelOf = (stepId: string, value: string) => {
    const step = f.steps.find((s) => s.id === stepId);
    if (step && (step.type === "single" || step.type === "multi")) {
      return step.options.find((o) => o.value === value)?.label;
    }
    return undefined;
  };
  const traits = Array.isArray(a.traits) ? a.traits : [];
  const when = str(a, "when");
  return [...traits.map((t) => labelOf("traits", t)), when ? labelOf("when", when) : undefined].filter(
    (x): x is string => Boolean(x),
  );
}
