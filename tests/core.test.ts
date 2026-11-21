import { describe, expect, it } from 'vitest';
import {
  EMPTY, OTHER_BANK, OTHER_CARRIER, PACKS, QUESTIONS, SAMPLE,
  accountAccess, answer, applyFix, buildPlan, cardData, currentValue, decodeGo, encodeGo, evaluate, visibleQuestions,
} from '../src/core';
import type { Profile } from '../src/core';

const status = (p: Profile, id: string) => evaluate(p).actions.find((a) => a.id === id)!.status;

describe('data pack', () => {
  const ke = PACKS.ke.providers;
  it('has three carriers and six banks for Kenya', () => {
    expect(ke.filter((p) => p.kind === 'carrier').map((p) => p.id)).toEqual(['safaricom', 'airtel', 'telkom']);
    expect(ke.filter((p) => p.kind === 'bank')).toHaveLength(6);
  });
  it('gives every provider a number that works from any network', () => {
    for (const p of ke) expect(p.anyLine.length, p.id).toBeGreaterThan(0);
  });
  it('has dialable tel values and an https source with a date on every provider', () => {
    for (const p of ke) {
      for (const l of [...p.anyLine, ...(p.ownLine ?? [])]) expect(l.tel, `${p.id} ${l.display}`).toMatch(/^(\+254\d{9}|0800\d{6}|\d{3})$/);
      expect(p.source.url).toMatch(/^https:\/\//);
      expect(p.source.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('shows the same digits a person reads as the phone dials', () => {
    for (const p of ke) for (const l of p.anyLine) {
      const shown = l.display.replace(/\D/g, '');
      const dialled = l.tel.replace('+254', '0').replace(/\D/g, '');
      expect(dialled, `${p.id} ${l.display}`).toBe(shown);
    }
  });
  it('has unique ids and go-link codes', () => {
    expect(new Set(ke.map((p) => p.id)).size).toBe(ke.length);
    expect(new Set(ke.map((p) => p.code)).size).toBe(ke.length);
  });
});

describe('the sample person', () => {
  const before = evaluate(SAMPLE);
  it('can do 1 of 5 first-hour actions before any fix', () => {
    expect(before.applicable).toBe(5);
    expect(before.ready).toBe(1);
    expect(before.actions.map((a) => a.status)).toEqual(['blocked', 'later', 'later', 'blocked', 'ready']);
  });
  it('gets eight findings, critical ones first', () => {
    expect(before.findings.map((f) => f.id)).toEqual([
      'pins-on-phone', 'password-unknown', 'second-step-loop',
      'finder-off', 'sim-pin-off', 'previews-on', 'numbers-on-phone-only',
      'imei-not-saved',
    ]);
    expect(before.findings.map((f) => f.severity)).toEqual(['critical', 'critical', 'critical', 'high', 'high', 'high', 'high', 'medium']);
  });
  it('shows the sign-in loop as four linked parts', () => {
    const loop = before.findings.find((f) => f.id === 'second-step-loop')!;
    expect(loop.loop).toEqual(['Phone gone', 'Sign in to Find Hub', 'Code needed', 'Code goes to the stolen SIM']);
  });
  it('reaches 5 of 5 and no findings once every fix is applied', () => {
    let p = SAMPLE;
    for (const f of before.findings) p = applyFix(f.id, p);
    const after = evaluate(p);
    expect(after.ready).toBe(5);
    expect(after.findings).toHaveLength(0);
  });
  it('improves or holds on every single fix, never gets worse', () => {
    for (const f of before.findings) expect(evaluate(applyFix(f.id, SAMPLE)).ready).toBeGreaterThanOrEqual(before.ready);
  });
});

describe('account access', () => {
  const base: Profile = { ...EMPTY, carriers: ['safaricom'], findOn: 'yes', numbersOffPhone: true };
  it('is ready with a password and no second step', () => {
    expect(accountAccess({ ...base, secondSteps: [] }).status).toBe('ready');
  });
  it('is ready when backup codes exist beside SMS', () => {
    expect(accountAccess({ ...base, secondSteps: ['sms', 'codes'] }).status).toBe('ready');
  });
  it('waits for a replacement SIM when SMS is the only second step', () => {
    const r = accountAccess({ ...base, secondSteps: ['sms'] });
    expect(r.status).toBe('later');
    expect(r.reason).toContain('replacement SIM');
  });
  it('is blocked when the only second step is an app or prompt on the phone', () => {
    expect(accountAccess({ ...base, secondSteps: ['app'] }).status).toBe('blocked');
    expect(accountAccess({ ...base, secondSteps: ['prompt'] }).status).toBe('blocked');
  });
  it('falls back to the other device when there is one', () => {
    expect(accountAccess({ ...base, secondSteps: ['app'], otherDevice: true }).status).toBe('later');
    expect(accountAccess({ ...base, passwordKnown: false, otherDevice: true }).status).toBe('later');
  });
  it('is blocked with no password and no other device', () => {
    expect(accountAccess({ ...base, passwordKnown: false }).status).toBe('blocked');
  });
});

describe('remote lock', () => {
  const base: Profile = { ...EMPTY, carriers: ['safaricom'], findOn: 'yes' };
  it('needs only the password on an iPhone, even with SMS as the second step', () => {
    expect(status({ ...base, os: 'iphone', secondSteps: ['sms'] }, 'lock-phone')).toBe('ready');
  });
  it('follows account access on Android', () => {
    expect(status({ ...base, secondSteps: ['sms'] }, 'lock-phone')).toBe('later');
    expect(status({ ...base, secondSteps: ['sms', 'codes'] }, 'lock-phone')).toBe('ready');
  });
  it('is blocked when the finder is off or unchecked', () => {
    expect(status({ ...base, findOn: 'no' }, 'lock-phone')).toBe('blocked');
    expect(status({ ...base, findOn: 'unsure' }, 'lock-phone')).toBe('blocked');
  });
  it('does not apply to a button phone, and the total shrinks', () => {
    const ev = evaluate({ ...base, os: 'other' });
    expect(ev.actions[0].status).toBe('na');
    expect(ev.applicable).toBe(3); // no lock, no bank
    expect(ev.findings.some((f) => f.id === 'finder-off')).toBe(false);
  });
});

describe('calls', () => {
  const base: Profile = { ...EMPTY, carriers: ['safaricom'], banks: ['kcb'] };
  it('needs the number off the phone and the ID number', () => {
    expect(status({ ...base, numbersOffPhone: true, idKnown: true }, 'block-line')).toBe('ready');
    expect(status({ ...base, numbersOffPhone: false, idKnown: true }, 'block-line')).toBe('later');
    expect(status({ ...base, numbersOffPhone: true, idKnown: false }, 'freeze-bank')).toBe('later');
  });
  it('skips the bank action when no bank is chosen', () => {
    expect(status({ ...base, banks: [] }, 'freeze-bank')).toBe('na');
  });
});

describe('plan', () => {
  const input = { country: 'ke', os: 'android' as const, carriers: ['safaricom'], banks: ['equity', 'kcb'] };
  const ids = (steps: ReturnType<typeof buildPlan>) => steps.map((s) => s.id);
  it('puts the lock before the carrier call when nothing is known about the owner', () => {
    expect(ids(buildPlan(input))).toEqual(['safe', 'lock-phone', 'block-line', 'freeze-bank', 'secure-account', 'warn-contact', 'police', 'replace-sim', 'erase']);
  });
  it('moves the lock after the calls when the drill says the owner cannot sign in yet', () => {
    expect(ids(buildPlan(SAMPLE, evaluate(SAMPLE))).slice(0, 4)).toEqual(['safe', 'block-line', 'freeze-bank', 'lock-phone']);
  });
  it('keeps the lock first once the owner is ready', () => {
    let p = SAMPLE;
    for (const f of evaluate(SAMPLE).findings) p = applyFix(f.id, p);
    expect(ids(buildPlan(p, evaluate(p)))[1]).toBe('lock-phone');
  });
  it('lists the any-network numbers first for each carrier and bank', () => {
    const steps = buildPlan(input);
    const block = steps.find((s) => s.id === 'block-line')!;
    expect(block.lines![0]).toMatchObject({ provider: 'Safaricom', tel: '+254722002100' });
    expect(block.title).toContain('M-PESA');
    const bank = steps.find((s) => s.id === 'freeze-bank')!;
    expect(bank.lines!.map((l) => l.provider)).toContain('KCB Bank');
    expect(bank.lines![0].tel).toBe('+254763000000');
  });
  it('gives the police emergency number for Kenya', () => {
    expect(buildPlan(input)[0].lines![0].tel).toBe('999');
  });
  it('drops lock and erase for a button phone and the bank step with no bank', () => {
    expect(ids(buildPlan({ country: 'ke', os: 'other', carriers: ['airtel'], banks: [] }))).toEqual(['safe', 'block-line', 'secure-account', 'warn-contact', 'police', 'replace-sim']);
  });
  it('tells people where to find the number when the carrier is not in the pack', () => {
    const block = buildPlan({ country: 'xx', os: 'iphone', carriers: [OTHER_CARRIER], banks: [OTHER_BANK] }).find((s) => s.id === 'block-line')!;
    expect(block.lines).toHaveLength(0);
    expect(block.detail).toContain('official website');
  });
  it('marks exactly the first six kinds of step as first-hour', () => {
    expect(buildPlan(input).filter((s) => s.firstHour).map((s) => s.id)).toEqual(['safe', 'lock-phone', 'block-line', 'freeze-bank', 'secure-account', 'warn-contact']);
  });
});

describe('go-link', () => {
  it('encodes the sample as a short code with no personal data', () => {
    expect(encodeGo(SAMPLE)).toBe('ke.a.saf.eq-kcb');
  });
  it('round-trips', () => {
    const input = { country: 'ke', os: 'iphone' as const, carriers: ['airtel', 'telkom'], banks: [OTHER_BANK] };
    expect(decodeGo(encodeGo(input))).toEqual(input);
  });
  it('uses x for none', () => {
    expect(encodeGo({ country: 'ke', os: 'other', carriers: ['safaricom'], banks: [] })).toBe('ke.o.saf.x');
    expect(decodeGo('ke.o.saf.x')!.banks).toEqual([]);
  });
  it('accepts capitals and stray spaces, and ignores unknown codes', () => {
    expect(decodeGo('  KE.A.SAF-zzz.EQ ')).toEqual({ country: 'ke', os: 'android', carriers: ['safaricom'], banks: ['equity'] });
  });
  it('rejects text that is not a go code', () => {
    expect(decodeGo('hello')).toBeNull();
    expect(decodeGo('ke.q.saf.x')).toBeNull();
  });
  it('falls back to the generic pack for an unknown country', () => {
    expect(decodeGo('zz.a.x.x')!.country).toBe('xx');
  });
});

describe('wallet card', () => {
  const noExtras = { contact: '', imei: '' };
  it('builds the sample front in plan order: six steps, the carrier call second', () => {
    const d = cardData(SAMPLE, noExtras, 'phoneless-prod.vercel.app');
    expect(d.steps).toHaveLength(6);
    expect(d.steps[0]).toBe('Get safe. Borrow a phone.');
    expect(d.steps[1]).toBe('Call carrier: block SIM and mobile money');
  });
  it('writes the plan code and the checked date onto the card', () => {
    const d = cardData(SAMPLE, noExtras, 'phoneless-prod.vercel.app');
    expect(d.site).toBe('phoneless-prod.vercel.app/#/go/ke.a.saf.eq-kcb');
    expect(d.checked).toBe('14 Nov 2026');
  });
  it('lists carriers first with up to two any-network numbers each', () => {
    const d = cardData(SAMPLE, noExtras, 'x');
    expect(d.rows[0]).toEqual({ name: 'Safaricom', numbers: ['0722 002 100', '0722 002 200'] });
    expect(d.rows.map((r) => r.name)).toEqual(['Safaricom', 'Equity Bank', 'KCB Bank']);
    expect(d.emergency).toBe('999 or 112');
    expect(d.dropped).toBe(0);
  });
  it('keeps five rows and reports the rest when there are too many providers', () => {
    const many: Profile = { ...SAMPLE, carriers: ['safaricom', 'airtel', 'telkom'], banks: ['equity', 'kcb', 'coop', 'absa', 'ncba', 'stanbic'] };
    const d = cardData(many, noExtras, 'x');
    expect(d.rows).toHaveLength(5);
    expect(d.dropped).toBe(4);
  });
  it('leaves out an empty contact and IMEI, and trims what is typed', () => {
    expect(cardData(SAMPLE, { contact: '', imei: '' }, 'x').contact).toBeUndefined();
    expect(cardData(SAMPLE, { contact: '', imei: '' }, 'x').imei).toBeUndefined();
    const d = cardData(SAMPLE, { contact: ' 0700 000 000 ', imei: ' 350000000000000 ' }, 'x');
    expect(d.contact).toBe('0700 000 000');
    expect(d.imei).toBe('350000000000000');
  });
});

describe('questions', () => {
  it('asks 15 questions, 14 for a button phone', () => {
    expect(visibleQuestions(SAMPLE)).toHaveLength(15);
    expect(visibleQuestions({ ...SAMPLE, os: 'other' })).toHaveLength(14);
  });
  it('covers every stored answer exactly once', () => {
    const asked = QUESTIONS.map((q) => q.id).sort();
    const stored = Object.keys(SAMPLE).filter((k) => k !== 'v' && k !== 'country').sort();
    expect(asked).toEqual(stored);
  });
  it('stores yes and no as booleans and reads them back', () => {
    const q = QUESTIONS.find((x) => x.id === 'screenLock')!;
    const p = answer(SAMPLE, q, 'no');
    expect(p.screenLock).toBe(false);
    expect(currentValue(p, q)).toEqual(['no']);
  });
  it('drops "none" from a multiple answer', () => {
    const q = QUESTIONS.find((x) => x.id === 'banks')!;
    expect(answer(SAMPLE, q, ['none']).banks).toEqual([]);
    expect(answer(SAMPLE, q, ['kcb', 'none']).banks).toEqual(['kcb']);
  });
  it('offers every carrier in the pack plus "another carrier"', () => {
    const q = QUESTIONS.find((x) => x.id === 'carriers')!;
    expect(q.options(SAMPLE).map((o) => o.value)).toEqual(['safaricom', 'airtel', 'telkom', OTHER_CARRIER]);
  });
});
