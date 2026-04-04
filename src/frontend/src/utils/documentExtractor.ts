/**
 * documentExtractor.ts
 * Shared utility for extracting student rows and course rows from pasted/uploaded text.
 * Used by BulkRegistrationTab, JambAdmissionScannerTab, and CourseScanImportModal.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedStudentRow {
  sn: string;
  regNo: string;
  name: string;
  deptId: string;
  deptName: string;
  level: string;
  state: string;
  lga: string;
  gender: string;
  jambScore: string;
  aggregate: string;
  status: string;
  hasError: boolean;
}

export interface ParsedCourseRow {
  sn: number;
  courseCode: string;
  title: string;
  creditUnits: string;
  level: string;
  semester: "First" | "Second";
  status: "Core" | "Elective";
}

type Department = { id: bigint | number; name: string };

// ─── Department fuzzy match ───────────────────────────────────────────────────

/**
 * Fuzzy match a department by name.
 * Strategy (ordered by specificity):
 *  1. Exact match (case-insensitive)
 *  2. Dept name contains the search term
 *  3. Search term contains dept name
 *  4. Match ignoring "Education" suffix
 *  5. Match first word of search against dept name
 *  6. Abbreviation match ("CSC" → "Computer Science")
 */
export function fuzzyMatchDept(
  name: string,
  departments: Department[],
): Department | undefined {
  if (!name || !departments.length) return undefined;
  const norm = (s: string) => s.toLowerCase().trim();
  const search = norm(name);

  // 1. Exact match
  const exact = departments.find((d) => norm(d.name) === search);
  if (exact) return exact;

  // 2. Dept name contains search
  const contains = departments.find((d) => norm(d.name).includes(search));
  if (contains) return contains;

  // 3. Search contains dept name
  const reverse = departments.find((d) => search.includes(norm(d.name)));
  if (reverse) return reverse;

  // 4. Strip "Education" suffix from both and compare
  const stripEdu = (s: string) =>
    s
      .replace(/\beducation\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  const searchNoEdu = norm(stripEdu(name));
  const noEdu = departments.find((d) => {
    const dNoEdu = norm(stripEdu(d.name));
    return (
      dNoEdu === searchNoEdu ||
      dNoEdu.includes(searchNoEdu) ||
      searchNoEdu.includes(dNoEdu)
    );
  });
  if (noEdu) return noEdu;

  // 5. Match first word of search term against dept name
  const firstWord = search.split(/\s+/)[0];
  if (firstWord && firstWord.length > 2) {
    const firstWordMatch = departments.find((d) =>
      norm(d.name).includes(firstWord),
    );
    if (firstWordMatch) return firstWordMatch;
  }

  // 6. Abbreviation match — build abbrev from dept name words
  const abbrevMatch = departments.find((d) => {
    const words = d.name.split(/\s+/);
    const abbrev = words
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    const abbrev3 = words
      .filter((w) => !/(^the$|^of$|^and$|^in$)$/i.test(w))
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
    const searchUp = name.toUpperCase().trim();
    return (
      abbrev === searchUp || abbrev3 === searchUp || abbrev.startsWith(searchUp)
    );
  });
  if (abbrevMatch) return abbrevMatch;

  return undefined;
}

// ─── Student text parser ──────────────────────────────────────────────────────

/**
 * Header keywords that signal a row is a header row to skip.
 */
const STUDENT_HEADER_KEYWORDS = [
  "s/n",
  "serial",
  "sn",
  "reg no",
  "reg.",
  "registration",
  "name",
  "full name",
  "surname",
  "department",
  "faculty",
  "state",
  "lga",
  "sex",
  "gender",
  "status",
  "score",
  "aggregate",
  "course",
  "admitted",
];

function isHeaderRow(line: string): boolean {
  const lower = line.toLowerCase();
  const matchCount = STUDENT_HEADER_KEYWORDS.filter((kw) =>
    lower.includes(kw),
  ).length;
  return matchCount >= 2;
}

function isBlankOrTotal(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^(total|grand\s*total|sub.*total|summary)/i.test(t)) return true;
  if (/^\d+\.?$/.test(t)) return true; // just a number
  return false;
}

/**
 * Detect separator used in a line: tab, comma, or multi-space.
 */
