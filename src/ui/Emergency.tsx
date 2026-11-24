import { useState } from 'react';
import { OTHER_BANK, OTHER_CARRIER, buildPlan, decodeGo, encodeGo, evaluate, getPack, providersOf } from '../core';
import type { OS, PlanInput } from '../core';
import type { ScreenProps } from './App';

interface Props extends ScreenProps { code?: string }

export function Emergency({ saved, code }: Props) {
  const fromLink = code ? decodeGo(code) : null;
  const own = !code && saved.profile ? saved.profile : null;
  const [picked, setPicked] = useState<PlanInput | null>(fromLink ?? own);
  const [done, setDone] = useState<Set<string>>(new Set());

  if (code && !fromLink) {
    return (<><h1 tabIndex={-1}>That code is not a Phoneless plan</h1><p>Check the code on the card and type it again, or choose your phone and carrier below.</p><a className="btn primary" href="#/emergency">Choose by hand</a></>);
  }
  if (!picked) return <Picker onDone={setPicked} />;

  const ev = own ? evaluate(own) : undefined;
  const steps = buildPlan(picked, ev);
  const notReady = ev ? ev.actions.filter((a) => a.status === 'later' || a.status === 'blocked') : [];
  const toggle = (id: string) => { const n = new Set(done); n.has(id) ? n.delete(id) : n.add(id); setDone(n); };

  return (
    <>
      <h1 tabIndex={-1}>Phone gone: do these in order</h1>
      <p className="muted">Plan code: <strong>{encodeGo(picked)}</strong>. {own ? 'Built from your drill.' : 'Built from the code or your choices, not from a drill.'} <button className="btn" onClick={() => setPicked(null)}>Change</button></p>
      {notReady.length > 0 && (
        <div className="card not-ready">
          <h2>Not possible right away</h2>
          <p>From your drill, these will not work yet. Do not lose minutes on them; the plan below works around them.</p>
          <ul>
            {notReady.map((a) => (
              <li key={a.id}><strong>{a.title}: {a.status === 'later' ? 'later' : 'blocked'}.</strong> {a.reason}</li>
            ))}
          </ul>
        </div>
      )}
      <h2>In the first hour</h2>
      <ol className="steps">
        {steps.filter((s) => s.firstHour).map((s) => <Step key={s.id} s={s} done={done.has(s.id)} toggle={toggle} />)}
      </ol>
      <h2>After that</h2>
      <ol className="steps" start={steps.filter((s) => s.firstHour).length + 1}>
        {steps.filter((s) => !s.firstHour).map((s) => <Step key={s.id} s={s} done={done.has(s.id)} toggle={toggle} />)}
      </ol>
      <p className="muted">Phoneless cannot block or lock anything for you. It gives the order and the numbers. Numbers were checked against each provider’s own page on the date shown on the About page.</p>
    </>
  );
}

function Step({ s, done, toggle }: { s: ReturnType<typeof buildPlan>[number]; done: boolean; toggle: (id: string) => void }) {
  return (
    <li className={done ? 'done' : undefined}>
      <h3>{s.title}</h3>
      <p>{s.detail}</p>
      {s.say && <blockquote className="say"><strong>Say:</strong> “{s.say}”</blockquote>}
      {s.lines?.map((l) => (
        <a className="tel" key={l.provider + l.tel + l.label} href={`tel:${l.tel}`}>
          <span>{l.provider}: {l.label}</span><span className="num">{l.display}</span>
        </a>
      ))}
      {s.link && <p><a className="btn" href={s.link.url} target="_blank" rel="noreferrer">Open {s.link.label}</a></p>}
      {s.source && <p className="src"><a href={s.source} target="_blank" rel="noreferrer">Source</a></p>}
      <label className="opt"><input type="checkbox" checked={done} onChange={() => toggle(s.id)} /> Done</label>
    </li>
  );
}

function Picker({ onDone }: { onDone: (p: PlanInput) => void }) {
  const pack = getPack('ke');
  const [os, setOs] = useState<OS>('android');
  const [carriers, setCarriers] = useState<string[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const flip = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onDone({ country: 'ke', os, carriers, banks }); }}>
      <h1 tabIndex={-1}>Phone gone: three quick choices</h1>
      <p>If you have a Phoneless card, type its code after <strong>#/go/</strong> in the address bar instead.</p>
      <fieldset>
        <legend>The stolen phone was</legend>
        {(['android', 'iphone', 'other'] as OS[]).map((v) => (
          <label className="opt" key={v}><input type="radio" name="os" checked={os === v} onChange={() => setOs(v)} />{v === 'android' ? 'Android' : v === 'iphone' ? 'iPhone' : 'A button phone or something else'}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Lines in it</legend>
        {[...providersOf(pack, 'carrier').map((c) => ({ id: c.id, name: c.name })), { id: OTHER_CARRIER, name: 'Another carrier' }].map((c) => (
          <label className="opt" key={c.id}><input type="checkbox" checked={carriers.includes(c.id)} onChange={() => flip(carriers, setCarriers, c.id)} />{c.name}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Banks reached from it</legend>
        {[...providersOf(pack, 'bank').map((b) => ({ id: b.id, name: b.name })), { id: OTHER_BANK, name: 'Another bank' }].map((b) => (
          <label className="opt" key={b.id}><input type="checkbox" checked={banks.includes(b.id)} onChange={() => flip(banks, setBanks, b.id)} />{b.name}</label>
        ))}
      </fieldset>
      <button className="btn danger" type="submit">Show the plan</button>
    </form>
  );
}
