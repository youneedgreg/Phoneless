import { useEffect, useState } from 'react';
import { clearAll, load, save } from '../core';
import type { Saved } from '../core';
import { About } from './About';
import { Card } from './Card';
import { Drill } from './Drill';
import { Emergency } from './Emergency';
import { Home } from './Home';
import { Result } from './Result';

/** The part of the address after "#", e.g. "/go/ke.a.saf.eq-kcb". */
function useRoute(): string {
  const read = () => window.location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export interface ScreenProps {
  saved: Saved;
  update: (next: Saved) => void;
}

export function App() {
  const route = useRoute();
  const [saved, setSaved] = useState<Saved>(() => load());
  const update = (next: Saved) => setSaved(save({ ...next }));
  const props: ScreenProps = { saved, update };

  // Move focus to the page heading on every screen change, so screen readers announce it.
  useEffect(() => { document.querySelector<HTMLElement>('main h1')?.focus(); }, [route]);

  let screen;
  if (route.startsWith('/go/')) screen = <Emergency {...props} code={decodeURIComponent(route.slice(4))} />;
  else if (route === '/emergency') screen = <Emergency {...props} />;
  else if (route === '/drill') screen = <Drill {...props} />;
  else if (route === '/result') screen = <Result {...props} />;
  else if (route === '/card') screen = <Card {...props} />;
  else if (route === '/about') screen = <About />;
  else screen = <Home {...props} />;

  return (
    <>
      <header className="top">
        <a className="brand" href="#/">Phoneless</a>
        <nav aria-label="Main">
          <a href="#/drill">Drill</a>
          <a href="#/result">Result</a>
          <a href="#/card">Card</a>
          <a href="#/emergency">Phone gone now</a>
          <a href="#/about">About</a>
        </nav>
      </header>
      <main>{screen}</main>
      <footer>
        <p>Phoneless is a student prototype. It does not replace the police, your carrier or your bank, and it cannot block anything for you.</p>
        <p>Nothing you enter leaves this device. <button className="btn" onClick={() => { setSaved(clearAll()); window.location.hash = '#/'; }}>Erase my answers</button></p>
      </footer>
    </>
  );
}
