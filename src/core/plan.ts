import { accountName, finderName } from './evaluate';
import { OTHER_BANK, OTHER_CARRIER, TOOLS, findProvider, getPack } from './packs';
import type { Evaluation, Line, PlanInput, PlanStep, Provider } from './types';

function linesOf(providers: Provider[]): Array<Line & { provider: string }> {
  return providers.flatMap((p) => [...p.anyLine, ...(p.ownLine ?? [])].map((l) => ({ ...l, provider: p.name })));
}

/**
 * The ordered response plan.
 * With an evaluation (the owner did the drill) the order adapts to what they can really do.
 * Without one (a borrowed phone opened from a go-link) it gives the safe default order.
 */
export function buildPlan(input: PlanInput, ev?: Evaluation): PlanStep[] {
  const pack = getPack(input.country);
  const carriers = input.carriers.map((id) => findProvider(pack, id)).filter((p): p is Provider => !!p);
  const banks = input.banks.map((id) => findProvider(pack, id)).filter((p): p is Provider => !!p);
  const unknownCarrier = input.carriers.includes(OTHER_CARRIER) || carriers.length === 0;
  const unknownBank = input.banks.includes(OTHER_BANK);
  const finder = finderName(input.os);
  const acct = accountName(input.os);
  const wallets = carriers.map((c) => c.wallet).filter(Boolean).join(' and ');

  const safe: PlanStep = {
    id: 'safe', firstHour: true,
    title: 'Get somewhere safe and borrow a phone',
    detail: 'Do not chase the thief. If you were hurt or threatened, call the police emergency line before anything else.',
    lines: pack.emergency ? [{ label: 'emergency line', display: pack.emergency.display, tel: pack.emergency.tel, provider: 'Police' }] : undefined,
    source: pack.emergency?.source.url,
  };

  const lockState = ev?.actions.find((a) => a.id === 'lock-phone')?.status;
  const lock: PlanStep | null = input.os === 'other' ? null : {
    id: 'lock-phone', firstHour: true,
    title: `Lock the phone with ${finder}`,
    detail: input.os === 'android'
      ? 'Sign in, pick the phone and choose Mark as lost. Do this before the SIM is blocked: the lock only reaches the phone while it is online. Give it two minutes. If sign-in asks for a code you cannot get, move to the next step.'
      : 'Sign in with your Apple Account password, pick the phone and choose Mark as Lost. No verification code is needed. Do not add your contact details to the lock screen of a stolen phone.',
    link: { label: input.os === 'android' ? 'google.com/android/find' : 'icloud.com/find', url: input.os === 'android' ? TOOLS.android.url : TOOLS.iphone.url },
    source: input.os === 'android' ? TOOLS.android.source : TOOLS.iphone.source,
  };

  const block: PlanStep = {
    id: 'block-line', firstHour: true,
    title: wallets ? `Call your carrier: block the SIM and ${wallets}` : 'Call your carrier: block the SIM and mobile money',
    detail: unknownCarrier
      ? 'From another network a short code like 100 will not reach your carrier. Find the full customer care number on the carrier’s official website. They will ask for your name, your number and your ID number.'
      : 'Short codes like 100 only work from the same network. From any other phone use the long number. They will ask for your name, your number and your ID number.',
    say: 'My phone has been stolen. Please block my line and my mobile money now, and do not allow a SIM replacement until I come to a shop with my ID.',
    lines: linesOf(carriers),
    source: carriers[0]?.source.url,
  };

  const bank: PlanStep | null = input.banks.length === 0 ? null : {
    id: 'freeze-bank', firstHour: true,
    title: 'Call each bank: block mobile banking and cards',
    detail: unknownBank
      ? 'For a bank not listed here, use the number on the bank’s official website or on the back of your card.'
      : 'Ask them to block mobile and app banking for the stolen phone, and any card that was in the phone case.',
    say: 'My phone has been stolen. Please block mobile banking on my account and tell me what you need to confirm it is me.',
    lines: linesOf(banks),
    source: banks[0]?.source.url,
  };

  const account: PlanStep = {
    id: 'secure-account', firstHour: true,
    title: `Secure your ${acct}`,
    detail: input.os === 'iphone'
      ? 'Change your Apple Account password. You may remove the stolen phone from your device list, but leave it in Find My so it stays locked to you.'
      : 'Change the password, then look at the list of devices signed in to the account and sign the stolen phone out.',
    link: input.os === 'android' ? { label: 'myaccount.google.com/security', url: TOOLS.google.url }
      : input.os === 'iphone' ? { label: 'account.apple.com', url: TOOLS.apple.url } : undefined,
    source: input.os === 'iphone' ? TOOLS.apple.source : undefined,
  };

  const warn: PlanStep = {
    id: 'warn-contact', firstHour: true,
    title: 'Warn one person you trust',
    detail: 'Ask them to tell your family and close friends. Chat apps on the stolen phone can keep working on Wi-Fi even after the SIM is blocked.',
    say: 'My phone was stolen. Ignore any call or message from my number asking for money or codes until you hear from me in person.',
    source: TOOLS.whatsapp.source,
  };

  const police: PlanStep = {
    id: 'police', firstHour: false,
    title: 'Report the theft to the police',
    detail: input.country === 'ke'
      ? 'Go to the nearest police station, give the IMEI if you have it, and ask for the OB number. Banks and insurers may ask for it.'
      : 'Give the IMEI or serial number if you have it, and keep the report number.',
  };

  const sim: PlanStep = {
    id: 'replace-sim', firstHour: false,
    title: 'Get a replacement SIM with the same number',
    detail: 'Go to your carrier’s own shop with your original ID. Then install WhatsApp on a phone with the new SIM and register again: that signs the stolen phone out. WhatsApp cannot deactivate the account for you.',
    source: TOOLS.whatsapp.source,
  };

  const erase: PlanStep | null = input.os === 'other' ? null : {
    id: 'erase', firstHour: false,
    title: 'If the phone is not coming back, erase it',
    detail: input.os === 'android'
      ? `In ${finder} choose to erase the phone. After that it no longer shows in ${finder}, so do this last.`
      : 'In Find My choose Erase. The erase starts the next time the phone is online. Do not remove it from Find My.',
    link: lock?.link,
    source: lock?.source,
  };

  // The lock goes first unless the drill showed the owner cannot do it yet.
  const lockFirst = lock && (lockState === undefined || lockState === 'ready');
  const steps: Array<PlanStep | null> = lockFirst
    ? [safe, lock, block, bank, account, warn, police, sim, erase]
    : [safe, block, bank, lock, account, warn, police, sim, erase];
  return steps.filter((s): s is PlanStep => !!s);
}
