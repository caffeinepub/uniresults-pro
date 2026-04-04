import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, GraduationCap, Printer, Search } from "lucide-react";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StoredStudent {
  id: string | number;
  name: string;
  matricNumber?: string;
  matricNo?: string;
  regNo?: string;
  departmentId?: string | number;
  level?: number | string;
  programmeType?: string;
  programme?: string;
  subjectCombination?: string;
  studyMode?: string;
  entryMode?: string;
}

interface StoredResult {
  id: string | number;
  studentId: string | number;
  courseId: string | number;
  caScore?: number;
  examScore?: number;
  totalScore?: number;
  grade?: string;
  gradePoint?: number;
  status: string;
  _level?: number;
}

interface StoredCourse {
  id: string | number;
  code?: string;
  name?: string;
  title?: string;
  creditUnits?: number | string;
  level?: number | string;
  semester?: string;
  departmentId?: string | number;
}

interface StoredDepartment {
  id: string | number;
  name: string;
  facultyId?: string | number;
}

interface StoredFaculty {
  id: string | number;
  name: string;
}

interface StoredSettings {
  name?: string;
  institutionType?: string;
  academicYear?: string;
}

// ─── Grading helpers ─────────────────────────────────────────────────────────
function calcGrade(
  score: number,
  type: string,
): { grade: string; gp: number; remark: string } {
  if (type === "NCE") {
    if (score >= 70) return { grade: "A", gp: 4.0, remark: "Distinction" };
    if (score >= 60) return { grade: "B", gp: 3.0, remark: "Credit" };
    if (score >= 50) return { grade: "C", gp: 2.0, remark: "Merit" };
    if (score >= 45) return { grade: "D", gp: 1.0, remark: "Pass" };
    return { grade: "F", gp: 0.0, remark: "Fail" };
  }
  // University / Polytechnic
  if (score >= 70) return { grade: "A", gp: 5.0, remark: "Excellent" };
  if (score >= 60) return { grade: "B", gp: 4.0, remark: "Very Good" };
  if (score >= 50) return { grade: "C", gp: 3.0, remark: "Good" };
  if (score >= 45) return { grade: "D", gp: 2.0, remark: "Pass" };
  if (score >= 40) return { grade: "E", gp: 1.0, remark: "Pass" };
  return { grade: "F", gp: 0.0, remark: "Fail" };
}

