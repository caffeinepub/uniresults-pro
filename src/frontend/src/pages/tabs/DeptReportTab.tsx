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
import { calcGradePoint, useApp } from "../../context/AppContext";

export default function DeptReportTab() {
  const {
    currentUser,
    departments,
    faculties,
    courses,
    students,
    results,
    academicCalendars,
  } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const dept = departments.find((d) => d.id === deptId);
  const faculty = faculties.find((f) => f.id === dept?.facultyId);

  const sessions = useMemo(() => {
    const set = new Set<string>();
    for (const c of academicCalendars) set.add(c.session);
    set.add("2024/2025");
    return Array.from(set).sort().reverse();
  }, [academicCalendars]);

  const semesters = ["First", "Second"];

  const [session, setSession] = useState(sessions[0] ?? "2024/2025");
  const [semester, setSemester] = useState("First");

  const deptCourses = useMemo(
    () =>
      courses.filter(
        (c) => c.departmentId === deptId && c.semester === semester,
      ),
    [courses, deptId, semester],
  );

  const deptCourseIds = new Set(deptCourses.map((c) => c.id));
  const deptStudents = students.filter((s) => s.departmentId === deptId);
  const deptResults = results.filter(
    (r) =>
      deptCourseIds.has(r.courseId) &&
      (r.status === "published" || r.status === "approved"),
  );

  const grades = ["A", "B", "C", "D", "E", "F"];
  const gradeDistribution = grades.map((g) => {
    const count = deptResults.filter((r) => r.grade === g).length;
    const pct =
      deptResults.length > 0
        ? ((count / deptResults.length) * 100).toFixed(1)
        : "0.0";
    return { grade: g, count, pct };
  });

  const totalResults = deptResults.length;
  const passCount = deptResults.filter((r) => r.grade !== "F").length;
  const passRate =
    totalResults > 0 ? ((passCount / totalResults) * 100).toFixed(1) : "0.0";
  const avgScore =
    totalResults > 0
      ? (
          deptResults.reduce((s, r) => s + r.totalScore, 0) / totalResults
        ).toFixed(1)
      : "0.0";

  // Per-student stats
  const studentStats = deptStudents
    .map((s) => {
      const sr = deptResults.filter((r) => r.studentId === s.id);
      const avg =
        sr.length > 0
          ? sr.reduce((a, r) => a + r.totalScore, 0) / sr.length
          : 0;
      const hasF = sr.some((r) => r.grade === "F");
      return { student: s, avg, hasF, count: sr.length };
    })
    .filter((s) => s.count > 0);

  const top5 = [...studentStats].sort((a, b) => b.avg - a.avg).slice(0, 5);
  const atRisk = studentStats.filter((s) => s.hasF);

  // Per-course stats
  const courseStats = deptCourses.map((c) => {
    const cr = deptResults.filter((r) => r.courseId === c.id);
    const enrolled = deptStudents.length;
    const avg =
      cr.length > 0
        ? (cr.reduce((a, r) => a + r.totalScore, 0) / cr.length).toFixed(1)
        : "0.0";
    const pass = cr.filter((r) => r.grade !== "F").length;
    const rate = cr.length > 0 ? ((pass / cr.length) * 100).toFixed(1) : "0.0";
    return { course: c, enrolled, avg, passRate: rate, count: cr.length };
  });

  function downloadCSV() {
    const lines: string[] = [
      `Department Report: ${dept?.name ?? ""}`,
      `Session: ${session}, Semester: ${semester}`,
      "",
      `Total Students,${deptStudents.length}`,
      `Total Results,${totalResults}`,
      `Pass Rate,${passRate}%`,
      `Average Score,${avgScore}`,
      "",
      "Grade Distribution",
      "Grade,Count,Percentage",
      ...gradeDistribution.map((g) => `${g.grade},${g.count},${g.pct}%`),
      "",
      "Course Breakdown",
      "Course Code,Course Name,Enrolled,Results,Avg Score,Pass Rate",
      ...courseStats.map(
        (cs) =>
          `${cs.course.code},${cs.course.name},${cs.enrolled},${cs.count},${cs.avg},${cs.passRate}%`,
      ),
      "",
      "Top 5 Students",
      "Name,Matric,Avg Score",
      ...top5.map(
        (s) =>
          `${s.student.name},${s.student.matricNumber},${s.avg.toFixed(1)}`,
      ),
      "",
      "At-Risk Students",
      "Name,Matric",
      ...atRisk.map((s) => `${s.student.name},${s.student.matricNumber}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      `dept_report_${dept?.name ?? ""}_${session}_${semester}.csv`.replace(
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
          <h1 className="text-2xl font-bold">Department Report</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {dept?.name ?? ""} · {faculty?.name ?? ""}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSV}
            data-ocid="dept_report.download_button"
          >
            <Download className="w-4 h-4 mr-1" /> Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            data-ocid="dept_report.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 no-print">
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger
            data-ocid="dept_report.session.select"
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
            data-ocid="dept_report.semester.select"
            className="w-32"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((s) => (
              <SelectItem key={s} value={s}>
                {s} Semester
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="print-area grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Students",
            value: deptStudents.length,
            color: "text-primary",
          },
          {
            label: "Results Submitted",
            value: totalResults,
            color: "text-foreground",
          },
          {
            label: "Pass Rate",
            value: `${passRate}%`,
            color: Number(passRate) >= 60 ? "text-success" : "text-destructive",
          },
          {
            label: "Average Score",
            value: `${avgScore}/100`,
            color: "text-foreground",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Grade distribution */}
      <div className="print-area">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Grade Distribution
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {grades.map((g) => (
                  <TableHead key={g} className="text-center">
                    {g}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {gradeDistribution.map((g) => (
                  <TableCell key={g.grade} className="text-center">
                    <span className="font-bold">{g.count}</span>
                    <span className="text-xs text-muted-foreground block">
                      {g.pct}%
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Course breakdown */}
      <div className="print-area">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Course Breakdown
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseStats.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No courses for this period
                  </TableCell>
                </TableRow>
              ) : (
                courseStats.map((cs) => (
                  <TableRow key={String(cs.course.id)}>
                    <TableCell className="font-mono text-sm">
                      {cs.course.code}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {cs.course.name}
                    </TableCell>
                    <TableCell className="text-sm">{cs.enrolled}</TableCell>
                    <TableCell className="text-sm">{cs.count}</TableCell>
                    <TableCell className="text-sm">{cs.avg}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          Number(cs.passRate) >= 60
                            ? "bg-success/15 text-success"
                            : "bg-destructive/15 text-destructive"
                        }
                      >
                        {cs.passRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Top 5 performers */}
      <div className="print-area">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Top 5 Performing Students
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Matric No.</TableHead>
                <TableHead>Avg Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                top5.map((s, i) => (
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
                    <TableCell className="font-semibold">
                      {s.avg.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* At-risk students */}
      {atRisk.length > 0 && (
        <div className="print-area">
          <h2 className="text-sm font-semibold mb-3 text-destructive uppercase tracking-wide">
            At-Risk Students (F Grade)
          </h2>
          <div className="rounded-xl border border-destructive/20 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-destructive/5">
                  <TableHead>Name</TableHead>
                  <TableHead>Matric No.</TableHead>
                  <TableHead>Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRisk.map((s) => (
                  <TableRow key={String(s.student.id)}>
                    <TableCell className="font-medium">
                      {s.student.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.student.matricNumber}
                    </TableCell>
                    <TableCell className="text-sm text-destructive font-medium">
                      {s.avg.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
