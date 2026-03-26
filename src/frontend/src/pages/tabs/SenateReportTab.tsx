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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Printer } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { ExtendedDepartment, Faculty } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";
import { logReportActivity } from "../../utils/institutionHelpers";

interface Props {
  userRole: "Registrar" | "HOD" | "Dean";
  hodDepartmentId?: bigint;
}

type AppResults = ReturnType<typeof useApp>["results"];
type AppCourses = ReturnType<typeof useApp>["courses"];

function getCodePrefix(code: string): string {
  const m = code.match(/^([A-Za-z]+)/);
  return m ? m[1].toUpperCase() : code;
}

function isEducationDept(deptName: string): boolean {
  return deptName.toLowerCase().includes("education");
}

function isFinalYear(level: number): boolean {
  return level >= 400;
}

function calcSubjectAreaStats(
  studentId: bigint,
  prefix: string,
  results: AppResults,
  courses: AppCourses,
): { tco: number; tcp: number; tgp: number; cgpa: number | null } {
  const approved = results.filter(
    (r) =>
      r.studentId === studentId &&
      (r.status === "approved" || r.status === "published"),
  );
  const matching = approved.filter((r) => {
    const c = courses.find((co) => co.id === r.courseId);
    return c && getCodePrefix(c.code) === prefix;
  });
  if (matching.length === 0) return { tco: 0, tcp: 0, tgp: 0, cgpa: null };
  let tco = 0;
  let tcp = 0;
  let tgp = 0;
  for (const r of matching) {
    const c = courses.find((co) => co.id === r.courseId);
    const cu = c ? Number(c.creditUnits) : 1;
    tco += cu;
    if (r.grade !== "F") tcp += cu;
    tgp += r.gradePoint * cu;
  }
  const cgpa = tco > 0 ? Math.round((tgp / tco) * 100) / 100 : null;
  return { tco, tcp, tgp, cgpa };
}

function calcGCGPA(
  studentId: bigint,
  prefixes: string[],
  results: AppResults,
  courses: AppCourses,
): number | null {
  const approved = results.filter(
    (r) =>
      r.studentId === studentId &&
      (r.status === "approved" || r.status === "published"),
  );
  let totalTGP = 0;
  let totalTCO = 0;
  for (const prefix of prefixes) {
    const matching = approved.filter((r) => {
      const c = courses.find((co) => co.id === r.courseId);
      return c && getCodePrefix(c.code) === prefix;
    });
    for (const r of matching) {
      const c = courses.find((co) => co.id === r.courseId);
      const cu = c ? Number(c.creditUnits) : 1;
      totalTCO += cu;
      totalTGP += r.gradePoint * cu;
    }
  }
  if (totalTCO === 0) return null;
  return Math.round((totalTGP / totalTCO) * 100) / 100;
}

function getProgressRemarks(gcgpa: number | null, level: number): string {
  if (isFinalYear(level)) {
    const yr = new Date().getFullYear();
    return `March, ${yr}`;
  }
  if (gcgpa === null) return "Withdrawn";
  if (gcgpa >= 1.5) return "Promoted";
  if (gcgpa >= 1.0) return "Probation";
  return "Withdrawn";
}

function cgpaToGradeLabel(cgpa: number | null): string {
  if (cgpa === null) return "Fail";
  if (cgpa >= 4.5) return "Distinction";
  if (cgpa >= 3.5) return "Credit";
  if (cgpa >= 2.4) return "Merit";
  if (cgpa >= 1.5) return "Pass";
  return "Fail";
}

function calcTPGradeLabel(
  studentId: bigint,
  results: AppResults,
  courses: AppCourses,
): string {
  const tpResults = results.filter((r) => {
    if (
      r.studentId !== studentId ||
      (r.status !== "approved" && r.status !== "published")
    )
      return false;
    const c = courses.find((co) => co.id === r.courseId);
    return c && getCodePrefix(c.code) === "TP";
  });
  if (tpResults.length === 0) return "-";
  let tco = 0;
  let tgp = 0;
  for (const r of tpResults) {
    const c = courses.find((co) => co.id === r.courseId);
    const cu = c ? Number(c.creditUnits) : 1;
    tco += cu;
    tgp += r.gradePoint * cu;
  }
  const cgpa = tco > 0 ? tgp / tco : null;
  return cgpaToGradeLabel(cgpa);
}

