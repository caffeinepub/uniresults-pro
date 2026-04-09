import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  GraduationCap,
  Printer,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../../context/AppContext";

/* ─── Constants ────────────────────────────────────────────────── */

const FACILITIES_DETAIL = [
  { key: "lecture_rooms", label: "Lecture Rooms / Classrooms" },
  { key: "computer_lab", label: "Computer Laboratory" },
  { key: "science_lab", label: "Science / Practical Laboratory" },
  { key: "library", label: "Library / Digital Library" },
  { key: "internet", label: "Internet Access / Wi-Fi" },
  { key: "staff_offices", label: "Staff Offices" },
  { key: "research", label: "Research Facilities" },
  { key: "elibrary", label: "E-Library / Virtual Resources" },
  { key: "av_room", label: "Audio-Visual Room" },
  { key: "hostel", label: "Hostel / Accommodation" },
  { key: "health_centre", label: "Medical / Health Centre" },
  { key: "student_common", label: "Student Common Room" },
];

const NUC_COMPLIANCE = [
  { id: "c1", label: "Adequate teaching staff (minimum 40% PhD holders)" },
  { id: "c2", label: "Staff-student ratio within NUC benchmark (1:30 max)" },
  { id: "c3", label: "Minimum 70% pass rate across all courses" },
  { id: "c4", label: "Functional laboratory/studio facilities" },
  {
    id: "c5",
    label: "Adequate library resources (textbooks + digital resources)",
  },
  { id: "c6", label: "Approved programme curriculum in place" },
  { id: "c7", label: "Evidence of research output (publications/projects)" },
  { id: "c8", label: "Functional examination/assessment system" },
  {
    id: "c9",
    label: "Student industrial work experience scheme (SIWES) in place",
  },
  {
    id: "c10",
    label: "Adequate ICT infrastructure (internet, computers, LMS)",
  },
];

const PLO_DEFAULTS = [
  "Apply knowledge of the discipline to solve relevant problems.",
  "Analyze a problem and identify appropriate solutions.",
  "Design, implement, and evaluate systems or processes.",
  "Function effectively on multi-disciplinary teams.",
  "Understand professional, ethical, and social responsibilities.",
  "Communicate effectively with diverse audiences.",
  "Engage in continuing professional development and lifelong learning.",
  "Apply scientific methods and critical thinking.",
];

const STATUS_OPTIONS = ["Available", "Inadequate", "Not Available"] as const;
type FacilityStatus = (typeof STATUS_OPTIONS)[number];

interface FacilityEntry {
  status: FacilityStatus;
  count: string;
  notes: string;
}

interface InstitutionalInfo {
  address: string;
  foundingYear: string;
  vcName: string;
  accreditationHistory: string;
  nucApproved: boolean;
  ncceApproved: boolean;
  nbteApproved: boolean;
  studyMode: "Full Time" | "Part Time" | "Distance Learning";
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function exportCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="font-semibold text-sm flex-1">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && <CardContent className="pt-0 pb-4">{children}</CardContent>}
    </Card>
  );
}

/* ─── Readiness Score Ring ──────────────────────────────────────── */
function ReadinessRing({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label =
    score >= 70 ? "Ready" : score >= 50 ? "Near Ready" : "Not Ready";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        aria-label={`Accreditation readiness score: ${score} out of 100`}
        role="img"
      >
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text
          x="65"
          y="60"
          textAnchor="middle"
          className="fill-foreground"
          style={{ fontSize: 24, fontWeight: 700 }}
        >
          {score}
        </text>
        <text
          x="65"
          y="78"
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 11 }}
        >
          /100
        </text>
      </svg>
      <Badge
        className="text-xs"
        style={{ background: color, color: "#fff", border: "none" }}
      >
        {label}
      </Badge>
    </div>
  );
}

