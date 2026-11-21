import { TOOLS } from './packs';
import type { ActionResult, Evaluation, Finding, OS, Profile, Status } from './types';

/** What the main account is called on each kind of phone. */
export function accountName(os: OS): string {
  if (os === 'android') return 'Google Account';
  if (os === 'iphone') return 'Apple Account';
  return 'main email account';
}

export function finderName(os: OS): string {
  return os === 'iphone' ? 'Find My' : 'Find Hub';
}

const offPhone = (p: Profile) =>
  p.secondSteps.length === 0 || p.secondSteps.includes('codes') || p.secondSteps.includes('key');

/** Can you get into the main account from a borrowed device, with the phone gone? */
export function accountAccess(p: Profile): { status: Status; reason: string } {
  const acct = accountName(p.os);
  if (!p.passwordKnown) {
    if (p.otherDevice)
      return { status: 'later', reason: `Only from your other device, which is already signed in. You cannot type the ${acct} password from memory.` };
    return { status: 'blocked', reason: `You cannot type your ${acct} password from memory, and no other device is signed in.` };
  }
  if (offPhone(p)) {
    return {
      status: 'ready',
      reason: p.secondSteps.length === 0
        ? 'You know the password and the account asks for nothing else.'
        : 'You know the password and have a second step that is not on the phone.',
    };
  }
  if (p.otherDevice) return { status: 'later', reason: 'Only once you reach your other device. Every second step you have is on the stolen phone.' };
  if (p.secondSteps.includes('sms'))
    return { status: 'later', reason: 'Only after you get a replacement SIM. The sign-in code goes by SMS to the stolen line.' };
  return { status: 'blocked', reason: 'Every second step you have lives on the stolen phone. Only the provider’s account recovery remains, and it is not guaranteed.' };
}

function lockPhone(p: Profile): { status: Status; reason: string } {
  const finder = finderName(p.os);
  if (p.os === 'other') return { status: 'na', reason: 'This phone has no remote lock.' };
  if (p.findOn === 'no') return { status: 'blocked', reason: `${finder} is off, so there is nothing to lock remotely.` };
  if (p.findOn === 'unsure') return { status: 'blocked', reason: `You are not sure ${finder} is on. Until you check, count it as off.` };
  if (p.os === 'iphone') {
    // Apple: iCloud.com/find needs the password only, no verification code.
    if (p.passwordKnown) return { status: 'ready', reason: 'iCloud.com/find asks for your Apple Account password only, with no code.' };
    if (p.otherDevice) return { status: 'later', reason: 'Only from your other Apple device. You cannot type the password from memory.' };
    return { status: 'blocked', reason: 'You cannot type your Apple Account password from memory.' };
  }
  return accountAccess(p);
}

export function evaluate(p: Profile): Evaluation {
  const callReady = p.numbersOffPhone && p.idKnown;
  const callReason = callReady
    ? 'You carry the number and can prove who you are.'
    : !p.numbersOffPhone && !p.idKnown
      ? 'The number is only in the stolen phone, and you cannot give your ID number when asked.'
      : !p.numbersOffPhone
        ? 'The number is only in the stolen phone. You would have to find it first.'
        : 'You cannot give your ID number when the agent asks who you are.';

  const lock = lockPhone(p);
  const acct = accountAccess(p);
  const actions: ActionResult[] = [
    { id: 'lock-phone', title: 'Lock the phone remotely', ...lock },
    {
      id: 'block-line', title: 'Block the SIM and mobile money',
      status: p.carriers.length === 0 ? 'na' : callReady ? 'ready' : 'later',
      reason: p.carriers.length === 0 ? 'No line chosen.' : callReason,
    },
    {
      id: 'freeze-bank', title: 'Freeze bank apps and cards',
      status: p.banks.length === 0 ? 'na' : callReady ? 'ready' : 'later',
      reason: p.banks.length === 0 ? 'No bank is tied to this phone.' : callReason,
    },
    { id: 'secure-account', title: `Secure your ${accountName(p.os)}`, ...acct },
    {
      id: 'warn-contact', title: 'Warn someone you trust',
      status: p.contactKnown ? 'ready' : 'blocked',
      reason: p.contactKnown
        ? 'You know one number by heart.'
        : 'You do not know anyone’s number by heart, so there is no one you can call from a borrowed phone.',
    },
  ];

  return {
    actions,
    ready: actions.filter((a) => a.status === 'ready').length,
    applicable: actions.filter((a) => a.status !== 'na').length,
    findings: findingsFor(p),
  };
}

