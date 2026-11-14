import { useEffect, useRef, useState } from "react";
import type { Answers, Funnel, StepOf } from "../engine/schema";
import { chips, companionName, fill, firstMessage, matchedCount, previewMessages } from "../engine/personalize";
import { track, trackOnce } from "../analytics";
import { cleanEmail, redact } from "../engine/text";

type Ctx = {
  f: Funnel;
  answers: Answers;
  setAnswer: (key: string, value: Answers[string]) => void;
  next: () => void;
};

export function Landing({ step, next }: Ctx & { step: StepOf<"landing"> }) {
  useEffect(() => trackOnce("landing", "Landing Viewed"), []);
  return (
    <div className="screen">
      <div className="hero">
        <span className="time">{step.time}</span>
        {step.chat.map((m, i) => (
          <div key={i} className={`bubble ${m.from === "user" ? "me" : ""}`}>{m.text}</div>
        ))}
      </div>
      <h1>{step.title}</h1>
      <p className="lead">{step.subtitle}</p>
      <button
        className="btn"
        data-testid="cta"
        onClick={() => {
          trackOnce("quiz_started", "Quiz Started");
          next();
        }}
      >
        {step.cta}
      </button>
      <p className="note">{step.note}</p>
    </div>
  );
}

export function Single({ step, answers, setAnswer, next }: Ctx & { step: StepOf<"single"> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="screen">
      <h2>{step.title}</h2>
      {step.subtitle && <p className="lead">{step.subtitle}</p>}
      <div className={step.layout === "grid" ? "grid2" : "opts"}>
        {step.options.map((o) => (
          <button
            key={o.value}
            className={`opt ${answers[step.id] === o.value ? "sel" : ""}`}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setAnswer(step.id, o.value);
              track("Question Answered", { step_id: step.id, answer: o.value });
              setTimeout(next, 180);
            }}
          >
            {o.emoji && <span className="e" aria-hidden="true">{o.emoji}</span>}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Multi({ step, answers, setAnswer, next }: Ctx & { step: StepOf<"multi"> }) {
  const prev = answers[step.id];
  const [sel, setSel] = useState<string[]>(Array.isArray(prev) ? prev : []);
  const toggle = (v: string) =>
    setSel((s) => (s.includes(v) ? s.filter((x) => x !== v) : s.length >= step.max ? s : [...s, v]));
  return (
    <div className="screen">
      <h2>{step.title}</h2>
      {step.subtitle && <p className="lead">{step.subtitle}</p>}
      <div className="grid2">
        {step.options.map((o) => {
          const on = sel.includes(o.value);
          return (
            <button key={o.value} className={`opt col ${on ? "sel" : ""}`} aria-pressed={on} onClick={() => toggle(o.value)}>
              {o.emoji && <span className="e" aria-hidden="true">{o.emoji}</span>}
              {o.label}
            </button>
          );
        })}
      </div>
      <button
        className="btn"
        disabled={sel.length === 0}
        onClick={() => {
          setAnswer(step.id, sel);
          track("Question Answered", { step_id: step.id, answer: sel });
          next();
        }}
      >
        {step.cta}
      </button>
    </div>
  );
}

export function Likert({ step, answers, setAnswer, next }: Ctx & { step: StepOf<"likert"> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="screen">
      <span className="eyebrow">{step.eyebrow}</span>
      <h2>“{step.statement}”</h2>
      <div className="likert">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`opt ${answers[step.id] === n ? "sel" : ""}`}
            aria-label={`${n} of 5`}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setAnswer(step.id, n);
              track("Question Answered", { step_id: step.id, answer: n });
              setTimeout(next, 180);
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="scale">
        <span>{step.minLabel}</span>
        <span>{step.maxLabel}</span>
      </div>
    </div>
  );
}

export function Reward({ step, f, answers, next }: Ctx & { step: StepOf<"reward"> }) {
  const name = companionName(f, answers);
  return (
    <div className="screen">
      <h2>{fill(step.title, f, answers)}</h2>
      <p className="lead">{step.subtitle}</p>
      <div className="card chat">
        <div className="who small">
          <div className="ava sm" aria-hidden="true">{name[0]}</div>
          <strong>{name}</strong>
        </div>
        {previewMessages(f, answers).map((m, i) => (
          <div key={i} className="bubble">{m}</div>
        ))}
      </div>
      <button className="btn" onClick={next}>{step.cta}</button>
    </div>
  );
}

export function Info({ step, next }: Ctx & { step: StepOf<"info"> }) {
  return (
    <div className="screen">
      <div className="card stat">
        <b>{step.big}</b>
        <p className="headline">{step.headline}</p>
        <p className="lead">{step.text}</p>
        <span className="src">Source: {step.source}</span>
      </div>
      <button className="btn" onClick={next}>{step.cta}</button>
    </div>
  );
}

export function Loader({ step, f, answers, setAnswer, next }: Ctx & { step: StepOf<"loader"> }) {
  const [done, setDone] = useState(0);
  const [asking, setAsking] = useState(false);
  const answered = useRef(answers.memory !== undefined);

  // If the memory question is ignored for 8 s, carry on without an answer instead of waiting forever.
  useEffect(() => {
    if (!asking) return;
    const t = setTimeout(() => {
      answered.current = true;
      track("Micro Commitment Skipped");
      setAsking(false);
    }, 8000);
    return () => clearTimeout(t);
  }, [asking]);

  useEffect(() => {
    if (asking) return;
    if (done >= step.rows.length) {
      const t = setTimeout(next, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setDone((d) => d + 1);
      if (done === step.question.askAfterRow && !answered.current) setTimeout(() => setAsking(true), 500);
    }, 900);
    return () => clearTimeout(t);
  }, [done, asking, next, step]);

  return (
    <div className="screen">
      <h2>{step.title}</h2>
      {step.rows.map((r, i) => (
        <div key={r} className="lrow-wrap">
          <div className="lrow">
            <span>{r}</span>
            <span className="pct">{i < done ? "100%" : "…"}</span>
          </div>
          <div className="bar"><span style={{ width: i < done ? "100%" : "0%" }} /></div>
        </div>
      ))}
      {asking && (
        <div className="modal" role="dialog" aria-label="Quick question">
          <strong>{fill(step.question.text, f, answers)}</strong>
          <div className="grid2">
            {step.question.options.map((o) => (
              <button
                key={o.value}
                className="opt"
                onClick={() => {
                  answered.current = true;
                  setAnswer("memory", o.value);
                  track("Micro Commitment Answered", { memory: o.value });
                  setAsking(false);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Result({ step, f, answers, next, variant }: Ctx & { step: StepOf<"result">; variant: string }) {
  const name = companionName(f, answers);
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    trackOnce("result", "Result Viewed", { companion_name: name, result_variant: variant });
    const t = setTimeout(() => setTyping(false), 1300);
    return () => clearTimeout(t);
  }, [name, variant]);
  // The A/B difference is only the "why this match" block. Both variants show the first message.
  const explain = variant === "match_score";
  const tags = chips(f, answers);
  return (
    <div className="screen">
      <span className="eyebrow">{step.eyebrow}</span>
      <div className="card">
        <div className="who">
          <div className="ava" aria-hidden="true">{name[0]}</div>
          <h2>{name}</h2>
        </div>
        {explain && (
          <div className="explain" data-testid="match-explain">
            <strong>{step.scoreLabel.replace("{count}", String(matchedCount(answers)))}</strong>
            {tags.length > 0 && (
              <>
                <span className="src">{step.reasonsLabel}</span>
                <div className="chips">
                  {tags.map((t) => (
                    <span key={t} className="chip">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {typing ? (
          <div className="typing">{fill(step.typing, f, answers)}</div>
        ) : (
          <div className="bubble" data-testid="first-message">{firstMessage(f, answers)}</div>
        )}
      </div>
      <button className="btn" onClick={next}>{fill(step.cta, f, answers)}</button>
    </div>
  );
}

export function Email({ step, f, answers, next }: Ctx & { step: StepOf<"email"> }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="screen">
      <h2>{fill(step.title, f, answers)}</h2>
      <p className="lead">{step.subtitle}</p>
      <form
        className="opts"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const v = cleanEmail(value);
          if (!v) {
            setError(step.error);
            track("Email Error");
            return;
          }
          // Only the domain goes to analytics. The address itself is dropped here.
          track("Email Submitted", { email_domain: v.split("@")[1].toLowerCase() });
          setValue("");
          next();
        }}
      >
        <label className="eyebrow" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={step.placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
        />
        <p className="err" role="alert">{error}</p>
        <button className="btn" type="submit">{step.cta}</button>
      </form>
      <button
        className="link"
        onClick={() => {
          track("Email Skipped");
          next();
        }}
      >
        {step.skip}
      </button>
      <p className="note">{step.note}</p>
    </div>
  );
}

export function Paywall({ step, f, answers, setAnswer, next }: Ctx & { step: StepOf<"paywall"> }) {
  const [plan, setPlan] = useState(step.defaultPlan);
  useEffect(() => trackOnce("paywall", "Paywall Viewed", { default_plan: step.defaultPlan }), [step.defaultPlan]);
  return (
    <div className="screen">
      <h2>{fill(step.title, f, answers)}</h2>
      <div className="bubble wide">{firstMessage(f, answers)}</div>
      <div className="plans" role="radiogroup" aria-label="Plans">
        {step.plans.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={plan === p.id}
            className={`plan ${plan === p.id ? "sel" : ""}`}
            onClick={() => {
              setPlan(p.id);
              track("Plan Selected", { plan: p.id });
            }}
          >
            <span>
              {p.badge && <span className="tag">{p.badge}</span>}
              <strong>{p.label}</strong>
              <span className="src">{p.sub}</span>
            </span>
            <span className="price">{p.price}</span>
          </button>
        ))}
      </div>
      <button
        className="btn"
        data-testid="start"
        onClick={() => {
          track("Start Clicked", { plan });
          setAnswer("paywall_outcome", "start");
          next();
        }}
      >
        {step.cta}
      </button>
      <button
        className="link"
        data-testid="dismiss"
        onClick={() => {
          track("Paywall Dismissed", { plan });
          setAnswer("paywall_outcome", "dismiss");
          next();
        }}
      >
        {step.dismiss}
      </button>
      <p className="note">{step.cancelNote}</p>
      <div className="faq">
        {step.faq.map((x) => (
          <details key={x.q}>
            <summary>{fill(x.q, f, answers)}</summary>
            <p>{fill(x.a, f, answers)}</p>
          </details>
        ))}
      </div>
      <p className="note">{step.disclaimer}</p>
    </div>
  );
}

export function Finale({ step, answers }: Ctx & { step: StepOf<"finale"> }) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const toggle = (v: string) => setReasons((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v]));
  return (
    <div className="screen">
      <h2>{step.title}</h2>
      <p className="lead">{step.text}</p>
      {sent ? (
        <p className="ok" role="status">{step.thanks}</p>
      ) : (
        <form
          className="opts"
          onSubmit={(e) => {
            e.preventDefault();
            if (reasons.length === 0) return;
            track("Feedback Submitted", {
              reasons,
              paywall_outcome: typeof answers.paywall_outcome === "string" ? answers.paywall_outcome : undefined,
              comment: redact(comment.trim().slice(0, 500)) || undefined,
            });
            setSent(true);
          }}
        >
          <strong>{step.question}</strong>
          {step.reasons.map((r) => (
            <button
              type="button"
              key={r.value}
              className={`opt ${reasons.includes(r.value) ? "sel" : ""}`}
              aria-pressed={reasons.includes(r.value)}
              onClick={() => toggle(r.value)}
            >
              {r.label}
            </button>
          ))}
          <label className="sr" htmlFor="comment">{step.commentPlaceholder}</label>
          <textarea
            id="comment"
            rows={3}
            maxLength={500}
            placeholder={step.commentPlaceholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn" type="submit" disabled={reasons.length === 0}>{step.cta}</button>
        </form>
      )}
    </div>
  );
}
