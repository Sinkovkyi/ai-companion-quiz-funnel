import { z } from "zod";

const option = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().optional(),
});

const base = { id: z.string().regex(/^[a-z_]+$/) };

const landing = z.object({
  ...base,
  type: z.literal("landing"),
  time: z.string(),
  chat: z.array(z.object({ from: z.enum(["user", "ai"]), text: z.string() })).min(1),
  title: z.string(),
  subtitle: z.string(),
  cta: z.string(),
  note: z.string(),
});

const single = z.object({
  ...base,
  type: z.literal("single"),
  title: z.string(),
  subtitle: z.string().optional(),
  layout: z.enum(["list", "grid"]).optional(),
  options: z.array(option).min(2),
});

const multi = z.object({
  ...base,
  type: z.literal("multi"),
  title: z.string(),
  subtitle: z.string().optional(),
  max: z.number().int().min(1),
  cta: z.string(),
  options: z.array(option).min(2),
});

const likert = z.object({
  ...base,
  type: z.literal("likert"),
  eyebrow: z.string(),
  statement: z.string(),
  minLabel: z.string(),
  maxLabel: z.string(),
});

const reward = z.object({
  ...base,
  type: z.literal("reward"),
  title: z.string(),
  subtitle: z.string(),
  cta: z.string(),
});

const info = z.object({
  ...base,
  type: z.literal("info"),
  big: z.string(),
  headline: z.string(),
  text: z.string(),
  source: z.string().min(5),
  cta: z.string(),
});

const loader = z.object({
  ...base,
  type: z.literal("loader"),
  title: z.string(),
  rows: z.array(z.string()).min(1),
  question: z.object({
    askAfterRow: z.number().int().min(0),
    text: z.string(),
    options: z.array(option).min(2),
  }),
});

const result = z.object({
  ...base,
  type: z.literal("result"),
  eyebrow: z.string(),
  typing: z.string(),
  scoreLabel: z.string(),
  reasonsLabel: z.string(),
  cta: z.string(),
});

const email = z.object({
  ...base,
  type: z.literal("email"),
  title: z.string(),
  subtitle: z.string(),
  placeholder: z.string(),
  cta: z.string(),
  error: z.string(),
  note: z.string(),
  skip: z.string(),
});

const paywall = z.object({
  ...base,
  type: z.literal("paywall"),
  title: z.string(),
  defaultPlan: z.string(),
  plans: z
    .array(z.object({ id: z.string(), label: z.string(), price: z.string(), sub: z.string(), badge: z.string().optional() }))
    .min(1),
  cta: z.string(),
  dismiss: z.string(),
  cancelNote: z.string(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  disclaimer: z.string(),
});

const finale = z.object({
  ...base,
  type: z.literal("finale"),
  title: z.string(),
  text: z.string(),
  question: z.string(),
  reasons: z.array(option).min(2),
  commentPlaceholder: z.string(),
  cta: z.string(),
  thanks: z.string(),
});

export const stepSchema = z.discriminatedUnion("type", [
  landing, single, multi, likert, reward, info, loader, result, email, paywall, finale,
]);

const byKey = z.record(z.string(), z.string());

export const funnelSchema = z
  .object({
    meta: z.object({
      brand: z.string(),
      version: z.string(),
      market: z.string(),
      abTest: z.object({ flag: z.string(), variants: z.array(z.string()).min(2), control: z.string() }),
    }),
    steps: z.array(stepSchema).min(2),
    personalization: z.object({
      pronouns: z.record(z.string(), z.object({ subject: z.string(), object: z.string() })),
      names: z.record(z.string(), byKey),
      defaultName: z.string(),
      opening: byKey,
      middle: byKey,
      traitLine: byKey,
      paceLine: byKey,
      likertLines: z.record(z.string(), z.object({ min: z.number().int().min(1).max(5), line: z.string() })),
      memoryLine: z.string(),
      previews: z.record(z.string(), z.array(z.string()).min(1)),
    }),
  })
  .superRefine((f, ctx) => {
    const ids = f.steps.map((s) => s.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) ctx.addIssue({ code: "custom", message: `Duplicate step id: ${dup}` });
    if (f.steps[0].type !== "landing") ctx.addIssue({ code: "custom", message: "First step must be the landing" });
    if (!f.meta.abTest.variants.includes(f.meta.abTest.control))
      ctx.addIssue({ code: "custom", message: "A/B control must be one of the variants" });
    const paywall = f.steps.find((s) => s.type === "paywall");
    if (paywall && paywall.type === "paywall" && !paywall.plans.some((p) => p.id === paywall.defaultPlan))
      ctx.addIssue({ code: "custom", message: "Paywall defaultPlan must match a plan id" });
    const option = (id: string) => f.steps.find((s) => s.id === id);
    for (const key of ["intent", "partner", "style", "when", "traits"]) {
      if (!option(key)) ctx.addIssue({ code: "custom", message: `Personalization needs a "${key}" step` });
    }
  });

export type Funnel = z.infer<typeof funnelSchema>;
export type Step = z.infer<typeof stepSchema>;
export type StepOf<T extends Step["type"]> = Extract<Step, { type: T }>;
export type Answers = Record<string, string | string[] | number>;
