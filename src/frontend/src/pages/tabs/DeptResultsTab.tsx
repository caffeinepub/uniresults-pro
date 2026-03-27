import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInstitutionConfig } from "@/hooks/useInstitutionConfig";
import { Database, Download, Printer, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { logReportActivity } from "../../utils/institutionHelpers";

interface Props {
  userRole: "Registrar" | "HOD" | "Dean";
}

function calcGPA(
  studentId: string,
  results: any[],
  courses: any[],
  session?: string,
  semester?: string,
): number | null {
  const filtered = results.filter((r) => {
    if (String(r.studentId) !== studentId) return false;
    if (!["approved", "published"].includes(r.status)) return false;
    if (session && r.session && r.session !== session) return false;
    if (semester && semester !== "All" && r.semester && r.semester !== semester)
      return false;
    return true;
  });
  if (filtered.length === 0) return null;
  let totalGP = 0;
  let totalCU = 0;
  for (const r of filtered) {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    const cu = course ? Number(course.creditUnits) : 1;
    totalGP += (r.gradePoint ?? 0) * cu;
    totalCU += cu;
  }
  if (totalCU === 0) return null;
  return Math.round((totalGP / totalCU) * 100) / 100;
}

function calcCGPA(
  studentId: string,
  results: any[],
  courses: any[],
): number | null {
  const filtered = results.filter(
    (r) =>
      String(r.studentId) === studentId &&
      ["approved", "published"].includes(r.status),
  );
  if (filtered.length === 0) return null;
  let totalGP = 0;
  let totalCU = 0;
  for (const r of filtered) {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    const cu = course ? Number(course.creditUnits) : 1;
    totalGP += (r.gradePoint ?? 0) * cu;
    totalCU += cu;
  }
  if (totalCU === 0) return null;
  return Math.round((totalGP / totalCU) * 100) / 100;
}

function getRemarks(cgpa: number | null): string {
  if (cgpa === null) return "—";
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "2nd Class Upper";
  if (cgpa >= 2.5) return "2nd Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1.0) return "Pass";
  return "Fail";
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-green-600 dark:text-green-400 font-semibold";
    case "B":
      return "text-blue-600 dark:text-blue-400 font-semibold";
    case "C":
      return "text-amber-600 dark:text-amber-400 font-semibold";
    case "D":
    case "E":
      return "text-orange-600 dark:text-orange-400 font-semibold";
    case "F":
      return "text-red-600 dark:text-red-400 font-bold";
    default:
      return "text-muted-foreground";
  }
}

const SAMPLE_NIGERIAN_NAMES = [
  "Adebayo Oluwaseun",
  "Chidinma Okonkwo",
  "Emeka Nwosu",
  "Fatima Abubakar",
  "Gbenga Adeyemi",
  "Hauwa Ibrahim",
  "Ikenna Obi",
  "Jumoke Adeleke",
  "Kelechi Eze",
  "Ladi Musa",
  "Musa Salihu",
  "Ngozi Nnaji",
  "Olumide Afolabi",
  "Precious Okoro",
  "Rasheed Lawal",
];