function cgpaLabel(cgpa: number): { grade: string; remark: string } {
  if (cgpa >= 4.5) return { grade: "A", remark: "Distinction" };
  if (cgpa >= 3.5) return { grade: "B", remark: "Credit" };
  if (cgpa >= 2.5) return { grade: "C", remark: "Merit" };
  if (cgpa >= 2.0) return { grade: "D", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}

// ─── Level labels ─────────────────────────────────────────────────────────────
function levelLabel(level: number, type: string): string {
  const t = type.toLowerCase();
  if (t === "nce") {
    if (level === 100) return "NCE 1 (100 Level)";
    if (level === 200) return "NCE 2 (200 Level)";
    if (level === 300) return "NCE 3 (300 Level)";
    return `NCE ${Math.floor(level / 100)}`;
  }
  if (t === "polytechnic") {
    if (level === 100) return "ND 1 (100 Level)";
    if (level === 200) return "ND 2 (200 Level)";
    if (level === 300) return "HND 1 (300 Level)";
    if (level === 400) return "HND 2 (400 Level)";
    return `Level ${level}`;
  }
  return `${level} Level`;
}

// ─── Record title helper ─────────────────────────────────────────────────────
function getPublicRecordTitle(institutionType: string): string {
  const t = institutionType.toLowerCase();
  if (t === "nce") return "NCE STUDENT ACADEMIC RECORD";
  if (t === "polytechnic") return "ND/HND STUDENT ACADEMIC RECORD";
  return "STUDENT ACADEMIC RECORD"; // UG / University
}

// ─── Subject groups ───────────────────────────────────────────────────────────
const SUBJECT_GROUPS = [
  { key: "EDU", label: "EDU", prefixes: ["EDU", "SED"], color: "#1d4ed8" },
  {
    key: "GSE",
    label: "GSE",
    prefixes: ["GST", "GSE", "ENT"],
    color: "#7c3aed",
  },
  {
    key: "CSC",
    label: "CSC",
    prefixes: ["CSC", "COS", "IFT", "SEN", "CBY", "ICT", "DTS"],
    color: "#065f46",
  },
  { key: "BIO", label: "BIO", prefixes: ["BIO", "MCB"], color: "#3f6212" },
  { key: "CHE", label: "CHE", prefixes: ["CHM", "CHE"], color: "#9a3412" },
  { key: "PHY", label: "PHY", prefixes: ["PHY"], color: "#0369a1" },
  { key: "MTH", label: "MTH", prefixes: ["MTH", "STA"], color: "#be185d" },
  { key: "ENG", label: "ENG", prefixes: ["ENG"], color: "#92400e" },
  { key: "AGR", label: "AGR", prefixes: ["AGR"], color: "#166534" },
];

interface LevelRow {
  sn: number;
  code: string;
  title: string;
  credit: number;
  ca: number;
  exam: number;
  score: number;
  grade: string;
  gp: number;
}

interface LevelSummary {
  tco: number;
  tcp: number;
  tgp: number;
  cgpa: number;
  grade: string;
  remark: string;
}

function computeSummary(rows: LevelRow[]): LevelSummary {
  let tco = 0;
  let tcp = 0;
  let tgp = 0;
  for (const r of rows) {
    tco += r.credit;
    if (r.grade !== "F") tcp += r.credit;
    tgp += r.credit * r.gp;
  }
  const cgpa = tco > 0 ? tgp / tco : 0;
  const { grade, remark } = cgpaLabel(cgpa);
  return {
    tco,
    tcp,
    tgp: Number(tgp.toFixed(2)),
    cgpa: Number(cgpa.toFixed(2)),
    grade,
    remark,
  };
}

function computeForPrefixes(
  rows: LevelRow[],
  prefixes: string[],
): LevelSummary | null {
  const filtered = rows.filter((r) =>
    prefixes.some((p) => r.code.toUpperCase().startsWith(p.toUpperCase())),
  );
  if (filtered.length === 0) return null;
  return computeSummary(filtered);
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────
function SummaryRow({
  label,
  summary,
  color,
}: { label: string; summary: LevelSummary; color?: string }) {
  return (
    <tr style={{ backgroundColor: color ? `${color}12` : "#f9fafb" }}>
      <td
        colSpan={2}
        className="border border-gray-300 px-2 py-1 font-bold text-xs"
        style={{ color: color ?? "inherit" }}
      >
        {label}
      </td>
      <td className="border border-gray-300 px-2 py-1 text-xs text-center font-semibold">
        {summary.tco}
      </td>
      <td className="border border-gray-300 px-2 py-1 text-xs text-center" />
      <td className="border border-gray-300 px-2 py-1 text-xs text-center" />
      <td className="border border-gray-300 px-2 py-1 text-xs text-center font-bold">
        TCO={summary.tco} TCP={summary.tcp} TGP={summary.tgp}
      </td>
      <td className="border border-gray-300 px-2 py-1 text-xs text-center font-bold">
        {summary.cgpa.toFixed(2)}
      </td>
      <td
        className="border border-gray-300 px-2 py-1 text-xs text-center font-bold"
        style={{ color: summary.remark === "Fail" ? "#dc2626" : "#16a34a" }}
      >
        {summary.grade}
      </td>
    </tr>
  );
}

function TotalsRow({
  label,
  summary,
}: { label: string; summary: LevelSummary }) {
  return (
    <div className="mt-2 mb-3 rounded border border-gray-300 bg-gray-50 px-4 py-2 flex flex-wrap gap-4 text-xs font-mono print:text-[10px]">
      <span className="font-bold min-w-[10rem]">{label}:</span>
      <span>
        TCO = <strong>{summary.tco}</strong>
      </span>
      <span>
        TCP = <strong>{summary.tcp}</strong>
      </span>
      <span>
        TGP = <strong>{summary.tgp}</strong>
      </span>
      <span>
        CGPA = <strong>{summary.cgpa.toFixed(2)}</strong>
      </span>
      <span>
        GRADE = <strong>{summary.grade}</strong>
      </span>
      <span>
        REMARK ={" "}
        <strong
          style={{ color: summary.remark === "Fail" ? "#dc2626" : "#16a34a" }}
        >
          {summary.remark}
        </strong>
      </span>
    </div>
  );
}

// ─── Read localStorage ────────────────────────────────────────────────────────
function readLS<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLSObj<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PublicResultsPage() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [record, setRecord] = useState<null | {
    student: StoredStudent;
    levelResults: Record<number, LevelRow[]>;
    deptName: string;
    facultyName: string;
    institutionName: string;
    institutionType: string;
    academicYear: string;
  }>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    setSearched(true);
    setNotFound(false);
    setRecord(null);

    const students = readLS<StoredStudent>("uni_students");
    const allResults = readLS<StoredResult>("uni_results");
    const courses = readLS<StoredCourse>("uni_courses");
    const departments = readLS<StoredDepartment>("uni_departments");
    const faculties = readLS<StoredFaculty>("uni_faculties");
    const settings = readLSObj<StoredSettings>("uni_settings");

    const student = students.find((s) => {
      const matric = (
        s.matricNumber ??
        s.matricNo ??
        s.regNo ??
        ""
      ).toLowerCase();
      const jamb = (s as any).jambRegNo?.toLowerCase() ?? "";
      return matric === q || jamb === q;
    });

    if (!student) {
      setNotFound(true);
      return;
    }

    const publishedResults = allResults.filter(
      (r) =>
        String(r.studentId) === String(student.id) && r.status === "published",
    );

    if (publishedResults.length === 0) {
      setNotFound(true);
      return;
    }

    const instType = settings?.institutionType ?? "University";
    const instName =
      settings?.name ?? "Federal University of Education, Kontagora";
    const academicYear = settings?.academicYear ?? "2024/2025";

    const dept = departments.find(
      (d) => String(d.id) === String(student.departmentId),
    );
    const faculty = faculties.find(
      (f) => String(f.id) === String(dept?.facultyId),
    );
    const deptName =
      dept?.name ?? (student as any).department ?? "General Studies Education";
    const facultyName = faculty?.name ?? "School of General Studies Education";

    const byLevel: Record<number, LevelRow[]> = {};

    for (const r of publishedResults) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const credit = Number(course?.creditUnits ?? 2);
      const score = r.totalScore ?? 0;
      const { grade, gp } = calcGrade(score, instType);

      let level: number;
      if (r._level) {
        level = r._level;
      } else if (course) {
        const match = (course.code ?? "").match(/(\d+)/);
        const codeNum = match ? Number(match[1]) : 0;
        level = Math.floor(codeNum / 100) * 100;
        if (level < 100 || level > 900) level = Number(student.level) || 100;
      } else {
        level = Number(student.level) || 100;
      }

      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push({
        sn: byLevel[level].length + 1,
        code: course?.code ?? `CRSE${String(r.courseId).slice(-3)}`,
        title: course?.name ?? course?.title ?? "Course Title",
        credit,
        ca: r.caScore ?? 0,
        exam: r.examScore ?? 0,
        score,
        grade: r.grade ?? grade,
        gp: r.gradePoint ?? gp,
      });
    }

    // Re-number
    for (const level of Object.keys(byLevel)) {
      byLevel[Number(level)] = byLevel[Number(level)].map((row, idx) => ({
        ...row,
        sn: idx + 1,
      }));
    }

    setRecord({
      student,
      levelResults: byLevel,
      deptName,
      facultyName,
      institutionName: instName,
      institutionType: instType,
      academicYear,
    });
  };

  const handlePrint = () => window.print();

  const renderRecord = () => {
    if (!record) return null;
    const {
      student,
      levelResults,
      deptName,
      facultyName,
      institutionName,
      institutionType,
      academicYear,
    } = record;
    const levels = Object.keys(levelResults)
      .map(Number)
      .sort((a, b) => a - b);
    const allRows = levels.flatMap((l) => levelResults[l] ?? []);
    const cumulative = computeSummary(allRows);
    const studyMode = (student as any).studyMode ?? "Full Time";
    const matricNo =
      student.matricNumber ?? student.matricNo ?? student.regNo ?? "—";
    const subjectComb =
      student.programme ??
      student.subjectCombination ??
      student.programmeType ??
      deptName;

    return (
      <div
        id="printable-record"
        className="bg-white border border-gray-300 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-400 max-w-4xl mx-auto mt-6"
      >
        {/* Header */}
        <div className="text-center px-8 pt-8 pb-5 border-b border-gray-200 space-y-1">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-lg font-bold uppercase tracking-wider text-gray-900">
            {institutionName}
          </h1>
          <p className="text-sm font-semibold text-gray-600">{facultyName}</p>
          <p className="text-xs text-gray-500">
            {academicYear} Academic Session
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Badge
              className={
                studyMode === "Distance Learning"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : studyMode === "Part Time"
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : "bg-blue-100 text-blue-800 border-blue-300"
              }
            >
              {studyMode}
            </Badge>
          </div>
          <h2 className="text-base font-bold uppercase tracking-widest text-blue-900 pt-1">
            {getPublicRecordTitle(institutionType)}
          </h2>
        </div>

        <div className="px-8 py-5 space-y-5">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm border border-gray-200 rounded p-4 bg-gray-50">
            <div>
              <span className="text-gray-500">Name: </span>
              <span className="font-semibold">{student.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Matric No: </span>
              <span className="font-semibold font-mono">{matricNo}</span>
            </div>
            <div>
              <span className="text-gray-500">Subject Combination: </span>
              <span className="font-semibold">{subjectComb}</span>
            </div>
            <div>
              <span className="text-gray-500">Department: </span>
              <span className="font-semibold">{deptName}</span>
            </div>
          </div>

          {/* Level Sections */}
          {levels.map((level) => {
            const rows = levelResults[level] ?? [];
            const summary = computeSummary(rows);
            const lbl = levelLabel(level, institutionType);

            const hasCsc = rows.some((r) =>
              ["CSC", "COS", "IFT", "SEN", "CBY", "ICT", "DTS"].some((p) =>
                r.code.toUpperCase().startsWith(p),
              ),
            );
            const hasChe = rows.some((r) =>
              ["CHM", "CHE"].some((p) => r.code.toUpperCase().startsWith(p)),
            );

            return (
              <div key={level}>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 px-2">
                    {lbl}
                  </span>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse print:text-[10px]">
                    <thead>
                      <tr className="bg-blue-900 text-white">
                        <th className="border border-gray-300 px-2 py-1.5 text-left w-8">
                          S/N
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left">
                          Course Code
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-left">
                          Course Title
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">
                          Credit
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">
                          CA
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">
                          Exam
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">
                          Total
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">
                          Grade
                        </th>
                        <th className="border border-gray-300 px-2 py-1.5 text-center">
                          GP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.sn}
                          className={
                            row.sn % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }
                        >
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {row.sn}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-mono">
                            {row.code}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            {row.title}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {row.credit}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {row.ca}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {row.exam}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center font-semibold">
                            {row.score}
                          </td>
                          <td
                            className={`border border-gray-300 px-2 py-1 text-center font-bold ${row.grade === "F" ? "text-red-600" : row.grade === "A" ? "text-green-700" : ""}`}
                          >
                            {row.grade}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {row.gp.toFixed(1)}
                          </td>
                        </tr>
                      ))}

                      {/* Per-subject rows */}
                      {SUBJECT_GROUPS.map((group) => {
                        if (
                          (group.key === "CSC" || group.key === "CHE") &&
                          hasCsc &&
                          hasChe
                        )
                          return null;
                        const s = computeForPrefixes(rows, group.prefixes);
                        if (!s) return null;
                        return (
                          <SummaryRow
                            key={group.key}
                            label={group.label}
                            summary={s}
                            color={group.color}
                          />
                        );
                      })}

                      {/* CSC/CHE combined */}
                      {hasCsc &&
                        hasChe &&
                        (() => {
                          const s = computeForPrefixes(rows, [
                            "CSC",
                            "COS",
                            "IFT",
                            "SEN",
                            "CBY",
                            "ICT",
                            "DTS",
                            "CHM",
                            "CHE",
                          ]);
                          if (!s) return null;
                          return (
                            <SummaryRow
                              key="CSC/CHE"
                              label="CSC/CHE"
                              summary={s}
                              color="#0f766e"
                            />
                          );
                        })()}
                    </tbody>
                  </table>
                </div>

                <TotalsRow label={`${lbl} — Total`} summary={summary} />
              </div>
            );
          })}

          {/* Cumulative */}
          {allRows.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-6">
                <div className="flex-1 h-0.5 bg-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-900 px-3">
                  CUMULATIVE
                </span>
                <div className="flex-1 h-0.5 bg-gray-400" />
              </div>

              {/* Cumulative per-subject */}
              <div className="space-y-1">
                {(() => {
                  const hasCscAll = allRows.some((r) =>
                    ["CSC", "COS", "IFT", "SEN", "CBY", "ICT", "DTS"].some(
                      (p) => r.code.toUpperCase().startsWith(p),
                    ),
                  );
                  const hasCheAll = allRows.some((r) =>
                    ["CHM", "CHE"].some((p) =>
                      r.code.toUpperCase().startsWith(p),
                    ),
                  );
                  return (
                    <>
                      {SUBJECT_GROUPS.map((group) => {
                        if (
                          (group.key === "CSC" || group.key === "CHE") &&
                          hasCscAll &&
                          hasCheAll
                        )
                          return null;
                        const s = computeForPrefixes(allRows, group.prefixes);
                        if (!s) return null;
                        return (
                          <div
                            key={group.key}
                            className="rounded border px-4 py-1.5 flex flex-wrap gap-4 text-xs font-mono"
                            style={{
                              backgroundColor: `${group.color}12`,
                              borderColor: `${group.color}40`,
                            }}
                          >
                            <span
                              className="font-bold min-w-[4rem]"
                              style={{ color: group.color }}
                            >
                              {group.label}:
                            </span>
                            <span>
                              TCO = <strong>{s.tco}</strong>
                            </span>
                            <span>
                              TCP = <strong>{s.tcp}</strong>
                            </span>
                            <span>
                              TGP = <strong>{s.tgp}</strong>
                            </span>
                            <span>
                              CGPA = <strong>{s.cgpa.toFixed(2)}</strong>
                            </span>
                            <span>
                              GRADE = <strong>{s.grade}</strong>
                            </span>
                            <span>
                              REMARK ={" "}
                              <strong
                                style={{
                                  color:
                                    s.remark === "Fail" ? "#dc2626" : "#16a34a",
                                }}
                              >
                                {s.remark}
                              </strong>
                            </span>
                          </div>
                        );
                      })}
                      {hasCscAll &&
                        hasCheAll &&
                        (() => {
                          const s = computeForPrefixes(allRows, [
                            "CSC",
                            "COS",
                            "IFT",
                            "SEN",
                            "CBY",
                            "ICT",
                            "DTS",
                            "CHM",
                            "CHE",
                          ]);
                          if (!s) return null;
                          return (
                            <div
                              className="rounded border px-4 py-1.5 flex flex-wrap gap-4 text-xs font-mono"
                              style={{
                                backgroundColor: "#0f766e12",
                                borderColor: "#0f766e40",
                              }}
                            >
                              <span
                                className="font-bold min-w-[4rem]"
                                style={{ color: "#0f766e" }}
                              >
                                CSC/CHE:
                              </span>
                              <span>
                                TCO = <strong>{s.tco}</strong>
                              </span>
                              <span>
                                TCP = <strong>{s.tcp}</strong>
                              </span>
                              <span>
                                TGP = <strong>{s.tgp}</strong>
                              </span>
                              <span>
                                CGPA = <strong>{s.cgpa.toFixed(2)}</strong>
                              </span>
                              <span>
                                GRADE = <strong>{s.grade}</strong>
                              </span>
                              <span>
                                REMARK ={" "}
                                <strong
                                  style={{
                                    color:
                                      s.remark === "Fail"
                                        ? "#dc2626"
                                        : "#16a34a",
                                  }}
                                >
                                  {s.remark}
                                </strong>
                              </span>
                            </div>
                          );
                        })()}
                    </>
                  );
                })()}
              </div>

              <TotalsRow label="Cumulative Total" summary={cumulative} />
            </>
          )}
        </div>

        {/* Print button */}
        <div className="px-8 pb-6 flex justify-end no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            data-ocid="public_results.print.button"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Record
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8 no-print">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-900 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Public Result Lookup
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your matric number or JAMB registration number to view your
            published academic record.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Results are only shown after official publication by the
            institution.
          </p>
        </div>

        {/* Search box */}
        <div className="no-print">
          <Card className="p-6 max-w-xl mx-auto shadow-sm">
            <div className="flex gap-3">
              <Input
                placeholder="Enter matric number (e.g. CSE/2024/001)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
                data-ocid="public_results.search_input"
              />
              <Button
                onClick={handleSearch}
                data-ocid="public_results.search_button"
              >
                <Search className="w-4 h-4 mr-1.5" />
                Search
              </Button>
            </div>
          </Card>
        </div>

        {/* Not found */}
        {searched && notFound && (
          <div
            className="text-center mt-10 text-gray-500 no-print"
            data-ocid="public_results.error_state"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-700">
              No published results found
            </p>
            <p className="text-sm mt-1">
              No published results found for <strong>{query}</strong>.
            </p>
            <p className="text-xs mt-1 text-gray-400">
              Results are only visible after official publication. Please check
              back later or contact your institution.
            </p>
          </div>
        )}

        {/* Record */}
        {record && renderRecord()}

        {/* Footer */}
        <div className="text-center mt-10 text-xs text-gray-400 no-print">
          <a href="/" className="text-blue-600 hover:underline mr-4">
            ← Back to Login
          </a>
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
