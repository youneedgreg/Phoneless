import { OTHER_BANK, OTHER_CARRIER, getPack } from './packs';
import type { OS, PlanInput } from './types';

// A go-link is short enough to print on the wallet card and type by hand:
//   https://<host>/#/go/ke.a.saf.eq-kcb
// country . phone (a, i, o) . carriers . banks      "x" means none.
// It holds no name, number or answer about weaknesses, so it is safe to share.
const OS_CODE: Record<OS, string> = { android: 'a', iphone: 'i', other: 'o' };
const CODE_OS: Record<string, OS> = { a: 'android', i: 'iphone', o: 'other' };

export function encodeGo(input: PlanInput): string {
  const pack = getPack(input.country);
  const codes = (ids: string[], other: string, otherCode: string) => {
    const out = ids
      .map((id) => (id === other ? otherCode : pack.providers.find((p) => p.id === id)?.code))
      .filter((c): c is string => !!c);
    return out.length ? out.join('-') : 'x';
  };
  return [pack.id, OS_CODE[input.os], codes(input.carriers, OTHER_CARRIER, 'oc'), codes(input.banks, OTHER_BANK, 'ob')].join('.');
}

export function decodeGo(text: string): PlanInput | null {
  const parts = text.trim().toLowerCase().replace(/[^a-z.\-]/g, '').split('.');
  if (parts.length !== 4) return null;
  const [country, osCode, carrierPart, bankPart] = parts;
  const os = CODE_OS[osCode];
  if (!os) return null;
  const pack = getPack(country);
  const ids = (part: string, kind: 'carrier' | 'bank', otherCode: string, other: string) =>
    part === 'x' ? [] : part.split('-').flatMap((code) => {
      if (code === otherCode) return [other];
      const p = pack.providers.find((x) => x.code === code && x.kind === kind);
      return p ? [p.id] : [];
    });
  return {
    country: pack.id,
    os,
    carriers: ids(carrierPart, 'carrier', 'oc', OTHER_CARRIER),
    banks: ids(bankPart, 'bank', 'ob', OTHER_BANK),
  };
}
