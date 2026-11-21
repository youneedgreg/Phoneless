import { encodeGo } from '../core';
import type { ScreenProps } from './App';

// TO WRITE (Day 3 in the roadmap). This stub only proves the route and the go code.
// Build: two card faces at 85.6 mm x 54 mm with cut lines, a Print button, and two optional inputs
// (trusted contact number, IMEI) saved through update({ ...saved, card: {...} }).
export function Card({ saved }: ScreenProps) {
  if (!saved.profile) {
    return (<><h1 tabIndex={-1}>Your wallet card</h1><p>Do the drill first so the card has your carrier and bank on it.</p><a className="btn primary" href="#/drill">Start the drill</a></>);
  }
  return (
    <>
      <h1 tabIndex={-1}>Your wallet card</h1>
      <p>Card layout to build. Your plan code is <strong>{encodeGo(saved.profile)}</strong>.</p>
    </>
  );
}