function loadSampleData() {
  const students = JSON.parse(localStorage.getItem("unires_students") || "[]");
  const results = JSON.parse(localStorage.getItem("unires_results") || "[]");
  const courses = JSON.parse(localStorage.getItem("unires_courses") || "[]");
  const departments = JSON.parse(
    localStorage.getItem("unires_departments") || "[]",
  );

  if (departments.length === 0) {
    toast.error("No departments found. Please generate default data first.");
    return;
  }

  const grades = ["A", "B", "B", "C", "C", "D", "F"];
  const gradePoints: Record<string, number> = {
    A: 5,
    B: 4,
    C: 3,
    D: 2,
    E: 1,
    F: 0,
  };

  let newStudents: any[] = [];
  let newResults: any[] = [];
  const now = Date.now();

  const depts = departments.slice(0, 4);
  let nameIdx = 0;

  for (const dept of depts) {
    const deptCourses = courses
      .filter((c: any) => String(c.departmentId) === String(dept.id))
      .slice(0, 5);
    if (deptCourses.length === 0) continue;
    const prefix = (dept.name || "GEN").substring(0, 3).toUpperCase();

    for (let i = 1; i <= 4; i++) {
      const sid = now + nameIdx;
      const level = i <= 2 ? 100 : 200;
      const matric = `${prefix}/${2024}/${String(i).padStart(3, "0")}`;
      const student = {
        id: sid,
        name: SAMPLE_NIGERIAN_NAMES[nameIdx % SAMPLE_NIGERIAN_NAMES.length],
        matricNumber: matric,
        departmentId: dept.id,
        level,
        status: "active",
        session: "2023/2024",
        email: `student${sid}@uni.edu.ng`,
        phone: "",
      };
      newStudents.push(student);

      for (const course of deptCourses) {
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const gp = gradePoints[grade] ?? 0;
        const total =
          grade === "A"
            ? 80
            : grade === "B"
              ? 70
              : grade === "C"
                ? 60
                : grade === "D"
                  ? 50
                  : grade === "F"
                    ? 30
                    : 45;
        newResults.push({
          id: now + nameIdx * 1000 + course.id,
          studentId: sid,
          courseId: course.id,
          caScore: Math.floor(total * 0.4),
          examScore: Math.floor(total * 0.6),
          totalScore: total,
          grade,
          gradePoint: gp,
          remarks:
            grade === "A"
              ? "Distinction"
              : grade === "B"
                ? "Credit"
                : grade === "C"
                  ? "Merit"
                  : grade === "F"
                    ? "Fail"
                    : "Pass",
          status: "published",
          session: "2023/2024",
          semester: "First",
        });
      }
      nameIdx++;
    }
  }

  const existingMatrics = new Set(students.map((s: any) => s.matricNumber));
  const toAdd = newStudents.filter((s) => !existingMatrics.has(s.matricNumber));
  localStorage.setItem(
    "unires_students",
    JSON.stringify([...students, ...toAdd]),
  );

  const existingResultIds = new Set(results.map((r: any) => String(r.id)));
  const resultsToAdd = newResults.filter(
    (r) => !existingResultIds.has(String(r.id)),
  );
  localStorage.setItem(
    "unires_results",
    JSON.stringify([...results, ...resultsToAdd]),
  );

  toast.success(
    `Loaded sample data: ${toAdd.length} students, ${resultsToAdd.length} results`,
  );
  window.location.reload();
}

interface DeptSection {
  facultyName: string;
  deptName: string;
  deptId: string;
  courseCodes: { code: string; id: string; creditUnits: number }[];
  rows: {
    sn: number;
    studentId: string;
    matricNumber: string;
    name: string;
    level: number;
    grades: Record<string, string>; // courseId -> "A (5)"
    gpa: number | null;
    cgpa: number | null;
    coursesFailed: string[];
    remarks: string;
  }[];
}

