import { SAMPLE, SAMPLE_NAME, evaluate } from '../core';
import type { ScreenProps } from './App';

// Gzipped size of the whole build, rounded up, from `npm run build` (TOTAL line).
// The e2e checks it against the real dist/ so it cannot go stale.
const APP_KB = 26;

export function Home({ saved, update }: ScreenProps) {
  const trySample = () => {
    const ev = evaluate(SAMPLE);
    update({
      profile: SAMPLE, sample: true, dismissed: [], card: { contact: '', imei: '' },
      first: { ready: ev.ready, applicable: ev.applicable, findings: ev.findings.length, at: new Date().toISOString() },
    });
    window.location.hash = '#/result';
  };
  return (
    <>
      <h1 tabIndex={-1}>If your phone were snatched right now, what could you still do?</h1>
      <p className="lead">Take a two-minute drill. See which first-hour actions you would be locked out of, fix them, and leave with a wallet card that is not on your phone.</p>
      <div className="row">
        <a className="btn primary" href="#/drill">{saved.profile && !saved.sample ? 'Redo the drill' : 'Start the drill'}</a>
        <button className="btn" onClick={trySample}>Try with a sample person</button>
        <a className="btn danger" href="#/emergency">My phone is gone now</a>
      </div>
      <p className="muted size-line">The whole app is {APP_KB} KB, so it loads on a weak signal and keeps working offline once opened.</p>
      <h2>Try it in two minutes</h2>
      <ol>
        <li>Choose <strong>Try with a sample person</strong>. {SAMPLE_NAME} can do 1 of 5 first-hour actions.</li>
        <li>Read why the remote lock is blocked: the sign-in code goes to the stolen phone.</li>
        <li>Choose <strong>I fixed this</strong> on each finding and watch the count reach 5 of 5.</li>
        <li>Open <strong>Phone gone now</strong> to see the ordered plan with the real numbers.</li>
        <li>Turn your network off and reload. Everything still works.</li>
      </ol>
      <p className="muted">No account. No server. Nothing you answer leaves this device.</p>
    </>
  );
}
