# Test log

Write each result here the day you run it: date, device, browser and version, pass or fail, and what you saw.
A failed or skipped row stays in the log.

| Date | Test | Device and browser | Result | Notes |
| --- | --- | --- | --- | --- |
| 2026-11-14 | 41 unit tests (`npm test`) | Node 22.23.4, Linux | Pass | Starter as delivered |
| 2026-11-14 | 16 browser checks (`npm run e2e`) | Headless Chrome, Linux, 360 x 740 | Pass | Includes offline reload and "no request left this site" |
| 2026-11-21 | Plan code on a phone that never opened the site: `phoneless-prod.vercel.app/#/go/ke.a.saf.eq-kcb` typed by hand | Samsung Galaxy A06 (SM-A065F), Android 16, Chrome 158.0.8127.42 | Pass | The plan opened with Safaricom, Equity and KCB numbers |
| 2026-11-21 | Tap a number on the plan | Samsung Galaxy A06 (SM-A065F), Android 16, Chrome 158.0.8127.42 | Pass | Numbers were tappable; tapping one opened the dialler |
| 2026-11-21 | Copy my plan link | Samsung Galaxy A06 (SM-A065F), Android 16, Chrome 158.0.8127.42 | Pass | The button changed to "Copied", Android showed "Copied to clipboard", and the link was on the clipboard |
| 2026-11-21 | Not-ready box after my own drill (Phone gone now) | Samsung Galaxy A06 (SM-A065F), Android 16, Chrome 158.0.8127.42 | Pass | "Not possible right away" listed the actions I could not do, each with its reason |
| 2026-11-21 | Offline after one visit: airplane mode on, tab closed, site reopened | Samsung Galaxy A06 (SM-A065F), Android 16, Chrome 158.0.8127.42 | Pass | Home, the sample result and the plan all opened with no network |
| 2026-11-21 | IMEI step: dial `*#06#` | Samsung Galaxy A06 (SM-A065F), Android 16 | Pass | A 15-digit IMEI appeared |
| 2026-11-21 | Lock-screen message step: follow the app's Android path | Samsung Galaxy A06 (SM-A065F), Android 16 | Fail, wording | The app said "the lock screen option", but Samsung's Notifications screen also has a "Lock screen" item that only sets the notification style. The setting is Notifications, then Hide content while locked, then Hide when locked. Wording fixed |
| 2026-11-21 | SIM lock step: follow the app's Android path | Samsung Galaxy A06 (SM-A065F), Android 16 | Fail, wording | Right place, different names: Security and privacy, then More security settings, then SIM card security, then Lock SIM card. Wording fixed |
| 2026-11-21 | Find Hub wording: "Mark as lost" at google.com/android/find | Laptop browser, signed in | Pass | The option is called Mark as lost (not pressed) |
| 2026-11-21 | Print the sample card: A4, scale 100 | Mac, Chrome; HP DeskJet 2720 | Pass | Each face measured 85.6 x 54 mm with a ruler; nothing cut off. Made-up contact and IMEI only |
| 2026-11-21 | Print a card with five providers (three carriers, several banks) | Mac, Chrome; HP DeskJet 2720 | Pass | At most five providers shown; nothing cut off |
| 2026-11-24 | Keyboard only: Home, all 15 drill questions, Result, "I fixed this", the plan, the card fields and "Print the card" (scripted, Tab / Shift+Tab / Space / Enter) | Chrome, Mac, playwright-core | Pass | Focus visible at every stop; the heading takes focus after each screen change; phone numbers reachable |
| 2026-11-24 | Zoom 200% and 400% (640 and 320 px wide), seven screens, light and dark | Chrome, Mac, playwright-core | Pass after fix | 320 px first scrolled sideways 4 px on the plan (a long button); fixed in #11 |
| 2026-11-24 | Small screen 320 x 568: tap targets at least 48 px, text at least 16 px, no number wraps | Chrome, Mac, playwright-core | Pass after fix | Nav links were 24 px tall and some text 14 to 15 px; fixed in #11. The printed card faces stay print-size on purpose |
| 2026-11-24 | Contrast of every text, seven screens, light and dark | Chrome, Mac, playwright-core | Pass | Every text at least 4.5:1 |
| 2026-11-24 | Not colour alone: achromatopsia emulation on Result and the plan | Chrome, Mac, DevTools protocol | Pass | Ready, Later and Blocked still told apart by words and symbols |
| 2026-11-24 | axe-core 4.14.1, WCAG 2.0 to 2.2 A and AA plus best practice, seven screens x light/dark x 375/1280 px, sample loaded | Chrome, Mac | Pass, 0 violations in 28 runs | Flagged for review: the card box label had no role (fixed in #12); About table headers' background unreadable while the table scrolls (contrast measured separately: pass) |
| 2026-11-24 | Lighthouse 13.6.0 accessibility and best practices, mobile | Chrome, Mac | 100 and 100 | Home, Result (sample loaded), plan from the drill, plan from a code |
| 2026-11-24 | VoiceOver with Safari: Drill, Result, plan, Card | macOS 27.0, Safari 27.0 | Pass | Each question and answer read; the Result headline read and read again after "I fixed this"; each number read with its provider; Card announced as "Your wallet card, front and back, group" |
| 2026-11-24 | TalkBack on the plan (sample person) | Samsung Galaxy A06 (SM-A065F), Android 16, Chrome | Pass | Every phone number read with its provider |
| 2026-11-24 | Plain language: every sentence on Home, the drill, Result, the plan and the card read aloud to people who are not developers | 7 people, in person | Pass | Nobody was confused by any sentence. No names or answers recorded |