/* ─── Props ─────────────────────────────────────────────────────── */
interface AccreditationReportTabProps {
  /** HOD: restrict to one dept. Dean: restrict to faculty depts. Admin/Registrar: all depts */
  filterDeptId?: bigint;
  filterFacultyId?: bigint;
  userRole?: "Admin" | "HOD" | "Dean";
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function AccreditationReportTab({
  filterDeptId,
  filterFacultyId,
  userRole = "Admin",
}: AccreditationReportTabProps) {
  const {
    departments,
    faculties,
    courses,
    students,
    results,
    staffMembers,
    academicCalendars,
    institutionSettings,
  } = useApp();

  /* filters */
  const availableDepts = useMemo(() => {
    if (filterDeptId) return departments.filter((d) => d.id === filterDeptId);
    if (filterFacultyId)
      return departments.filter((d) => d.facultyId === filterFacultyId);
    return departments;
  }, [departments, filterDeptId, filterFacultyId]);

  const [selDept, setSelDept] = useState(() =>
    filterDeptId ? String(filterDeptId) : "",
  );
  const [selSession, setSelSession] = useState("");
  const [generated, setGenerated] = useState(false);

  /* Section A — Institutional Info */
  const [instInfo, setInstInfo] = useState<InstitutionalInfo>({
    address:
      institutionSettings?.address ??
      "Federal University of Education, Kontagora, Niger State",
    foundingYear: "1978",
    vcName: "Prof. Abdullahi Mohammed",
    accreditationHistory: "Full Accreditation 2018, Interim Accreditation 2021",
    nucApproved: true,
    ncceApproved: true,
    nbteApproved: false,
    studyMode: "Full Time",
  });

  /* Section B — Programme Info */
  const [progInfo, setProgInfo] = useState({
    programmeStartYear: "2000",
    accreditationStatus: "Full Accreditation",
    lastAccreditationDate: "2021-03-15",
    minYears: "4",
    maxYears: "6",
    degreeType: "B.Ed.",
  });

  /* Section F — Facilities */
  const [facilityData, setFacilityData] = useState<
    Record<string, FacilityEntry>
  >(
    Object.fromEntries(
      FACILITIES_DETAIL.map((f) => [
        f.key,
        { status: "Available", count: "", notes: "" },
      ]),
    ),
  );

  /* Section compliance */
  const [compliance, setCompliance] = useState<Record<string, boolean>>(
    Object.fromEntries(NUC_COMPLIANCE.map((c) => [c.id, true])),
  );
  const [complianceComments, setComplianceComments] = useState<
    Record<string, string>
  >({});

  /* PLOs */
  const [plos, setPlos] = useState<string[]>(PLO_DEFAULTS.slice());

  /* Derived data */
  const sessions = useMemo(() => {
    const s = [...new Set(academicCalendars.map((c) => c.session))];
    if (!s.includes("2024/2025")) s.push("2024/2025");
    return s;
  }, [academicCalendars]);

  const dept = departments.find((d) => String(d.id) === selDept);
  const faculty = dept
    ? faculties.find((f) => String(f.id) === String(dept.facultyId))
    : null;
  const deptCourses = useMemo(
    () => courses.filter((c) => String(c.departmentId) === selDept),
    [courses, selDept],
  );
  const deptStudents = useMemo(
    () => students.filter((s) => String(s.departmentId) === selDept),
    [students, selDept],
  );
  const deptStaff = useMemo(
    () => staffMembers.filter((s) => String(s.departmentId) === selDept),
    [staffMembers, selDept],
  );
  const hod = deptStaff.find((s) => s.role === "HOD");

  /* Enrolment */
  const levels = ["100", "200", "300", "400", "500", "600"];
  const enrolmentData = useMemo(
    () =>
      levels
        .map((lvl) => {
          const lvlStudents = deptStudents.filter(
            (s) => String((s as any).level ?? "100") === lvl,
          );
          const male = lvlStudents.filter((s) =>
            ["Male", "M"].includes((s as any).gender ?? ""),
          ).length;
          const female = lvlStudents.filter((s) =>
            ["Female", "F"].includes((s as any).gender ?? ""),
          ).length;
          return { level: `${lvl}L`, male, female, total: lvlStudents.length };
        })
        .filter((e) => e.total > 0),
    [deptStudents],
  );
  const totalMale = enrolmentData.reduce((s, e) => s + e.male, 0);
  const totalFemale = enrolmentData.reduce((s, e) => s + e.female, 0);
  const totalStudents = enrolmentData.reduce((s, e) => s + e.total, 0);

  /* Graduation rates */
  const graduationData = useMemo(() => {
    const map: Record<string, { graduates: number; total: number }> = {};
    for (const s of deptStudents) {
      const sess = (s as any).admissionSession ?? "2024/2025";
      if (!map[sess]) map[sess] = { graduates: 0, total: 0 };
      map[sess].total++;
      if (s.status === "Graduated" || s.status === "graduated")
        map[sess].graduates++;
    }
    return Object.entries(map).map(([session, d]) => ({
      session,
      graduates: d.graduates,
      total: d.total,
      rate: d.total > 0 ? ((d.graduates / d.total) * 100).toFixed(1) : "0",
    }));
  }, [deptStudents]);

  /* CGPA distribution */
  const cgpaDistribution = useMemo(() => {
    const studentCGPAs: Record<string, { sum: number; count: number }> = {};
    const deptResultsAll = results.filter((r) => {
      const c = deptCourses.find((c) => String(c.id) === String(r.courseId));
      return !!c && r.status === "published";
    });
    for (const r of deptResultsAll) {
      const key = String(r.studentId);
      if (!studentCGPAs[key]) studentCGPAs[key] = { sum: 0, count: 0 };
      studentCGPAs[key].sum += r.gradePoint;
      studentCGPAs[key].count++;
    }
    const cgpas = Object.values(studentCGPAs).map((v) =>
      v.count > 0 ? v.sum / v.count : 0,
    );
    return {
      firstClass: cgpas.filter((g) => g >= 4.5).length,
      secondUpper: cgpas.filter((g) => g >= 3.5 && g < 4.5).length,
      secondLower: cgpas.filter((g) => g >= 2.4 && g < 3.5).length,
      thirdClass: cgpas.filter((g) => g >= 1.5 && g < 2.4).length,
      pass: cgpas.filter((g) => g > 0 && g < 1.5).length,
    };
  }, [results, deptCourses]);

  /* Course compliance */
  const totalCore = useMemo(
    () =>
      deptCourses
        .filter((c) => (c as any).isCore)
        .reduce((s, c) => s + Number(c.creditUnits), 0),
    [deptCourses],
  );
  const totalElective = useMemo(
    () =>
      deptCourses
        .filter((c) => !(c as any).isCore)
        .reduce((s, c) => s + Number(c.creditUnits), 0),
    [deptCourses],
  );
  const totalCU = totalCore + totalElective;
  const instType =
    (institutionSettings as any)?.institutionType ?? "University";
  const minCredit =
    instType === "NCE" ? 90 : instType === "Polytechnic" ? 60 : 120;
  const creditCompliant = totalCU >= minCredit;

  /* Staff */
  const phdCount = deptStaff.filter((s) =>
    s.qualification?.toLowerCase().includes("phd"),
  ).length;
  const phdPercent =
    deptStaff.length > 0
      ? ((phdCount / deptStaff.length) * 100).toFixed(0)
      : "0";
  const mastersCount = deptStaff.filter(
    (s) =>
      s.qualification?.toLowerCase().includes("m.sc") ||
      s.qualification?.toLowerCase().includes("masters") ||
      s.qualification?.toLowerCase().includes("med") ||
      s.qualification?.toLowerCase().includes("mba"),
  ).length;
  const mastersPercent =
    deptStaff.length > 0
      ? ((mastersCount / deptStaff.length) * 100).toFixed(0)
      : "0";
  const staffStudentRatio =
    deptStaff.length > 0
      ? (deptStudents.length / deptStaff.length).toFixed(1)
      : "N/A";

  /* Result stats */
  const deptResults = useMemo(
    () =>
      results.filter((r) => {
        const c = deptCourses.find((c) => String(c.id) === String(r.courseId));
        return !!c && r.status === "published";
      }),
    [results, deptCourses],
  );
  const totalPassed = deptResults.filter((r) => r.grade !== "F").length;
  const overallPassRate =
    deptResults.length > 0
      ? ((totalPassed / deptResults.length) * 100).toFixed(1)
      : "0";

  const gradeData = useMemo(() => {
    const grades: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };
    for (const r of deptResults) if (r.grade in grades) grades[r.grade]++;
    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }, [deptResults]);

