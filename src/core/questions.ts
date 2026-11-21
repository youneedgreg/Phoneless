import { accountName, finderName } from './evaluate';
import { OTHER_BANK, OTHER_CARRIER, getPack, providersOf } from './packs';
import type { Profile } from './types';

export interface Option { value: string; label: string }
export interface Question {
  id: keyof Profile;
  kind: 'one' | 'many';
  text: (p: Profile) => string;
  help?: (p: Profile) => string;
  options: (p: Profile) => Option[];
  /** For 'many': a value that clears the others when picked, e.g. "None". */
  none?: string;
  /** Stored as boolean: 'yes' -> true, anything else -> false. */
  bool?: boolean;
  skip?: (p: Profile) => boolean;
}

const YES_NO: Option[] = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
const YES_NO_UNSURE: Option[] = [...YES_NO, { value: 'unsure', label: 'Not sure' }];

export const QUESTIONS: Question[] = [
  {
    id: 'os', kind: 'one', text: () => 'What phone do you carry?',
    options: () => [
      { value: 'android', label: 'Android' },
      { value: 'iphone', label: 'iPhone' },
      { value: 'other', label: 'A button phone or something else' },
    ],
  },
  {
    id: 'carriers', kind: 'many', text: () => 'Which lines are in it?',
    options: (p) => [
      ...providersOf(getPack(p.country), 'carrier').map((c) => ({ value: c.id, label: c.wallet ? `${c.name} (${c.wallet})` : c.name })),
      { value: OTHER_CARRIER, label: 'Another carrier' },
    ],
  },
  {
    id: 'banks', kind: 'many', none: 'none',
    text: () => 'Which banks do you reach from this phone?',
    help: () => 'Count a bank if its app is on the phone or its codes come by SMS to this line.',
    options: (p) => [
      ...providersOf(getPack(p.country), 'bank').map((b) => ({ value: b.id, label: b.name })),
      { value: OTHER_BANK, label: 'Another bank' },
      { value: 'none', label: 'None' },
    ],
  },
  {
    id: 'screenLock', kind: 'one', bool: true,
    text: () => 'Does the phone need a PIN, pattern, fingerprint or face to open?', options: () => YES_NO,
  },
  {
    id: 'simPin', kind: 'one',
    text: () => 'Is a SIM PIN turned on?',
    help: () => 'If it is, the phone asks for a SIM PIN every time it restarts. This is not your screen lock and not your mobile money PIN.',
    options: () => YES_NO_UNSURE,
  },
  {
    id: 'previews', kind: 'one',
    text: () => 'When a text arrives while the phone is locked, can you read it on the screen?', options: () => YES_NO_UNSURE,
  },
  {
    id: 'findOn', kind: 'one', skip: (p) => p.os === 'other',
    text: (p) => `Is ${finderName(p.os)} turned on?`,
    help: (p) => p.os === 'iphone' ? 'Settings, your name, Find My.' : 'Settings, Security, Find Hub. It used to be called Find My Device.',
    options: () => YES_NO_UNSURE,
  },
  {
    id: 'passwordKnown', kind: 'one', bool: true,
    text: (p) => `Could you type your ${accountName(p.os)} password right now, from memory?`,
    help: () => 'Answer No if it is only saved in the phone or its password manager.',
    options: () => YES_NO,
  },
  {
    id: 'secondSteps', kind: 'many', none: 'none',
    text: (p) => `When you sign in to your ${accountName(p.os)} on a new device, what does it ask for after the password?`,
    help: () => 'Tick every one you have set up.',
    options: () => [
      { value: 'sms', label: 'A code sent by SMS to this phone' },
      { value: 'prompt', label: 'A tap on a prompt on this phone' },
      { value: 'app', label: 'A code from an authenticator app on this phone' },
      { value: 'codes', label: 'Backup codes or a second number that is not this phone' },
      { value: 'key', label: 'A security key or passkey that is not this phone' },
      { value: 'none', label: 'Nothing, only the password' },
    ],
  },
  {
    id: 'otherDevice', kind: 'one', bool: true,
    text: (p) => `Is a laptop or tablet already signed in to your ${accountName(p.os)}?`, options: () => YES_NO,
  },
  {
    id: 'contactKnown', kind: 'one', bool: true,
    text: () => 'Do you know one family member’s or friend’s number by heart?', options: () => YES_NO,
  },
  {
    id: 'idKnown', kind: 'one', bool: true,
    text: () => 'Do you know your ID number by heart?',
    help: () => 'Carriers and banks ask for it before they block anything.',
    options: () => YES_NO,
  },
  {
    id: 'imeiSaved', kind: 'one', bool: true,
    text: () => 'Is the phone’s IMEI written down somewhere other than the phone?',
    help: () => 'The IMEI is the 15-digit number you see when you dial *#06#.',
    options: () => YES_NO,
  },
  {
    id: 'pinsOnPhone', kind: 'one', bool: true,
    text: () => 'Are any PINs or passwords saved in notes, contacts or chats on the phone?', options: () => YES_NO,
  },
  {
    id: 'numbersOffPhone', kind: 'one', bool: true,
    text: () => 'Do you carry your carrier’s and bank’s phone numbers anywhere other than the phone?',
    help: () => 'For example on a card in your wallet.',
    options: () => YES_NO,
  },
];

export function visibleQuestions(p: Profile): Question[] {
  return QUESTIONS.filter((q) => !q.skip?.(p));
}

/** Write one answer into the profile, converting to the stored shape. */
export function answer(p: Profile, q: Question, value: string | string[]): Profile {
  if (q.kind === 'many') {
    let list = Array.isArray(value) ? value : [value];
    if (q.none) list = list.filter((v) => v !== q.none);
    return { ...p, [q.id]: list };
  }
  const v = Array.isArray(value) ? value[0] : value;
  return { ...p, [q.id]: q.bool ? v === 'yes' : v };
}

/** Read the stored value back as the option value(s) the question shows. */
export function currentValue(p: Profile, q: Question): string[] {
  const raw = p[q.id] as unknown;
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'boolean') return [raw ? 'yes' : 'no'];
  return [String(raw)];
}
