import { describe, expect, it } from "vitest";
import raw from "../../funnels/halcy.json";
import { funnelSchema, type Answers } from "../../src/engine/schema";
import { chips, companionName, fill, firstMessage, matchScore, previewMessages } from "../../src/engine/personalize";
import { backIndex, canGoBack, questionCounter } from "../../src/engine/flow";

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
    for (const p of placeholders) expect(["{name}", "{they}", "{them}"]).toContain(p);
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

  it("keeps the match score within the cap", () => {
    expect(matchScore(f, a)).toBe(92);
    expect(matchScore(f, { traits: ["a", "b", "c", "d", "e"] })).toBeLessThanOrEqual(f.personalization.matchScore.max);
  });

  it("shows trait and time labels as chips", () => {
    expect(chips(f, a)).toEqual(["Witty", "Calm", "Late at night"]);
  });
});

describe("flow", () => {
  it("skips info, reward and loader screens on Back", () => {
    expect(backIndex(f.steps, at("open_up"))).toBe(at("when"));
    expect(backIndex(f.steps, at("pace"))).toBe(at("ask_how"));
  });

  it("does not allow Back on landing, loader, result, paywall or finale", () => {
    for (const id of ["landing", "matching", "result", "paywall", "finale"]) expect(canGoBack(f.steps, at(id)), id).toBe(false);
    expect(canGoBack(f.steps, at("age"))).toBe(true);
  });

  it("counts only questions", () => {
    expect(questionCounter(f.steps, at("intent"))).toEqual({ current: 1, total: 9 });
    expect(questionCounter(f.steps, at("stat"))).toBeNull();
  });
});