  const GRADE_COLORS: Record<string, string> = {
    A: "#22c55e",
    B: "#3b82f6",
    C: "#f59e0b",
    D: "#f97316",
    E: "#ef4444",
    F: "#dc2626",
  };

  const courseStats = useMemo(() => {
    const map: Record<
      string,
      { code: string; name: string; total: number; passed: number; sum: number }
    > = {};
    for (const r of deptResults) {
      const c = deptCourses.find((c) => String(c.id) === String(r.courseId));
      if (!c) continue;
      const key = String(c.id);
      if (!map[key])
        map[key] = { code: c.code, name: c.name, total: 0, passed: 0, sum: 0 };
      map[key].total++;
      if (r.grade !== "F") map[key].passed++;
      map[key].sum += r.totalScore ?? 0;
    }
    return Object.values(map).map((s) => ({
      ...s,
      passRate: s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : "0",
      mean: s.total > 0 ? (s.sum / s.total).toFixed(1) : "0",
    }));
  }, [deptResults, deptCourses]);

  /* ─── Accreditation Readiness Score ─────────────── */
  const readinessScore = useMemo(() => {
    if (!dept) return 0;
    // Staff qualifications (30%)
    const phdPct =
      deptStaff.length > 0 ? (phdCount / deptStaff.length) * 100 : 0;
    const staffScore = Math.min(30, (phdPct / 40) * 30);

    // Course compliance (20%)
    const courseScore = creditCompliant ? 20 : (totalCU / minCredit) * 20;

    // Facilities (20%)
    const availCount = Object.values(facilityData).filter(
      (f) => f.status === "Available",
    ).length;
    const facilityScore = (availCount / FACILITIES_DETAIL.length) * 20;

    // Pass rate (15%)
    const passScore = Math.min(15, (Number(overallPassRate) / 70) * 15);

    // Staff:student ratio (15%)
    const ratio =
      deptStaff.length > 0 ? deptStudents.length / deptStaff.length : 999;
    const ratioScore =
      ratio <= 30 ? 15 : ratio <= 45 ? 10 : ratio <= 60 ? 5 : 0;

    return Math.round(
      staffScore + courseScore + facilityScore + passScore + ratioScore,
    );
  }, [
    dept,
    phdCount,
    deptStaff,
    creditCompliant,
    totalCU,
    minCredit,
    facilityData,
    overallPassRate,
    deptStudents,
  ]);

  const complianceMet = Object.values(compliance).filter(Boolean).length;

  /* ─── CSV Exports ─────────────────────────────────── */
  function exportStaff() {
    exportCSV(
      [
        "S/N",
        "Name",
        "Qualification",
        "Designation",
        "Department",
        "Specialization",
        "Full-Time",
      ],
      deptStaff.map((s, i) => [
        i + 1,
        s.name,
        s.qualification ?? "",
        s.designation ?? s.role ?? "",
        dept?.name ?? "",
        (s as any).specialization ?? "General",
        "Full-Time",
      ]),
      `staff_${dept?.name ?? "dept"}.csv`,
    );
  }

  function exportStudentStats() {
    exportCSV(
      ["Level", "Male", "Female", "Total"],
      enrolmentData.map((e) => [e.level, e.male, e.female, e.total]),
      `students_${dept?.name ?? "dept"}.csv`,
    );
  }

  function exportCourseList() {
    exportCSV(
      ["Code", "Title", "Credit Units", "Level", "Semester", "Type"],
      deptCourses.map((c) => [
        c.code,
        c.name,
        Number(c.creditUnits),
        `${String((c as any).level ?? "")}L`,
        c.semester,
        (c as any).isCore ? "Core" : "Elective",
      ]),
      `courses_${dept?.name ?? "dept"}.csv`,
    );
  }

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Accreditation Report</h2>
        <Badge variant="outline">NUC / NCCE / NBTE Self-Study Format</Badge>
        {userRole === "HOD" && (
          <Badge variant="secondary">Department View</Badge>
        )}
        {userRole === "Dean" && <Badge variant="secondary">Faculty View</Badge>}
      </div>

