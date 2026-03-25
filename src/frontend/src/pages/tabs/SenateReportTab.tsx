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
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import type { ExtendedDepartment, Faculty } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

interface Props {
  userRole: "Registrar" | "HOD" | "Dean";
  hodDepartmentId?: bigint;
}

function getCodePrefix(code: string): string {
  const m = code.match(/^([A-Za-z]+)/);
  return m ? m[1].toUpperCase() : code;
}

function calcCGPA(
  studentId: bigint,
  results: ReturnType<typeof useApp>["results"] extends never
    ? never
    : ReturnType<typeof useApp>["results"],
  courses: ReturnType<typeof useApp>["courses"],
): number | null {
  const approved = results.filter(
    (r) =>
      r.studentId === studentId &&
      (r.status === "approved" || r.status === "published"),
  );
  if (approved.length === 0) return null;
  let totalGP = 0;
  let totalCU = 0;
  for (const r of approved) {
    const course = courses.find((c) => c.id === r.courseId);
    const cu = course ? Number(course.creditUnits) : 1;
    totalGP += r.gradePoint * cu;
    totalCU += cu;
  }
  if (totalCU === 0) return null;
  return Math.round((totalGP / totalCU) * 100) / 100;
}

function getRemarks(cgpa: number | null): string {
  if (cgpa === null) return "Fail / Incomplete";
  if (cgpa >= 4.5) return "First Class Hons";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  if (cgpa >= 1.0) return "Pass";
  return "Fail / Incomplete";
}

function scoreToGradeLabel(score: string): string {
  if (score === "-") return "-";
  const n = Number.parseFloat(score);
  if (Number.isNaN(n)) return score;
  if (n >= 70) return "Distinction";
  if (n >= 60) return "Credit";
  if (n >= 50) return "Merit";
  if (n >= 40) return "Pass";
  return "Fail";
}

function isEducationDept(deptName: string): boolean {
  return deptName.toLowerCase().includes("education");
}

