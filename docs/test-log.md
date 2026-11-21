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
