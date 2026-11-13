import { useCallback, useEffect, useState } from "react";
import type { Answers, Funnel } from "./engine/schema";
import { backIndex, canGoBack, nextIndex, progress, questionCounter } from "./engine/flow";
import { getVariant, setSuper, track, trackStepView } from "./analytics";
import { Email, Finale, Info, Landing, Likert, Loader, Multi, Paywall, Result, Reward, Single } from "./screens/Screens";

export default function App({ funnel }: { funnel: Funnel }) {
  const { steps, meta } = funnel;
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [variant, setVariant] = useState(meta.abTest.control);

  useEffect(() => {
    getVariant(meta.abTest.flag, meta.abTest.variants, meta.abTest.control).then((v) => {
      setVariant(v);
      setSuper({ result_variant: v });
    });
  }, [meta]);

  const step = steps[i];
  useEffect(() => {
    trackStepView(step.id, i, step.type);
    window.scrollTo(0, 0);
  }, [step, i]);

  const next = useCallback(() => setI((x) => nextIndex(steps, x)), [steps]);
  const setAnswer = useCallback((key: string, value: Answers[string]) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    if (key === "intent" && typeof value === "string") setSuper({ intent: value });
  }, []);

  const ctx = { f: funnel, answers, setAnswer, next };
  const counter = questionCounter(steps, i);

  return (
    <div className="app">
      <header className="top">
        {canGoBack(steps, i) ? (
          <button
            className="back"
            onClick={() => {
              track("Back Clicked", { from_step: step.id });
              setI(backIndex(steps, i));
            }}
          >
            ← Back
          </button>
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
      <main key={step.id}>
        {step.type === "landing" && <Landing {...ctx} step={step} />}
        {step.type === "single" && <Single {...ctx} step={step} />}
        {step.type === "multi" && <Multi {...ctx} step={step} />}
        {step.type === "likert" && <Likert {...ctx} step={step} />}
        {step.type === "reward" && <Reward {...ctx} step={step} />}
        {step.type === "info" && <Info {...ctx} step={step} />}
        {step.type === "loader" && <Loader {...ctx} step={step} />}
        {step.type === "result" && <Result {...ctx} step={step} variant={variant} />}
        {step.type === "email" && <Email {...ctx} step={step} />}
        {step.type === "paywall" && <Paywall {...ctx} step={step} />}
        {step.type === "finale" && <Finale {...ctx} step={step} />}
      </main>
    </div>
  );
}
