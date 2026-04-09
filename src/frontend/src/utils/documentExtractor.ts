/**
 * documentExtractor.ts
 * Shared utility for extracting student rows and course rows from pasted/uploaded text.
 * Also handles file-based extraction: CSV (BOM-safe), Excel (xlsx), TXT, PDF guidance.
 * Used by BulkRegistrationTab, JambAdmissionScannerTab, CourseScanImportModal, and UniversalFileUpload.
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

export type ExtractedFileResult =
  | { type: "rows"; rows: string[][]; headers: string[] }
  | { type: "text"; text: string }
  | { type: "image"; dataUrl: string; name: string }
  | { type: "word_guidance"; fileName: string }
  | { type: "unsupported"; fileType: string; fileName: string };

type Department = { id: bigint | number; name: string };

// ─── File-based extraction ────────────────────────────────────────────────────

/**
 * Extract rows from a CSV file — handles BOM, Windows line endings, quoted fields.
 */
export function extractFromCSV(text: string): string[][] {
  // Remove BOM if present
  const clean = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = clean.split("\n");
  const results: string[][] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const fields = parseCSVLine(line);
    if (fields.length > 0) results.push(fields);
  }
  return results;
}

/**
 * Parse a single CSV line handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Extract rows from an Excel file using SheetJS (xlsx).
 * Returns a 2D array of string values.
 */
export async function extractFromExcel(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  // Use first non-empty sheet
  let sheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const range = sheet["!ref"];
    if (range) {
      sheetName = name;
      break;
    }
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  // Convert to array of objects, then to 2D array
  const jsonData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number | boolean | null)[][];

  return jsonData.map((row) =>
    row.map((cell) => (cell == null ? "" : String(cell).trim())),
  );
}

/**
 * Read a plain text file and return its contents.
 */
export async function extractFromText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Read an image file as a data URL.
 */
export async function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

/**
 * Classify and extract from any uploaded file.
 * Returns a typed ExtractedFileResult the caller can handle.
 */
export async function extractFromFile(
  file: File,
): Promise<ExtractedFileResult> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  // CSV
  if (name.endsWith(".csv") || type === "text/csv") {
    const text = await extractFromText(file);
    const rows = extractFromCSV(text);
    const headers = rows[0] ?? [];
    return { type: "rows", rows: rows.slice(1), headers };
  }

  // Excel
  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    type.includes("spreadsheetml") ||
    type.includes("ms-excel")
  ) {
    const rows = await extractFromExcel(file);
    const headers = rows[0]?.map(String) ?? [];
    return { type: "rows", rows: rows.slice(1), headers };
  }

  // Plain text
  if (name.endsWith(".txt") || type === "text/plain") {
    const text = await extractFromText(file);
    return { type: "text", text };
  }

  // Images
  if (
    name.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/) ||
    type.startsWith("image/")
  ) {
    const dataUrl = await readImageAsDataUrl(file);
    return { type: "image", dataUrl, name: file.name };
  }

  // Word / Office docs
  if (
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".odt") ||
    type.includes("word") ||
    type.includes("officedocument.wordprocessing")
  ) {
    return { type: "word_guidance", fileName: file.name };
  }

  // PDF — guide user to copy-paste since we can't parse client-side without pdfjs bundling
  if (name.endsWith(".pdf") || type === "application/pdf") {
    return { type: "word_guidance", fileName: file.name };
  }

  return {
    type: "unsupported",
    fileType: (file.type || name.split(".").pop()) ?? "unknown",
    fileName: file.name,
  };
}

/**
 * Convert rows[][]/headers[] from extractFromFile into text that parseStudentText can consume.
 */
export function rowsToStudentText(rows: string[][], headers: string[]): string {
  if (rows.length === 0) return "";
  const headerLine = headers.join("\t");
  const dataLines = rows.map((r) => r.join("\t"));
  return [headerLine, ...dataLines].join("\n");
}

/**
 * Convert rows[][]/headers[] from extractFromFile into text that parseCourseText can consume.
 */
export function rowsToCourseText(rows: string[][], headers: string[]): string {
  if (rows.length === 0) return "";
  const headerLine = headers.join("\t");
  const dataLines = rows.map((r) => r.join("\t"));
  return [headerLine, ...dataLines].join("\n");
}

// ─── Department fuzzy match ───────────────────────────────────────────────────

/**
 * Fuzzy match a department by name.
 */
export function fuzzyMatchDept(
  name: string,
  departments: Department[],
): Department | undefined {
  if (!name || !departments.length) return undefined;
  const norm = (s: string) => s.toLowerCase().trim();
  const search = norm(name);

  const exact = departments.find((d) => norm(d.name) === search);
  if (exact) return exact;

  const contains = departments.find((d) => norm(d.name).includes(search));
  if (contains) return contains;

  const reverse = departments.find((d) => search.includes(norm(d.name)));
  if (reverse) return reverse;

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

  const firstWord = search.split(/\s+/)[0];
  if (firstWord && firstWord.length > 2) {
    const firstWordMatch = departments.find((d) =>
      norm(d.name).includes(firstWord),
    );
    if (firstWordMatch) return firstWordMatch;
  }

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
  if (/^\d+\.?$/.test(t)) return true;
  return false;
}

function detectSeparator(line: string): string {
  if (line.includes("\t")) return "\t";
  if (line.includes(",")) return ",";
  return "multi-space";
}