      {/* Setup Form */}
      {!generated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Generate Accreditation Self-Study Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Department</Label>
                <Select
                  value={selDept}
                  onValueChange={setSelDept}
                  disabled={!!filterDeptId}
                >
                  <SelectTrigger data-ocid="accreditation.dept.select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepts.map((d) => (
                      <SelectItem key={String(d.id)} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Academic Session</Label>
                <Select value={selSession} onValueChange={setSelSession}>
                  <SelectTrigger data-ocid="accreditation.session.select">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Degree Type</Label>
                <Select
                  value={progInfo.degreeType}
                  onValueChange={(v) =>
                    setProgInfo((p) => ({ ...p, degreeType: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "B.Sc.",
                      "B.Ed.",
                      "B.A.",
                      "NCE",
                      "ND",
                      "HND",
                      "M.Sc.",
                      "Ph.D.",
                      "PGDE",
                    ].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Study Mode</Label>
                <Select
                  value={instInfo.studyMode}
                  onValueChange={(v) =>
                    setInstInfo((p) => ({
                      ...p,
                      studyMode: v as InstitutionalInfo["studyMode"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Distance Learning">
                      Distance Learning
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Accreditation Body</Label>
                <div className="flex flex-col gap-1 pt-1">
                  {[
                    { key: "nucApproved", label: "NUC" },
                    { key: "ncceApproved", label: "NCCE" },
                    { key: "nbteApproved", label: "NBTE" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`acc-${key}`}
                        checked={
                          instInfo[key as keyof InstitutionalInfo] as boolean
                        }
                        onCheckedChange={(v) =>
                          setInstInfo((p) => ({ ...p, [key]: !!v }))
                        }
                      />
                      <Label
                        htmlFor={`acc-${key}`}
                        className="font-normal text-xs"
                      >
                        {label} Approved
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              data-ocid="accreditation.generate.button"
              onClick={() => setGenerated(true)}
              disabled={!selDept || !selSession}
            >
              Generate Full Self-Study Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Report */}
      {generated && dept && (
        <div id="accreditation-report" className="space-y-4">
          {/* Actions bar */}
          <div className="flex flex-wrap justify-between items-center gap-2 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGenerated(false)}
            >
              ← Back to Setup
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                data-ocid="accreditation.print.button"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 mr-1" /> Print Report
              </Button>
            </div>
          </div>

          {/* Letterhead */}
          <div className="text-center border-b pb-4 print:border-black space-y-1">
            <h1 className="text-xl font-bold uppercase">
              {institutionSettings?.name ??
                "Federal University of Education, Kontagora"}
            </h1>
            <p className="text-sm text-muted-foreground">{instInfo.address}</p>
            <p className="text-base font-semibold mt-2">
              DEPARTMENTAL SELF-STUDY ACCREDITATION REPORT
            </p>
            <p className="font-medium">
              {dept.name} — {faculty?.name ?? ""}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              <Badge variant="outline">{selSession} Academic Session</Badge>
              <Badge variant="secondary">{progInfo.degreeType} Programme</Badge>
              <Badge>{instInfo.studyMode}</Badge>
              {instInfo.nucApproved && (
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  NUC Approved
                </Badge>
              )}
              {instInfo.ncceApproved && (
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  NCCE Approved
                </Badge>
              )}
              {instInfo.nbteApproved && (
                <Badge className="bg-primary/10 text-primary border-primary/30">
                  NBTE Approved
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Prepared in compliance with NUC/NCCE/NBTE Accreditation Guidelines
            </p>
          </div>

          {/* Readiness Score summary */}
          <Card className="bg-muted/20">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ReadinessRing score={readinessScore} />
                <div className="flex-1 space-y-2 w-full">
                  <p className="text-sm font-semibold">
                    Accreditation Readiness Breakdown
                  </p>
                  {[
                    {
                      label: "Staff Qualifications (30%)",
                      value: Math.min(30, (Number(phdPercent) / 40) * 30),
                    },
                    {
                      label: "Course Compliance (20%)",
                      value: creditCompliant ? 20 : (totalCU / minCredit) * 20,
                    },
                    {
                      label: "Facilities (20%)",
                      value:
                        (Object.values(facilityData).filter(
                          (f) => f.status === "Available",
                        ).length /
                          FACILITIES_DETAIL.length) *
                        20,
                    },
                    {
                      label: "Pass Rate (15%)",
                      value: Math.min(15, (Number(overallPassRate) / 70) * 15),
                    },
                    {
                      label: "Staff:Student Ratio (15%)",
                      value:
                        deptStaff.length > 0 &&
                        deptStudents.length / deptStaff.length <= 30
                          ? 15
                          : deptStaff.length > 0 &&
                              deptStudents.length / deptStaff.length <= 45
                            ? 10
                            : 5,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="flex-1 text-muted-foreground">
                        {item.label}
                      </span>
                      <div className="w-24 bg-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${(item.value / Number(item.label.match(/\((\d+)%\)/)?.[1] ?? 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono">
                        {item.value.toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sectional Tabs */}
          <Tabs defaultValue="sec_a">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="sec_a" data-ocid="accreditation.tab.sec_a">
                A — Institution
              </TabsTrigger>
              <TabsTrigger value="sec_b" data-ocid="accreditation.tab.sec_b">
                B — Programme
              </TabsTrigger>
              <TabsTrigger value="sec_c" data-ocid="accreditation.tab.sec_c">
                C — Staff
              </TabsTrigger>
              <TabsTrigger value="sec_d" data-ocid="accreditation.tab.sec_d">
                D — Students
              </TabsTrigger>
              <TabsTrigger value="sec_e" data-ocid="accreditation.tab.sec_e">
                E — Courses
              </TabsTrigger>
              <TabsTrigger value="sec_f" data-ocid="accreditation.tab.sec_f">
                F — Facilities
              </TabsTrigger>
              <TabsTrigger value="sec_g" data-ocid="accreditation.tab.sec_g">
                G — Results
              </TabsTrigger>
              <TabsTrigger value="sec_h" data-ocid="accreditation.tab.sec_h">
                H — Readiness
              </TabsTrigger>
              <TabsTrigger value="plo" data-ocid="accreditation.tab.plo">
                PLOs
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                data-ocid="accreditation.tab.compliance"
              >
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* ── SECTION A ── */}
            <TabsContent value="sec_a" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section A: Institutional Information"
                icon={Building2}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 text-sm">
                  <div className="space-y-1">
                    <Label>Institution Name</Label>
                    <Input
                      value={institutionSettings?.name ?? ""}
                      readOnly
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Address</Label>
                    <Input
                      value={instInfo.address}
                      onChange={(e) =>
                        setInstInfo((p) => ({ ...p, address: e.target.value }))
                      }
                      data-ocid="accreditation.inst.address"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Founding Year</Label>
                    <Input
                      value={instInfo.foundingYear}
                      onChange={(e) =>
                        setInstInfo((p) => ({
                          ...p,
                          foundingYear: e.target.value,
                        }))
                      }
                      data-ocid="accreditation.inst.founding_year"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Vice-Chancellor / Provost Name</Label>
                    <Input
                      value={instInfo.vcName}
                      onChange={(e) =>
                        setInstInfo((p) => ({ ...p, vcName: e.target.value }))
                      }
                      data-ocid="accreditation.inst.vc_name"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Accreditation History</Label>
                    <Textarea
                      rows={2}
                      value={instInfo.accreditationHistory}
                      onChange={(e) =>
                        setInstInfo((p) => ({
                          ...p,
                          accreditationHistory: e.target.value,
                        }))
                      }
                      placeholder="E.g. Full Accreditation 2018, Interim 2021..."
                      data-ocid="accreditation.inst.history"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-3">
                  {[
                    { key: "nucApproved", label: "NUC Approved" },
                    { key: "ncceApproved", label: "NCCE Approved" },
                    { key: "nbteApproved", label: "NBTE Approved" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`sec_a-${key}`}
                        checked={
                          instInfo[key as keyof InstitutionalInfo] as boolean
                        }
                        onCheckedChange={(v) =>
                          setInstInfo((p) => ({ ...p, [key]: !!v }))
                        }
                        data-ocid={`accreditation.inst.${key}`}
                      />
                      <Label
                        htmlFor={`sec_a-${key}`}
                        className="font-normal text-xs"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION B ── */}
            <TabsContent value="sec_b" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section B: Programme Information"
                icon={BookOpen}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1">
                    <Label>Programme Name</Label>
                    <Input value={dept.name} readOnly className="bg-muted/30" />
                  </div>
                  <div className="space-y-1">
                    <Label>Degree Type</Label>
                    <Select
                      value={progInfo.degreeType}
                      onValueChange={(v) =>
                        setProgInfo((p) => ({ ...p, degreeType: v }))
                      }
                    >
                      <SelectTrigger data-ocid="accreditation.prog.degree_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "B.Sc.",
                          "B.Ed.",
                          "B.A.",
                          "NCE",
                          "ND",
                          "HND",
                          "M.Sc.",
                          "Ph.D.",
                          "PGDE",
                        ].map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Year Programme Started</Label>
                    <Input
                      value={progInfo.programmeStartYear}
                      onChange={(e) =>
                        setProgInfo((p) => ({
                          ...p,
                          programmeStartYear: e.target.value,
                        }))
                      }
                      data-ocid="accreditation.prog.start_year"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Accreditation Status</Label>
                    <Select
                      value={progInfo.accreditationStatus}
                      onValueChange={(v) =>
                        setProgInfo((p) => ({ ...p, accreditationStatus: v }))
                      }
                    >
                      <SelectTrigger data-ocid="accreditation.prog.acc_status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Full Accreditation",
                          "Interim Accreditation",
                          "Denied Accreditation",
                          "Pending",
                        ].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Last Accreditation Date</Label>
                    <Input
                      type="date"
                      value={progInfo.lastAccreditationDate}
                      onChange={(e) =>
                        setProgInfo((p) => ({
                          ...p,
                          lastAccreditationDate: e.target.value,
                        }))
                      }
                      data-ocid="accreditation.prog.last_date"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Min / Max Years for Completion</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min"
                        value={progInfo.minYears}
                        onChange={(e) =>
                          setProgInfo((p) => ({
                            ...p,
                            minYears: e.target.value,
                          }))
                        }
                        className="w-20"
                        data-ocid="accreditation.prog.min_years"
                      />
                      <span className="self-center text-muted-foreground">
                        —
                      </span>
                      <Input
                        placeholder="Max"
                        value={progInfo.maxYears}
                        onChange={(e) =>
                          setProgInfo((p) => ({
                            ...p,
                            maxYears: e.target.value,
                          }))
                        }
                        className="w-20"
                        data-ocid="accreditation.prog.max_years"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded-md bg-muted/30 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <b>HOD:</b> {hod?.name ?? "N/A"}
                  </div>
                  <div>
                    <b>Faculty:</b> {faculty?.name ?? "N/A"}
                  </div>
                  <div>
                    <b>Session:</b> {selSession}
                  </div>
                  <div>
                    <b>Study Mode:</b> {instInfo.studyMode}
                  </div>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION C — STAFF ── */}
            <TabsContent value="sec_c" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section C: Academic Staff"
                icon={Users}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-3 text-sm">
                    <span>
                      Total Staff: <b>{deptStaff.length}</b>
                    </span>
                    <span>
                      PhD:{" "}
                      <b>
                        {phdCount} ({phdPercent}%)
                      </b>
                    </span>
                    <span>
                      Masters:{" "}
                      <b>
                        {mastersCount} ({mastersPercent}%)
                      </b>
                    </span>
                    <span>
                      Staff:Student Ratio: <b>1:{staffStudentRatio}</b>
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportStaff}
                    data-ocid="accreditation.staff.export"
                  >
                    <Download className="w-3 h-3 mr-1" /> CSV
                  </Button>
                </div>
                {deptStaff.length === 0 ? (
                  <p
                    className="text-muted-foreground text-sm"
                    data-ocid="accreditation.staff.empty_state"
                  >
                    No staff records for this department.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table data-ocid="accreditation.staff.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Rank / Designation</TableHead>
                          <TableHead>Staff ID</TableHead>
                          <TableHead>Qualification</TableHead>
                          <TableHead>Specialization</TableHead>
                          <TableHead>FT/PT</TableHead>
                          <TableHead>PhD</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptStaff.map((s, i) => (
                          <TableRow
                            key={s.staffId}
                            data-ocid={`accreditation.staff.item.${i + 1}`}
                          >
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-medium">
                              {s.name}
                            </TableCell>
                            <TableCell>{s.designation ?? s.role}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {s.staffId}
                            </TableCell>
                            <TableCell>{s.qualification ?? "N/A"}</TableCell>
                            <TableCell>
                              {(s as any).specialization ?? "General"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                Full-Time
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {s.qualification
                                ?.toLowerCase()
                                .includes("phd") ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <XCircle className="w-4 h-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="mt-2 flex gap-6 p-3 bg-muted/20 rounded text-xs">
                  <span>
                    PhD ≥ 40%?{" "}
                    {Number(phdPercent) >= 40 ? (
                      <span className="text-success font-bold">✓ Yes</span>
                    ) : (
                      <span className="text-destructive font-bold">
                        ✗ No ({phdPercent}%)
                      </span>
                    )}
                  </span>
                  <span>
                    Staff:Student ≤ 30?{" "}
                    {Number(staffStudentRatio) <= 30 ? (
                      <span className="text-success font-bold">
                        ✓ Yes (1:{staffStudentRatio})
                      </span>
                    ) : (
                      <span className="text-destructive font-bold">
                        ✗ No (1:{staffStudentRatio})
                      </span>
                    )}
                  </span>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION D — STUDENTS ── */}
            <TabsContent value="sec_d" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section D: Student Statistics"
                icon={GraduationCap}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-3 text-sm flex-wrap">
                    <span>
                      Total: <b>{totalStudents}</b>
                    </span>
                    <span>
                      Male: <b>{totalMale}</b>
                    </span>
                    <span>
                      Female: <b>{totalFemale}</b>
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportStudentStats}
                    data-ocid="accreditation.students.export"
                  >
                    <Download className="w-3 h-3 mr-1" /> CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table data-ocid="accreditation.enrolment.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Level</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>% Female</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolmentData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground"
                            data-ocid="accreditation.enrolment.empty_state"
                          >
                            No enrolment data
                          </TableCell>
                        </TableRow>
                      ) : (
                        enrolmentData.map((e, i) => (
                          <TableRow
                            key={e.level}
                            data-ocid={`accreditation.enrolment.item.${i + 1}`}
                          >
                            <TableCell>{e.level}</TableCell>
                            <TableCell>{e.male}</TableCell>
                            <TableCell>{e.female}</TableCell>
                            <TableCell className="font-semibold">
                              {e.total}
                            </TableCell>
                            <TableCell>
                              {e.total > 0
                                ? ((e.female / e.total) * 100).toFixed(0)
                                : 0}
                              %
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {enrolmentData.length > 0 && (
                        <TableRow className="font-bold bg-muted/30">
                          <TableCell>TOTAL</TableCell>
                          <TableCell>{totalMale}</TableCell>
                          <TableCell>{totalFemale}</TableCell>
                          <TableCell>{totalStudents}</TableCell>
                          <TableCell>
                            {totalStudents > 0
                              ? ((totalFemale / totalStudents) * 100).toFixed(0)
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {enrolmentData.length > 0 && (
                  <div className="mt-3">
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={enrolmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="male" fill="#3b82f6" name="Male" />
                        <Bar dataKey="female" fill="#ec4899" name="Female" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/30">
                    <p className="text-muted-foreground">Graduation Rates</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Session</TableHead>
                          <TableHead className="text-xs">Admitted</TableHead>
                          <TableHead className="text-xs">Graduated</TableHead>
                          <TableHead className="text-xs">Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {graduationData.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-muted-foreground"
                              data-ocid="accreditation.graduation.empty_state"
                            >
                              No data
                            </TableCell>
                          </TableRow>
                        ) : (
                          graduationData.slice(0, 5).map((g, i) => (
                            <TableRow
                              key={g.session}
                              data-ocid={`accreditation.graduation.item.${i + 1}`}
                            >
                              <TableCell>{g.session}</TableCell>
                              <TableCell>{g.total}</TableCell>
                              <TableCell>{g.graduates}</TableCell>
                              <TableCell
                                className={
                                  Number(g.rate) >= 70
                                    ? "text-success font-semibold"
                                    : "text-destructive font-semibold"
                                }
                              >
                                {g.rate}%
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-2 rounded bg-muted/30 col-span-2">
                    <p className="text-muted-foreground mb-1">
                      CGPA Distribution (Published Results)
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        {
                          label: "First Class (≥4.5)",
                          val: cgpaDistribution.firstClass,
                          color: "text-success",
                        },
                        {
                          label: "2nd Upper (≥3.5)",
                          val: cgpaDistribution.secondUpper,
                          color: "text-blue-600",
                        },
                        {
                          label: "2nd Lower (≥2.4)",
                          val: cgpaDistribution.secondLower,
                          color: "text-amber-600",
                        },
                        {
                          label: "Third Class (≥1.5)",
                          val: cgpaDistribution.thirdClass,
                          color: "text-orange-500",
                        },
                        {
                          label: "Pass (<1.5)",
                          val: cgpaDistribution.pass,
                          color: "text-destructive",
                        },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={`font-bold ${color}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION E — COURSES ── */}
            <TabsContent value="sec_e" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section E: Course List per Programme"
                icon={BookOpen}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span>
                      Total Credit Units: <b>{totalCU}</b>
                    </span>
                    <span>
                      Core: <b>{totalCore} CU</b>
                    </span>
                    <span>
                      Elective: <b>{totalElective} CU</b>
                    </span>
                    <span
                      className={
                        creditCompliant
                          ? "text-success font-semibold"
                          : "text-destructive font-semibold"
                      }
                    >
                      NUC Min {minCredit} CU:{" "}
                      {creditCompliant
                        ? "✓ Met"
                        : `✗ Deficit (${minCredit - totalCU} CU)`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportCourseList}
                    data-ocid="accreditation.courses.export"
                  >
                    <Download className="w-3 h-3 mr-1" /> CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table data-ocid="accreditation.courses.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>CU</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deptCourses.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground"
                          >
                            No courses found for this department
                          </TableCell>
                        </TableRow>
                      ) : (
                        deptCourses.map((c, i) => (
                          <TableRow
                            key={String(c.id)}
                            data-ocid={`accreditation.course.item.${i + 1}`}
                          >
                            <TableCell className="text-xs">{i + 1}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {c.code}
                            </TableCell>
                            <TableCell className="text-xs">{c.name}</TableCell>
                            <TableCell className="text-xs">
                              {Number(c.creditUnits)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {String((c as any).level ?? "")}L
                            </TableCell>
                            <TableCell className="text-xs">
                              {c.semester}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (c as any).isCore ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {(c as any).isCore ? "Core" : "Elective"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION F — FACILITIES ── */}
            <TabsContent value="sec_f" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section F: Physical Facilities"
                icon={Building2}
              >
                <div className="overflow-x-auto">
                  <Table data-ocid="accreditation.facilities.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Facility</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Count / Capacity</TableHead>
                        <TableHead>Notes / Equipment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {FACILITIES_DETAIL.map((f, i) => (
                        <TableRow
                          key={f.key}
                          data-ocid={`accreditation.facility.item.${i + 1}`}
                        >
                          <TableCell className="text-xs">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {f.label}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={facilityData[f.key]?.status ?? "Available"}
                              onValueChange={(v) =>
                                setFacilityData((prev) => ({
                                  ...prev,
                                  [f.key]: {
                                    ...prev[f.key],
                                    status: v as FacilityStatus,
                                  },
                                }))
                              }
                            >
                              <SelectTrigger
                                className="h-7 text-xs w-36"
                                data-ocid={`accreditation.facility.${f.key}.status`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                  <SelectItem
                                    key={s}
                                    value={s}
                                    className="text-xs"
                                  >
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="e.g. 4 rooms / 200 seats"
                              value={facilityData[f.key]?.count ?? ""}
                              onChange={(e) =>
                                setFacilityData((prev) => ({
                                  ...prev,
                                  [f.key]: {
                                    ...prev[f.key],
                                    count: e.target.value,
                                  },
                                }))
                              }
                              className="h-7 text-xs w-40"
                              data-ocid={`accreditation.facility.${f.key}.count`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Notes..."
                              value={facilityData[f.key]?.notes ?? ""}
                              onChange={(e) =>
                                setFacilityData((prev) => ({
                                  ...prev,
                                  [f.key]: {
                                    ...prev[f.key],
                                    notes: e.target.value,
                                  },
                                }))
                              }
                              className="h-7 text-xs min-w-48"
                              data-ocid={`accreditation.facility.${f.key}.notes`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 flex gap-6 text-xs text-muted-foreground">
                  <span>
                    Available:{" "}
                    <b className="text-success">
                      {
                        Object.values(facilityData).filter(
                          (f) => f.status === "Available",
                        ).length
                      }
                    </b>
                  </span>
                  <span>
                    Inadequate:{" "}
                    <b className="text-amber-500">
                      {
                        Object.values(facilityData).filter(
                          (f) => f.status === "Inadequate",
                        ).length
                      }
                    </b>
                  </span>
                  <span>
                    Not Available:{" "}
                    <b className="text-destructive">
                      {
                        Object.values(facilityData).filter(
                          (f) => f.status === "Not Available",
                        ).length
                      }
                    </b>
                  </span>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION G — RESULTS ── */}
            <TabsContent value="sec_g" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section G: Result Statistics"
                icon={BarChart3}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <Card>
                    <CardContent className="pt-3">
                      <p className="text-xs text-muted-foreground">
                        Total Results
                      </p>
                      <p className="text-2xl font-bold">{deptResults.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3">
                      <p className="text-xs text-muted-foreground">Passed</p>
                      <p className="text-2xl font-bold text-success">
                        {totalPassed}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-3">
                      <p className="text-xs text-muted-foreground">
                        Overall Pass Rate
                      </p>
                      <p
                        className={`text-2xl font-bold ${Number(overallPassRate) >= 70 ? "text-success" : "text-destructive"}`}
                      >
                        {overallPassRate}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2">
                    Grade Distribution
                  </p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={gradeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Count">
                        {gradeData.map((entry) => (
                          <Cell
                            key={entry.grade}
                            fill={GRADE_COLORS[entry.grade] ?? "#94a3b8"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <Table data-ocid="accreditation.result_stats.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Entries</TableHead>
                        <TableHead>Passed</TableHead>
                        <TableHead>Pass Rate</TableHead>
                        <TableHead>Mean Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseStats.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground"
                          >
                            No published results yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        courseStats.map((s, i) => (
                          <TableRow
                            key={s.code}
                            data-ocid={`accreditation.course_stats.item.${i + 1}`}
                          >
                            <TableCell className="font-mono text-xs">
                              {s.code}
                            </TableCell>
                            <TableCell className="text-xs">{s.name}</TableCell>
                            <TableCell>{s.total}</TableCell>
                            <TableCell>{s.passed}</TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${Number(s.passRate) >= 70 ? "text-success" : "text-destructive"}`}
                              >
                                {s.passRate}%
                              </span>
                            </TableCell>
                            <TableCell>{s.mean}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── SECTION H — READINESS ── */}
            <TabsContent value="sec_h" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Section H: Accreditation Readiness Score"
                icon={ClipboardList}
              >
                <div className="flex flex-col sm:flex-row items-start gap-6 mt-3">
                  <ReadinessRing score={readinessScore} />
                  <div className="flex-1 space-y-3 text-sm">
                    {[
                      {
                        label: "Staff Qualifications",
                        weight: 30,
                        value: Math.min(30, (Number(phdPercent) / 40) * 30),
                        tip: `${phdPercent}% PhD holders. NUC requires ≥ 40%.`,
                        pass: Number(phdPercent) >= 40,
                      },
                      {
                        label: "Course Compliance",
                        weight: 20,
                        value: creditCompliant
                          ? 20
                          : (totalCU / minCredit) * 20,
                        tip: `Total credit units: ${totalCU} / required ${minCredit}. ${creditCompliant ? "Met." : `Deficit: ${minCredit - totalCU} CU.`}`,
                        pass: creditCompliant,
                      },
                      {
                        label: "Physical Facilities",
                        weight: 20,
                        value:
                          (Object.values(facilityData).filter(
                            (f) => f.status === "Available",
                          ).length /
                            FACILITIES_DETAIL.length) *
                          20,
                        tip: `${Object.values(facilityData).filter((f) => f.status === "Available").length}/${FACILITIES_DETAIL.length} facilities marked Available.`,
                        pass:
                          Object.values(facilityData).filter(
                            (f) => f.status === "Available",
                          ).length >=
                          FACILITIES_DETAIL.length * 0.7,
                      },
                      {
                        label: "Student Pass Rate",
                        weight: 15,
                        value: Math.min(
                          15,
                          (Number(overallPassRate) / 70) * 15,
                        ),
                        tip: `Overall pass rate: ${overallPassRate}%. NUC benchmark: ≥ 70%.`,
                        pass: Number(overallPassRate) >= 70,
                      },
                      {
                        label: "Staff:Student Ratio",
                        weight: 15,
                        value:
                          deptStaff.length > 0 &&
                          deptStudents.length / deptStaff.length <= 30
                            ? 15
                            : deptStaff.length > 0 &&
                                deptStudents.length / deptStaff.length <= 45
                              ? 10
                              : 5,
                        tip: `Current ratio 1:${staffStudentRatio}. NUC benchmark: 1:30 max.`,
                        pass: Number(staffStudentRatio) <= 30,
                      },
                    ].map((item) => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {item.label} ({item.weight}%)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {item.value.toFixed(0)}/{item.weight}
                            </span>
                            {item.pass ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(item.value / item.weight) * 100}%`,
                              background: item.pass ? "#22c55e" : "#f59e0b",
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.tip}
                        </p>
                        {!item.pass && (
                          <p className="text-xs text-amber-600">
                            💡 Improvement tip:{" "}
                            {item.label === "Staff Qualifications"
                              ? "Encourage staff to pursue PhD qualifications or recruit more PhD holders."
                              : item.label === "Course Compliance"
                                ? `Add ${minCredit - totalCU} more credit units to the programme curriculum.`
                                : item.label === "Physical Facilities"
                                  ? "Mark more facilities as available or procure missing equipment."
                                  : item.label === "Student Pass Rate"
                                    ? "Review course delivery, provide remedial classes, and improve student support."
                                    : "Recruit more academic staff to improve the staff-to-student ratio."}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            </TabsContent>

            {/* ── PLOs ── */}
            <TabsContent value="plo" className="space-y-3 mt-4">
              <CollapsibleSection
                title="Programme Learning Outcomes (PLOs)"
                icon={ClipboardList}
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Edit the learning outcomes for the{" "}
                  <strong>{dept.name}</strong> programme:
                </p>
                {plos.map((plo, idx) => (
                  <div
                    key={`plo-${String(idx)}`}
                    className="flex gap-3 items-start mb-2"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-10 shrink-0 mt-2.5">
                      PLO {idx + 1}
                    </span>
                    <Textarea
                      rows={2}
                      value={plo}
                      onChange={(e) => {
                        const updated = [...plos];
                        updated[idx] = e.target.value;
                        setPlos(updated);
                      }}
                      className="text-sm"
                      data-ocid={`accreditation.plo.${idx + 1}.textarea`}
                    />
                  </div>
                ))}
              </CollapsibleSection>
            </TabsContent>

            {/* ── COMPLIANCE ── */}
            <TabsContent value="compliance" className="space-y-3 mt-4">
              <CollapsibleSection
                title="NUC / NCCE Minimum Benchmark Compliance Checklist"
                icon={ClipboardList}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Badge
                    variant={complianceMet >= 8 ? "default" : "destructive"}
                  >
                    {complianceMet}/{NUC_COMPLIANCE.length} Benchmarks Met
                  </Badge>
                  {complianceMet >= 8 && (
                    <span className="text-xs text-success">
                      Accreditation Ready
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {NUC_COMPLIANCE.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`comp-${item.id}`}
                          checked={compliance[item.id]}
                          onCheckedChange={(v) =>
                            setCompliance((prev) => ({
                              ...prev,
                              [item.id]: !!v,
                            }))
                          }
                          data-ocid={`accreditation.compliance.${item.id}.checkbox`}
                        />
                        <Label
                          htmlFor={`comp-${item.id}`}
                          className={`font-normal text-sm ${compliance[item.id] ? "text-foreground" : "text-destructive"}`}
                        >
                          {item.label}
                        </Label>
                      </div>
                      <Input
                        placeholder="Add comment or evidence..."
                        value={complianceComments[item.id] ?? ""}
                        onChange={(e) =>
                          setComplianceComments((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="ml-6 h-7 text-xs"
                        data-ocid={`accreditation.compliance.${item.id}.input`}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