const ORDER = { critical: 0, high: 1, medium: 2 } as const;

export function findingsFor(p: Profile): Finding[] {
  const out: Finding[] = [];
  const acct = accountName(p.os);
  const finder = finderName(p.os);
  const android = p.os === 'android';
  const iphone = p.os === 'iphone';

  if (!p.screenLock) {
    out.push({
      id: 'no-screen-lock', severity: 'critical', title: 'The phone opens with no lock',
      why: 'Whoever holds the phone holds every app on it: mobile money, bank, email and chats.',
      loop: [],
      fix: [
        'Open Settings and search for "screen lock".',
        'Set a PIN of six digits or more. Add fingerprint or face on top if you like.',
      ],
      minutes: 2, source: TOOLS.simPinAndroid.source,
    });
  }

  if (p.pinsOnPhone) {
    out.push({
      id: 'pins-on-phone', severity: 'critical', title: 'PINs or passwords are saved on the phone',
      why: 'A thief who gets the phone open can read them from your notes, contacts or chats and use them straight away.',
      loop: [],
      fix: [
        'Search your notes, contacts and chats for "PIN", "password" and your bank’s name.',
        'Delete each one. Change any PIN that was written there.',
      ],
      minutes: 5,
    });
  }

  if (!p.passwordKnown) {
    out.push({
      id: 'password-unknown', severity: 'critical', title: `You cannot type your ${acct} password from memory`,
      why: `Without it you cannot sign in on any other device, so you cannot lock the phone, read your email or reset other accounts.`,
      loop: ['Phone gone', 'Password is saved only on the phone', `No ${acct}`, `No ${finder}, no email`],
      fix: [
        `Change the password to a long phrase you can remember, at ${android ? 'myaccount.google.com' : iphone ? 'account.apple.com' : 'your provider’s security page'}.`,
        'Type it from memory once a week for a month.',
        'Never write it on the wallet card.',
      ],
      minutes: 5,
    });
  }

  const stepsOnPhoneOnly = p.secondSteps.length > 0 && !p.secondSteps.includes('codes') && !p.secondSteps.includes('key');
  if (stepsOnPhoneOnly) {
    const viaSms = p.secondSteps.includes('sms');
    out.push({
      id: 'second-step-loop', severity: 'critical', title: `Your ${acct} sends its sign-in code to the stolen phone`,
      why: android
        ? `To lock the phone you must sign in to ${finder}. Signing in asks for a code. The code goes to the phone you are trying to lock.`
        : `Signing in on a new device asks for a code, and the code goes to the phone that is gone.`,
      loop: android
        ? ['Phone gone', `Sign in to ${finder}`, 'Code needed', viaSms ? 'Code goes to the stolen SIM' : 'Code is made on the stolen phone']
        : ['Phone gone', `Sign in to your ${acct}`, 'Code needed', viaSms ? 'Code goes to the stolen SIM' : 'Code is made on the stolen phone'],
      fix: android
        ? [
            'On any browser open myaccount.google.com.',
            'Go to Security & sign-in, then 2-Step Verification, then Backup codes.',
            'Write the codes on paper. Keep the paper at home, not in your wallet and not on the phone.',
          ]
        : iphone
          ? [
              'Add a second trusted phone number that is not in this phone, such as a family member’s, in Settings under your name, Sign-In & Security.',
              'Remember that iCloud.com/find needs only your password, so you can still lock the phone.',
            ]
          : [
              'Open your email provider’s security page.',
              'Create backup codes or add a second step that is not this phone.',
              'Keep the codes on paper at home.',
            ],
      minutes: 5, source: android ? TOOLS.android.ready : iphone ? TOOLS.iphone.source : undefined,
    });
  }

  if (p.os !== 'other' && p.findOn !== 'yes') {
    out.push({
      id: 'finder-off', severity: 'high',
      title: p.findOn === 'no' ? `${finder} is turned off` : `You have not checked that ${finder} is on`,
      why: 'If it is off on the day the phone is taken, you cannot lock or erase it from anywhere.',
      loop: [],
      fix: android
        ? [
            'Open Settings, then Security, then Find Hub.',
            'Turn on "Allow device to be located".',
            'On another device open android.com/find and check that this phone appears.',
          ]
        : [
            'Open Settings, tap your name, then Find My, then Find My iPhone.',
            'Turn on Find My iPhone.',
            'On another device open iCloud.com/find and check that this phone appears.',
          ],
      minutes: 3, source: android ? TOOLS.android.ready : TOOLS.iphone.source,
    });
  }

  if (p.simPin !== 'yes') {
    out.push({
      id: 'sim-pin-off', severity: 'high',
      title: p.simPin === 'no' ? 'The SIM has no PIN' : 'You are not sure the SIM has a PIN',
      why: 'Without a SIM PIN, a thief can move your SIM into another phone and receive your calls and codes there until the line is blocked.',
      loop: [],
      fix: [
        android
          ? 'Open Settings, then Security & privacy, then More security settings, then SIM lock, then Lock SIM.'
          : iphone
            ? 'Open Settings, then Cellular (or Mobile Service), then SIM PIN.'
            : 'Open the phone’s security settings and look for SIM lock or SIM PIN.',
        'The phone asks for the current SIM PIN first. If you do not know it, stop and ask your carrier. Do not guess: wrong guesses lock the SIM.',
        'Change the PIN to one only you know, and memorise it.',
      ],
      minutes: 5, source: android ? TOOLS.simPinAndroid.source : iphone ? TOOLS.simPinIphone.source : undefined,
    });
  }

  if (p.previews !== 'no') {
    out.push({
      id: 'previews-on', severity: 'high',
      title: p.previews === 'yes' ? 'Messages show on the locked screen' : 'You are not sure if messages show on the locked screen',
      why: 'One-time codes arrive by SMS. If the locked screen shows message contents, a thief can read each code without opening the phone.',
      loop: [],
      fix: [
        android
          ? 'Open Settings, then Notifications, then the lock screen option, and choose to hide sensitive content. The wording differs by phone maker.'
          : iphone
            ? 'Open Settings, then Notifications, then Show Previews, and choose When Unlocked.'
            : 'Open the phone’s notification settings and hide message contents on the lock screen.',
        'Lock the phone, send yourself a text from another phone, and check that the words do not show.',
      ],
      minutes: 2,
    });
  }

  if (!p.numbersOffPhone) {
    out.push({
      id: 'numbers-on-phone-only', severity: 'high', title: 'The numbers you would need are only in the phone',
      why: 'From a borrowed phone on another network, short codes like 100 do not reach your own carrier. You need the long numbers, and they went with the phone.',
      loop: [],
      fix: ['Make your wallet card on the Card screen.', 'Print it and put it behind your ID, or copy the numbers by hand.'],
      minutes: 3,
    });
  }

  if (!p.contactKnown) {
    out.push({
      id: 'no-number-known', severity: 'medium', title: 'You do not know anyone’s number by heart',
      why: 'With a borrowed phone and no numbers in your head, you cannot reach the one person who could help or warn others.',
      loop: [],
      fix: ['Pick one person. Memorise their number.', 'Optionally add it to the wallet card.'],
      minutes: 5,
    });
  }

  if (!p.idKnown) {
    out.push({
      id: 'id-unknown', severity: 'medium', title: 'You do not know your ID number by heart',
      why: 'Carriers and banks ask for it before they block anything, to check that the caller is you.',
      loop: [],
      fix: ['Memorise your ID number.', 'Do not write it on the wallet card: together with your name and phone number it is what a SIM-swap fraudster needs.'],
      minutes: 5,
    });
  }

  if (!p.imeiSaved) {
    out.push({
      id: 'imei-not-saved', severity: 'medium', title: 'The phone’s IMEI is not written down anywhere else',
      why: 'The police ask for it in a theft report, and a carrier can use it to disable the handset.',
      loop: [],
      fix: [
        'Dial *#06# or open Settings, About phone, and copy the 15-digit IMEI.',
        'Add it to the wallet card, or write it on the phone’s box at home.',
      ],
      minutes: 2, source: TOOLS.android.source,
    });
  }

  return out.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
