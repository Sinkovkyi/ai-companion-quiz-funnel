import { describe, expect, it } from "vitest";
import raw from "../../funnels/halcy.json";
import { funnelSchema, type Answers } from "../../src/engine/schema";
import { chips, companionName, fill, firstMessage, matchedCount, previewMessages } from "../../src/engine/personalize";
import { backIndex, canGoBack, questionCounter } from "../../src/engine/flow";
import { cleanEmail, redact } from "../../src/engine/text";

const f = funnelSchema.parse(raw);
const ids = f.steps.map((s) => s.id);
const at = (id: string) => ids.indexOf(id);

describe("funnel config", () => {
  it("passes the schema", () => {
    expect(funnelSchema.safeParse(raw).success).toBe(true);
  });

  it("rejects duplicate step ids", () => {
    const broken = structuredClone(raw) as typeof raw;
    broken.steps[2].id = broken.steps[1].id;
    expect(funnelSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a paywall default plan that does not exist", () => {
    const broken = structuredClone(raw) as { steps: { type: string; defaultPlan?: string }[] };
    broken.steps.find((s) => s.type === "paywall")!.defaultPlan = "lifetime";
    expect(funnelSchema.safeParse(broken).success).toBe(false);
  });

  it("has a name for every partner x style combination", () => {
    const partner = f.steps.find((s) => s.id === "partner")!;
    const style = f.steps.find((s) => s.id === "style")!;
    if (partner.type !== "single" || style.type !== "single") throw new Error("wrong step types");
    for (const p of partner.options) for (const s of style.options) {
      expect(f.personalization.names[p.value]?.[s.value], `${p.value}/${s.value}`).toBeTruthy();
    }
  });

  it("has an opening, middle, trait line and preview for every option", () => {
    const opts = (id: string) => {
      const s = f.steps.find((x) => x.id === id)!;
      return s.type === "single" || s.type === "multi" ? s.options.map((o) => o.value) : [];
    };
    for (const v of opts("when")) expect(f.personalization.opening[v], v).toBeTruthy();
    for (const v of opts("intent")) expect(f.personalization.middle[v], v).toBeTruthy();
    for (const v of opts("traits")) expect(f.personalization.traitLine[v], v).toBeTruthy();
    for (const v of opts("style")) expect(f.personalization.previews[v]?.length, v).toBeGreaterThan(0);
  });

  it("has no unfilled placeholders other than {name}, {they}, {them}", () => {
    const text = JSON.stringify(raw);
    const placeholders = new Set(text.match(/\{[a-z_]+\}/g) ?? []);
    for (const p of placeholders) expect(["{name}", "{they}", "{them}", "{count}"]).toContain(p);
  });
});

describe("personalization", () => {
  const a: Answers = { intent: "flirty", partner: "woman", style: "playful", when: "night", traits: ["witty", "calm"], memory: "yes" };

  it("picks the name from partner and style", () => {
    expect(companionName(f, a)).toBe("Mia");
    expect(companionName(f, {})).toBe(f.personalization.defaultName);
  });

  it("builds the first message from when, intent, first trait and memory", () => {
    const m = firstMessage(f, a);
    expect(m).toContain(f.personalization.opening.night);
    expect(m).toContain(f.personalization.middle.flirty);
    expect(m).toContain(f.personalization.traitLine.witty);
    expect(m).toContain(f.personalization.memoryLine);
    expect(firstMessage(f, { ...a, memory: "no" })).not.toContain(f.personalization.memoryLine);
  });

  it("still writes a message with no answers", () => {
    expect(firstMessage(f, {}).length).toBeGreaterThan(10);
  });

  it("fills placeholders", () => {
    expect(fill("{name} is typing", f, a)).toBe("Mia is typing");
  });

  it("uses previews for the chosen style", () => {
    expect(previewMessages(f, a)).toEqual(f.personalization.previews.playful);
  });

  it("counts only answers that shape the companion", () => {
    expect(matchedCount(a)).toBe(6);
    expect(matchedCount({ ...a, age: "25-34", traits: [] })).toBe(5);
  });

  it("uses a strong 'ask how I am' answer and the pace in the message", () => {
    const m = firstMessage(f, { ...a, ask_how: 5, pace: "slow" });
    expect(m).toContain(f.personalization.likertLines.ask_how.line);
    expect(m).not.toContain(f.personalization.traitLine.witty);
    expect(m).toContain(f.personalization.paceLine.slow);
    expect(firstMessage(f, { ...a, ask_how: 2 })).toContain(f.personalization.traitLine.witty);
  });

  it("never writes an empty sentence for a pace with no line", () => {
    expect(firstMessage(f, { ...a, pace: "natural" })).not.toMatch(/\s{2}|\s$/);
  });

  it("shows trait and time labels as chips", () => {
    expect(chips(f, a)).toEqual(["Witty", "Calm", "Late at night"]);
  });
});

describe("flow", () => {
  it("skips info, reward and loader screens on Back", () => {
    expect(backIndex(f.steps, at("ask_how"))).toBe(at("when"));
    expect(backIndex(f.steps, at("pace"))).toBe(at("ask_how"));
  });

  it("does not allow Back on landing, the first question, loader, result, paywall or finale", () => {
    for (const id of ["landing", "matching", "result", "paywall", "finale"]) expect(canGoBack(f.steps, at(id)), id).toBe(false);
    expect(canGoBack(f.steps, at("age"))).toBe(true);
    expect(canGoBack(f.steps, at("intent"))).toBe(false);
  });

  it("counts only questions", () => {
    expect(questionCounter(f.steps, at("intent"))).toEqual({ current: 1, total: 8 });
    expect(questionCounter(f.steps, at("stat"))).toBeNull();
  });
});

describe("text safety", () => {
  it("removes email addresses from free text", () => {
    expect(redact("email me at jane.doe@gmail.com please")).toBe("email me at [email] please");
    expect(redact("no address here")).toBe("no address here");
  });

  it("accepts real emails and rejects malformed ones", () => {
    for (const ok of ["a@b.co", "Tester.Name+x@Example.COM", "x@mail.example.co.uk"]) expect(cleanEmail(ok), ok).toBeTruthy();
    for (const bad of ["a@b..com", "a@.co.uk", "a@b.com.", "x@-x.com", "a@b", "@b.com", "a b@c.com"]) expect(cleanEmail(bad), bad).toBeNull();
    expect(cleanEmail("a@b.com\u200B")).toBe("a@b.com");
  });
});
