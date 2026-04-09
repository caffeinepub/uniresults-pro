import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Layers,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Course } from "../../context/AppContext";
import {
  type ExtendedDepartment,
  type ExtendedResult,
  calcGradePoint,
  useApp,
} from "../../context/AppContext";

type SortDir = "asc" | "desc";

function useSort<T>(items: T[], key: keyof T, defaultDir: SortDir = "asc") {
  const [col, setCol] = useState<keyof T>(key);
  const [dir, setDir] = useState<SortDir>(defaultDir);
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = a[col];
      const bv = b[col];
      if (av === undefined || av === null || bv === undefined || bv === null)
        return 0;
      const cmp =
        (av as any) < (bv as any) ? -1 : (av as any) > (bv as any) ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [items, col, dir]);
  function toggle(c: keyof T) {
    if (c === col) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setCol(c);
      setDir("asc");
    }
  }
  return { sorted, col, dir, toggle };
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronDown className="w-3 h-3 opacity-30" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  );
}

type DeptSubmissionRow = {
  dept: ExtendedDepartment;
  totalCourses: number;
  scoresEntered: number;
  submitted: number;
  hodApproved: number;
  deanApproved: number;
  status: "All Submitted" | "Partial" | "Missing";
};

type CollatedStudentRow = {
  studentId: string;
  name: string;
  matric: string;
  homeDept: string;
  programmes: string[];
  courses: Array<{
    courseCode: string;
    courseName: string;
    deptCode: string;
    semester: string;
    ca: number;
    exam: number;
    total: number;
    grade: string;
    gradePoint: number;
    creditUnits: number;
  }>;
  totalCredits: number;
  creditsPassed: number;
  tcp: number;
  tgp: number;
  cgpa: number;
  isCombined: boolean;
};

