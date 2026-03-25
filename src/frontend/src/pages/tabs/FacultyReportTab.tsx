import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";

export default function FacultyReportTab() {
  const {
    faculties,
    departments,
    courses,
    students,
    results,
    academicCalendars,
  } = useApp();

  const sessions = useMemo(() => {
    const set = new Set<string>();
    for (const c of academicCalendars) set.add(c.session);
    set.add("2024/2025");
    return Array.from(set).sort().reverse();
  }, [academicCalendars]);

  const [facultyId, setFacultyId] = useState(String(faculties[0]?.id ?? 1));
  const [session, setSession] = useState(sessions[0] ?? "2024/2025");
  const [semester, setSemester] = useState("First");

  const faculty = faculties.find((f) => String(f.id) === facultyId);
  const facultyDepts = departments.filter(
    (d) => String(d.facultyId) === facultyId,
  );

  const deptStats = useMemo(() => {
    return facultyDepts.map((dept) => {
      const deptCourses = courses.filter(
        (c) => c.departmentId === dept.id && c.semester === semester,
      );
      const deptCourseIds = new Set(deptCourses.map((c) => c.id));
      const deptStudents = students.filter((s) => s.departmentId === dept.id);
      const deptResults = results.filter(
        (r) =>
          deptCourseIds.has(r.courseId) &&
          (r.status === "published" || r.status === "approved"),
      );
      const passCount = deptResults.filter((r) => r.grade !== "F").length;
      const passRate =
        deptResults.length > 0
          ? ((passCount / deptResults.length) * 100).toFixed(1)
          : "0.0";
      const avgScore =
        deptResults.length > 0
          ? (
              deptResults.reduce((s, r) => s + r.totalScore, 0) /
              deptResults.length
            ).toFixed(1)
          : "0.0";
      const gradeDistrib = ["A", "B", "C", "D", "E", "F"].map(
        (g) => deptResults.filter((r) => r.grade === g).length,
      );
      return {
        dept,
        studentCount: deptStudents.length,
        resultCount: deptResults.length,
        passRate,
        avgScore,
        gradeDistrib,
      };
    });
  }, [facultyDepts, courses, students, results, semester]);

  // Top performers across the faculty
  const facultyCourseIds = new Set(
    courses
      .filter(
        (c) =>
          facultyDepts.some((d) => d.id === c.departmentId) &&
          c.semester === semester,
      )
      .map((c) => c.id),
  );
  const facultyResults = results.filter(
    (r) =>
      facultyCourseIds.has(r.courseId) &&
      (r.status === "published" || r.status === "approved"),
  );
  const facultyStudents = students.filter((s) =>
    facultyDepts.some((d) => d.id === s.departmentId),
  );

  const top5 = facultyStudents
    .map((s) => {
      const sr = facultyResults.filter((r) => r.studentId === s.id);
      const avg =
        sr.length > 0
          ? sr.reduce((a, r) => a + r.totalScore, 0) / sr.length
          : 0;
      return { student: s, avg, count: sr.length };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  function downloadCSV() {
    const lines: string[] = [
      `Faculty Report: ${faculty?.name ?? ""}`,
      `Session: ${session}, Semester: ${semester}`,
      "",
      "Department Comparison",
      "Department,Students,Results,Avg Score,Pass Rate,A,B,C,D,E,F",
      ...deptStats.map(
        (d) =>
          `${d.dept.name},${d.studentCount},${d.resultCount},${d.avgScore},${d.passRate}%,${d.gradeDistrib.join(",")}`,
      ),
      "",
      "Top Performers (Faculty-wide)",
      "Name,Matric,Avg Score",
      ...top5.map(
        (s) =>
          `${s.student.name},${s.student.matricNumber},${s.avg.toFixed(1)}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      `faculty_report_${faculty?.name ?? ""}_${session}_${semester}.csv`.replace(
        /[/\s]/g,
        "_",
      );
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Faculty Report</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {faculty?.name ?? ""}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSV}
            data-ocid="faculty_report.download_button"
          >
            <Download className="w-4 h-4 mr-1" /> Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            data-ocid="faculty_report.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap no-print">
        <Select value={facultyId} onValueChange={setFacultyId}>
          <SelectTrigger
            data-ocid="faculty_report.faculty.select"
            className="w-52"
          >
            <SelectValue placeholder="Select Faculty" />
          </SelectTrigger>
          <SelectContent>
            {faculties.map((f) => (
              <SelectItem key={String(f.id)} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger
            data-ocid="faculty_report.session.select"
            className="w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger
            data-ocid="faculty_report.semester.select"
            className="w-36"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="First">First Semester</SelectItem>
            <SelectItem value="Second">Second Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department comparison table */}
      <div className="print-area">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Department Comparison
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Department</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
                <TableHead>A</TableHead>
                <TableHead>B</TableHead>
                <TableHead>C</TableHead>
                <TableHead>D</TableHead>
                <TableHead>E</TableHead>
                <TableHead>F</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptStats.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No departments in this faculty
                  </TableCell>
                </TableRow>
              ) : (
                deptStats.map(
                  ({
                    dept,
                    studentCount,
                    resultCount,
                    passRate,
                    avgScore,
                    gradeDistrib,
                  }) => (
                    <TableRow key={String(dept.id)}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-sm">{studentCount}</TableCell>
                      <TableCell className="text-sm">{resultCount}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {avgScore}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            Number(passRate) >= 60
                              ? "bg-success/15 text-success"
                              : "bg-destructive/15 text-destructive"
                          }
                        >
                          {passRate}%
                        </Badge>
                      </TableCell>
                      {["A", "B", "C", "D", "E", "F"].map((grade, gIdx) => (
                        <TableCell key={grade} className="text-sm text-center">
                          {gradeDistrib[gIdx]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ),
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Top performers */}
      <div className="print-area">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Top Performers (Faculty-wide)
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Matric No.</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Avg Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No results data available
                  </TableCell>
                </TableRow>
              ) : (
                top5.map((s, i) => {
                  const dept = departments.find(
                    (d) => d.id === s.student.departmentId,
                  );
                  return (
                    <TableRow key={String(s.student.id)}>
                      <TableCell className="font-bold text-primary">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.student.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.student.matricNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {dept?.name ?? "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {s.avg.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
