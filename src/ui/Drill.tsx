import { useState } from 'react';
import { EMPTY, answer, currentValue, evaluate, visibleQuestions } from '../core';
import type { Profile, Question } from '../core';
import type { ScreenProps } from './App';

export function Drill({ saved, update }: ScreenProps) {
  const [p, setP] = useState<Profile>(saved.profile && !saved.sample ? saved.profile : EMPTY);
  const [touched, setTouched] = useState<Set<string>>(() => new Set(saved.profile && !saved.sample ? visibleQuestions(saved.profile).map((q) => q.id) : []));
  const [error, setError] = useState('');
  const questions = visibleQuestions(p);

  const pick = (q: Question, value: string, checked: boolean) => {
    let next: string | string[] = value;
    if (q.kind === 'many') {
      const now = currentValue(p, q);
      if (value === q.none) next = checked ? [value] : [];
      else next = checked ? [...now.filter((v) => v !== q.none), value] : now.filter((v) => v !== value);
    }
    setP(answer(p, q, next));
    setTouched(new Set(touched).add(q.id));
    setError('');
  };

  const finish = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const missing = questions.find((q) => !touched.has(q.id));
    if (missing) {
      setError(`Answer question ${questions.indexOf(missing) + 1} first.`);
      document.getElementById(`q-${missing.id}`)?.scrollIntoView({ block: 'center' });
      document.querySelector<HTMLElement>(`#q-${missing.id} input`)?.focus();
      return;
    }
    if (p.carriers.length === 0) { setError('Choose at least one line in question 2.'); return; }
    const ev = evaluate(p);
    update({
      ...saved, profile: p, sample: false,
      first: saved.first && !saved.sample ? saved.first : { ready: ev.ready, applicable: ev.applicable, findings: ev.findings.length, at: new Date().toISOString() },
    });
    window.location.hash = '#/result';
  };

  return (
    <form onSubmit={finish} noValidate>
      <h1 tabIndex={-1}>The drill</h1>
      <p>Answer for the phone in your pocket today. Nothing you choose leaves this device. Never type a PIN, password or ID number here: the drill does not ask for one.</p>
      {questions.map((q, i) => {
        const now = touched.has(q.id) ? currentValue(p, q) : [];
        const noneOn = q.kind === 'many' && touched.has(q.id) && now.length === 0;
        return (
          <fieldset key={q.id} id={`q-${q.id}`}>
            <legend>{i + 1}. {q.text(p)}</legend>
            {q.help && <p className="muted">{q.help(p)}</p>}
            {q.options(p).map((o) => (
              <label className="opt" key={o.value}>
                <input
                  type={q.kind === 'many' ? 'checkbox' : 'radio'} name={q.id} value={o.value}
                  checked={o.value === q.none ? noneOn : now.includes(o.value)}
                  onChange={(e) => pick(q, o.value, (e.currentTarget as HTMLInputElement).checked)}
                />
                {o.label}
              </label>
            ))}
          </fieldset>
        );
      })}
      <p role="alert" className="status blocked">{error}</p>
      <button className="btn primary" type="submit">See my result</button>
    </form>
  );
}
