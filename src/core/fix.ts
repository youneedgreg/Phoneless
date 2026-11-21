import type { Profile } from './types';

/** What "I fixed this" changes in the profile, per finding. */
export function fixPatch(id: string, p: Profile): Partial<Profile> {
  switch (id) {
    case 'no-screen-lock': return { screenLock: true };
    case 'pins-on-phone': return { pinsOnPhone: false };
    case 'password-unknown': return { passwordKnown: true };
    case 'second-step-loop': return { secondSteps: p.secondSteps.includes('codes') ? p.secondSteps : [...p.secondSteps, 'codes'] };
    case 'finder-off': return { findOn: 'yes' };
    case 'sim-pin-off': return { simPin: 'yes' };
    case 'previews-on': return { previews: 'no' };
    case 'numbers-on-phone-only': return { numbersOffPhone: true };
    case 'no-number-known': return { contactKnown: true };
    case 'id-unknown': return { idKnown: true };
    case 'imei-not-saved': return { imeiSaved: true };
    default: return {};
  }
}

export function applyFix(id: string, p: Profile): Profile {
  return { ...p, ...fixPatch(id, p) };
}