export default function DeptResultsTab({ userRole }: Props) {
  const { students, results, courses, departments, faculties } =
    useApp() as any;
  const _instConfig = useInstitutionConfig();
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportFn, setPendingExportFn] = useState<(() => void) | null>(
    null,
  );
  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterSession, setFilterSession] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");

  const institutionName =
    JSON.parse(localStorage.getItem("unires_institutionSettings") || "{}")
      .name || "University";

  const filteredDepts = useMemo(() => {
    if (filterFaculty === "all") return departments;
    return departments.filter(
      (d: any) => String(d.facultyId) === filterFaculty,
    );
  }, [departments, filterFaculty]);

  const sections: DeptSection[] = useMemo(() => {
    const deptList =
      filterDept === "all"
        ? filteredDepts
        : filteredDepts.filter((d: any) => String(d.id) === filterDept);

    return deptList
      .map((dept: any) => {
        const faculty = faculties.find(
          (f: any) => String(f.id) === String(dept.facultyId),
        );
        const facultyName = faculty
          ? faculty.name.toUpperCase()
          : "UNKNOWN FACULTY";
        const deptName = dept.name.toUpperCase();
        const deptId = String(dept.id);

        // Get students in this dept
        let deptStudents = students.filter(
          (s: any) =>
            String(s.departmentId) === deptId && s.status !== "deferred",
        );
        if (filterLevel !== "all") {
          deptStudents = deptStudents.filter(
            (s: any) => String(s.level) === filterLevel,
          );
        }

        if (deptStudents.length === 0) return null;

        // Get courses for this dept
        let deptCourses = courses.filter(
          (c: any) => String(c.departmentId) === deptId,
        );
        if (filterSemester !== "all") {
          deptCourses = deptCourses.filter(
            (c: any) => !c.semester || c.semester === filterSemester,
          );
        }

        // Sort courses by code
        deptCourses = [...deptCourses].sort((a: any, b: any) =>
          a.code.localeCompare(b.code),
        );

        const courseCodes = deptCourses.map((c: any) => ({
          code: c.code,
          id: String(c.id),
          creditUnits: Number(c.creditUnits),
        }));

        const rows = deptStudents.map((student: any, idx: number) => {
          const sid = String(student.id);
          const studentResults = results.filter((r: any) => {
            if (String(r.studentId) !== sid) return false;
            if (!["approved", "published"].includes(r.status)) return false;
            if (filterSession && r.session && r.session !== filterSession)
              return false;
            if (
              filterSemester !== "all" &&
              r.semester &&
              r.semester !== filterSemester
            )
              return false;
            return true;
          });

          const grades: Record<string, string> = {};
          for (const cc of courseCodes) {
            const res = studentResults.find(
              (r: any) => String(r.courseId) === cc.id,
            );
            if (res) {
              grades[cc.id] = `${res.grade} (${res.gradePoint})`;
            } else {
              grades[cc.id] = "-";
            }
          }

          const gpa = calcGPA(
            sid,
            results,
            courses,
            filterSession || undefined,
            filterSemester,
          );
          const cgpa = calcCGPA(sid, results, courses);

          const coursesFailed = studentResults
            .filter((r: any) => r.grade === "F")
            .map((r: any) => {
              const c = courses.find(
                (cc: any) => String(cc.id) === String(r.courseId),
              );
              return c ? c.code : "?";
            });

          return {
            sn: idx + 1,
            studentId: sid,
            matricNumber: student.matricNumber,
            name: student.name,
            level: Number(student.level ?? 100),
            grades,
            gpa,
            cgpa,
            coursesFailed,
            remarks: getRemarks(cgpa),
          };
        });

        return { facultyName, deptName, deptId, courseCodes, rows };
      })
      .filter(Boolean) as DeptSection[];
  }, [
    students,
    results,
    courses,
    faculties,
    filteredDepts,
    filterDept,
    filterLevel,
    filterSession,
    filterSemester,
  ]);

  function exportDeptCSV(section: DeptSection) {
    const headers = [
      "S/N",
      "Matric No",
      "Student Name",
      ...section.courseCodes.map((c) => c.code),
      "GPA",
      "CGPA",
      "Courses Failed",
      "Remarks",
    ];
    const rowsData = section.rows.map((r) => [
      r.sn,
      r.matricNumber,
      r.name,
      ...section.courseCodes.map((c) => r.grades[c.id] ?? "-"),
      r.gpa !== null ? r.gpa.toFixed(2) : "-",
      r.cgpa !== null ? r.cgpa.toFixed(2) : "-",
      r.coursesFailed.length > 0 ? r.coursesFailed.join("; ") : "-",
      r.remarks,
    ]);
    const csv = [headers, ...rowsData]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${section.deptName}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    logReportActivity(
      "Departmental",
      section.deptName,
      filterSession || "All",
      userRole,
      "CSV",
    );
  }

  function exportAllCSV() {
    if (sections.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const allRows: string[][] = [];
    for (const section of sections) {
      allRows.push([`FACULTY OF ${section.facultyName}`, "", ""]);
      allRows.push([`DEPARTMENT OF ${section.deptName}`, "", ""]);
      const headers = [
        "S/N",
        "Matric No",
        "Student Name",
        ...section.courseCodes.map((c) => c.code),
        "GPA",
        "CGPA",
        "Courses Failed",
        "Remarks",
      ];
      allRows.push(headers);
      for (const r of section.rows) {
        allRows.push([
          String(r.sn),
          r.matricNumber,
          r.name,
          ...section.courseCodes.map((c) => r.grades[c.id] ?? "-"),
          r.gpa !== null ? r.gpa.toFixed(2) : "-",
          r.cgpa !== null ? r.cgpa.toFixed(2) : "-",
          r.coursesFailed.length > 0 ? r.coursesFailed.join("; ") : "-",
          r.remarks,
        ]);
      }
      allRows.push([""]);
    }
    const csv = allRows
      .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "departmental_results_all.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("All departments exported.");
    logReportActivity(
      "Departmental",
      "All Departments",
      filterSession || "All",
      userRole,
      "CSV",
    );
  }

  function printDept(deptId: string) {
    const el = document.getElementById(`dept-section-${deptId}`);
    if (!el) return;
    const printContent = el.innerHTML;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Departmental Results</title><style>
      body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      h2, h3 { margin: 4px 0; }
      .no-print { display: none !important; }
    </style></head><body>${printContent}</body></html>`);
    w.document.close();
    w.print();
  }

  const hasData = sections.length > 0;

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .dept-results-container { padding: 0; }
          .dept-section { page-break-after: always; }
          table { font-size: 10px; }
        }
      `}</style>

      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Departmental Results Processing
          </h2>
          <p className="text-sm text-muted-foreground">
            {institutionName} — {userRole} View
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPendingExportFn(() => exportAllCSV);
              setExportDialogOpen(true);
            }}
            data-ocid="dept_results.export_all.button"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export All CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPendingExportFn(() => () => window.print());
              setExportDialogOpen(true);
            }}
            data-ocid="dept_results.print_all.button"
          >
            <Printer className="w-3.5 h-3.5 mr-1" /> Print All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSampleData}
            data-ocid="dept_results.load_sample.button"
          >
            <Database className="w-3.5 h-3.5 mr-1" /> Load Sample Data
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-muted/30 rounded-lg border border-border no-print"
        data-ocid="dept_results.panel"
      >
        <div className="space-y-1">
          <Label className="text-xs">Faculty</Label>
          <Select
            value={filterFaculty}
            onValueChange={(v) => {
              setFilterFaculty(v);
              setFilterDept("all");
            }}
          >
            <SelectTrigger
              className="h-8 text-xs"
              data-ocid="dept_results.faculty.select"
            >
              <SelectValue placeholder="All Faculties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {(faculties as any[]).map((f: any) => (
                <SelectItem key={String(f.id)} value={String(f.id)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger
              className="h-8 text-xs"
              data-ocid="dept_results.dept.select"
            >
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {filteredDepts.map((d: any) => (
                <SelectItem key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Level</Label>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger
              className="h-8 text-xs"
              data-ocid="dept_results.level.select"
            >
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {_instConfig.levelLabel}s</SelectItem>
              {_instConfig.levels
                .filter((l) => !["700", "800"].includes(l))
                .map((l) => (
                  <SelectItem key={l} value={l}>
                    {_instConfig.levelLabel} {l}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Session</Label>
          <Input
            className="h-8 text-xs"
            placeholder="e.g. 2023/2024"
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            data-ocid="dept_results.session.input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Semester</Label>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger
              className="h-8 text-xs"
              data-ocid="dept_results.semester.select"
            >
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="First">First</SelectItem>
              <SelectItem value="Second">Second</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {!hasData ? (
        <div
          className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg"
          data-ocid="dept_results.empty_state"
        >
          <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No student data found</p>
          <p className="text-sm mt-1">
            Adjust filters or load sample data to get started.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={loadSampleData}
            data-ocid="dept_results.empty_load.button"
          >
            <Database className="w-3.5 h-3.5 mr-1" /> Load Sample Data
          </Button>
        </div>
      ) : (
        <div className="dept-results-container space-y-8">
          {sections.map((section) => (
            <div
              key={section.deptId}
              className="dept-section border border-border rounded-lg overflow-hidden"
              id={`dept-section-${section.deptId}`}
              data-ocid="dept_results.dept.panel"
            >
              {/* Section Header */}
              <div className="bg-primary/5 border-b border-border px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Faculty of
                    </p>
                    <h2 className="text-base font-bold text-foreground">
                      {section.facultyName}
                    </h2>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                      Department of
                    </p>
                    <h3 className="text-sm font-bold text-primary">
                      {section.deptName}
                    </h3>
                  </div>
                  <div className="flex gap-2 no-print">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPendingExportFn(() => () => exportDeptCSV(section));
                        setExportDialogOpen(true);
                      }}
                      data-ocid="dept_results.dept_export.button"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPendingExportFn(
                          () => () => printDept(section.deptId),
                        );
                        setExportDialogOpen(true);
                      }}
                      data-ocid="dept_results.dept_print.button"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1" /> Print
                    </Button>
                  </div>
                </div>
              </div>

              {/* Level-grouped tables */}
              {(() => {
                const lvlGroups: Record<number, typeof section.rows> = {};
                for (const row of section.rows) {
                  const lvl = row.level ?? 100;
                  if (!lvlGroups[lvl]) lvlGroups[lvl] = [];
                  lvlGroups[lvl].push(row);
                }
                const sortedLevels = Object.keys(lvlGroups).map(Number).sort();
                return sortedLevels.map((lvl) => {
                  const lvlRows = lvlGroups[lvl];
                  return (
                    <div key={lvl} className="mb-2">
                      {/* Level heading */}
                      <div className="text-center py-2 px-4 border-t border-border bg-muted/10">
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                          {institutionName}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          Faculty of {section.facultyName}
                        </p>
                        <p className="text-[10px] uppercase">
                          Department of {section.deptName}
                        </p>
                        <p className="text-xs font-bold uppercase mt-0.5">
                          Level {lvl} Students —{" "}
                          {filterSession || "All Sessions"}{" "}
                          {filterSemester !== "all" ? filterSemester : ""}{" "}
                          Semester
                        </p>
                        <hr className="mt-1 border-foreground/20" />
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-muted/50 border-b border-border">
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                                S/N
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                                Matric No
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap min-w-32">
                                Student Name
                              </th>
                              {section.courseCodes.map((c) => (
                                <th
                                  key={c.id}
                                  className="px-3 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap"
                                >
                                  {c.code}
                                </th>
                              ))}
                              <th className="px-3 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap">
                                GPA
                              </th>
                              <th className="px-3 py-2 text-center font-semibold text-muted-foreground whitespace-nowrap">
                                CGPA
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap min-w-28">
                                Courses Failed
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                                Remarks
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {lvlRows.map((row, idx) => {
                              const isEven = idx % 2 === 0;
                              return (
                                <tr
                                  key={row.studentId}
                                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${isEven ? "" : "bg-muted/10"}`}
                                  data-ocid={`dept_results.item.${row.sn}`}
                                >
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 font-mono font-medium whitespace-nowrap">
                                    {row.matricNumber}
                                  </td>
                                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                                    {row.name}
                                  </td>
                                  {section.courseCodes.map((c) => {
                                    const cell = row.grades[c.id] ?? "-";
                                    const grade = cell.split(" ")[0];
                                    return (
                                      <td
                                        key={c.id}
                                        className={`px-3 py-2 text-center whitespace-nowrap ${gradeColor(grade)}`}
                                      >
                                        {cell}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-2 text-center font-semibold">
                                    {row.gpa !== null ? (
                                      row.gpa.toFixed(2)
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-semibold">
                                    {row.cgpa !== null ? (
                                      <span
                                        className={
                                          row.cgpa >= 3.5
                                            ? "text-green-600 dark:text-green-400"
                                            : row.cgpa >= 2.5
                                              ? "text-blue-600 dark:text-blue-400"
                                              : row.cgpa >= 1.5
                                                ? "text-amber-600 dark:text-amber-400"
                                                : "text-red-600 dark:text-red-400"
                                        }
                                      >
                                        {row.cgpa.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {row.coursesFailed.length > 0 ? (
                                      <span className="text-red-600 dark:text-red-400">
                                        {row.coursesFailed.join(", ")}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <Badge
                                      variant="outline"
                                      className={
                                        row.remarks === "First Class"
                                          ? "border-green-500 text-green-700 dark:text-green-400 text-[10px]"
                                          : row.remarks === "2nd Class Upper"
                                            ? "border-blue-500 text-blue-700 dark:text-blue-400 text-[10px]"
                                            : row.remarks === "2nd Class Lower"
                                              ? "border-sky-500 text-sky-700 dark:text-sky-400 text-[10px]"
                                              : row.remarks === "Third Class"
                                                ? "border-amber-500 text-amber-700 dark:text-amber-400 text-[10px]"
                                                : row.remarks === "Pass"
                                                  ? "border-orange-400 text-orange-600 dark:text-orange-400 text-[10px]"
                                                  : "border-red-500 text-red-600 dark:text-red-400 text-[10px]"
                                      }
                                    >
                                      {row.remarks}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-2 bg-muted/10 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Level {lvl} —{" "}
                          <strong className="text-foreground">
                            {lvlRows.length}
                          </strong>{" "}
                          students
                        </span>
                        <span className="no-print">
                          {
                            lvlRows.filter((r) => r.coursesFailed.length > 0)
                              .length
                          }{" "}
                          with failed courses
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Overall Footer */}
              <div className="px-6 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Total:{" "}
                  <strong className="text-foreground">
                    {section.rows.length}
                  </strong>{" "}
                  students
                </span>
                <span className="no-print">
                  {
                    section.rows.filter((r) => r.coursesFailed.length > 0)
                      .length
                  }{" "}
                  with failed courses
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent data-ocid="dept_results.export_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Authorization</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to export sensitive academic data. Please confirm
              you are authorized to access this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="dept_results.export_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="dept_results.export_confirm_button"
              onClick={() => {
                if (pendingExportFn) pendingExportFn();
                setPendingExportFn(null);
              }}
            >
              Confirm Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