function getEdRemarks(cgpa: number | null): string {
  if (cgpa === null) return "Fail";
  if (cgpa >= 4.5) return "Distinction";
  if (cgpa >= 3.5) return "Credit";
  if (cgpa >= 2.4) return "Merit";
  if (cgpa >= 1.5) return "Pass";
  return "Fail";
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
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState<string>(
    userRole === "HOD" && hodDepartmentId !== undefined
      ? String(hodDepartmentId)
      : "all",
  );

  // Unique sessions from results
  const sessions = useMemo(() => {
    const s = new Set<string>();
    for (const r of results) {
      if ((r as any).session) s.add((r as any).session);
    }
    return Array.from(s).sort().reverse();
  }, [results]);

  // Filter results by session/semester
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (sessionFilter !== "all" && (r as any).session !== sessionFilter)
        return false;
      if (semesterFilter !== "all" && (r as any).semester !== semesterFilter)
        return false;
      return true;
    });
  }, [results, sessionFilter, semesterFilter]);

  // Departments filtered by role
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

  // Group depts by faculty
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

  // Build report data per dept
  const reportData = useMemo(() => {
    return grouped.map(({ faculty, depts }) => ({
      faculty,
      depts: depts.map((dept) => {
        const deptCourses = courses.filter((c) => c.departmentId === dept.id);
        const prefixes = Array.from(
          new Set(deptCourses.map((c) => getCodePrefix(c.code))),
        ).sort();

        const deptStudents = students.filter((s) => s.departmentId === dept.id);

        const rows = deptStudents.map((student, idx) => {
          const stuResults = filteredResults.filter(
            (r) => r.studentId === student.id,
          );
          const approvedResults = stuResults.filter(
            (r) => r.status === "approved" || r.status === "published",
          );

          // Per prefix average
          const prefixScores: Record<string, string> = {};
          for (const prefix of prefixes) {
            const matching = approvedResults.filter((r) => {
              const c = courses.find((co) => co.id === r.courseId);
              return c && getCodePrefix(c.code) === prefix;
            });
            if (matching.length === 0) {
              prefixScores[prefix] = "-";
            } else {
              const avg =
                matching.reduce((s, r) => s + r.totalScore, 0) /
                matching.length;
              prefixScores[prefix] = avg.toFixed(1);
            }
          }

          const cgpa = calcCGPA(student.id, filteredResults, courses);
          const outstanding = approvedResults
            .filter((r) => r.grade === "F")
            .map((r) => courses.find((c) => c.id === r.courseId)?.code ?? "?")
            .join(", ");

          return {
            sno: idx + 1,
            matricNumber: student.matricNumber,
            name: student.name,
            prefixScores,
            cgpa,
            outstanding: outstanding || "None",
            remarks: getRemarks(cgpa),
            graduatingYear: getGraduatingYear(
              student.matricNumber,
              student.level,
            ),
          };
        });

        return { dept, prefixes, rows, isEd: isEducationDept(dept.name) };
      }),
    }));
  }, [grouped, courses, students, filteredResults]);

  const institutionName = useMemo(() => {
    try {
      const s = localStorage.getItem("institution_settings");
      if (s) return JSON.parse(s).name || "University";
    } catch {}
    return "University";
  }, []);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const rows: string[] = [];
    for (const { faculty, depts } of reportData) {
      for (const { dept, prefixes, rows: deptRows, isEd } of depts) {
        rows.push(
          `"FACULTY: ${faculty?.name ?? "Unknown"}",,"DEPARTMENT: ${dept.name}"`,
        );
        const header = [
          "S/No",
          "Matric Number",
          "Student Name",
          ...prefixes,
          "CGPA",
          "Outstanding Courses",
          "Remarks",
          "Graduating Year",
        ];
        rows.push(header.map((h) => `"${h}"`).join(","));
        for (const r of deptRows) {
          const line = [
            r.sno,
            `"${r.matricNumber}"`,
            `"${r.name}"`,
            ...prefixes.map((p) =>
              isEd
                ? scoreToGradeLabel(r.prefixScores[p] ?? "-")
                : (r.prefixScores[p] ?? "-"),
            ),
            r.cgpa !== null ? r.cgpa.toFixed(2) : "-",
            `"${r.outstanding}"`,
            `"${isEd ? getEdRemarks(r.cgpa) : r.remarks}"`,
            r.graduatingYear,
          ];
          rows.push(line.join(","));
        }
        rows.push("");
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `senate_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls - hidden on print */}
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
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={handlePrint}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print All
          </Button>
          <Button
            data-ocid="senate.export.button"
            size="sm"
            className="h-8 text-xs"
            onClick={handleExportCSV}
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
            {/* Faculty header */}
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

            {depts.map(({ dept, prefixes, rows, isEd }) => (
              <div
                key={String(dept.id)}
                className="senate-dept-section mb-8"
                style={{ pageBreakInside: "avoid" }}
              >
                {/* Department subheader */}
                <div className="dept-header bg-muted/40 rounded-t-md border border-border px-4 py-2 mb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Department
                      </p>
                      <h3 className="text-base font-bold text-foreground">
                        {dept.name}
                      </h3>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{institutionName}</p>
                      <p>{new Date().toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-t-0 border-border rounded-b-md">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="px-2 py-2 text-left font-semibold border-r border-primary-foreground/20 w-8">
                          S/No
                        </th>
                        <th className="px-2 py-2 text-left font-semibold border-r border-primary-foreground/20 whitespace-nowrap">
                          Matric No
                        </th>
                        <th className="px-2 py-2 text-left font-semibold border-r border-primary-foreground/20">
                          Student Name
                        </th>
                        {prefixes.map((p) => (
                          <th
                            key={p}
                            className="px-2 py-2 text-center font-semibold border-r border-primary-foreground/20 whitespace-nowrap"
                          >
                            {p}
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center font-semibold border-r border-primary-foreground/20">
                          CGPA
                        </th>
                        <th className="px-2 py-2 text-left font-semibold border-r border-primary-foreground/20">
                          Outstanding Courses
                        </th>
                        <th className="px-2 py-2 text-left font-semibold border-r border-primary-foreground/20">
                          Remarks
                        </th>
                        <th className="px-2 py-2 text-center font-semibold whitespace-nowrap">
                          Graduating Year
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5 + prefixes.length}
                            className="px-4 py-6 text-center text-muted-foreground italic"
                          >
                            No students in this department
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, ri) => (
                          <tr
                            key={row.matricNumber}
                            data-ocid={`senate.item.${ri + 1}`}
                            className={`border-b border-border/50 ${
                              ri % 2 === 0 ? "bg-background" : "bg-muted/20"
                            } hover:bg-primary/5 transition-colors`}
                          >
                            <td className="px-2 py-1.5 text-center text-muted-foreground border-r border-border/30">
                              {row.sno}
                            </td>
                            <td className="px-2 py-1.5 font-mono border-r border-border/30 whitespace-nowrap">
                              {row.matricNumber}
                            </td>
                            <td className="px-2 py-1.5 font-medium border-r border-border/30">
                              {row.name}
                            </td>
                            {prefixes.map((p) => {
                              const raw = row.prefixScores[p] ?? "-";
                              if (!isEd) {
                                return (
                                  <td
                                    key={p}
                                    className="px-2 py-1.5 text-center border-r border-border/30"
                                  >
                                    {raw}
                                  </td>
                                );
                              }
                              const label = scoreToGradeLabel(raw);
                              const cls =
                                label === "Distinction"
                                  ? "bg-green-50 text-green-700 font-semibold"
                                  : label === "Credit"
                                    ? "bg-blue-50 text-blue-700 font-semibold"
                                    : label === "Merit"
                                      ? "bg-amber-50 text-amber-700 font-semibold"
                                      : label === "Pass"
                                        ? "bg-gray-50 text-gray-600 font-semibold"
                                        : label === "Fail"
                                          ? "bg-red-50 text-red-600 font-semibold"
                                          : "";
                              return (
                                <td
                                  key={p}
                                  className={`px-2 py-1.5 text-center border-r border-border/30 ${cls}`}
                                >
                                  {label}
                                </td>
                              );
                            })}
                            <td
                              className={`px-2 py-1.5 text-center font-bold border-r border-border/30 ${
                                row.cgpa !== null && row.cgpa >= 4.5
                                  ? "text-green-600"
                                  : row.cgpa !== null && row.cgpa >= 3.5
                                    ? "text-blue-600"
                                    : row.cgpa !== null && row.cgpa < 1.5
                                      ? "text-red-500"
                                      : ""
                              }`}
                            >
                              {row.cgpa !== null ? row.cgpa.toFixed(2) : "-"}
                            </td>
                            <td
                              className={`px-2 py-1.5 border-r border-border/30 ${
                                row.outstanding !== "None"
                                  ? "text-red-600 font-medium"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {row.outstanding}
                            </td>
                            {(() => {
                              const displayRemark = isEd
                                ? getEdRemarks(row.cgpa)
                                : row.remarks;
                              const remarkCls = isEd
                                ? displayRemark === "Distinction"
                                  ? "text-green-700"
                                  : displayRemark === "Credit"
                                    ? "text-blue-700"
                                    : displayRemark === "Merit"
                                      ? "text-amber-700"
                                      : displayRemark === "Pass"
                                        ? "text-gray-600"
                                        : "text-red-600"
                                : row.remarks === "First Class Hons"
                                  ? "text-green-700"
                                  : row.remarks === "Second Class Upper"
                                    ? "text-blue-700"
                                    : row.remarks.includes("Fail")
                                      ? "text-red-600"
                                      : "";
                              return (
                                <td
                                  className={`px-2 py-1.5 border-r border-border/30 whitespace-nowrap font-medium ${remarkCls}`}
                                >
                                  {displayRemark}
                                </td>
                              );
                            })()}
                            <td className="px-2 py-1.5 text-center">
                              {row.graduatingYear}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Dept footer */}
                <div className="text-xs text-muted-foreground mt-1 px-1 flex justify-between">
                  <span>Total Students: {rows.length}</span>
                  {isEd ? (
                    <span>
                      Distinction:{" "}
                      {
                        rows.filter(
                          (r) => getEdRemarks(r.cgpa) === "Distinction",
                        ).length
                      }{" "}
                      | Credit:{" "}
                      {
                        rows.filter((r) => getEdRemarks(r.cgpa) === "Credit")
                          .length
                      }{" "}
                      | Merit:{" "}
                      {
                        rows.filter((r) => getEdRemarks(r.cgpa) === "Merit")
                          .length
                      }{" "}
                      | Pass:{" "}
                      {
                        rows.filter((r) => getEdRemarks(r.cgpa) === "Pass")
                          .length
                      }{" "}
                      | Fail:{" "}
                      {
                        rows.filter((r) => getEdRemarks(r.cgpa) === "Fail")
                          .length
                      }
                    </span>
                  ) : (
                    <span>
                      First Class:{" "}
                      {
                        rows.filter((r) => r.remarks === "First Class Hons")
                          .length
                      }{" "}
                      | 2nd Upper:{" "}
                      {
                        rows.filter((r) => r.remarks === "Second Class Upper")
                          .length
                      }{" "}
                      | 2nd Lower:{" "}
                      {
                        rows.filter((r) => r.remarks === "Second Class Lower")
                          .length
                      }
                    </span>
                  )}
                </div>
              </div>
            ))}
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
          body { font-size: 11px; }
          table { border-collapse: collapse; }
          th, td { border: 1px solid #999 !important; }
          thead { background: #1a3a5c !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
