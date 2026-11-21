import { SAMPLE_NAME, applyFix, evaluate } from '../core';
import type { Status } from '../core';
import type { ScreenProps } from './App';

const WORD: Record<Status, string> = { ready: '✓ Ready', later: '◷ Later', blocked: '✗ Blocked', na: 'Not needed' };

export function Result({ saved, update }: ScreenProps) {
  if (!saved.profile) {
    return (<><h1 tabIndex={-1}>No result yet</h1><p>Do the drill first, or try the sample person on the home page.</p><a className="btn primary" href="#/drill">Start the drill</a></>);
  }
  const p = saved.profile;
  const ev = evaluate(p);
  const open = ev.findings.filter((f) => !saved.dismissed.includes(f.id));
  const first = saved.first;
  const changed = first && (first.ready !== ev.ready || first.findings !== ev.findings.length);

  return (
    <>
      <h1 tabIndex={-1}>Your result</h1>
      {saved.sample && <p className="card">You are looking at {SAMPLE_NAME}. <a href="#/drill">Do the drill for yourself.</a></p>}
      <p className="score" aria-live="polite">You could do {ev.ready} of {ev.applicable} first-hour actions.</p>
      {changed && first && <p>When you first took the drill it was {first.ready} of {first.applicable}, with {first.findings} things to fix.</p>}
      <p className="muted">Ready means you could do it within minutes from a borrowed phone, with nothing looked up. Later means you must first reach something you do not have with you. Blocked means it cannot be done as things stand.</p>

      <h2>The first hour</h2>
      <ul className="plain">
        {ev.actions.filter((a) => a.status !== 'na').map((a) => (
          <li className="card" key={a.id}>
            <h3>{a.title} <span className={`status ${a.status}`}>{WORD[a.status]}</span></h3>
            <p>{a.reason}</p>
          </li>
        ))}
      </ul>

      <h2>{open.length === 0 ? 'Nothing left to fix' : `${open.length} thing${open.length === 1 ? '' : 's'} to fix, most urgent first`}</h2>
      <ul className="plain">
        {open.map((f) => (
          <li className="card" key={f.id}>
            <p className={`sev ${f.severity}`}>{f.severity}</p>
            <h3>{f.title}</h3>
            <p>{f.why}</p>
            {f.loop.length > 0 && <ol className="loop" aria-label="The loop you would be stuck in">{f.loop.map((x) => <li key={x}>{x}</li>)}</ol>}
            <p><strong>Fix it in about {f.minutes} minutes</strong></p>
            <ol>{f.fix.map((s) => <li key={s}>{s}</li>)}</ol>
            {f.source && <p className="src"><a href={f.source} target="_blank" rel="noreferrer">Where these steps come from</a></p>}
            <div className="row">
              <button className="btn primary" onClick={() => update({ ...saved, profile: applyFix(f.id, p) })}>I fixed this</button>
              <button className="btn" onClick={() => update({ ...saved, dismissed: [...saved.dismissed, f.id] })}>This does not apply to me</button>
            </div>
          </li>
        ))}
      </ul>
      {saved.dismissed.length > 0 && (
        <p><button className="btn" onClick={() => update({ ...saved, dismissed: [] })}>Show the {saved.dismissed.length} I set aside</button></p>
      )}
      <div className="row">
        <a className="btn primary" href="#/card">Make my wallet card</a>
        <a className="btn" href="#/emergency">See my plan</a>
      </div>
      <p className="muted">This result comes from your answers. Phoneless cannot see your phone or check your settings, so it can be wrong. If a finding does not fit you, set it aside.</p>
    </>
  );
}
