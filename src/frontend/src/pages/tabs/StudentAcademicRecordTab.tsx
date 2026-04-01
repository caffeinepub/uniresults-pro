import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Printer, User } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type ExtendedCourse,
  type ExtendedResult,
  type ExtendedStudent,
  getStudentDepartment,
  useApp,
} from "../../context/AppContext";

// ─── NCE Grading Scale ────────────────────────────────────────────────────────
function nceGrade(score: number): {
  grade: string;
  gp: number;
  remark: string;
} {
  if (score >= 70) return { grade: "A", gp: 4.0, remark: "Distinction" };
  if (score >= 60) return { grade: "B", gp: 3.0, remark: "Credit" };
  if (score >= 50) return { grade: "C", gp: 2.0, remark: "Merit" };
  if (score >= 45) return { grade: "D", gp: 1.0, remark: "Pass" };
  return { grade: "F", gp: 0.0, remark: "Fail" };
}

function cgpaGradeRemark(cgpa: number): { grade: string; remark: string } {
  if (cgpa >= 3.5) return { grade: "A", remark: "Distinction" };
  if (cgpa >= 3.0) return { grade: "B", remark: "Credit" };
  if (cgpa >= 2.5) return { grade: "C", remark: "Merit" };
  if (cgpa >= 2.0) return { grade: "D", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}

// ─── NCE Departments ─────────────────────────────────────────────────────────
const NCE_DEPARTMENTS = [
  { code: "ALL", label: "All Departments" },
  { code: "EDU", label: "Education (EDU)" },
  { code: "GSE", label: "General Studies Education (GSE)" },
  { code: "CSC", label: "Computer Science (CSC)" },
  { code: "ISC", label: "Integrated Science (ISC)" },
  { code: "ISS", label: "Integrated Social Studies (ISS)" },
  { code: "BIO", label: "Biology Education (BIO)" },
  { code: "CHM", label: "Chemistry Education (CHM)" },
  { code: "PHY", label: "Physics Education (PHY)" },
  { code: "MTH", label: "Mathematics Education (MTH)" },
  { code: "ENG", label: "English Education (ENG)" },
  { code: "AGR", label: "Agriculture Education (AGR)" },
];

// ─── NCE Level Labels ─────────────────────────────────────────────────────────
const NCE_LEVELS: Record<number, string> = {
  100: "NCE 1 (100 Level)",
  200: "NCE 2 (200 Level)",
  300: "NCE 3 (300 Level)",
};

// ─── Subject prefix mapping ───────────────────────────────────────────────────
const SUBJECT_GROUPS: Array<{
  key: string;
  label: string;
  prefixes: string[];
  bgClass: string;
  borderClass: string;
}> = [
  {
    key: "EDU",
    label: "EDU",
    prefixes: ["EDU", "SED"],
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    borderClass: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "GSE",
    label: "GSE",
    prefixes: ["GST", "GSE", "ENT"],
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    borderClass: "border-purple-200 dark:border-purple-800",
  },
  {
    key: "CSC",
    label: "CSC",
    prefixes: ["CSC", "COS", "IFT", "SEN", "CBY", "ICT", "DTS"],
    bgClass: "bg-green-50 dark:bg-green-950/30",
    borderClass: "border-green-200 dark:border-green-800",
  },
  {
    key: "CHE",
    label: "CHE",
    prefixes: ["CHM", "CHE"],
    bgClass: "bg-orange-50 dark:bg-orange-950/30",
    borderClass: "border-orange-200 dark:border-orange-800",
  },
  {
    key: "BIO",
    label: "BIO",
    prefixes: ["BIO", "MCB"],
    bgClass: "bg-lime-50 dark:bg-lime-950/30",
    borderClass: "border-lime-200 dark:border-lime-800",
  },
  {
    key: "PHY",
    label: "PHY",
    prefixes: ["PHY"],
    bgClass: "bg-sky-50 dark:bg-sky-950/30",
    borderClass: "border-sky-200 dark:border-sky-800",
  },
  {
    key: "MTH",
    label: "MTH",
    prefixes: ["MTH", "STA"],
    bgClass: "bg-pink-50 dark:bg-pink-950/30",
    borderClass: "border-pink-200 dark:border-pink-800",
  },
];

const CSC_CHE_GROUP = {
  key: "CSC/CHE",
  label: "CSC/CHE",
  bgClass: "bg-teal-50 dark:bg-teal-950/30",
  borderClass: "border-teal-200 dark:border-teal-800",
};

// ─── Sample NCE data generator ───────────────────────────────────────────────
function makeSampleNceData(
  student: ExtendedStudent,
  allCourses: ExtendedCourse[],
): ExtendedResult[] {
  const dept = (student as any).department ?? "GSE";
  const levelScores: Record<number, number[]> = {
    100: [72, 65, 55, 78, 47, 80, 61, 58, 73],
    200: [68, 74, 52, 63, 70, 45, 81, 57],
    300: [75, 60, 83, 50, 67, 71, 56, 79],
  };
  const results: ExtendedResult[] = [];
  let idCounter = BigInt(90000) + student.id * BigInt(100);

  const deptCourses = allCourses.filter((c) => {
    const code = (c.code ?? "").toUpperCase();
    return (
      code.startsWith(dept.slice(0, 3)) ||
      code.startsWith("GST") ||
      code.startsWith("EDU") ||
      code.startsWith("SED")
    );
  });

  for (const [levelStr, scores] of Object.entries(levelScores)) {
    const level = Number(levelStr);
    const levelCourses = deptCourses.filter(
      (c) =>
        Math.floor(Number(c.code?.match(/\d+/)?.[0] ?? "0") / 100) * 100 ===
        level,
    );
    const useCourses =
      levelCourses.length >= 4 ? levelCourses.slice(0, 8) : null;

    scores.forEach((score, i) => {
      const { grade, gp } = nceGrade(score);
      const courseId = useCourses
        ? useCourses[i % useCourses.length].id
        : BigInt(level / 100 + i + 1);
      results.push({
        id: idCounter++,
        studentId: student.id,
        courseId,
        caScore: Math.round(score * 0.4),
        examScore: Math.round(score * 0.6),
        totalScore: score,
        grade,
        gradePoint: gp,
        remarks: nceGrade(score).remark,
        status: "published",
        _level: level,
      } as any);
    });
  }
  return results;
}

// ─── Level Row ────────────────────────────────────────────────────────────────
interface LevelResult {
  sn: number;
  code: string;
  title: string;
  credit: number;
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

function computeSummary(rows: LevelResult[]): LevelSummary {
  let tco = 0;
  let tcp = 0;
  let tgp = 0;
  for (const r of rows) {
    tco += r.credit;
    if (r.grade !== "F") tcp += r.credit;
    tgp += r.credit * r.gp;
  }
  const cgpa = tco > 0 ? tgp / tco : 0;
  const { grade, remark } = cgpaGradeRemark(cgpa);
  return {
    tco,
    tcp,
    tgp: Number(tgp.toFixed(2)),
    cgpa: Number(cgpa.toFixed(2)),
    grade,
    remark,
  };
}

/**
 * Compute summary for rows whose course code starts with any of the given prefixes.
 * Returns null if no matching rows.
 */
function computeSummaryForPrefix(
  rows: LevelResult[],
  prefixes: string[],
): LevelSummary | null {
  const filtered = rows.filter((r) => {
    const code = r.code.toUpperCase();
    return prefixes.some((p) => code.startsWith(p.toUpperCase()));
  });
  if (filtered.length === 0) return null;
  return computeSummary(filtered);
}

// ─── SummaryRow component ────────────────────────────────────────────────────
function SummaryRow({
  label,
  summary,
  bgClass,
  borderClass,
}: {
  label: string;
  summary: LevelSummary;
  bgClass?: string;
  borderClass?: string;
}) {
  return (
    <div
      className={`mt-1.5 mb-1 rounded border px-4 py-2 flex flex-wrap gap-4 text-xs font-mono ${
        bgClass ?? "bg-muted/40"
      } ${borderClass ?? "border-border"}`}
    >
      <span className="font-bold text-foreground mr-1 min-w-[4rem]">
        {label}:
      </span>
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
          className={
            summary.remark === "Fail"
              ? "text-destructive"
              : "text-green-700 dark:text-green-400"
          }
        >
          {summary.remark}
        </strong>
      </span>
    </div>
  );
}

/**
 * Render per-subject summary rows for a given set of level rows.
 * Shows CSC/CHE combined row if student has both CSC and CHE courses.
 */
function SubjectSummaryRows({ rows }: { rows: LevelResult[] }) {
  const hasCsc = rows.some((r) =>
    ["CSC", "COS", "IFT", "SEN", "CBY", "ICT", "DTS"].some((p) =>
      r.code.toUpperCase().startsWith(p),
    ),
  );
  const hasChe = rows.some((r) =>
    ["CHM", "CHE"].some((p) => r.code.toUpperCase().startsWith(p)),
  );

  return (
    <>
      {SUBJECT_GROUPS.map((group) => {
        // Skip individual CSC or CHE if they form a combined row
        if ((group.key === "CSC" || group.key === "CHE") && hasCsc && hasChe) {
          return null;
        }
        const summary = computeSummaryForPrefix(rows, group.prefixes);
        if (!summary) return null;
        return (
          <SummaryRow
            key={group.key}
            label={group.label}
            summary={summary}
            bgClass={group.bgClass}
            borderClass={group.borderClass}
          />
        );
      })}
      {/* CSC/CHE combined row */}
      {hasCsc &&
        hasChe &&
        (() => {
          const combined = computeSummaryForPrefix(rows, [
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
          if (!combined) return null;
          return (
            <SummaryRow
              key="CSC/CHE"
              label={CSC_CHE_GROUP.label}
              summary={combined}
              bgClass={CSC_CHE_GROUP.bgClass}
              borderClass={CSC_CHE_GROUP.borderClass}
            />
          );
        })()}
    </>
  );
}

// ─── Single Student Academic Record ──────────────────────────────────────────
interface StudentAcademicRecordProps {
  student: ExtendedStudent;
  levelResults: Record<number, LevelResult[]>;
  deptName: string;
  institutionName: string;
  academicYear?: string;
  studyMode?: string;
  printMode?: boolean;
  onPrint?: () => void;
}

function StudentAcademicRecord({
  student,
  levelResults,
  deptName,
  institutionName,
  academicYear,
  studyMode,
  printMode = false,
  onPrint,
}: StudentAcademicRecordProps) {
  const subjectCombination =
    (student as any).programme ||
    (student as any).subjectCombination ||
    (student as any).programmeType ||
    deptName;

  const matricNo =
    (student as any).matricNo ||
    (student as any).regNo ||
    student.matricNumber ||
    "—";

  // Derive school/faculty name from department
  const schoolName = useMemo(() => {
    const dn = deptName.toLowerCase();
    if (dn.includes("science")) return "School of Science Education";
    if (dn.includes("education") || dn.includes("edu"))
      return "Faculty of Education";
    if (dn.includes("art") || dn.includes("language"))
      return "School of Arts & Social Sciences Education";
    if (dn.includes("voc") || dn.includes("tech"))
      return "School of Vocational & Technical Education";
    return "School of General Studies Education";
  }, [deptName]);

  const effectiveStudyMode =
    (student as any).studyMode ?? studyMode ?? "Full Time";

  const studyModeColor =
    effectiveStudyMode === "Distance Learning"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300"
      : effectiveStudyMode === "Part Time"
        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300"
        : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300";

  const levels = [100, 200, 300];
  const levelsWithData = levels.filter(
    (l) => (levelResults[l]?.length ?? 0) > 0,
  );

  const allRows = levelsWithData.flatMap((l) => levelResults[l] ?? []);
  const cumulative = computeSummary(allRows);

  return (
    <div
      className={`academic-record-container${printMode ? " print-page" : ""}`}
      data-ocid="academic_record.card"
    >
      <Card className="border-2 border-border bg-card shadow-sm print:shadow-none print:border print:border-gray-400">
        {/* ── Official Document Header ── */}
        <div className="text-center px-6 pt-6 pb-4 border-b border-border print:border-gray-400 space-y-1">
          <h2 className="text-base font-bold uppercase tracking-wider text-foreground leading-tight">
            {institutionName}
          </h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {schoolName}
          </p>
          {academicYear && (
            <p className="text-xs text-muted-foreground">
              {academicYear} Academic Session
            </p>
          )}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                studyModeColor
              }`}
            >
              {effectiveStudyMode}
            </span>
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary pt-1">
            Student Academic Record
          </h3>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs border border-border rounded p-3 bg-muted/20 print:border-gray-300">
            <div>
              <span className="text-muted-foreground">Name: </span>
              <span className="font-semibold">{student.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Matric No: </span>
              <span className="font-semibold font-mono">{matricNo}</span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Subject Combination:{" "}
              </span>
              <span className="font-semibold">{subjectCombination}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Department: </span>
              <span className="font-semibold">{deptName}</span>
            </div>
          </div>

          {levelsWithData.length === 0 && (
            <div
              className="text-center py-8 text-muted-foreground text-sm"
              data-ocid="academic_record.empty_state"
            >
              No published results available for this student.
            </div>
          )}

          {/* Level Sections */}
          {levelsWithData.map((level) => {
            const rows = levelResults[level] ?? [];
            const summary = computeSummary(rows);
            const nceLabel = NCE_LEVELS[level] ?? `Level ${level}`;
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mt-3 mb-1">
                  <div className="flex-1 h-px bg-border print:bg-gray-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary whitespace-nowrap px-2">
                    {nceLabel}
                  </span>
                  <div className="flex-1 h-px bg-border print:bg-gray-400" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse print:text-[10px]">
                    <thead>
                      <tr className="bg-muted/60 print:bg-gray-100">
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-left w-8">
                          S/N
                        </th>
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-left">
                          Course Code
                        </th>
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-left">
                          Course Title
                        </th>
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-center">
                          Credit
                        </th>
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-center">
                          Score
                        </th>
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-center">
                          Grade
                        </th>
                        <th className="border border-border print:border-gray-400 px-2 py-1 text-center">
                          GP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.sn}
                          className="hover:bg-muted/20 print:hover:bg-transparent"
                        >
                          <td className="border border-border print:border-gray-400 px-2 py-1 text-center">
                            {row.sn}
                          </td>
                          <td className="border border-border print:border-gray-400 px-2 py-1 font-mono">
                            {row.code}
                          </td>
                          <td className="border border-border print:border-gray-400 px-2 py-1">
                            {row.title}
                          </td>
                          <td className="border border-border print:border-gray-400 px-2 py-1 text-center">
                            {row.credit}
                          </td>
                          <td className="border border-border print:border-gray-400 px-2 py-1 text-center">
                            {row.score}
                          </td>
                          <td
                            className={`border border-border print:border-gray-400 px-2 py-1 text-center font-bold ${
                              row.grade === "A"
                                ? "text-green-700 dark:text-green-400"
                                : row.grade === "F"
                                  ? "text-red-600"
                                  : "text-foreground"
                            }`}
                          >
                            {row.grade}
                          </td>
                          <td className="border border-border print:border-gray-400 px-2 py-1 text-center">
                            {row.gp.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Per-subject summary rows */}
                <SubjectSummaryRows rows={rows} />

                {/* Year Total row */}
                <SummaryRow
                  label={`${nceLabel} — Total`}
                  summary={summary}
                  bgClass="bg-muted/40"
                  borderClass="border-border"
                />
              </div>
            );
          })}

          {/* Cumulative */}
          {allRows.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex-1 h-0.5 bg-border print:bg-gray-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-foreground px-3 bg-card">
                  CUMULATIVE
                </span>
                <div className="flex-1 h-0.5 bg-border print:bg-gray-500" />
              </div>

              {/* Per-subject cumulative rows */}
              <SubjectSummaryRows rows={allRows} />

              {/* Overall cumulative */}
              <SummaryRow
                label="Cumulative Total"
                summary={cumulative}
                bgClass="bg-muted/60"
                borderClass="border-border"
              />
            </>
          )}
        </div>

        {!printMode && onPrint && (
          <div className="px-6 pb-4 flex justify-end no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              data-ocid="academic_record.print.button"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Record
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Tab Component ───────────────────────────────────────────────────────
interface StudentAcademicRecordTabProps {
  mode?: "admin" | "student";
}

export default function StudentAcademicRecordTab({
  mode = "admin",
}: StudentAcademicRecordTabProps) {
  const {
    students,
    results,
    courses,
    departments,
    currentUser,
    institutionSettings,
  } = useApp();

  const institutionName =
    institutionSettings?.name ?? "Federal University of Education, Kontagora";

  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedSession, setSelectedSession] = useState("2024/2025");

  const currentStudent = useMemo(() => {
    if (mode !== "student") return null;
    return (
      students.find(
        (s) =>
          (s as any).matricNo === (currentUser as any)?.matricNo ||
          String(s.id) === String((currentUser as any)?.studentId),
      ) ?? null
    );
  }, [mode, students, currentUser]);

  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results) {
      if ((r as any).session) s.add((r as any).session);
    }
    s.add("2024/2025");
    return Array.from(s).sort().reverse();
  }, [results]);

  const visibleStudents = useMemo(() => {
    if (mode === "student" && currentStudent) return [currentStudent];

    return students.filter((s) => {
      if (selectedDept === "ALL") return true;
      const dept = getStudentDepartment(s, departments);
      const deptName = (dept?.name ?? "").toUpperCase();
      const code = (s as any).department?.toUpperCase() ?? "";
      return (
        deptName.includes(selectedDept) ||
        code.startsWith(selectedDept) ||
        deptName.startsWith(selectedDept)
      );
    });
  }, [mode, currentStudent, students, selectedDept, departments]);

  const buildLevelResults = (
    student: ExtendedStudent,
  ): Record<number, LevelResult[]> => {
    const studentResults = results.filter(
      (r) =>
        String(r.studentId) === String(student.id) &&
        ["published", "approved"].includes(r.status),
    );

    const effectiveResults =
      studentResults.length > 0
        ? studentResults
        : makeSampleNceData(student, courses as ExtendedCourse[]);

    const byLevel: Record<number, LevelResult[]> = {};

    for (const r of effectiveResults) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const credit = course ? Number(course.creditUnits ?? 2) : 2;
      const score = r.totalScore ?? 0;
      const { grade, gp } = nceGrade(score);

      let level: number;
      if ((r as any)._level) {
        level = (r as any)._level;
      } else if (course) {
        const match = (course.code ?? "").match(/(\d+)/);
        const codeNum = match ? Number(match[1]) : 0;
        level = Math.floor(codeNum / 100) * 100;
        if (level < 100 || level > 300) level = Number(student.level) || 100;
      } else {
        level = Number(student.level) || 100;
      }
      if (level > 300) level = 300;
      if (level < 100) level = 100;

      if (!byLevel[level]) byLevel[level] = [];
      byLevel[level].push({
        sn: byLevel[level].length + 1,
        code: course?.code ?? `CRSE${String(r.courseId).slice(-3)}`,
        title: course?.name ?? "Course Title",
        credit,
        score,
        grade: r.grade ?? grade,
        gp: r.gradePoint ?? gp,
      });
    }

    for (const level of Object.keys(byLevel)) {
      byLevel[Number(level)] = byLevel[Number(level)].map((row, idx) => ({
        ...row,
        sn: idx + 1,
      }));
    }

    return byLevel;
  };

  const handlePrintAll = () => window.print();
  const handlePrintStudent = (matricNo: string) => {
    const el = document.querySelector(
      `[data-matric="${matricNo}"]`,
    ) as HTMLElement | null;
    if (!el) {
      window.print();
      return;
    }
    const original = document.body.innerHTML;
    document.body.innerHTML = el.outerHTML;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  const getDeptLabel = (student: ExtendedStudent) => {
    const dept = getStudentDepartment(student, departments);
    return (
      dept?.name ?? (student as any).department ?? "General Studies Education"
    );
  };

  const groupedByDept = useMemo(() => {
    const groups: Record<string, ExtendedStudent[]> = {};
    for (const s of visibleStudents) {
      const dept = getStudentDepartment(s, departments);
      const deptName =
        dept?.name ?? (s as any).department ?? "General Studies Education";
      if (!groups[deptName]) groups[deptName] = [];
      groups[deptName].push(s);
    }
    return groups;
  }, [visibleStudents, departments]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">
              NCE Student Academic Record
            </h2>
            <p className="text-xs text-muted-foreground">
              Official per-student academic record — NCE format
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          {mode === "admin" && (
            <>
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger
                  className="w-52"
                  data-ocid="academic_record.dept.select"
                >
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {NCE_DEPARTMENTS.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedSession}
                onValueChange={setSelectedSession}
              >
                <SelectTrigger
                  className="w-36"
                  data-ocid="academic_record.session.select"
                >
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintAll}
                data-ocid="academic_record.print.button"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print All
              </Button>
            </>
          )}
          {mode === "student" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintAll}
              data-ocid="academic_record.print.button"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print My Record
            </Button>
          )}
        </div>
      </div>

      {visibleStudents.length === 0 && (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="academic_record.empty_state"
        >
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            No students found for the selected department.
          </p>
        </div>
      )}

      {/* Batch view — grouped by department */}
      {mode === "admin" &&
        Object.entries(groupedByDept).map(([deptName, deptStudents]) => (
          <div key={deptName} className="space-y-4">
            <div className="flex items-center gap-3 pt-2">
              <Badge
                variant="secondary"
                className="text-xs font-semibold uppercase tracking-wider"
              >
                {deptName}
              </Badge>
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {deptStudents.length} student
                {deptStudents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {deptStudents.map((student, idx) => {
              const levelResults = buildLevelResults(student);
              const mno =
                (student as any).matricNo ??
                student.matricNumber ??
                String(student.id);
              return (
                <div
                  key={String(student.id)}
                  data-matric={mno}
                  data-ocid={`academic_record.item.${idx + 1}`}
                  className="print-student-page"
                >
                  <StudentAcademicRecord
                    student={student}
                    levelResults={levelResults}
                    deptName={deptName}
                    institutionName={institutionName}
                    academicYear={selectedSession}
                    studyMode={(student as any).studyMode ?? "Full Time"}
                    onPrint={() => handlePrintStudent(mno)}
                  />
                </div>
              );
            })}
          </div>
        ))}

      {/* Student self-view */}
      {mode === "student" &&
        currentStudent &&
        (() => {
          const levelResults = buildLevelResults(currentStudent);
          const deptName = getDeptLabel(currentStudent);
          return (
            <StudentAcademicRecord
              student={currentStudent}
              levelResults={levelResults}
              deptName={deptName}
              institutionName={institutionName}
              academicYear={selectedSession}
              studyMode={(currentStudent as any).studyMode ?? "Full Time"}
              printMode={false}
            />
          );
        })()}

      {mode === "student" && !currentStudent && (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="academic_record.empty_state"
        >
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Your academic record is not yet available. Please check back after
            results are published.
          </p>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-student-page { page-break-after: always; }
          .print-student-page:last-child { page-break-after: avoid; }
          body { background: white !important; }
          .academic-record-container { margin-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}
