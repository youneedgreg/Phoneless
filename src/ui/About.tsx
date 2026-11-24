import { PACKS, TOOLS } from '../core';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
function host(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'source'; }
}

// The numbers table is rendered from the data pack, so it can never disagree with the plan.
export function About() {
  const providers = PACKS.ke.providers;
  return (
    <>
      <h1 tabIndex={-1}>About Phoneless</h1>
      <p>Phoneless is a two-minute drill you take before your phone is ever stolen. It asks what you have set up, shows which first-hour actions you would really be able to do, helps you close the gaps, and leaves you with a plan and a wallet card that are not on the phone.</p>
      <p>It is a student prototype, built for Kenya first. It cannot see your phone or do anything for you — it gives the order and the numbers.</p>

      <h2>What it cannot do</h2>
      <ul>
        <li>It cannot block, lock or erase anything. It tells you who to call and in what order.</li>
        <li>It only knows what you tick. If a setting is different from what you answered, the result will be wrong — set any finding aside if it does not fit you.</li>
        <li>It has not been tested in a real theft.</li>
        <li>Numbers are for Kenya: Safaricom, Airtel, Telkom and six banks. Anywhere else you get the plan without numbers and are told where to find them.</li>
        <li>English only, for now. No SACCOs or mobile lenders, and no QR code on the card — the plan code is short enough to type.</li>
        <li>The order "call the carrier first, then lock the phone" follows advice from one person at a bank or phone shop in Kenya. It is not a rule stated on any page I found. Google says the phone must be online to be locked, so once the SIM is blocked the lock may arrive only over Wi-Fi.</li>
      </ul>

      <h2>Your privacy</h2>
      <p>Phoneless has no server and no accounts. Your answers are ticks, not secrets, and they are stored only in this browser until you erase them. The optional contact number and IMEI stay on this device and on the paper you print. A plan code holds your phone type, carriers and banks, and nothing else. Nothing is tracked, and no request leaves this site — you can confirm that in your browser’s Network tab.</p>

      <h2>How the result is worked out</h2>
      <p><strong>Ready</strong> means you could do it within minutes from a borrowed phone, with nothing looked up. <strong>Later</strong> means you must first reach something you do not have with you. <strong>Blocked</strong> means it cannot be done as things stand.</p>
      <p>Two facts the remote-lock rule rests on:</p>
      <ul>
        <li>On an iPhone, Apple says <a href={TOOLS.iphone.source} target="_blank" rel="noreferrer">iCloud.com/find needs no verification code</a>, so the lock needs only your Apple Account password.</li>
        <li>On Android, Google says that <a href={TOOLS.android.ready} target="_blank" rel="noreferrer">without backup codes or a security key you may need a new SIM from your carrier</a> before you can sign in — which is the loop the drill shows.</li>
      </ul>

      <h2>Where the numbers come from</h2>
      <p>Every number below was compared with the provider’s own page on the date shown. "Page opened" means the page itself was read; "Search excerpt" means the official page was read as a search-engine excerpt.</p>
      <div className="table-wrap">
        <table className="numbers">
          <caption>Kenya carrier and bank numbers in Phoneless</caption>
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Numbers from any network</th>
              <th scope="col">Source</th>
              <th scope="col">Checked</th>
              <th scope="col">How read</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id}>
                <th scope="row">{p.name}</th>
                <td>{p.anyLine.map((l) => l.display).join(', ')}</td>
                <td><a href={p.source.url} target="_blank" rel="noreferrer">{host(p.source.url)}</a></td>
                <td>{fmt(p.source.checked)}</td>
                <td>{p.source.evidence === 'opened' ? 'Page opened' : 'Search excerpt'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Test results</h2>
      <p>What has been run so far, honestly. A row that has not been run says so.</p>
      <div className="table-wrap">
        <table>
          <caption>How Phoneless has been tested</caption>
          <thead>
            <tr><th scope="col">Test</th><th scope="col">Result</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Core logic (47 unit tests)</th><td>Pass, headless on Node</td></tr>
            <tr><th scope="row">Whole loop in a browser (24 checks)</th><td>Pass in Chrome, including the offline reload and "no request left this site"</td></tr>
            <tr><th scope="row">Nothing leaves the site, live</th><td>Pass — on the deployed site, only same-origin requests appear in the Network tab</td></tr>
            <tr><th scope="row">Offline after one visit</th><td>Pass in Chrome; a service worker caches every file</td></tr>
            <tr><th scope="row">Real phone: plan code on a phone that never opened the site, tap-to-call, copy link, offline</th><td>Pass on a Samsung Galaxy A06, Android 16, Chrome</td></tr>
            <tr><th scope="row">Android settings steps followed on that phone</th><td>Two steps had the wrong menu names for Samsung; both fixed</td></tr>
            <tr><th scope="row">Printed card, A4 at 100%</th><td>Pass: each face 85.6 × 54 mm, nothing cut off, also with five providers</td></tr>
            <tr><th scope="row">Screen readers (VoiceOver, TalkBack)</th><td>Not yet run</td></tr>
            <tr><th scope="row">People taking the drill unaided</th><td>Not yet run</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Credits</h2>
      <ul>
        <li>Built with <a href="https://preactjs.com" target="_blank" rel="noreferrer">Preact</a>, <a href="https://vite.dev" target="_blank" rel="noreferrer">Vite</a>, Vitest and playwright-core. No server, no analytics, no third-party fonts or scripts.</li>
        <li>Numbers from the official pages of Safaricom, Airtel, Telkom, Equity, KCB, Co-operative, Absa, NCBA and Stanbic, and the National Police Service (links above). Device and account steps from Google, Apple and WhatsApp help pages.</li>
        <li>AI assistance: Claude (Anthropic) helped research the problem and the hackathons, design the drill rules, write the code (including the wallet card and this page) and re-check the provider numbers. I decided what Phoneless does and leaves out, tested it on my own phone and on paper, and approved every change before it went live.</li>
        <li>The sample person is made up. No real name, number or ID appears anywhere in Phoneless.</li>
        <li>Licensed under MIT.</li>
      </ul>
    </>
  );
}
