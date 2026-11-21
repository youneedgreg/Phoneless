// Phoneless core types. No UI code imports anything but these and the core functions.

export type Answer = 'yes' | 'no' | 'unsure';
export type OS = 'android' | 'iphone' | 'other';
/** A second sign-in step on the main account (Google Account on Android, Apple Account on iPhone). */
export type SecondStep = 'sms' | 'prompt' | 'app' | 'codes' | 'key';
export type Status = 'ready' | 'later' | 'blocked' | 'na';
export type Severity = 'critical' | 'high' | 'medium';

/** What a plan needs. Holds no secret and nothing that identifies a person. */
export interface PlanInput {
  country: string; // pack id, e.g. 'ke'
  os: OS;
  carriers: string[]; // provider ids
  banks: string[]; // provider ids
}

/** The drill answers. Stored only on this device. */
export interface Profile extends PlanInput {
  v: 1;
  screenLock: boolean;
  simPin: Answer;
  previews: Answer; // message contents show on the lock screen
  findOn: Answer; // Find Hub / Find My is turned on
  passwordKnown: boolean; // can type the main account password from memory
  secondSteps: SecondStep[]; // empty = the account asks for nothing but the password
  otherDevice: boolean; // a laptop or tablet is already signed in to that account
  contactKnown: boolean; // knows one trusted person's number by heart
  idKnown: boolean; // knows their ID number by heart
  imeiSaved: boolean; // IMEI written down somewhere other than the phone
  pinsOnPhone: boolean; // PINs or passwords saved in notes, contacts or chats
  numbersOffPhone: boolean; // carries the hotline numbers somewhere other than the phone
}

export interface Source {
  url: string;
  checked: string; // ISO date the page was last compared with this entry
  /** 'opened' = the page itself was read; 'excerpt' = read as a search excerpt of the official page. */
  evidence: 'opened' | 'excerpt';
}

export interface Line {
  label: string; // "From any network", "From a Safaricom line"
  display: string; // "0722 002 100"
  tel: string; // "+254722002100" or "100"
}

export interface Provider {
  id: string;
  code: string; // short code used in go-links
  kind: 'carrier' | 'bank';
  name: string;
  wallet?: string; // mobile money on this carrier
  ownLine?: Line[]; // short codes that only work from this provider's own line
  anyLine: Line[]; // numbers that work from any phone
  callsFrom?: string; // the only number this provider says it calls customers from
  hours?: string;
  source: Source;
}

export interface Pack {
  id: string;
  name: string;
  emergency?: { display: string; tel: string; source: Source };
  providers: Provider[];
}

export interface ActionResult {
  id: 'lock-phone' | 'block-line' | 'freeze-bank' | 'secure-account' | 'warn-contact';
  title: string;
  status: Status;
  reason: string;
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  why: string;
  /** Things that depend on each other in a circle, for the loop row. Empty when there is no loop. */
  loop: string[];
  fix: string[];
  minutes: number;
  source?: string; // url backing the fix steps
}

export interface Evaluation {
  actions: ActionResult[];
  ready: number;
  applicable: number;
  findings: Finding[];
}

export interface PlanStep {
  id: string;
  firstHour: boolean;
  title: string;
  detail: string;
  say?: string; // words to read out on the call
  lines?: Array<Line & { provider: string }>;
  link?: { label: string; url: string };
  source?: string;
}
