import { Fragment, useState } from 'react';
import { applyFix, cardData } from '../core';
import type { ScreenProps } from './App';

// The wallet card: two faces to print, plus two optional fields the owner can add.
// Nothing here leaves the device. The card never carries a PIN, password, ID number or name.
export function Card({ saved, update }: ScreenProps) {
  const p = saved.profile;
  const [contact, setContact] = useState(saved.card.contact);
  const [imei, setImei] = useState(saved.card.imei);

  if (!p) {
    return (
      <>
        <h1 tabIndex={-1}>Your wallet card</h1>
        <p>Do the drill first so the card has your carrier and bank on it.</p>
        <a className="btn primary" href="#/drill">Start the drill</a>
      </>
    );
  }

  const host = typeof location !== 'undefined' ? location.host : '';
  const data = cardData(p, { contact, imei }, host);
  const imeiDigits = imei.replace(/\s/g, '');
  const imeiHint = imeiDigits.length > 0 && imeiDigits.length !== 15 ? `An IMEI has 15 digits. You typed ${imeiDigits.length}.` : '';

  const setCard = (nextContact: string, nextImei: string) => {
    setContact(nextContact);
    setImei(nextImei);
    update({ ...saved, card: { contact: nextContact, imei: nextImei } });
  };

  const printed = () => {
    let next = applyFix('numbers-on-phone-only', p);
    if (imeiDigits.length > 0) next = applyFix('imei-not-saved', next);
    update({ ...saved, profile: next, card: { contact, imei } });
    window.location.hash = '#/result';
  };

  return (
    <>
      <h1 tabIndex={-1}>Your wallet card</h1>
      <p>Print this, cut it out and keep it behind your ID — not in the same case as the phone. It is the one copy of your plan and numbers that is not on the phone.</p>

      <div className="no-print">
        <div className="field">
          <label htmlFor="contact">A trusted person’s number (optional)</label>
          <input id="contact" type="tel" inputMode="tel" autoComplete="off" value={contact}
            onInput={(e) => setCard((e.currentTarget as HTMLInputElement).value, imei)} />
        </div>
        <div className="field">
          <label htmlFor="imei">This phone’s IMEI (optional)</label>
          <input id="imei" inputMode="numeric" autoComplete="off" value={imei}
            onInput={(e) => setCard(contact, (e.currentTarget as HTMLInputElement).value)} />
          {imeiHint && <p className="muted" role="status">{imeiHint}</p>}
        </div>
        <p className="muted">These two stay on this device and on the paper you print. Do not add your ID number, a PIN or a password.</p>
      </div>

      <div className="cards" role="group" aria-label="Your wallet card, front and back">
        <section className="face" aria-label="Card front">
          <h2>If this phone is gone</h2>
          <ol>{data.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <p className="site">{data.site}</p>
        </section>
        <section className="face" aria-label="Card back">
          <h2>Numbers from any phone</h2>
          <dl>
            {data.rows.map((r) => (
              <Fragment key={r.name}>
                <dt>{r.name}</dt>
                <dd>{r.numbers.join(', ')}</dd>
              </Fragment>
            ))}
            {data.emergency && (<><dt>Police</dt><dd>{data.emergency}</dd></>)}
            {data.contact && (<><dt>Trusted</dt><dd>{data.contact}</dd></>)}
            {data.imei && (<><dt>IMEI</dt><dd>{data.imei}</dd></>)}
          </dl>
          <p className="site">Numbers checked {data.checked}</p>
        </section>
      </div>

      {data.dropped > 0 && (
        <p className="muted no-print">{data.dropped} more did not fit on the card. Write them on the back by hand.</p>
      )}

      <div className="row no-print">
        <button className="btn primary" onClick={() => window.print()}>Print the card</button>
        <button className="btn" onClick={printed}>I have printed it and it is in my wallet</button>
      </div>
    </>
  );
}
