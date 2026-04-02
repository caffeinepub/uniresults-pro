import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { getStudentDepartment, useApp } from "../context/AppContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectAreaGrade {
  area: string;
  label: string;
  avgScore: number;
  gradeWord: string;
  pass: boolean;
}

interface StudentRow {
  sn: number;
  matricNo: string;
  name: string;
  subjectGrades: SubjectAreaGrade[];
  gcgpa: number;
  carryOver: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUBJECT_AREA_DEFS: {
  area: string;
  label: string;
  prefixes: string[];
  tpCodes?: string[];
}[] = [
  {
    area: "EDU",
    label: "EDU",
    prefixes: ["EDU"],
    tpCodes: ["EDU301", "EDU401", "EDU 301", "EDU 401"],
  },
  {
    area: "TP",
    label: "TP",
    prefixes: [],
    tpCodes: ["EDU301", "EDU401", "EDU 301", "EDU 401"],
  },
  { area: "GSE", label: "GSE", prefixes: ["GST", "GSE", "ENT"] },
  { area: "SED", label: "SED", prefixes: ["SED"] },
  { area: "BIO", label: "BIO", prefixes: ["BIO"] },
  { area: "CHE", label: "CHE", prefixes: ["CHM", "CHE"] },
  {
    area: "CSC",
    label: "CSC",
    prefixes: ["CSC", "COS", "IFT", "SEN", "CBY", "ICT", "DTS"],
  },
  { area: "PHY", label: "PHY", prefixes: ["PHY"] },
  { area: "MTH", label: "MTH", prefixes: ["MTH", "STA"] },
  { area: "MCB", label: "MCB", prefixes: ["MCB"] },
  { area: "AGR", label: "AGR", prefixes: ["AGR"] },
];

const TP_COURSE_CODES = new Set(["EDU301", "EDU401", "EDU 301", "EDU 401"]);

function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

function scoreToGradeWord(avg: number): { word: string; pass: boolean } {
  if (avg >= 3.5) return { word: "DISTINCTION", pass: true };
  if (avg >= 2.5) return { word: "MERIT", pass: true };
  if (avg >= 1.5) return { word: "CREDIT", pass: true };
  if (avg >= 1.0) return { word: "PASS", pass: true };
  return { word: "FAIL", pass: false };
}

function rawScoreToGp(score: number): number {
  if (score >= 70) return 4.0;
  if (score >= 60) return 3.5;
  if (score >= 50) return 3.0;
  if (score >= 45) return 2.5;
  if (score >= 40) return 2.0;
  return 0.0;
}

function getAreaForCourse(courseCode: string): string | null {
  const norm = normalizeCode(courseCode);
  // TP check first
  if (TP_COURSE_CODES.has(norm)) return "TP";
  for (const def of SUBJECT_AREA_DEFS) {
    if (def.area === "TP") continue;
    for (const prefix of def.prefixes) {
      if (norm.startsWith(prefix)) return def.area;
    }
  }
  return null;
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const SAMPLE_BIO_STUDENTS: StudentRow[] = [
  {
    sn: 1,
    matricNo: "BIO/NCE/2022/001",
    name: "Abubakar Suleiman",
    subjectGrades: [],
    gcgpa: 3.72,
    carryOver: 0,
  },
  {
    sn: 2,
    matricNo: "BIO/NCE/2022/002",
    name: "Adaeze Nwosu",
    subjectGrades: [],
    gcgpa: 3.51,
    carryOver: 0,
  },
  {
    sn: 3,
    matricNo: "BIO/NCE/2022/003",
    name: "Blessing Okafor",
    subjectGrades: [],
    gcgpa: 2.88,
    carryOver: 0,
  },
  {
    sn: 4,
    matricNo: "BIO/NCE/2022/004",
    name: "Chukwuemeka Eze",
    subjectGrades: [],
    gcgpa: 2.65,
    carryOver: 1,
  },
  {
    sn: 5,
    matricNo: "BIO/NCE/2022/005",
    name: "Dorcas Yusuf",
    subjectGrades: [],
    gcgpa: 1.98,
    carryOver: 0,
  },
  {
    sn: 6,
    matricNo: "BIO/NCE/2022/006",
    name: "Emmanuel Bello",
    subjectGrades: [],
    gcgpa: 3.44,
    carryOver: 0,
  },
  {
    sn: 7,
    matricNo: "BIO/NCE/2022/007",
    name: "Fatima Al-Hassan",
    subjectGrades: [],
    gcgpa: 2.78,
    carryOver: 0,
  },
  {
    sn: 8,
    matricNo: "BIO/NCE/2022/008",
    name: "Grace Adekunle",
    subjectGrades: [],
    gcgpa: 3.61,
    carryOver: 0,
  },
  {
    sn: 9,
    matricNo: "BIO/NCE/2022/009",
    name: "Hassan Mohammed",
    subjectGrades: [],
    gcgpa: 2.45,
    carryOver: 1,
  },
  {
    sn: 10,
    matricNo: "BIO/NCE/2022/010",
    name: "Ifeoma Obiora",
    subjectGrades: [],
    gcgpa: 3.85,
    carryOver: 0,
  },
  {
    sn: 11,
    matricNo: "BIO/NCE/2022/011",
    name: "John Onuoha",
    subjectGrades: [],
    gcgpa: 2.12,
    carryOver: 0,
  },
  {
    sn: 12,
    matricNo: "BIO/NCE/2022/012",
    name: "Khadija Musa",
    subjectGrades: [],
    gcgpa: 1.75,
    carryOver: 2,
  },
  {
    sn: 13,
    matricNo: "BIO/NCE/2022/013",
    name: "Lukman Abdullahi",
    subjectGrades: [],
    gcgpa: 3.2,
    carryOver: 0,
  },
  {
    sn: 14,
    matricNo: "BIO/NCE/2022/014",
    name: "Mary Ochigbo",
    subjectGrades: [],
    gcgpa: 2.95,
    carryOver: 0,
  },
  {
    sn: 15,
    matricNo: "BIO/NCE/2022/015",
    name: "Ngozi Anichebe",
    subjectGrades: [],
    gcgpa: 3.4,
    carryOver: 0,
  },
];

const AREA_GRADES_PASS: Record<string, Record<string, number>> = {
  "BIO/NCE/2022/001": { EDU: 3.8, TP: 3.9, GSE: 3.7, BIO: 3.6, CHE: 3.5 },
  "BIO/NCE/2022/002": { EDU: 3.6, TP: 3.7, GSE: 3.5, BIO: 3.6, CHE: 3.4 },
  "BIO/NCE/2022/003": { EDU: 2.9, TP: 3.0, GSE: 2.8, BIO: 2.9, CHE: 2.7 },
  "BIO/NCE/2022/004": { EDU: 2.7, TP: 2.8, GSE: 2.6, BIO: 2.5, CHE: 2.6 },
  "BIO/NCE/2022/005": { EDU: 2.0, TP: 2.1, GSE: 1.9, BIO: 2.0, CHE: 1.8 },
  "BIO/NCE/2022/006": { EDU: 3.5, TP: 3.6, GSE: 3.4, BIO: 3.3, CHE: 3.4 },
  "BIO/NCE/2022/007": { EDU: 2.8, TP: 2.9, GSE: 2.7, BIO: 2.8, CHE: 2.6 },
  "BIO/NCE/2022/008": { EDU: 3.7, TP: 3.8, GSE: 3.6, BIO: 3.5, CHE: 3.6 },
  "BIO/NCE/2022/009": { EDU: 2.5, TP: 2.6, GSE: 2.4, BIO: 2.3, CHE: 2.4 },
  "BIO/NCE/2022/010": { EDU: 3.9, TP: 4.0, GSE: 3.8, BIO: 3.8, CHE: 3.7 },
  "BIO/NCE/2022/011": { EDU: 2.1, TP: 2.2, GSE: 2.0, BIO: 2.1, CHE: 2.0 },
  "BIO/NCE/2022/012": { EDU: 1.8, TP: 1.9, GSE: 1.7, BIO: 1.6, CHE: 1.7 },
  "BIO/NCE/2022/013": { EDU: 3.2, TP: 3.3, GSE: 3.1, BIO: 3.2, CHE: 3.0 },
  "BIO/NCE/2022/014": { EDU: 3.0, TP: 3.1, GSE: 2.9, BIO: 2.9, CHE: 2.8 },
  "BIO/NCE/2022/015": { EDU: 3.4, TP: 3.5, GSE: 3.3, BIO: 3.3, CHE: 3.2 },
};

// 3 students with FAIL in at least one area (separate list for fail)
const SAMPLE_FAIL_STUDENTS: StudentRow[] = [
  {
    sn: 1,
    matricNo: "BIO/NCE/2022/016",
    name: "Obiageli Chukwu",
    subjectGrades: [],
    gcgpa: 0.95,
    carryOver: 3,
  },
  {
    sn: 2,
    matricNo: "BIO/NCE/2022/017",
    name: "Rabiu Garba",
    subjectGrades: [],
    gcgpa: 1.1,
    carryOver: 2,
  },
  {
    sn: 3,
    matricNo: "BIO/NCE/2022/018",
    name: "Stella Nnadi",
    subjectGrades: [],
    gcgpa: 0.8,
    carryOver: 4,
  },
];

const AREA_GRADES_FAIL: Record<string, Record<string, number>> = {
  "BIO/NCE/2022/016": { EDU: 0.8, TP: 0.9, GSE: 1.2, BIO: 0.7, CHE: 1.0 },
  "BIO/NCE/2022/017": { EDU: 1.1, TP: 1.2, GSE: 0.9, BIO: 1.0, CHE: 1.2 },
  "BIO/NCE/2022/018": { EDU: 0.7, TP: 0.8, GSE: 1.0, BIO: 0.6, CHE: 0.9 },
};

const PASS_AREAS = ["EDU", "TP", "GSE", "BIO", "CHE"] as const;

function buildSampleRows(
  baseRows: StudentRow[],
  areaGrades: Record<string, Record<string, number>>,
): StudentRow[] {
  return baseRows.map((row, idx) => ({
    ...row,
    sn: idx + 1,
    subjectGrades: PASS_AREAS.map((area) => {
      const avg = areaGrades[row.matricNo]?.[area] ?? 2.0;
      const { word, pass } = scoreToGradeWord(avg);
      return { area, label: area, avgScore: avg, gradeWord: word, pass };
    }),
  }));
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PassFailListReportProps {
  listType: "pass" | "fail";
  defaultDepartment?: string;
  defaultSession?: string;
  defaultLevel?: string;
  defaultStudyMode?: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PassFailListReport({
  listType,
  defaultDepartment = "Biology Education",
  defaultSession = "2024/2025",
  defaultLevel = "NCE III",
  defaultStudyMode = "Full-Time",
}: PassFailListReportProps) {
  const {
    students,
    results,
    courses,
    departments,
    faculties,
    institutionSettings,
  } = useApp();

  const [session, setSession] = useState(defaultSession);
  const [level, setLevel] = useState(defaultLevel);
  const [department, setDepartment] = useState(defaultDepartment);
  const [studyMode, setStudyMode] = useState(defaultStudyMode);

  const institutionName =
    institutionSettings?.name ?? "Federal University of Education, Kontagora";

  // ── Derive school/faculty name from selected department ──
  const schoolName = useMemo(() => {
    const dept = departments.find((d) =>
      d.name.toLowerCase().includes(department.toLowerCase().split(" ")[0]),
    );
    if (!dept) return "School of Sciences";
    const faculty = faculties?.find(
      (f) => String(f.id) === String((dept as any).facultyId),
    );
    return faculty?.name ?? "School of Sciences";
  }, [departments, department, faculties]);

  // ── Derive subject combination abbreviation ──
  const subjectCombination = useMemo(() => {
    const deptLower = department.toLowerCase();
    if (deptLower.includes("biology") && deptLower.includes("chemistry"))
      return "Biology / Chemistry (BIO-CHE)";
    if (deptLower.includes("biology") && deptLower.includes("computer"))
      return "Biology / Computer Science (BIO-CSC)";
    if (deptLower.includes("computer") && deptLower.includes("physics"))
      return "Computer Science / Physics (CSC-PHY)";
    if (deptLower.includes("computer") && deptLower.includes("mathematics"))
      return "Computer Science / Mathematics (CSC-MTH)";
    if (deptLower.includes("physics") && deptLower.includes("mathematics"))
      return "Physics / Mathematics (PHY-MTH)";
    if (deptLower.includes("biology")) return "Biology / Chemistry (BIO-CHE)";
    if (deptLower.includes("computer"))
      return "Computer Science / Mathematics (CSC-MTH)";
    if (deptLower.includes("physics")) return "Physics / Mathematics (PHY-MTH)";
    if (deptLower.includes("chemistry")) return "Chemistry / Biology (CHE-BIO)";
    if (deptLower.includes("mathematics"))
      return "Mathematics / Physics (MTH-PHY)";
    return department;
  }, [department]);

  // ── Build rows from real data if available, else sample data ──
  const { rows, areaColumns } = useMemo(() => {
    // Try to use real data from the context
    const deptObj = departments.find(
      (d) =>
        d.name.toLowerCase().includes(department.toLowerCase().split(" ")[0]) ||
        d.name.toLowerCase() === department.toLowerCase(),
    );

    const deptStudents = deptObj
      ? students.filter(
          (s) =>
            String(s.departmentId) === String(deptObj.id) &&
            s.status === "active",
        )
      : [];

    // Check if we have real results for these students
    const hasRealResults =
      deptStudents.length > 0 &&
      results.some(
        (r) =>
          deptStudents.some((s) => String(s.id) === String(r.studentId)) &&
          ["approved", "published"].includes(r.status),
      );

    if (hasRealResults && deptStudents.length > 0) {
      // Build from real data
      const usedAreas = new Set<string>();
      const studentRows: StudentRow[] = [];

      let sn = 0;
      for (const student of deptStudents) {
        const sr = results.filter(
          (r) =>
            String(r.studentId) === String(student.id) &&
            ["approved", "published"].includes(r.status),
        );
        if (sr.length === 0) continue;

        // Group by subject area
        const areaMap: Record<string, number[]> = {};
        for (const r of sr) {
          const course = courses.find(
            (c) => String(c.id) === String(r.courseId),
          );
          const code = course?.code ?? "";
          const area = getAreaForCourse(code);
          if (!area) continue;
          usedAreas.add(area);
          if (!areaMap[area]) areaMap[area] = [];
          const total = Number(r.totalScore ?? 0);
          areaMap[area].push(rawScoreToGp(total));
        }

        const subjectGrades: SubjectAreaGrade[] = Object.entries(areaMap).map(
          ([area, gps]) => {
            const avg = gps.reduce((a, b) => a + b, 0) / gps.length;
            const { word, pass } = scoreToGradeWord(avg);
            return { area, label: area, avgScore: avg, gradeWord: word, pass };
          },
        );

        const allGps = subjectGrades.map((g) => g.avgScore);
        const gcgpa = allGps.length
          ? allGps.reduce((a, b) => a + b, 0) / allGps.length
          : 0;
        const isPass = subjectGrades.every((g) => g.pass);

        if (listType === "pass" && !isPass) continue;
        if (listType === "fail" && isPass) continue;

        sn++;
        studentRows.push({
          sn,
          matricNo:
            (student as any).matricNo || student.matricNumber || `MATRIC/${sn}`,
          name: student.name,
          subjectGrades,
          gcgpa,
          carryOver: sr.filter((r) => r.grade === "F").length,
        });
      }

      const orderedAreas = SUBJECT_AREA_DEFS.filter((d) =>
        usedAreas.has(d.area),
      ).map((d) => d.area);
      return { rows: studentRows, areaColumns: orderedAreas };
    }

    // Fall back to sample data
    const sampleRows =
      listType === "pass"
        ? buildSampleRows(SAMPLE_BIO_STUDENTS, AREA_GRADES_PASS)
        : buildSampleRows(SAMPLE_FAIL_STUDENTS, AREA_GRADES_FAIL);

    return { rows: sampleRows, areaColumns: [...PASS_AREAS] };
  }, [students, results, courses, departments, department, listType]);

  // ── Department options ──
  const deptOptions = useMemo(() => {
    const names = new Set(departments.map((d) => d.name));
    return Array.from(names);
  }, [departments]);

  const sessionOptions = ["2024/2025", "2023/2024", "2022/2023", "2021/2022"];
  const levelOptions = [
    "NCE I",
    "NCE II",
    "NCE III",
    "100 Level",
    "200 Level",
    "300 Level",
    "400 Level",
    "ND I",
    "ND II",
    "HND I",
    "HND II",
  ];
  const studyModeOptions = ["Full-Time", "Part-Time", "Distance Learning"];

  // ── CSV Export ──
  function exportCSV() {
    const headers = [
      "S/N",
      "Matric No",
      "Name",
      ...areaColumns,
      "GCGPA",
      "Carry Over",
    ];
    const csvRows = rows.map((r) => [
      r.sn,
      r.matricNo,
      r.name,
      ...areaColumns.map(
        (a) => r.subjectGrades.find((g) => g.area === a)?.gradeWord ?? "-",
      ),
      r.gcgpa.toFixed(2),
      r.carryOver,
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listType === "pass" ? "pass" : "failure"}-list-${session.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const printDate = new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const listTitle = listType === "pass" ? "PASS LIST" : "FAILURE LIST";
  const levelLabel = level.toUpperCase();

  return (
    <div className="passfail-report">
      {/* ── Print CSS ── */}
      <style>{`
        @media print {
          .passfail-no-print { display: none !important; }
          .passfail-report { padding: 0; }
          .passfail-table { font-size: 11px; }
          .passfail-table th, .passfail-table td { border: 1px solid #000 !important; padding: 4px 6px !important; }
          .passfail-fail-cell { color: red !important; font-weight: bold !important; }
          .passfail-header { text-align: center; margin-bottom: 12px; }
        }
        @media screen {
          .passfail-table th, .passfail-table td { border: 1px solid #d1d5db; }
        }
      `}</style>

      {/* ── Filter Bar ── */}
      <div className="passfail-no-print flex flex-wrap gap-3 mb-6 p-4 bg-muted/40 rounded-lg border">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Session
          </span>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger
              className="w-36 h-8 text-xs"
              data-ocid="passfail.session.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Level/Year
          </span>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger
              className="w-36 h-8 text-xs"
              data-ocid="passfail.level.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {levelOptions.map((l) => (
                <SelectItem key={l} value={l} className="text-xs">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Department
          </span>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger
              className="w-52 h-8 text-xs"
              data-ocid="passfail.department.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {deptOptions.length > 0
                ? deptOptions.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {d}
                    </SelectItem>
                  ))
                : [
                    "Biology Education",
                    "Computer Science Education",
                    "Physics Education",
                    "Chemistry Education",
                    "Mathematics Education",
                  ].map((d) => (
                    <SelectItem key={d} value={d} className="text-xs">
                      {d}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Study Mode
          </span>
          <Select value={studyMode} onValueChange={setStudyMode}>
            <SelectTrigger
              className="w-40 h-8 text-xs"
              data-ocid="passfail.studymode.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {studyModeOptions.map((m) => (
                <SelectItem key={m} value={m} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => window.print()}
            data-ocid="passfail.print.button"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={exportCSV}
            data-ocid="passfail.export.button"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            CSV Export
          </Button>
        </div>
      </div>

      {/* ── Official Header ── */}
      <div className="passfail-header text-center mb-6 space-y-0.5">
        <p className="font-bold text-base uppercase tracking-wide">
          {institutionName}
        </p>
        <p className="font-semibold text-sm">
          {levelLabel} {studyMode.toUpperCase()} GRADUATING STUDENTS RESULT
        </p>
        <p className="text-sm font-medium">{session} SESSION</p>
        <p className="text-sm font-medium uppercase">{schoolName}</p>
        <p className="text-sm">{subjectCombination}</p>
        <p
          className={`text-xl font-extrabold uppercase tracking-widest mt-2 ${
            listType === "pass" ? "text-green-700" : "text-red-700"
          }`}
        >
          {listTitle}
        </p>
        <div className="flex justify-center gap-4 mt-1">
          <Badge
            variant="outline"
            className={`text-xs ${
              listType === "pass"
                ? "border-green-600 text-green-700"
                : "border-red-600 text-red-700"
            }`}
          >
            {rows.length} Student{rows.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {department}
          </Badge>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground border rounded-lg"
            data-ocid="passfail.empty_state"
          >
            No students match the current filter criteria.
          </div>
        ) : (
          <table
            className="passfail-table w-full text-sm border-collapse"
            style={{ borderCollapse: "collapse" }}
          >
            <thead>
              <tr className="bg-muted/60">
                <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">
                  S/N
                </th>
                <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap">
                  MATRIC NO
                </th>
                <th className="px-3 py-2 text-left font-semibold text-xs whitespace-nowrap min-w-[140px]">
                  NAME
                </th>
                {areaColumns.map((area) => (
                  <th
                    key={area}
                    className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap"
                  >
                    {area}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">
                  GCGPA
                </th>
                <th className="px-3 py-2 text-center font-semibold text-xs whitespace-nowrap">
                  CARRY
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.matricNo}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/70"}
                  data-ocid={`passfail.item.${idx + 1}`}
                >
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {row.sn}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono whitespace-nowrap">
                    {row.matricNo}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
                    {row.name}
                  </td>
                  {areaColumns.map((area) => {
                    const g = row.subjectGrades.find((sg) => sg.area === area);
                    const word = g?.gradeWord ?? "—";
                    const isFail = word === "FAIL";
                    return (
                      <td
                        key={area}
                        className={`px-3 py-2 text-xs text-center whitespace-nowrap font-semibold uppercase ${
                          isFail
                            ? "passfail-fail-cell text-red-600"
                            : "text-foreground"
                        }`}
                      >
                        {word}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-xs text-center font-bold">
                    {row.gcgpa.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-xs text-center">
                    {row.carryOver > 0 ? (
                      <span className="text-orange-600 font-medium">
                        {row.carryOver}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="passfail-footer flex justify-between items-center mt-6 pt-4 border-t text-xs text-muted-foreground">
        <span>
          {institutionSettings?.logoText ?? "FUEK"} MIS. Printed on: {printDate}
        </span>
        <span>Page 1 of 1</span>
      </div>

      {/* ── Grade Legend ── */}
      <div className="passfail-no-print mt-4 flex flex-wrap gap-3">
        <span className="text-xs text-muted-foreground font-medium">
          Grade Scale:
        </span>
        {[
          {
            word: "DISTINCTION",
            range: "3.50 – 4.00",
            color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          },
          {
            word: "MERIT",
            range: "2.50 – 3.49",
            color: "text-blue-700 bg-blue-50 border-blue-200",
          },
          {
            word: "CREDIT",
            range: "1.50 – 2.49",
            color: "text-sky-700 bg-sky-50 border-sky-200",
          },
          {
            word: "PASS",
            range: "1.00 – 1.49",
            color: "text-yellow-700 bg-yellow-50 border-yellow-200",
          },
          {
            word: "FAIL",
            range: "below 1.00",
            color: "text-red-700 bg-red-50 border-red-200",
          },
        ].map(({ word, range, color }) => (
          <span
            key={word}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold ${color}`}
          >
            {word} <span className="font-normal opacity-70">({range})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
