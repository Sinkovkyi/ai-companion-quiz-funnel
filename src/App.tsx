import { useCallback, useEffect, useRef, useState } from "react";
import type { Answers, Funnel } from "./engine/schema";
import { backIndex, canGoBack, nextIndex, progress, questionCounter } from "./engine/flow";
import { getVariant, session, setSuper, track, trackStepView } from "./analytics";
import { Email, Finale, Info, Landing, Likert, Loader, Multi, Paywall, Result, Reward, Single } from "./screens/Screens";

type Saved = { i: number; answers: Answers; variant?: string };
const KEY = "halcy_state";
/** Taps right after a screen change belong to the old screen (double-tap), so they are ignored. */
const INPUT_LOCK_MS = 350;

export default function App({ funnel }: { funnel: Funnel }) {
  const { steps, meta } = funnel;
  const saved = useRef(session.get<Saved>(KEY)).current;
  const [i, setI] = useState(saved && saved.i < steps.length ? saved.i : 0);
  const [answers, setAnswers] = useState<Answers>(saved?.answers ?? {});
  const [variant, setVariant] = useState<string | undefined>(saved?.variant);
  const [locked, setLocked] = useState(false);
  const step = steps[i];

  // Refresh-safe: progress lives in sessionStorage for this tab.
  useEffect(() => session.set(KEY, { i, answers, variant } satisfies Saved), [i, answers, variant]);

  useEffect(() => {
    trackStepView(step.id, i, step.type);
    window.scrollTo(0, 0);
    setLocked(true);
    const t = setTimeout(() => setLocked(false), INPUT_LOCK_MS);
    return () => clearTimeout(t);
  }, [step, i]);

  // Ask for the A/B variant only at the matching screen, right before the result,
  // so people who never reach the result are not counted as exposed.
  useEffect(() => {
    if (variant || (step.type !== "loader" && step.type !== "result")) return;
    getVariant(meta.abTest.flag, meta.abTest.variants, meta.abTest.control).then((v) => {
      setVariant(v);
      setSuper({ result_variant: v });
    });
  }, [step, variant, meta]);

  useEffect(() => {
    if (variant) setSuper({ result_variant: variant });
  }, [variant]);

  // `next` only moves forward from the screen it was created on, so a late timer or a second tap is a no-op.
  const next = useCallback(() => setI((x) => (x === i ? nextIndex(steps, x) : x)), [steps, i]);

  const goBack = useCallback(
    (via: "button" | "browser") => {
      track("Back Clicked", { from_step: step.id, via });
      setI(backIndex(steps, i));
    },
    [steps, i, step.id],
  );

  // Browser / swipe back: one history entry per screen, handled like our Back button.
  useEffect(() => {
    if (i > 0) history.pushState({ halcy: i }, "");
  }, [i]);
  useEffect(() => {
    const onPop = () => {
      if (canGoBack(steps, i)) goBack("browser");
      else history.pushState({ halcy: i }, ""); // screens without Back stay put
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [steps, i, goBack]);

  const setAnswer = useCallback((key: string, value: Answers[string]) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    if (key === "intent" && typeof value === "string") setSuper({ intent: value });
  }, []);

  const ctx = { f: funnel, answers, setAnswer, next };
  const counter = questionCounter(steps, i);
  const shown = variant ?? meta.abTest.control;

  return (
    <div className="app">
      <header className="top">
        {canGoBack(steps, i) ? (
          <button className="back" onClick={() => goBack("button")}>← Back</button>
        ) : (
          <span />
        )}
        <div className="brand">{meta.brand.toLowerCase()}</div>
        <div className="count">{counter ? `${counter.current} / ${counter.total}` : ""}</div>
      </header>
      {i > 0 && (
        <div className="bar" aria-hidden="true">
          <span style={{ width: `${progress(steps, i)}%` }} />
        </div>
      )}
      <main key={step.id} className={locked ? "locked" : undefined}>
        {step.type === "landing" && <Landing {...ctx} step={step} />}
        {step.type === "single" && <Single {...ctx} step={step} />}
        {step.type === "multi" && <Multi {...ctx} step={step} />}
        {step.type === "likert" && <Likert {...ctx} step={step} />}
        {step.type === "reward" && <Reward {...ctx} step={step} />}
        {step.type === "info" && <Info {...ctx} step={step} />}
        {step.type === "loader" && <Loader {...ctx} step={step} />}
        {step.type === "result" && (variant ? <Result {...ctx} step={step} variant={shown} /> : <p className="typing">…</p>)}
        {step.type === "email" && <Email {...ctx} step={step} />}
        {step.type === "paywall" && <Paywall {...ctx} step={step} />}
        {step.type === "finale" && <Finale {...ctx} step={step} />}
      </main>
    </div>
  );
}