function getGraduatingYear(
  matricNumber: string,
  level: bigint | number,
): number {
  const yearMatch = matricNumber.match(/(20\d{2})/);
  const lvl = Number(level);
  if (yearMatch) {
    const admYear = Number.parseInt(yearMatch[1], 10);
    return admYear + (lvl >= 500 ? 5 : 4);
  }
  return new Date().getFullYear();
}

function remarkColor(remark: string): string {
  if (remark === "Promoted") return "text-green-700 font-semibold";
  if (remark === "Probation") return "text-amber-700 font-semibold";
  if (remark === "Withdrawn") return "text-red-600 font-semibold";
  return "text-blue-700 font-semibold";
}

function gradeLabelColor(label: string): string {
  if (label === "Distinction") return "text-green-700 font-semibold";
  if (label === "Credit") return "text-blue-700 font-semibold";
  if (label === "Merit") return "text-amber-700 font-semibold";
  if (label === "Pass") return "text-gray-600 font-semibold";
  if (label === "Fail") return "text-red-600 font-semibold";
  return "";
}

/** Split prefixes into EDU, TP, and dept-subject (others) for education depts */
function splitEdPrefixes(prefixes: string[]): {
  eduPrefix: string | null;
  tpPrefix: string | null;
  deptPrefixes: string[];
} {
  const eduPrefix = prefixes.find((p) => p === "EDU") ?? null;
  const tpPrefix = prefixes.find((p) => p === "TP") ?? null;
  const gsePrefix = prefixes.find((p) => p === "GSE") ?? null;
  const deptPrefixes = prefixes.filter(
    (p) => p !== "EDU" && p !== "TP" && p !== "GSE",
  );
  // GSE is grouped with EDU-area prefixes (omit separately, show under EDU group if found)
  // Actually per spec: EDU has TCO/TCP/TGP/CGPA/Grade, TP is single, dept subject (CSC/PHY) has TCO/TCP/TGP/CGPA/Grade
  // GSE typically goes with EDU area — include it in deptPrefixes or omit per spec
  // The spec says: EDU prefix, TP prefix, and remaining dept prefix (CSC, PHY)
  // We'll add GSE as a 5-sub-col group similar to EDU if present, or skip it per original design
  const extra = gsePrefix ? [gsePrefix] : [];
  return { eduPrefix, tpPrefix, deptPrefixes: [...extra, ...deptPrefixes] };
}

