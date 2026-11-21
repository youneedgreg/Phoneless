import type { Pack, Provider } from './types';

// Every number here was compared with the provider's own page on the date in `checked`.
// evidence 'opened'  = the page itself was read.
// evidence 'excerpt' = the official page was read as a search-engine excerpt because a direct fetch failed.
// Re-check every entry before you ship (Day-1 check 3) and bump `checked`.
const CHECKED = '2026-11-14';
// Re-opened in a browser on 21 Nov 2026 (Day-1 check 3): the six entries that were excerpts.
const RECHECKED = '2026-11-21';

const ke: Provider[] = [
  {
    id: 'safaricom', code: 'saf', kind: 'carrier', name: 'Safaricom', wallet: 'M-PESA',
    ownLine: [
      { label: 'PrePay, from a Safaricom line', display: '100', tel: '100' },
      { label: 'PostPay, from a Safaricom line', display: '200', tel: '200' },
    ],
    anyLine: [
      { label: 'PrePay, from any network', display: '0722 002 100', tel: '+254722002100' },
      { label: 'PostPay, from any network', display: '0722 002 200', tel: '+254722002200' },
    ],
    callsFrom: '0722 000 000',
    source: { url: 'https://safaricom.co.ke/about/contact-us', checked: CHECKED, evidence: 'opened' },
  },
  {
    id: 'airtel', code: 'air', kind: 'carrier', name: 'Airtel', wallet: 'Airtel Money',
    ownLine: [
      { label: 'Prepaid, from an Airtel line', display: '100', tel: '100' },
      { label: 'Postpaid, from an Airtel line', display: '200', tel: '200' },
    ],
    anyLine: [{ label: 'From any network', display: '0733 100 100', tel: '+254733100100' }],
    callsFrom: '0733 100 000',
    hours: '24 hours',
    source: { url: 'https://www.airtelkenya.com/ke/about/contact-us', checked: RECHECKED, evidence: 'opened' },
  },
  {
    id: 'telkom', code: 'tel', kind: 'carrier', name: 'Telkom', wallet: 'T-kash',
    ownLine: [{ label: 'From a Telkom line', display: '100', tel: '100' }],
    anyLine: [{ label: 'From any network', display: '020 222 1000', tel: '+254202221000' }],
    source: { url: 'https://telkom.co.ke/help-center/contact-us/', checked: RECHECKED, evidence: 'opened' },
  },
  {
    id: 'equity', code: 'eq', kind: 'bank', name: 'Equity Bank',
    ownLine: [{ label: 'From an Equitel line', display: '100', tel: '100' }],
    anyLine: [{ label: 'From any network', display: '0763 000 000', tel: '+254763000000' }],
    callsFrom: '0763 000 000',
    hours: '24 hours, 7 days',
    source: { url: 'https://equitel.com/secure-banking-tips', checked: CHECKED, evidence: 'opened' },
  },
  {
    id: 'kcb', code: 'kcb', kind: 'bank', name: 'KCB Bank',
    anyLine: [
      { label: 'Contact centre', display: '0711 087 000', tel: '+254711087000' },
      { label: 'Contact centre', display: '0732 187 000', tel: '+254732187000' },
    ],
    callsFrom: '0711 070 000',
    source: { url: 'https://ke.kcbgroup.com/talk-to-us', checked: RECHECKED, evidence: 'opened' },
  },
  {
    id: 'coop', code: 'coop', kind: 'bank', name: 'Co-operative Bank',
    anyLine: [
      { label: 'Contact centre', display: '0703 027 000', tel: '+254703027000' },
      { label: 'Contact centre', display: '020 277 6000', tel: '+254202776000' },
    ],
    hours: '24 hours, 7 days',
    source: { url: 'https://www.co-opbank.co.ke/contact', checked: CHECKED, evidence: 'opened' },
  },
  {
    id: 'absa', code: 'absa', kind: 'bank', name: 'Absa Bank Kenya',
    anyLine: [
      { label: 'Contact centre', display: '0722 130 120', tel: '+254722130120' },
      { label: 'Contact centre', display: '0732 130 120', tel: '+254732130120' },
      { label: 'Landline', display: '020 390 0000', tel: '+254203900000' },
    ],
    source: { url: 'https://www.absabank.co.ke/talk-to-us/', checked: RECHECKED, evidence: 'opened' },
  },
  {
    id: 'ncba', code: 'ncba', kind: 'bank', name: 'NCBA Bank',
    anyLine: [
      { label: 'Toll free', display: '0800 720 444', tel: '0800720444' },
      { label: 'Contact centre', display: '0711 056 444', tel: '+254711056444' },
      { label: 'Contact centre', display: '0732 156 444', tel: '+254732156444' },
    ],
    source: { url: 'https://ncbagroup.com/ke/talk-to-us/', checked: RECHECKED, evidence: 'opened' },
  },
  {
    id: 'stanbic', code: 'stan', kind: 'bank', name: 'Stanbic Bank',
    anyLine: [
      { label: 'Customer care', display: '0711 068 888', tel: '+254711068888' },
      { label: 'Customer care', display: '020 326 8888', tel: '+254203268888' },
    ],
    source: { url: 'https://www.stanbicbank.co.ke/kenya/personal/contact-us', checked: RECHECKED, evidence: 'opened' },
  },
];

export const PACKS: Record<string, Pack> = {
  ke: {
    id: 'ke',
    name: 'Kenya',
    emergency: {
      display: '999 or 112',
      tel: '999',
      source: {
        url: 'https://nationalpolice.go.ke/sites/default/files/2025-01/NPS%20Service%20Standards.pdf',
        checked: CHECKED,
        evidence: 'excerpt',
      },
    },
    providers: ke,
  },
  // The generic pack has no numbers on purpose: it tells people where to find the real one.
  xx: { id: 'xx', name: 'Another country', providers: [] },
};

export const OTHER_BANK = 'other-bank';
export const OTHER_CARRIER = 'other-carrier';

export function getPack(id: string): Pack {
  return PACKS[id] ?? PACKS.xx;
}

export function providersOf(pack: Pack, kind: 'carrier' | 'bank'): Provider[] {
  return pack.providers.filter((p) => p.kind === kind);
}

export function findProvider(pack: Pack, id: string): Provider | undefined {
  return pack.providers.find((p) => p.id === id);
}

/** Sources for the device and account steps. All four pages were opened on the checked date. */
export const TOOLS = {
  android: {
    name: 'Find Hub',
    url: 'https://www.google.com/android/find',
    source: 'https://support.google.com/accounts/answer/6160491',
    ready: 'https://support.google.com/android/answer/3265955',
  },
  iphone: {
    name: 'Find My',
    url: 'https://www.icloud.com/find',
    source: 'https://support.apple.com/120837',
  },
  google: { url: 'https://myaccount.google.com/security', source: 'https://support.google.com/android/answer/3265955' },
  apple: { url: 'https://account.apple.com', source: 'https://support.apple.com/120837' },
  whatsapp: { source: 'https://faq.whatsapp.com/1007324800132703' },
  simPinAndroid: { source: 'https://support.google.com/android/answer/15146908' },
  simPinIphone: { source: 'https://support.apple.com/en-us/118228' },
} as const;
