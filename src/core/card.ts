import { evaluate } from './evaluate';
import { encodeGo } from './golink';
import { findProvider, getPack } from './packs';
import { buildPlan } from './plan';
import type { Saved } from './storage';
import type { Profile, Provider } from './types';

// The printable wallet card, built from the drill. It never holds a secret:
// no PIN, password, ID number, email, the owner's own number or their name.
export interface CardData {
  steps: string[]; // the first-hour steps, short, in the same order as the plan
  site: string; // "<host>/#/go/ke.a.saf.eq-kcb"
  rows: Array<{ name: string; numbers: string[] }>; // carriers then banks, for the back
  emergency?: string; // "999 or 112"
  contact?: string; // trusted person's number, if the owner typed one
  imei?: string; // the phone's IMEI, if the owner typed one
  checked: string; // "14 Nov 2026" — the oldest check date among the numbers on the card
  dropped: number; // providers that did not fit on the card
}

// One short line per plan step, so the card reads in the same order as the on-screen plan.
const STEP_LINE: Record<string, string> = {
  safe: 'Get safe. Borrow a phone.',
  'lock-phone': 'Lock it: google.com/android/find (or icloud.com/find for an iPhone)',
  'block-line': 'Call carrier: block SIM and mobile money',
  'freeze-bank': 'Call bank: block mobile banking',
  'secure-account': 'Change account password',
  'warn-contact': 'Warn one person you trust',
};

const MAX_ROWS = 5; // a credit-card back only holds so much; the rest go on by hand

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Turn an ISO date ("2026-11-14") into a card date ("14 Nov 2026"). */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function cardData(p: Profile, card: Saved['card'], host: string): CardData {
  const pack = getPack(p.country);

  // Front: the first-hour steps, in the order the plan put them for this person.
  const steps = buildPlan(p, evaluate(p))
    .filter((s) => s.firstHour)
    .map((s) => STEP_LINE[s.id])
    .filter((line): line is string => !!line);

  // Back: carriers first, then banks; at most two any-network numbers each; at most five rows.
  const chosen = [...p.carriers, ...p.banks]
    .map((id) => findProvider(pack, id))
    .filter((pr): pr is Provider => !!pr);
  const kept = chosen.slice(0, MAX_ROWS);
  const rows = kept.map((pr) => ({ name: pr.name, numbers: pr.anyLine.slice(0, 2).map((l) => l.display) }));

  // The oldest date among the numbers actually printed, so the card never claims a fresher check than it has.
  const dates = (kept.length ? kept.map((pr) => pr.source.checked) : pack.emergency ? [pack.emergency.source.checked] : []).sort();

  const contact = card.contact.trim();
  const imei = card.imei.trim();

  return {
    steps,
    site: `${host}/#/go/${encodeGo(p)}`,
    rows,
    emergency: pack.emergency?.display,
    contact: contact || undefined,
    imei: imei || undefined,
    checked: formatDate(dates[0] ?? ''),
    dropped: chosen.length - kept.length,
  };
}