export default function SenateReportTab({ userRole, hodDepartmentId }: Props) {
  const {
    students,
    results,
    courses,
    departments,
    faculties,
    loadSenateSampleData,
  } = useApp();

  const [sessionFilter, setSessionFilter] = useState("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportFn, setPendingExportFn] = useState<(() => void) | null>(
    null,
  );
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState<string>(
    userRole === "HOD" && hodDepartmentId !== undefined
      ? String(hodDepartmentId)
      : "all",
  );

  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results) {
      if ((r as any).session) s.add((r as any).session);
    }
    return Array.from(s).sort().reverse();
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (sessionFilter !== "all" && (r as any).session !== sessionFilter)
        return false;
      if (semesterFilter !== "all" && (r as any).semester !== semesterFilter)
        return false;
      return true;
    });
  }, [results, sessionFilter, semesterFilter]);

  const visibleDepts = useMemo(() => {
    if (userRole === "HOD" && hodDepartmentId !== undefined) {
      return (departments as ExtendedDepartment[]).filter(
        (d) => d.id === hodDepartmentId,
      );
    }
    if (deptFilter !== "all") {
      return (departments as ExtendedDepartment[]).filter(
        (d) => String(d.id) === deptFilter,
      );
    }
    return departments as ExtendedDepartment[];
  }, [departments, userRole, hodDepartmentId, deptFilter]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { faculty: Faculty | null; depts: ExtendedDepartment[] }
    >();
    for (const dept of visibleDepts) {
      const fac =
        (faculties as Faculty[]).find((f) => f.id === dept.facultyId) ?? null;
      const key = fac ? String(fac.id) : "none";
      if (!map.has(key)) map.set(key, { faculty: fac, depts: [] });
      map.get(key)!.depts.push(dept);
    }
    return Array.from(map.values());
  }, [visibleDepts, faculties]);

  const reportData = useMemo(() => {
    return grouped.map(({ faculty, depts }) => ({
      faculty,
      depts: depts.map((dept) => {
        const deptCourses = courses.filter((c) => c.departmentId === dept.id);
        const prefixes = Array.from(
          new Set(deptCourses.map((c) => getCodePrefix(c.code))),
        ).sort();
        const isEd = isEducationDept(dept.name);
        const edSplit = isEd ? splitEdPrefixes(prefixes) : null;
        const deptStudents = students.filter((s) => s.departmentId === dept.id);

        const rows = deptStudents.map((student, idx) => {
          const subjectStats: Record<
            string,
            { tco: number; tcp: number; tgp: number; cgpa: number | null }
          > = {};
          for (const prefix of prefixes) {
            subjectStats[prefix] = calcSubjectAreaStats(
              student.id,
              prefix,
              filteredResults,
              courses,
            );
          }
          const gcgpa = calcGCGPA(
            student.id,
            prefixes,
            filteredResults,
            courses,
          );
          const level = Number(student.level);
          const remarks = getProgressRemarks(gcgpa, level);
          const approvedResults = filteredResults.filter(
            (r) =>
              r.studentId === student.id &&
              (r.status === "approved" || r.status === "published"),
          );
          const outstanding = approvedResults
            .filter((r) => r.grade === "F")
            .map((r) => courses.find((c) => c.id === r.courseId)?.code ?? "?")
            .join(", ");
          const tpGradeLabel = isEd
            ? calcTPGradeLabel(student.id, filteredResults, courses)
            : null;
          return {
            sno: idx + 1,
            matricNumber: student.matricNumber,
            name: student.name,
            level,
            subjectStats,
            gcgpa,
            outstanding: outstanding || "None",
            remarks,
            graduatingYear: getGraduatingYear(
              student.matricNumber,
              student.level,
            ),
            tpGradeLabel,
          };
        });

        return { dept, prefixes, edSplit, rows, isEd };
      }),
    }));
  }, [grouped, courses, students, filteredResults]);

  const institutionName = useMemo(() => {
    try {
      const s = localStorage.getItem("unires_institutionSettings");
      if (s) return JSON.parse(s).name || "University";
    } catch {}
    return "Federal University of Education Kontagora, Niger State";
  }, []);

  const handlePrint = () => {
    window.print();
    const deptNames =
      reportData.flatMap((d) => d.depts.map((dd) => dd.dept.name)).join(", ") ||
      "All";
    logReportActivity(
      "Senate",
      deptNames.slice(0, 60),
      sessionFilter !== "all" ? sessionFilter : "All Sessions",
      "System",
      "Print",
    );
  };

  const handleExportCSV = () => {
    const csvRows: string[] = [];
    for (const { faculty, depts } of reportData) {
      for (const { dept, prefixes, isEd, edSplit, rows: deptRows } of depts) {
        csvRows.push(
          `"FACULTY: ${faculty?.name ?? "Unknown"}",,"DEPARTMENT: ${dept.name}"`,
        );
        const headerCols: string[] = ["S/No", "Matric Number", "Student Name"];
        if (isEd && edSplit) {
          if (edSplit.eduPrefix) {
            const p = edSplit.eduPrefix;
            headerCols.push(
              `${p}_TCO`,
              `${p}_TCP`,
              `${p}_TGP`,
              `${p}_CGPA`,
              `${p}_Grade`,
            );
          }
          if (edSplit.tpPrefix) {
            headerCols.push("TP_Grade");
          }
          for (const p of edSplit.deptPrefixes) {
            headerCols.push(
              `${p}_TCO`,
              `${p}_TCP`,
              `${p}_TGP`,
              `${p}_CGPA`,
              `${p}_Grade`,
            );
          }
        } else {
          for (const p of prefixes) {
            headerCols.push(
              `${p}_TCO`,
              `${p}_TCP`,
              `${p}_TGP`,
              `${p}_CGPA`,
              `${p}_Grade`,
            );
          }
        }
        headerCols.push(
          "GCGPA",
          "Outstanding Courses",
          "Remarks",
          "Graduating Year",
        );
        csvRows.push(headerCols.map((h) => `"${h}"`).join(","));

        for (const r of deptRows) {
          const line: Array<string | number> = [
            r.sno,
            `"${r.matricNumber}"`,
            `"${r.name}"`,
          ];
          if (isEd && edSplit) {
            if (edSplit.eduPrefix) {
              const st = r.subjectStats[edSplit.eduPrefix] ?? {
                tco: 0,
                tcp: 0,
                tgp: 0,
                cgpa: null,
              };
              line.push(
                st.tco,
                st.tcp,
                st.tgp.toFixed(2),
                st.cgpa !== null ? st.cgpa.toFixed(2) : "-",
                `"${cgpaToGradeLabel(st.cgpa)}"`,
              );
            }
            if (edSplit.tpPrefix) {
              line.push(`"${r.tpGradeLabel ?? "-"}"`);
            }
            for (const p of edSplit.deptPrefixes) {
              const st = r.subjectStats[p] ?? {
                tco: 0,
                tcp: 0,
                tgp: 0,
                cgpa: null,
              };
              line.push(
                st.tco,
                st.tcp,
                st.tgp.toFixed(2),
                st.cgpa !== null ? st.cgpa.toFixed(2) : "-",
                `"${cgpaToGradeLabel(st.cgpa)}"`,
              );
            }
          } else {
            for (const p of prefixes) {
              const st = r.subjectStats[p] ?? {
                tco: 0,
                tcp: 0,
                tgp: 0,
                cgpa: null,
              };
              line.push(
                st.tco,
                st.tcp,
                st.tgp.toFixed(2),
                st.cgpa !== null ? st.cgpa.toFixed(2) : "-",
                `"${cgpaToGradeLabel(st.cgpa)}"`,
              );
            }
          }
          line.push(
            r.gcgpa !== null ? r.gcgpa.toFixed(2) : "-",
            `"${r.outstanding}"`,
            `"${r.remarks}"`,
            r.graduatingYear,
          );
          csvRows.push(line.join(","));
        }
        csvRows.push("");
      }
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `senate_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    const deptNames =
      reportData.flatMap((d) => d.depts.map((dd) => dd.dept.name)).join(", ") ||
      "All";
    logReportActivity(
      "Senate",
      deptNames.slice(0, 60),
      sessionFilter !== "all" ? sessionFilter : "All Sessions",
      "System",
      "CSV",
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="no-print flex flex-wrap gap-3 items-end bg-muted/30 rounded-lg p-4 border border-border/50">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Session</Label>
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger
              data-ocid="senate.session.select"
              className="w-36 h-8 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium">Semester</Label>
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger
              data-ocid="senate.semester.select"
              className="w-36 h-8 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="First">First</SelectItem>
              <SelectItem value="Second">Second</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {userRole !== "HOD" && (
          <div className="space-y-1">
            <Label className="text-xs font-medium">Department</Label>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger
                data-ocid="senate.dept.select"
                className="w-48 h-8 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {(departments as ExtendedDepartment[]).map((d) => (
                  <SelectItem key={String(d.id)} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="ml-auto flex gap-2">
          <Button
            data-ocid="senate.load_sample.button"
            size="sm"
            variant="outline"
            className="h-8 text-xs border-dashed text-muted-foreground hover:text-foreground"
            onClick={loadSenateSampleData}
          >
            Load Demo Data
          </Button>
          <Button
            data-ocid="senate.print.button"
            onClick={() => {
              setPendingExportFn(() => handlePrint);
              setExportDialogOpen(true);
            }}
            size="sm"
            variant="outline"
            className="h-8 text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print All
          </Button>
          <Button
            data-ocid="senate.export.button"
            onClick={() => {
              setPendingExportFn(() => handleExportCSV);
              setExportDialogOpen(true);
            }}
            size="sm"
            className="h-8 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div id="senate-report-content">
        {reportData.length === 0 && (
          <div
            data-ocid="senate.empty_state"
            className="text-center py-16 text-muted-foreground text-sm"
          >
            No data available for the selected filters.
          </div>
        )}

        {reportData.map(({ faculty, depts }) => (
          <div
            key={faculty?.id !== undefined ? String(faculty.id) : "nofac"}
            className="mb-10 senate-faculty-section"
          >
            <div className="faculty-header border-t-4 border-primary pt-4 mb-4">
              <div className="text-center mb-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  {institutionName}
                </p>
                <h2 className="text-xl font-bold text-foreground uppercase tracking-wide mt-1">
                  FACULTY OF {faculty?.name?.toUpperCase() ?? "UNKNOWN FACULTY"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Senate Result Presentation &mdash;{" "}
                  {sessionFilter !== "all" ? sessionFilter : "All Sessions"}{" "}
                  &bull;{" "}
                  {semesterFilter !== "all"
                    ? `${semesterFilter} Semester`
                    : "All Semesters"}
                </p>
              </div>
            </div>

            {depts.map(({ dept, prefixes, edSplit, rows, isEd }) => {
              const levelGroups: Record<number, typeof rows> = {};
              for (const row of rows) {
                const lvl = row.level ?? 100;
                if (!levelGroups[lvl]) levelGroups[lvl] = [];
                levelGroups[lvl].push(row);
              }
              const sortedLevels = Object.keys(levelGroups).map(Number).sort();

              return (
                <div key={String(dept.id)} className="senate-dept-section mb-8">
                  {sortedLevels.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground italic text-xs border border-border rounded-md">
                      No students in this department
                    </div>
                  )}
                  {sortedLevels.map((lvl) => {
                    const lvlRows = levelGroups[lvl];
                    const finalYear = isFinalYear(lvl);

                    // Determine column layout
                    const hasTp = isEd && edSplit && edSplit.tpPrefix !== null;
                    const eduPfx = isEd && edSplit ? edSplit.eduPrefix : null;
                    const deptPfxList =
                      isEd && edSplit ? edSplit.deptPrefixes : null;
                    // non-ed uses prefixes directly
                    const nonEdPrefixes = !isEd ? prefixes : [];

                    return (
                      <div
                        key={lvl}
                        className="mb-8"
                        style={{ pageBreakInside: "avoid" }}
                      >
                        {/* Level heading */}
                        <div className="level-heading text-center py-3 mb-0 border-b-2 border-primary/30">
                          <p className="text-xs font-bold uppercase tracking-widest">
                            {institutionName}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Faculty of{" "}
                            {faculty?.name?.toUpperCase() ?? "Unknown Faculty"}
                          </p>
                          <p className="text-xs font-semibold uppercase">
                            Department of {dept.name}
                          </p>
                          <p className="text-sm font-bold uppercase mt-1">
                            Level {lvl} Students &mdash;{" "}
                            {sessionFilter !== "all"
                              ? sessionFilter
                              : "All Sessions"}{" "}
                            {semesterFilter !== "all" ? semesterFilter : ""}{" "}
                            Semester
                          </p>
                          <hr className="mt-2 border-foreground/30" />
                        </div>

                        {/* Faculty Presentation Table */}
                        <div className="overflow-x-auto border border-t-0 border-border rounded-b-md">
                          <table className="w-full text-xs border-collapse senate-table">
                            <thead>
                              {/* === ROW 1: Group headers === */}
                              <tr className="bg-primary text-primary-foreground">
                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-left font-semibold border border-primary-foreground/20 w-8 align-middle"
                                >
                                  S/No
                                </th>
                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-left font-semibold border border-primary-foreground/20 whitespace-nowrap align-middle"
                                >
                                  Matric No
                                </th>
                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-left font-semibold border border-primary-foreground/20 align-middle"
                                >
                                  Name
                                </th>

                                {/* Education layout */}
                                {isEd && edSplit ? (
                                  <>
                                    {/* EDU group */}
                                    {eduPfx && (
                                      <th
                                        colSpan={5}
                                        className="px-2 py-1.5 text-center font-bold border border-primary-foreground/20"
                                      >
                                        {eduPfx}
                                      </th>
                                    )}
                                    {/* TP: single cell spanning both rows */}
                                    {hasTp && (
                                      <th
                                        rowSpan={2}
                                        className="px-2 py-2 text-center font-bold border border-primary-foreground/20 align-middle whitespace-nowrap"
                                      >
                                        TP
                                        <br />
                                        <span className="text-[10px] font-normal opacity-80">
                                          Grade
                                        </span>
                                      </th>
                                    )}
                                    {/* Dept subject groups (CSC, PHY, GSE, etc.) */}
                                    {deptPfxList?.map((p) => (
                                      <th
                                        key={p}
                                        colSpan={5}
                                        className="px-2 py-1.5 text-center font-bold border border-primary-foreground/20"
                                      >
                                        {p}
                                      </th>
                                    ))}
                                  </>
                                ) : (
                                  /* Non-education layout: all prefixes get colSpan=5 */
                                  nonEdPrefixes.map((p) => (
                                    <th
                                      key={p}
                                      colSpan={5}
                                      className="px-2 py-1.5 text-center font-bold border border-primary-foreground/20"
                                    >
                                      {p}
                                    </th>
                                  ))
                                )}

                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-center font-bold border border-primary-foreground/20 whitespace-nowrap align-middle"
                                >
                                  GCGPA
                                </th>
                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-left font-semibold border border-primary-foreground/20 align-middle"
                                >
                                  Outstanding
                                  <br />
                                  Courses
                                </th>
                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-left font-semibold border border-primary-foreground/20 align-middle"
                                >
                                  Remarks
                                </th>
                                <th
                                  rowSpan={2}
                                  className="px-2 py-2 text-center font-semibold border border-primary-foreground/20 whitespace-nowrap align-middle"
                                >
                                  Graduating
                                  <br />
                                  Year
                                </th>
                              </tr>

                              {/* === ROW 2: Sub-column headers === */}
                              <tr className="bg-primary/80 text-primary-foreground">
                                {isEd && edSplit ? (
                                  <>
                                    {/* EDU sub-cols */}
                                    {eduPfx && (
                                      <Fragment key={eduPfx}>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          TCO
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          TCP
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          TGP
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          CGPA
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          Grade
                                        </th>
                                      </Fragment>
                                    )}
                                    {/* TP already used rowSpan=2, so no sub-header cell here */}
                                    {/* Dept subject sub-cols */}
                                    {deptPfxList?.map((p) => (
                                      <Fragment key={p}>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          TCO
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          TCP
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          TGP
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          CGPA
                                        </th>
                                        <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                          Grade
                                        </th>
                                      </Fragment>
                                    ))}
                                  </>
                                ) : (
                                  /* Non-education: all prefixes sub-cols */
                                  nonEdPrefixes.map((p) => (
                                    <Fragment key={p}>
                                      <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                        TCO
                                      </th>
                                      <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                        TCP
                                      </th>
                                      <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                        TGP
                                      </th>
                                      <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                        CGPA
                                      </th>
                                      <th className="px-1.5 py-1 text-center font-medium border border-primary-foreground/20 whitespace-nowrap text-[10px]">
                                        Grade
                                      </th>
                                    </Fragment>
                                  ))
                                )}
                              </tr>
                            </thead>

                            <tbody>
                              {lvlRows.map((row, ri) => {
                                const gcgpaColor =
                                  row.gcgpa === null
                                    ? "text-red-600"
                                    : row.gcgpa >= 3.5
                                      ? "text-green-700"
                                      : row.gcgpa >= 2.4
                                        ? "text-blue-700"
                                        : row.gcgpa !== null && row.gcgpa < 1.0
                                          ? "text-red-600"
                                          : "";
                                return (
                                  <tr
                                    key={row.matricNumber}
                                    data-ocid={`senate.item.${ri + 1}`}
                                    className={`border-b border-border/50 ${
                                      ri % 2 === 0
                                        ? "bg-background"
                                        : "bg-muted/20"
                                    } hover:bg-primary/5 transition-colors`}
                                  >
                                    <td className="px-2 py-1.5 text-center text-muted-foreground border border-border/30">
                                      {row.sno}
                                    </td>
                                    <td className="px-2 py-1.5 font-mono border border-border/30 whitespace-nowrap">
                                      {row.matricNumber}
                                    </td>
                                    <td className="px-2 py-1.5 font-medium border border-border/30">
                                      {row.name}
                                    </td>

                                    {/* Education columns */}
                                    {isEd && edSplit ? (
                                      <>
                                        {/* EDU cells */}
                                        {eduPfx &&
                                          (() => {
                                            const stats = row.subjectStats[
                                              eduPfx
                                            ] ?? {
                                              tco: 0,
                                              tcp: 0,
                                              tgp: 0,
                                              cgpa: null,
                                            };
                                            const gradeLabel = cgpaToGradeLabel(
                                              stats.cgpa,
                                            );
                                            return (
                                              <Fragment key={eduPfx}>
                                                <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                  {stats.tco > 0
                                                    ? stats.tco
                                                    : "-"}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                  {stats.tco > 0
                                                    ? stats.tcp
                                                    : "-"}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                  {stats.tco > 0
                                                    ? stats.tgp.toFixed(1)
                                                    : "-"}
                                                </td>
                                                <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                  {stats.tco > 0
                                                    ? (stats.cgpa?.toFixed(2) ??
                                                      "-")
                                                    : "-"}
                                                </td>
                                                <td
                                                  className={`px-1.5 py-1.5 text-center border border-border/30 text-[10px] ${gradeLabelColor(gradeLabel)}`}
                                                >
                                                  {stats.tco > 0
                                                    ? gradeLabel
                                                    : "-"}
                                                </td>
                                              </Fragment>
                                            );
                                          })()}

                                        {/* TP single cell */}
                                        {hasTp && (
                                          <td
                                            className={`px-1.5 py-1.5 text-center border border-border/30 text-[10px] ${gradeLabelColor(row.tpGradeLabel ?? "-")}`}
                                          >
                                            {row.tpGradeLabel ?? "-"}
                                          </td>
                                        )}

                                        {/* Dept subject cells (CSC, PHY, GSE, etc.) */}
                                        {deptPfxList?.map((p) => {
                                          const stats = row.subjectStats[p] ?? {
                                            tco: 0,
                                            tcp: 0,
                                            tgp: 0,
                                            cgpa: null,
                                          };
                                          const gradeLabel = cgpaToGradeLabel(
                                            stats.cgpa,
                                          );
                                          return (
                                            <Fragment key={p}>
                                              <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                {stats.tco > 0
                                                  ? stats.tco
                                                  : "-"}
                                              </td>
                                              <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                {stats.tco > 0
                                                  ? stats.tcp
                                                  : "-"}
                                              </td>
                                              <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                {stats.tco > 0
                                                  ? stats.tgp.toFixed(1)
                                                  : "-"}
                                              </td>
                                              <td className="px-1.5 py-1.5 text-center border border-border/30">
                                                {stats.tco > 0
                                                  ? (stats.cgpa?.toFixed(2) ??
                                                    "-")
                                                  : "-"}
                                              </td>
                                              <td
                                                className={`px-1.5 py-1.5 text-center border border-border/30 text-[10px] ${gradeLabelColor(gradeLabel)}`}
                                              >
                                                {stats.tco > 0
                                                  ? gradeLabel
                                                  : "-"}
                                              </td>
                                            </Fragment>
                                          );
                                        })}
                                      </>
                                    ) : (
                                      /* Non-education columns */
                                      nonEdPrefixes.map((p) => {
                                        const stats = row.subjectStats[p] ?? {
                                          tco: 0,
                                          tcp: 0,
                                          tgp: 0,
                                          cgpa: null,
                                        };
                                        const gradeLabel = cgpaToGradeLabel(
                                          stats.cgpa,
                                        );
                                        return (
                                          <Fragment key={p}>
                                            <td className="px-1.5 py-1.5 text-center border border-border/30">
                                              {stats.tco > 0 ? stats.tco : "-"}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-center border border-border/30">
                                              {stats.tco > 0 ? stats.tcp : "-"}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-center border border-border/30">
                                              {stats.tco > 0
                                                ? stats.tgp.toFixed(1)
                                                : "-"}
                                            </td>
                                            <td className="px-1.5 py-1.5 text-center border border-border/30">
                                              {stats.tco > 0
                                                ? (stats.cgpa?.toFixed(2) ??
                                                  "-")
                                                : "-"}
                                            </td>
                                            <td
                                              className={`px-1.5 py-1.5 text-center border border-border/30 text-[10px] ${gradeLabelColor(gradeLabel)}`}
                                            >
                                              {stats.tco > 0 ? gradeLabel : "-"}
                                            </td>
                                          </Fragment>
                                        );
                                      })
                                    )}

                                    <td
                                      className={`px-2 py-1.5 text-center font-bold border border-border/30 ${gcgpaColor}`}
                                    >
                                      {row.gcgpa !== null
                                        ? row.gcgpa.toFixed(2)
                                        : "-"}
                                    </td>
                                    <td
                                      className={`px-2 py-1.5 border border-border/30 ${
                                        row.outstanding !== "None"
                                          ? "text-red-600 font-medium"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {row.outstanding}
                                    </td>
                                    <td
                                      className={`px-2 py-1.5 border border-border/30 whitespace-nowrap ${remarkColor(row.remarks)}`}
                                    >
                                      {row.remarks}
                                    </td>
                                    <td className="px-2 py-1.5 text-center border border-border/30">
                                      {finalYear
                                        ? `March, ${row.graduatingYear}`
                                        : row.graduatingYear}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Level footer stats */}
                        <div className="text-xs text-muted-foreground mt-1 flex justify-between bg-muted/20 rounded px-2 py-1">
                          <span>
                            Level {lvl} &mdash; Total: {lvlRows.length}
                          </span>
                          {finalYear ? (
                            <span className="text-blue-700 font-semibold">
                              Graduating: {lvlRows.length}
                            </span>
                          ) : (
                            <span>
                              Promoted:{" "}
                              <span className="text-green-700 font-semibold">
                                {
                                  lvlRows.filter(
                                    (r) => r.remarks === "Promoted",
                                  ).length
                                }
                              </span>
                              {" | "}Probation:{" "}
                              <span className="text-amber-700 font-semibold">
                                {
                                  lvlRows.filter(
                                    (r) => r.remarks === "Probation",
                                  ).length
                                }
                              </span>
                              {" | "}Withdrawn:{" "}
                              <span className="text-red-600 font-semibold">
                                {
                                  lvlRows.filter(
                                    (r) => r.remarks === "Withdrawn",
                                  ).length
                                }
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .senate-faculty-section { page-break-before: always; }
          .senate-faculty-section:first-child { page-break-before: avoid; }
          .senate-dept-section { page-break-inside: avoid; }
          .dept-header { page-break-after: avoid; }
          body { font-size: 10px; }
          .senate-table { border-collapse: collapse; width: 100%; }
          .senate-table th, .senate-table td { border: 1px solid #999 !important; padding: 2px 4px; }
          .senate-table thead tr:first-child th { background: #1a3a5c !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .senate-table thead tr:last-child th { background: #2c5282 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Export Authorization Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent data-ocid="senate.export_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Authorization</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to export sensitive academic data. Please confirm
              you are authorized to access this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="senate.export_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="senate.export_confirm_button"
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
