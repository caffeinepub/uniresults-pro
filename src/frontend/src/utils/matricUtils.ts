/**
 * Shared Matric Number Utility for UniResults Pro
 * Format: DEPTCODE/YEAR/SEQNUM  (e.g. BIO/2025/001)
 */

export interface MatricParams {
  deptName: string;
  year?: number;
  students: Array<{ matricNumber?: string; departmentId?: bigint }>;
  departmentId?: bigint;
  sequencePadding?: 2 | 3 | 4;
  customDeptCodes?: Record<string, string>;
}

/** Dept name → 3-letter code mapping with well-known overrides */
const DEFAULT_DEPT_CODES: Record<string, string> = {
  "Biology Education": "BIO",
  "Chemistry Education": "CHE",
  "Computer Science Education": "CSE",
  "Mathematics Education": "MAT",
  "Physics Education": "PHY",
  "General Studies Education": "GSE",
  "English Education": "ENG",
  "Science Education": "SCE",
  "Computer Science": "CSC",
  Mathematics: "MTH",
  Physics: "PHY",
  Chemistry: "CHM",
  "Electrical Engineering": "EEE",
  "Civil Engineering": "CVE",
  "Mechanical Engineering": "MEE",
  "Chemical Engineering": "CHE",
  "English Language": "ENG",
  History: "HIS",
  Philosophy: "PHL",
  "Fine Arts": "FAR",
  Sociology: "SOC",
  "Political Science": "POL",
  "Mass Communication": "MAC",
  Psychology: "PSY",
  Accounting: "ACC",
  "Business Administration": "BUS",
  Economics: "ECO",
  Finance: "FIN",
};

/**
 * Derive a dept code from a department name.
 */
export function getDeptCodeFromName(
  deptName: string,
  customOverrides?: Record<string, string>,
): string {
  if (customOverrides) {
    const found = Object.entries(customOverrides).find(
      ([k]) => k.toLowerCase() === deptName.toLowerCase(),
    );
    if (found) return found[1].toUpperCase().slice(0, 4);
  }
  if (DEFAULT_DEPT_CODES[deptName]) return DEFAULT_DEPT_CODES[deptName];
  for (const [name, code] of Object.entries(DEFAULT_DEPT_CODES)) {
    if (deptName.toLowerCase().includes(name.toLowerCase())) return code;
  }
  const stripped = deptName.replace(/\s+Education$/i, "").trim();
  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  const acronym = words
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  if (acronym.length >= 3) return acronym.slice(0, 3);
  return (
    stripped
      .replace(/[^A-Z]/gi, "")
      .slice(0, 3)
      .toUpperCase() || "STD"
  );
}

/**
 * Generate a unique matric number.
 */
export function generateMatricNumber(params: MatricParams): string {
  const {
    deptName,
    year = new Date().getFullYear(),
    students,
    departmentId,
    sequencePadding = 3,
    customDeptCodes,
  } = params;

  const deptCode = getDeptCodeFromName(deptName, customDeptCodes);
  const prefix = `${deptCode}/${year}/`;

  const existingSeqNums = students
    .filter((s) => {
      if (!s.matricNumber) return false;
      if (
        departmentId !== undefined &&
        s.departmentId !== undefined &&
        String(s.departmentId) !== String(departmentId)
      )
        return false;
      return s.matricNumber.startsWith(prefix);
    })
    .map((s) => {
      const parts = (s.matricNumber ?? "").split("/");
      return Number.parseInt(parts[2] ?? "0", 10);
    })
    .filter((n) => !Number.isNaN(n));

  let seq = existingSeqNums.length > 0 ? Math.max(...existingSeqNums) + 1 : 1;

  const allExistingMatrics = new Set(
    students.map((s) => s.matricNumber?.toUpperCase() ?? ""),
  );
  let candidate = `${deptCode}/${year}/${String(seq).padStart(sequencePadding, "0")}`;
  while (allExistingMatrics.has(candidate.toUpperCase())) {
    seq++;
    candidate = `${deptCode}/${year}/${String(seq).padStart(sequencePadding, "0")}`;
  }

  return candidate;
}

/** Load JAMB registration open/closed state */
export function getJambRegistrationOpen(): boolean {
  try {
    return JSON.parse(
      localStorage.getItem("jambRegistrationOpen") ?? "false",
    ) as boolean;
  } catch {
    return false;
  }
}

/** Save JAMB registration open/closed state */
export function setJambRegistrationOpenStorage(open: boolean): void {
  localStorage.setItem("jambRegistrationOpen", JSON.stringify(open));
}

/** Load dept code overrides */
export function getDeptCodeOverrides(): Record<string, string> {
  try {
    return JSON.parse(
      localStorage.getItem("deptCodeOverrides") ?? "{}",
    ) as Record<string, string>;
  } catch {
    return {};
  }
}

/** Save dept code overrides */
export function saveDeptCodeOverrides(overrides: Record<string, string>): void {
  localStorage.setItem("deptCodeOverrides", JSON.stringify(overrides));
}

/** Matric number settings */
export interface MatricSettings {
  year: number;
  padding: 2 | 3 | 4;
}

export function getMatricSettings(): MatricSettings {
  try {
    const raw = localStorage.getItem("matricSettings");
    if (raw) return JSON.parse(raw) as MatricSettings;
  } catch {}
  return { year: new Date().getFullYear(), padding: 3 };
}

export function saveMatricSettings(settings: MatricSettings): void {
  localStorage.setItem("matricSettings", JSON.stringify(settings));
}