export default function FacultyCollationTab({
  userRole,
}: { userRole: "Dean" | "ExamOfficer" }) {
  const {
    currentUser,
    departments,
    faculties,
    courses,
    results,
    students,
    courseRegistrations,
    addNotification,
  } = useApp();

  const [collated, setCollated] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Determine the faculty from current user's department
  const userDeptId = (currentUser as any)?.departmentId;
  const userDept = departments.find((d) => String(d.id) === String(userDeptId));
  const facultyId = userDept?.facultyId ?? faculties[0]?.id;
  const faculty = faculties.find((f) => String(f.id) === String(facultyId));

  // All departments in this faculty
  const facultyDepts = useMemo(
    () => departments.filter((d) => String(d.facultyId) === String(facultyId)),
    [departments, facultyId],
  );

  // Build dept submission rows
  const deptRows: DeptSubmissionRow[] = useMemo(() => {
    return facultyDepts.map((dept) => {
      const deptCourses = courses.filter(
        (c) => String(c.departmentId) === String(dept.id),
      );
      const courseIds = new Set(deptCourses.map((c) => String(c.id)));
      const deptResults = results.filter((r) =>
        courseIds.has(String(r.courseId)),
      );
      const uniqueCourseIdsWithResults = new Set(
        deptResults.map((r) => String(r.courseId)),
      );

      const scoresEntered = uniqueCourseIdsWithResults.size;
      const submitted = deptResults.filter(
        (r) =>
          r.status === "submitted" ||
          r.status === "hod_approved" ||
          r.status === "dean_approved" ||
          r.status === "approved" ||
          r.status === "published",
      ).length;
      const hodApproved = deptResults.filter(
        (r) =>
          r.status === "hod_approved" ||
          r.status === "dean_approved" ||
          r.status === "approved" ||
          r.status === "published",
      ).length;
      const deanApproved = deptResults.filter(
        (r) =>
          r.status === "dean_approved" ||
          r.status === "approved" ||
          r.status === "published",
      ).length;

      let status: DeptSubmissionRow["status"] = "Missing";
      if (scoresEntered >= deptCourses.length && deptCourses.length > 0) {
        status = "All Submitted";
      } else if (scoresEntered > 0) {
        status = "Partial";
      }

      return {
        dept,
        totalCourses: deptCourses.length,
        scoresEntered,
        submitted,
        hodApproved,
        deanApproved,
        status,
      };
    });
  }, [facultyDepts, courses, results]);

  const {
    sorted: sortedDeptRows,
    col: deptCol,
    dir: deptDir,
    toggle: toggleDept,
  } = useSort(deptRows, "status" as keyof DeptSubmissionRow);

  // Build collated student results
  const collatedRows: CollatedStudentRow[] = useMemo(() => {
    if (!collated) return [];
    const facultyDeptIds = new Set(facultyDepts.map((d) => String(d.id)));
    const facultyCourses = courses.filter((c) =>
      facultyDeptIds.has(String(c.departmentId)),
    );
    const courseMap = new Map(facultyCourses.map((c) => [String(c.id), c]));

    // Find all students in this faculty
    const facultyStudents = students.filter((s) =>
      facultyDeptIds.has(String(s.departmentId)),
    );

    // Also look for cross-dept registrations (students from other depts registered for faculty courses)
    const crossRegStudentIds = new Set(
      courseRegistrations
        .filter((cr) => courseMap.has(String(cr.courseId)))
        .map((cr) => String(cr.studentId)),
    );
    const allStudentIds = new Set([
      ...facultyStudents.map((s) => String(s.id)),
      ...crossRegStudentIds,
    ]);

    const rows: CollatedStudentRow[] = [];

    for (const studentId of allStudentIds) {
      const student = students.find((s) => String(s.id) === studentId);
      if (!student) continue;

      // Get all results for this student across ALL departments in the faculty
      // Also include GST/EDU/GSE courses from any department
      const studentResults = results.filter(
        (r) => String(r.studentId) === studentId,
      );

      // Get all courses this student has results for
      const deptCodesUsed = new Set<string>();
      const courseRows: CollatedStudentRow["courses"] = [];

      for (const res of studentResults) {
        const course = courses.find(
          (c) => String(c.id) === String(res.courseId),
        );
        if (!course) continue;
        const dept = departments.find(
          (d) => String(d.id) === String(course.departmentId),
        );
        const deptCode = dept?.name?.split(" ")[0]?.toUpperCase() ?? "UNK";
        deptCodesUsed.add(deptCode);

        const total = (res.caScore ?? 0) + (res.examScore ?? 0);
        const { grade, gradePoint } = calcGradePoint(total);
        const credits = Number(course.creditUnits ?? 0);

        courseRows.push({
          courseCode: course.code,
          courseName: course.name,
          deptCode,
          semester: course.semester ?? "-",
          ca: res.caScore ?? 0,
          exam: res.examScore ?? 0,
          total,
          grade,
          gradePoint,
          creditUnits: credits,
        });
      }

      if (courseRows.length === 0) continue;

      const homeDept = departments.find(
        (d) => String(d.id) === String(student.departmentId),
      );
      const totalCredits = courseRows.reduce((s, c) => s + c.creditUnits, 0);
      const creditsPassed = courseRows
        .filter((c) => c.grade !== "F")
        .reduce((s, c) => s + c.creditUnits, 0);
      const tcp = courseRows.reduce(
        (s, c) => s + c.creditUnits * c.gradePoint,
        0,
      );
      const tgp = courseRows.reduce((s, c) => s + c.creditUnits, 0);
      const cgpa = tgp > 0 ? tcp / tgp : 0;
      const programmes = [...deptCodesUsed];
      const isCombined = programmes.length > 1;

      rows.push({
        studentId,
        name: student.name,
        matric: student.matricNumber,
        homeDept: homeDept?.name ?? "-",
        programmes,
        courses: courseRows,
        totalCredits,
        creditsPassed,
        tcp,
        tgp,
        cgpa,
        isCombined,
      });
    }

    return rows;
  }, [
    collated,
    facultyDepts,
    courses,
    students,
    results,
    departments,
    courseRegistrations,
  ]);

  const {
    sorted: sortedCollated,
    col: collCol,
    dir: collDir,
    toggle: toggleColl,
  } = useSort(collatedRows, "name" as keyof CollatedStudentRow);

  function handleCollate() {
    setCollated(true);
    if (userRole !== "Dean") {
      addNotification(
        "Dean",
        `Faculty ${faculty?.name ?? ""} results have been collated and are ready for review`,
        "faculty_collation",
      );
    }
    toast.success("Faculty results collated successfully");
  }

  function handlePrint() {
    window.print();
  }

  function exportCSV() {
    const rows = sortedCollated.map((r) => [
      r.matric,
      r.name,
      r.homeDept,
      r.programmes.join(" + "),
      r.courses.length,
      r.totalCredits,
      r.creditsPassed,
      r.cgpa.toFixed(2),
      r.isCombined ? "COMBINED" : "SINGLE",
    ]);
    const header = [
      "Matric No",
      "Name",
      "Home Dept",
      "Programmes",
      "Courses",
      "Total Credits",
      "Credits Passed",
      "CGPA",
      "Type",
    ];
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faculty-collation-${faculty?.name ?? "results"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function statusBadge(status: DeptSubmissionRow["status"]) {
    if (status === "All Submitted")
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
          All Submitted
        </Badge>
      );
    if (status === "Partial")
      return (
        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-xs">
          Partial
        </Badge>
      );
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
        Missing
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Faculty Result Collation</h2>
          <p className="text-sm text-muted-foreground">
            {faculty?.name ?? "Faculty"} — All departmental results compiled
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            data-ocid="faculty_collation.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          {collated && (
            <Button
              size="sm"
              variant="outline"
              onClick={exportCSV}
              data-ocid="faculty_collation.export_button"
            >
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleCollate}
            data-ocid="faculty_collation.collate_button"
            className="bg-primary text-primary-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            {collated ? "Re-Collate" : "Collate Faculty Results"}
          </Button>
        </div>
      </div>

      {/* Dept submission summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Departmental Submission Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">S/N</TableHead>
                  {(
                    [
                      ["dept", "Department"],
                      ["totalCourses", "Total Courses"],
                      ["scoresEntered", "Scores Entered"],
                      ["submitted", "Submitted"],
                      ["hodApproved", "HOD Approved"],
                      ["deanApproved", "Dean Approved"],
                      ["status", "Status"],
                    ] as [keyof DeptSubmissionRow, string][]
                  ).map(([k, label]) => (
                    <TableHead
                      key={k}
                      className="cursor-pointer select-none hover:bg-muted/50"
                      onClick={() => toggleDept(k)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={deptCol === k} dir={deptDir} />
                      </span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDeptRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                      data-ocid="faculty_collation.depts.empty_state"
                    >
                      No departments found in this faculty
                    </TableCell>
                  </TableRow>
                )}
                {sortedDeptRows.map((row, i) => (
                  <TableRow
                    key={String(row.dept.id)}
                    data-ocid={`faculty_collation.depts.item.${i + 1}`}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {row.dept.name}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.totalCourses}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span
                        className={
                          row.scoresEntered < row.totalCourses
                            ? "text-amber-600"
                            : "text-green-600"
                        }
                      >
                        {row.scoresEntered}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{row.submitted}</TableCell>
                    <TableCell className="text-sm">{row.hodApproved}</TableCell>
                    <TableCell className="text-sm">
                      {row.deanApproved}
                    </TableCell>
                    <TableCell>{statusBadge(row.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {deptRows.some((r) => r.status === "Missing") && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm no-print">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {deptRows.filter((r) => r.status === "Missing").length}{" "}
            department(s) have not submitted results yet. Collating now will
            only include available data.
          </span>
        </div>
      )}

      {/* Collated results */}
      {collated && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Faculty Collated Results — {sortedCollated.length} Students
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">S/N</TableHead>
                    {(
                      [
                        ["matric", "Matric No"],
                        ["name", "Name"],
                        ["homeDept", "Home Dept"],
                        ["programmes", "Programmes"],
                        ["totalCredits", "Total Credits"],
                        ["creditsPassed", "Credits Passed"],
                        ["cgpa", "CGPA"],
                      ] as [keyof CollatedStudentRow, string][]
                    ).map(([k, label]) => (
                      <TableHead
                        key={k}
                        className="cursor-pointer select-none hover:bg-muted/50"
                        onClick={() => toggleColl(k)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <SortIcon active={collCol === k} dir={collDir} />
                        </span>
                      </TableHead>
                    ))}
                    <TableHead>Type</TableHead>
                    <TableHead className="no-print">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCollated.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                        data-ocid="faculty_collation.results.empty_state"
                      >
                        No results to display. Make sure scores have been
                        entered.
                      </TableCell>
                    </TableRow>
                  )}
                  {sortedCollated.map((row, i) => (
                    <>
                      <TableRow
                        key={row.studentId}
                        className="cursor-pointer hover:bg-muted/30"
                        data-ocid={`faculty_collation.results.item.${i + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {row.matric}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.homeDept}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono">
                            {row.programmes.join(" + ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.totalCredits}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.creditsPassed}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-bold text-sm ${
                              row.cgpa >= 4.5
                                ? "text-green-600"
                                : row.cgpa >= 3.5
                                  ? "text-blue-600"
                                  : row.cgpa >= 2.4
                                    ? "text-amber-600"
                                    : "text-destructive"
                            }`}
                          >
                            {row.cgpa.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.isCombined ? (
                            <Badge className="bg-violet-500/10 text-violet-700 border-violet-500/20 text-xs">
                              COMBINED
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground text-xs">
                              SINGLE
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="no-print">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === row.studentId
                                  ? null
                                  : row.studentId,
                              )
                            }
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            data-ocid={`faculty_collation.results.expand.${i + 1}`}
                          >
                            {expandedRow === row.studentId ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> View Courses
                              </>
                            )}
                          </button>
                        </TableCell>
                      </TableRow>
                      {expandedRow === row.studentId && (
                        <TableRow key={`${row.studentId}-expand`}>
                          <TableCell colSpan={9} className="p-0">
                            <div className="bg-muted/20 border-y border-border/50 px-4 py-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                All Courses — {row.name}
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-muted-foreground">
                                      <th className="text-left pb-1 pr-3">
                                        Code
                                      </th>
                                      <th className="text-left pb-1 pr-3">
                                        Course Name
                                      </th>
                                      <th className="text-left pb-1 pr-3">
                                        Dept
                                      </th>
                                      <th className="text-left pb-1 pr-3">
                                        Sem
                                      </th>
                                      <th className="text-right pb-1 pr-3">
                                        CA
                                      </th>
                                      <th className="text-right pb-1 pr-3">
                                        Exam
                                      </th>
                                      <th className="text-right pb-1 pr-3">
                                        Total
                                      </th>
                                      <th className="text-left pb-1 pr-3">
                                        Grade
                                      </th>
                                      <th className="text-right pb-1 pr-3">
                                        GP
                                      </th>
                                      <th className="text-right pb-1">CU</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.courses.map((c) => (
                                      <tr
                                        key={c.courseCode}
                                        className="border-t border-border/30"
                                      >
                                        <td className="py-1 pr-3 font-mono font-medium">
                                          {c.courseCode}
                                        </td>
                                        <td className="py-1 pr-3">
                                          {c.courseName}
                                        </td>
                                        <td className="py-1 pr-3 text-muted-foreground">
                                          {c.deptCode}
                                        </td>
                                        <td className="py-1 pr-3 text-muted-foreground">
                                          {c.semester}
                                        </td>
                                        <td className="py-1 pr-3 text-right">
                                          {c.ca}
                                        </td>
                                        <td className="py-1 pr-3 text-right">
                                          {c.exam}
                                        </td>
                                        <td className="py-1 pr-3 text-right font-medium">
                                          {c.total}
                                        </td>
                                        <td className="py-1 pr-3">
                                          <span
                                            className={`font-bold ${
                                              c.grade === "A"
                                                ? "text-green-600"
                                                : c.grade === "B"
                                                  ? "text-blue-600"
                                                  : c.grade === "F"
                                                    ? "text-destructive"
                                                    : "text-amber-600"
                                            }`}
                                          >
                                            {c.grade}
                                          </span>
                                        </td>
                                        <td className="py-1 pr-3 text-right">
                                          {c.gradePoint.toFixed(1)}
                                        </td>
                                        <td className="py-1 text-right">
                                          {c.creditUnits}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-border font-semibold">
                                      <td
                                        colSpan={5}
                                        className="pt-2 text-right pr-3 text-muted-foreground"
                                      >
                                        Totals:
                                      </td>
                                      <td />
                                      <td />
                                      <td />
                                      <td className="pt-2 text-right pr-3">
                                        {row.tcp.toFixed(1)}
                                      </td>
                                      <td className="pt-2 text-right">
                                        {row.totalCredits}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td
                                        colSpan={9}
                                        className="pt-1 text-right text-muted-foreground"
                                      >
                                        CGPA = TCP/TGP = {row.tcp.toFixed(1)}/
                                        {row.tgp} ={" "}
                                        <strong>{row.cgpa.toFixed(2)}</strong>
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
