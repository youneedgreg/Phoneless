import type { Profile } from './types';

/** A made-up person for the demo. Not based on anyone. */
export const SAMPLE_NAME = 'Amina (sample, not a real person)';

export const SAMPLE: Profile = {
  v: 1,
  country: 'ke',
  os: 'android',
  carriers: ['safaricom'],
  banks: ['equity', 'kcb'],
  screenLock: true,
  simPin: 'no',
  previews: 'yes',
  findOn: 'unsure',
  passwordKnown: false,
  secondSteps: ['sms'],
  otherDevice: false,
  contactKnown: true,
  idKnown: true,
  imeiSaved: false,
  pinsOnPhone: true,
  numbersOffPhone: false,
};

export const EMPTY: Profile = {
  v: 1, country: 'ke', os: 'android', carriers: [], banks: [],
  screenLock: true, simPin: 'unsure', previews: 'unsure', findOn: 'unsure',
  passwordKnown: true, secondSteps: [], otherDevice: false,
  contactKnown: true, idKnown: true, imeiSaved: false, pinsOnPhone: false, numbersOffPhone: false,
};