function detectSeparator(line: string): string {
  if (line.includes("\t")) return "\t";
  if (line.includes(",")) return ",";
  return "multi-space";
}

/**
 * Split a line using the detected separator.
 */
function splitLine(line: string, sep: string): string[] {
  if (sep === "\t") return line.split("\t").map((c) => c.trim());
  if (sep === ",")
    return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  // multi-space: split on 2+ spaces
  return line
    .split(/\s{2,}/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Detect column positions from a header line.
 * Returns a map of { fieldName: columnIndex }.
 */
function detectColumnPositions(
  headerLine: string,
  sep: string,
): Record<string, number> {
  const parts = splitLine(headerLine, sep);
  const pos: Record<string, number> = {};
  parts.forEach((p, i) => {
    const l = p.toLowerCase();
    if (/^s\/?n$|^#$|^no\.?$|^serial/.test(l)) pos.sn = i;
    else if (/reg|jamb/.test(l) && !/name|dept|course/.test(l)) pos.regNo = i;
    else if (/name|surname|full/.test(l)) pos.name = i;
    else if (
      /dept|department|course|programme|faculty/.test(l) &&
      !/score|lga/.test(l)
    )
      pos.dept = i;
    else if (/^state/.test(l)) pos.state = i;
    else if (/lga|local/.test(l)) pos.lga = i;
    else if (/sex|gender/.test(l)) pos.gender = i;
    else if (/score|jamb.score|utme/.test(l)) pos.jambScore = i;
    else if (/agg|aggregate/.test(l)) pos.aggregate = i;
    else if (/status|standing/.test(l)) pos.status = i;
    else if (/level|class/.test(l)) pos.level = i;
  });
  return pos;
}

/**
 * Normalize gender string to "Male" or "Female".
 */
function normalizeGender(g: string): string {
  const u = g.toUpperCase().trim();
  if (u === "M" || u === "MALE") return "Male";
  if (u === "F" || u === "FEMALE") return "Female";
  return g;
}

/**
 * Parse student rows from pasted/imported text.
 * Supports tab-separated, comma-separated, multi-space, and multi-line block formats.
 */
export function parseStudentText(
  text: string,
  departments: Department[],
): ParsedStudentRow[] {
  if (!text.trim()) return [];

  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (rawLines.length === 0) return [];

  // Detect separator from first non-empty line
  const firstDataLine =
    rawLines.find((l) => !isHeaderRow(l) && !isBlankOrTotal(l)) ?? rawLines[0];
  const sep = detectSeparator(firstDataLine);

  // Find header row if any (search first 3 lines)
  let headerLine = "";
  let dataStartIdx = 0;
  for (let i = 0; i < Math.min(3, rawLines.length); i++) {
    if (isHeaderRow(rawLines[i])) {
      headerLine = rawLines[i];
      dataStartIdx = i + 1;
      break;
    }
  }

  // Build column position map
  const colPos = headerLine ? detectColumnPositions(headerLine, sep) : {};

  const hasColMap = Object.keys(colPos).length >= 2;

  const results: ParsedStudentRow[] = [];
  let sn = 1;

  for (let i = dataStartIdx; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (isBlankOrTotal(line)) continue;

    const parts = splitLine(line, sep);
    if (parts.length < 2) continue;

    let snVal = "";
    let regNo = "";
    let name = "";
    let deptHint = "";
    let state = "";
    let lga = "";
    let gender = "";
    let jambScore = "";
    let aggregate = "";
    let status = "accepted";
    let level = "100";

    if (hasColMap) {
      // Use detected column positions
      snVal = colPos.sn !== undefined ? (parts[colPos.sn] ?? "") : "";
      regNo = colPos.regNo !== undefined ? (parts[colPos.regNo] ?? "") : "";
      name = colPos.name !== undefined ? (parts[colPos.name] ?? "") : "";
      deptHint = colPos.dept !== undefined ? (parts[colPos.dept] ?? "") : "";
      state = colPos.state !== undefined ? (parts[colPos.state] ?? "") : "";
      lga = colPos.lga !== undefined ? (parts[colPos.lga] ?? "") : "";
      gender = colPos.gender !== undefined ? (parts[colPos.gender] ?? "") : "";
      jambScore =
        colPos.jambScore !== undefined ? (parts[colPos.jambScore] ?? "") : "";
      aggregate =
        colPos.aggregate !== undefined ? (parts[colPos.aggregate] ?? "") : "";
      status =
        colPos.status !== undefined
          ? (parts[colPos.status] ?? "accepted")
          : "accepted";
      level =
        colPos.level !== undefined ? (parts[colPos.level] ?? "100") : "100";
    } else {
      // Heuristic column assignment based on common JAMB printout formats
      // Try to detect if first column is a serial number (pure number or like "1.")
      const firstIsSerial = /^\d+\.?$/.test(parts[0]);
      if (firstIsSerial && parts.length >= 3) {
        snVal = parts[0];
        // Check if second field looks like a JAMB reg number (alphanumeric, 8-12 chars)
        const secondIsReg = /^[A-Z0-9]{6,15}$/i.test(
          parts[1].replace(/[\s-]/g, ""),
        );
        if (secondIsReg) {
          regNo = parts[1];
          name = parts[2] ?? "";
          deptHint = parts[3] ?? "";
          state = parts[4] ?? "";
          lga = parts[5] ?? "";
          gender = parts[6] ?? "";
          jambScore = parts[7] ?? "";
          aggregate = parts[8] ?? "";
          status = parts[9] ?? "accepted";
        } else {
          // No reg number column — S/N, Name, Dept, State...
          name = parts[1] ?? "";
          deptHint = parts[2] ?? "";
          state = parts[3] ?? "";
          lga = parts[4] ?? "";
          gender = parts[5] ?? "";
          status = parts[6] ?? "accepted";
        }
      } else {
        // No serial — assume: RegNo, Name, Dept, State, LGA, Gender...
        const firstIsReg = /^[A-Z0-9]{6,15}$/i.test(
          parts[0].replace(/[\s-]/g, ""),
        );
        if (firstIsReg) {
          regNo = parts[0];
          name = parts[1] ?? "";
          deptHint = parts[2] ?? "";
          state = parts[3] ?? "";
          lga = parts[4] ?? "";
          gender = parts[5] ?? "";
          jambScore = parts[6] ?? "";
          aggregate = parts[7] ?? "";
          status = parts[8] ?? "accepted";
        } else {
          // Fallback: name is first non-trivial field
          name = parts[0];
          deptHint = parts[1] ?? "";
          state = parts[2] ?? "";
          lga = parts[3] ?? "";
          gender = parts[4] ?? "";
          status = parts[5] ?? "accepted";
        }
      }
    }

    // Skip rows that look like headers that slipped through
    if (isHeaderRow(name) || isHeaderRow(regNo)) continue;

    // Normalize gender
    gender = normalizeGender(gender);

    // Clean up status
    if (!status || status.toLowerCase().trim() === "") status = "accepted";
    const knownStatuses = [
      "accepted",
      "active",
      "deferred",
      "graduated",
      "withdrawn",
      "pending",
      "rejected",
    ];
    if (!knownStatuses.includes(status.toLowerCase())) status = "accepted";

    // Normalize level
    const levelMatch = level.match(/(\d{3})/);
    if (levelMatch) level = levelMatch[1];
    else level = "100";

    // Fuzzy match department
    const matchedDept = deptHint
      ? fuzzyMatchDept(deptHint, departments)
      : undefined;

    const row: ParsedStudentRow = {
      sn: snVal || String(sn),
      regNo: regNo.trim(),
      name: name.trim(),
      deptId: matchedDept ? String(matchedDept.id) : "",
      deptName: matchedDept?.name ?? deptHint.trim(),
      level,
      state: state.trim(),
      lga: lga.trim(),
      gender,
      jambScore: jambScore.trim(),
      aggregate: aggregate.trim(),
      status: status.toLowerCase().trim(),
      hasError: !name.trim(),
    };

    results.push(row);
    sn++;
  }

  return results;
}

// ─── Course text parser ───────────────────────────────────────────────────────

function normalizeCourseStatus(s: string): "Core" | "Elective" {
  const u = s.toUpperCase().trim();
  if (u === "C" || u === "CORE" || u === "COMPULSORY" || u === "REQUIRED")
    return "Core";
  if (u === "E" || u === "ELECTIVE" || u === "OPTIONAL") return "Elective";
  return "Core"; // default to Core if unclear
}

function normalizeSemester(s: string): "First" | "Second" {
  const u = s.toUpperCase().trim();
  if (u === "2" || u === "SECOND" || u === "2ND" || u === "II") return "Second";
  return "First";
}

function extractLevelFromCode(code: string): string {
  const normalized = code.replace(/[.\s]/g, "").toUpperCase();
  const m = normalized.match(/[A-Z]+(\d)\d{2}/);
  return m ? `${m[1]}00` : "100";
}

function normalizeCourseCode(raw: string): string {
  return raw.replace(/[.\s]/g, "").toUpperCase();
}

/**
 * Check if lines look like a multi-line block format (code on its own line, title on next, etc.)
 */
function isMultiLineBlockFormat(lines: string[]): boolean {
  const codePattern = /^[A-Z]{2,5}[.\s]*\d{3}$/i;
  let codeMatches = 0;
  for (const l of lines) {
    if (codePattern.test(l.replace(/\s+/g, " ").trim())) codeMatches++;
  }
  return lines.length > 3 && codeMatches / lines.length > 0.12;
}

/**
 * Parse courses from multi-line block format (code on line, title on next line, units on next, status on next).
 */
function parseMultiLineBlocks(
  lines: string[],
  rawText: string,
): ParsedCourseRow[] {
  const codePattern = /^[A-Z]{2,5}[.\s]*\d{3}$/i;
  const noisePattern =
    /^(s\/n|course\s*code|course\s*title|credit|unit|status|total|note[s]?|direct|students|minimum|maximum)/i;

  // Detect semester markers from raw text
  const rawLower = rawText.toLowerCase();
  const semesterMarkers: { pos: number; semester: "First" | "Second" }[] = [];

  // Match patterns like "First Semester 100 Level", "100 LEVEL FIRST SEMESTER COURSES", "Second Semester 200 level"
  const semPatterns = [
    /(?:first|second)\s+semester\s+\d{3}\s*level/gi,
    /\d{3}\s*level\s+(?:first|second)\s+semester/gi,
    /(?:first|second)\s+semester/gi,
  ];
  for (const pattern of semPatterns) {
    const matches = [...rawLower.matchAll(pattern)];
    for (const match of matches) {
      const sem: "First" | "Second" = match[0].includes("second")
        ? "Second"
        : "First";
      semesterMarkers.push({ pos: match.index ?? 0, semester: sem });
    }
    if (semesterMarkers.length > 0) break;
  }

  const results: ParsedCourseRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].replace(/\s+/g, " ").trim();
    if (noisePattern.test(line) || !line) {
      i++;
      continue;
    }
    if (codePattern.test(line)) {
      // Find title (next non-noise line)
      let titleIdx = i + 1;
      while (
        titleIdx < lines.length &&
        (noisePattern.test(lines[titleIdx].trim()) ||
          /^\d+$/.test(lines[titleIdx].trim()))
      )
        titleIdx++;
      const title = lines[titleIdx]?.trim() || "";

      // Find credit units (next pure number)
      let unitsIdx = titleIdx + 1;
      while (unitsIdx < lines.length && !/^\d+$/.test(lines[unitsIdx].trim()))
        unitsIdx++;
      const creditUnits = lines[unitsIdx]?.trim() || "2";

      // Find status (next C/E/Core/Elective)
      let statusIdx = unitsIdx + 1;
      while (
        statusIdx < lines.length &&
        !/^(core|elective|c|e)$/i.test(lines[statusIdx].trim())
      )
        statusIdx++;
      const status = normalizeCourseStatus(lines[statusIdx]?.trim() || "Core");

      // Determine semester from position in text
      const normalizedCode = normalizeCourseCode(line);
      const codePos = rawText.toUpperCase().indexOf(normalizedCode);
      let semester: "First" | "Second" = "First";
      for (const marker of semesterMarkers) {
        if (marker.pos <= codePos) semester = marker.semester;
      }

      if (title) {
        results.push({
          sn: results.length + 1,
          courseCode: normalizedCode,
          title,
          creditUnits,
          level: extractLevelFromCode(line),
          semester,
          status,
        });
      }
      i = Math.max(statusIdx + 1, i + 4);
    } else {
      i++;
    }
  }
  return results;
}

/**
 * Detect level from a heading line like "100 Level First Semester" or "200 LEVEL".
 */
function extractLevelFromHeading(line: string): string | null {
  const m = line.match(/(\d{3})\s*(?:level|l|lev)/i);
  return m ? m[1] : null;
}

/**
 * Parse course rows from pasted/copied text.
 * Handles multi-line block, tab-separated, and comma-separated formats.
 * Auto-detects semester and level from heading lines.
 */
export function parseCourseText(text: string): ParsedCourseRow[] {
  if (!text.trim()) return [];

  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const skipPatterns =
    /^(s\/n|course code|course title|credit unit|unit|title|total|#|note[s]?|^federal|^department|^school)/i;

  const lines = rawLines.filter((l) => !skipPatterns.test(l));

  if (isMultiLineBlockFormat(lines)) {
    return parseMultiLineBlocks(lines, text).filter(
      (r) => r.courseCode && r.title,
    );
  }

  // Determine starting index (skip headers)
  const firstLower = lines[0]?.toLowerCase() || "";
  let startIdx =
    firstLower.includes("course") ||
    firstLower.includes("code") ||
    firstLower.includes("s/n")
      ? 1
      : 0;

  // Track current semester and level from heading lines
  let currentSemester: "First" | "Second" = "First";
  let currentLevel = "100";

  const results: ParsedCourseRow[] = [];

  for (let idx = startIdx; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check if this is a section heading like "First Semester 100 Level Courses"
    const semInLine = /\b(first|second)\s+semester/i.exec(line);
    const levelInLine = extractLevelFromHeading(line);
    if (semInLine) {
      currentSemester = normalizeSemester(semInLine[1]);
      if (levelInLine) currentLevel = levelInLine;
      continue; // don't parse as course row
    }
    if (levelInLine && line.toLowerCase().includes("level")) {
      currentLevel = levelInLine;
      continue;
    }

    const sep = line.includes("\t") ? "\t" : ",";
    const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ""));

    let courseCode = "";
    let title = "";
    let creditUnits = "2";
    let level = currentLevel;
    let semester: "First" | "Second" = currentSemester;
    let statusStr = "C";

    if (parts.length >= 5) {
      const firstIsNum = /^\d+$/.test(parts[0]);
      if (firstIsNum) {
        // S/N, Code, Title, Units, Status
        [, courseCode, title, creditUnits, statusStr] = parts;
        level = parts[5] || currentLevel;
        semester = normalizeSemester(parts[6] || currentSemester);
      } else {
        // Code, Title, Units, Status, Level, Semester
        [courseCode, title, creditUnits, statusStr, level] = parts;
        semester = normalizeSemester(parts[5] || currentSemester);
      }
    } else if (parts.length >= 4) {
      const firstIsNum = /^\d+$/.test(parts[0]);
      if (firstIsNum) {
        // S/N, Code, Title, Units
        [, courseCode, title, creditUnits] = parts;
        statusStr = parts[4] || "C";
      } else {
        [courseCode, title, creditUnits, statusStr] = parts;
      }
    } else if (parts.length >= 3) {
      [courseCode, title, creditUnits] = parts;
      statusStr = parts[3] || "C";
    } else if (parts.length >= 2) {
      [courseCode, title] = parts;
    } else {
      continue;
    }

    if (!courseCode) continue;

    const normalizedCode = normalizeCourseCode(courseCode);
    if (!normalizedCode.match(/[A-Z]{2,}/)) continue; // skip if code has no letters

    // Extract level from course code if not already set
    if (!level || level === currentLevel) {
      const codeLevel = extractLevelFromCode(courseCode);
      level = codeLevel;
    }

    const row: ParsedCourseRow = {
      sn: results.length + 1,
      courseCode: normalizedCode,
      title: title.trim(),
      creditUnits: creditUnits.trim() || "2",
      level: level || "100",
      semester,
      status: normalizeCourseStatus(statusStr),
    };

    if (row.courseCode && row.title) {
      results.push(row);
    }
  }

  return results;
}