function splitLine(line: string, sep: string): string[] {
  if (sep === "\t") return line.split("\t").map((c) => c.trim());
  if (sep === ",")
    return line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  return line
    .split(/\s{2,}/)
    .map((c) => c.trim())
    .filter(Boolean);
}

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

function normalizeGender(g: string): string {
  const u = g.toUpperCase().trim();
  if (u === "M" || u === "MALE") return "Male";
  if (u === "F" || u === "FEMALE") return "Female";
  return g;
}

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

  const firstDataLine =
    rawLines.find((l) => !isHeaderRow(l) && !isBlankOrTotal(l)) ?? rawLines[0];
  const sep = detectSeparator(firstDataLine);

  let headerLine = "";
  let dataStartIdx = 0;
  for (let i = 0; i < Math.min(3, rawLines.length); i++) {
    if (isHeaderRow(rawLines[i])) {
      headerLine = rawLines[i];
      dataStartIdx = i + 1;
      break;
    }
  }

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
      const firstIsSerial = /^\d+\.?$/.test(parts[0]);
      if (firstIsSerial && parts.length >= 3) {
        snVal = parts[0];
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
          name = parts[1] ?? "";
          deptHint = parts[2] ?? "";
          state = parts[3] ?? "";
          lga = parts[4] ?? "";
          gender = parts[5] ?? "";
          status = parts[6] ?? "accepted";
        }
      } else {
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
          name = parts[0];
          deptHint = parts[1] ?? "";
          state = parts[2] ?? "";
          lga = parts[3] ?? "";
          gender = parts[4] ?? "";
          status = parts[5] ?? "accepted";
        }
      }
    }

    if (isHeaderRow(name) || isHeaderRow(regNo)) continue;

    gender = normalizeGender(gender);

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

    const levelMatch = level.match(/(\d{3})/);
    if (levelMatch) level = levelMatch[1];
    else level = "100";

    const matchedDept = deptHint
      ? fuzzyMatchDept(deptHint, departments)
      : undefined;

    results.push({
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
    });
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
  return "Core";
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

function isMultiLineBlockFormat(lines: string[]): boolean {
  const codePattern = /^[A-Z]{2,5}[.\s]*\d{3}$/i;
  let codeMatches = 0;
  for (const l of lines) {
    if (codePattern.test(l.replace(/\s+/g, " ").trim())) codeMatches++;
  }
  return lines.length > 3 && codeMatches / lines.length > 0.12;
}

function parseMultiLineBlocks(
  lines: string[],
  rawText: string,
): ParsedCourseRow[] {
  const codePattern = /^[A-Z]{2,5}[.\s]*\d{3}$/i;
  const noisePattern =
    /^(s\/n|course\s*code|course\s*title|credit|unit|status|total|note[s]?|direct|students|minimum|maximum)/i;

  const rawLower = rawText.toLowerCase();
  const semesterMarkers: { pos: number; semester: "First" | "Second" }[] = [];

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
      let titleIdx = i + 1;
      while (
        titleIdx < lines.length &&
        (noisePattern.test(lines[titleIdx].trim()) ||
          /^\d+$/.test(lines[titleIdx].trim()))
      )
        titleIdx++;
      const title = lines[titleIdx]?.trim() || "";

      let unitsIdx = titleIdx + 1;
      while (unitsIdx < lines.length && !/^\d+$/.test(lines[unitsIdx].trim()))
        unitsIdx++;
      const creditUnits = lines[unitsIdx]?.trim() || "2";

      let statusIdx = unitsIdx + 1;
      while (
        statusIdx < lines.length &&
        !/^(core|elective|c|e)$/i.test(lines[statusIdx].trim())
      )
        statusIdx++;
      const status = normalizeCourseStatus(lines[statusIdx]?.trim() || "Core");

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

function extractLevelFromHeading(line: string): string | null {
  const m = line.match(/(\d{3})\s*(?:level|l|lev)/i);
  return m ? m[1] : null;
}

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

  const firstLower = lines[0]?.toLowerCase() || "";
  let startIdx =
    firstLower.includes("course") ||
    firstLower.includes("code") ||
    firstLower.includes("s/n")
      ? 1
      : 0;

  let currentSemester: "First" | "Second" = "First";
  let currentLevel = "100";
  const results: ParsedCourseRow[] = [];

  for (let idx = startIdx; idx < lines.length; idx++) {
    const line = lines[idx];
    const semInLine = /\b(first|second)\s+semester/i.exec(line);
    const levelInLine = extractLevelFromHeading(line);
    if (semInLine) {
      currentSemester = normalizeSemester(semInLine[1]);
      if (levelInLine) currentLevel = levelInLine;
      continue;
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
        [, courseCode, title, creditUnits, statusStr] = parts;
        level = parts[5] || currentLevel;
        semester = normalizeSemester(parts[6] || currentSemester);
      } else {
        [courseCode, title, creditUnits, statusStr, level] = parts;
        semester = normalizeSemester(parts[5] || currentSemester);
      }
    } else if (parts.length >= 4) {
      const firstIsNum = /^\d+$/.test(parts[0]);
      if (firstIsNum) {
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
    if (!normalizedCode.match(/[A-Z]{2,}/)) continue;

    if (!level || level === currentLevel) {
      level = extractLevelFromCode(courseCode);
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

    if (row.courseCode && row.title) results.push(row);
  }

  return results;
}
