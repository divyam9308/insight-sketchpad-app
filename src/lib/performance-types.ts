export interface PerfRow {
  id: string;
  category: string;
  allocation: number; // percent number (0-100)
  workDone: string;
  selfScore: number; // 0-5
  ssnsFeedback: string;
  ssnsScore: number; // 0-5
  raFeedback: string;
  raScore: number; // 0-5
}

export const DEFAULT_ROWS: PerfRow[] = [
  {
    id: "r1",
    category: "Revenue and Mandate Lifecycle Management",
    allocation: 60,
    workDone: "",
    selfScore: 0,
    ssnsFeedback: "",
    ssnsScore: 0,
    raFeedback: "",
    raScore: 0,
  },
  {
    id: "r2",
    category: "Business Development",
    allocation: 10,
    workDone: "",
    selfScore: 0,
    ssnsFeedback: "",
    ssnsScore: 0,
    raFeedback: "",
    raScore: 0,
  },
  {
    id: "r3",
    category: "Business Enablement and Operational Excellence",
    allocation: 5,
    workDone: "",
    selfScore: 0,
    ssnsFeedback: "",
    ssnsScore: 0,
    raFeedback: "",
    raScore: 0,
  },
  {
    id: "r4",
    category: "Interpersonal & Organizational Effectiveness",
    allocation: 10,
    workDone: "",
    selfScore: 0,
    ssnsFeedback: "",
    ssnsScore: 0,
    raFeedback: "",
    raScore: 0,
  },
  {
    id: "r5",
    category: "Process Compliance",
    allocation: 15,
    workDone: "",
    selfScore: 0,
    ssnsFeedback: "",
    ssnsScore: 0,
    raFeedback: "",
    raScore: 0,
  },
];

export const PERF_COLUMNS = [
  { key: "category", label: "Category" },
  { key: "allocation", label: "Allocation" },
  { key: "workDone", label: "Work Done" },
  { key: "selfScore", label: "Self Score" },
  { key: "selfRating", label: "Self Rating" },
  { key: "ssnsFeedback", label: "SS/NS Feedback" },
  { key: "ssnsScore", label: "SS/NS Score" },
  { key: "ssnsRating", label: "SS/NS Rating" },
  { key: "raFeedback", label: "RA Feedback" },
  { key: "raScore", label: "RA Score" },
  { key: "finalRating", label: "Final Rating" },
] as const;

export type PerfColumnKey = (typeof PERF_COLUMNS)[number]["key"];

export const CALCULATED_KEYS: PerfColumnKey[] = ["selfRating", "ssnsRating", "finalRating"];

export type PerfPermission = "everyone" | "super_admin_disabled" | "super_admin_hidden";

export type PerfPermissions = Record<PerfColumnKey, PerfPermission>;

export const DEFAULT_PERF_PERMISSIONS: PerfPermissions = {
  category: "everyone",
  allocation: "everyone",
  workDone: "everyone",
  selfScore: "everyone",
  selfRating: "everyone",
  ssnsFeedback: "everyone",
  ssnsScore: "everyone",
  ssnsRating: "everyone",
  raFeedback: "everyone",
  raScore: "everyone",
  finalRating: "everyone",
};

const STORAGE_PREFIX = "fyndbridge.perf.review.";
const PERM_KEY = "fyndbridge.perf.permissions";

export function loadReview(userId: string): PerfRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) return JSON.parse(raw) as PerfRow[];
  } catch {
    /* empty */
  }
  return DEFAULT_ROWS.map((r) => ({ ...r }));
}

export function saveReview(userId: string, rows: PerfRow[]) {
  localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(rows));
}

export function loadPermissions(): PerfPermissions {
  try {
    const raw = localStorage.getItem(PERM_KEY);
    if (raw) return { ...DEFAULT_PERF_PERMISSIONS, ...JSON.parse(raw) };
  } catch {
    /* empty */
  }
  return { ...DEFAULT_PERF_PERMISSIONS };
}

export function savePermissions(perms: PerfPermissions) {
  localStorage.setItem(PERM_KEY, JSON.stringify(perms));
}

export function rating(score: number, allocation: number) {
  return (Number(score) * Number(allocation)) / 100;
}
