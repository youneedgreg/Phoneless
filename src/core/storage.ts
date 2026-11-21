import type { Profile } from './types';

export interface Snapshot { ready: number; applicable: number; findings: number; at: string }
export interface Saved {
  profile?: Profile;
  first?: Snapshot; // the result the first time the drill was finished: the "before"
  dismissed: string[]; // finding ids the person said do not apply
  card: { contact: string; imei: string }; // optional, typed by the person, never leaves the device
  sample?: boolean; // true while the demo person is loaded
}

const KEY = 'phoneless:v1';
const blank = (): Saved => ({ dismissed: [], card: { contact: '', imei: '' } });
let memory: Saved = blank();

// Storage can be missing or blocked (private mode, some in-app browsers). Then the app runs from memory.
export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Saved>;
      memory = { ...blank(), ...parsed, card: { ...blank().card, ...(parsed.card ?? {}) } };
    }
  } catch { /* keep memory copy */ }
  return memory;
}

export function save(next: Saved): Saved {
  memory = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* memory only */ }
  return memory;
}

export function clearAll(): Saved {
  memory = blank();
  try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
  return memory;
}
