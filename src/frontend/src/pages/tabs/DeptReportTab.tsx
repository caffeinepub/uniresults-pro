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

const LEVELS = [100, 200, 300, 400, 500, 600];

export default function DeptReportTab() {
  const {
    currentUser,
    departments,
    faculties,
    courses,
    students,
    results,
    academicCalendars,
    institutionSettings,
    logAudit,
  } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const dept = departments.find((d) => String(d.id) === String(deptId));
  const faculty = faculties.find(
    (f) => String(f.id) === String(dept?.facultyId),
  );
  const institutionName = institutionSettings?.name ?? "University";

  const sessions = useMemo(() => {
    const set = new Set<string>();
    for (const c of academicCalendars) set.add(c.session);
    set.add("2024/2025");
    return Array.from(set).sort().reverse();
  }, [academicCalendars]);

  const [session, setSession] = useState(sessions[0] ?? "2024/2025");
  const [semester, setSemester] = useState("First");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportFn, setPendingExportFn] = useState<(() => void) | null>(
    null,
  );

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

  // Group students by level
  const levelGroups = useMemo(() => {
    const map: Record<number, typeof deptStudents> = {};
    for (const lvl of LEVELS) map[lvl] = [];
    for (const s of deptStudents) {
      const lvl = Number(s.level ?? 100);
      const key = LEVELS.includes(lvl) ? lvl : 100;
      map[key].push(s);
    }
    return map;
  }, [deptStudents]);

  const activeLevel = filterLevel === "all" ? null : Number(filterLevel);
  const visibleLevels = LEVELS.filter(
    (lvl) => activeLevel === null || lvl === activeLevel,
  );

  function getLevelStats(lvl: number) {
    const lvlStudents = levelGroups[lvl];
    const lvlStudentIds = new Set(lvlStudents.map((s) => s.id));
    // Infer course level from first digit of code or course level property
    const lvlCourses = deptCourses.filter((c) => {
      const inferredLevel =
        Math.floor(Number(c.creditUnits ?? 1)) > 0
          ? Number.parseInt(c.code.replace(/[^0-9]/g, "").charAt(0) ?? "1") *
            100
          : 100;
      return inferredLevel === lvl || (c as any).level === lvl;
    });
    const lvlCourseIds = new Set(lvlCourses.map((c) => c.id));
    const lvlResults = deptResults.filter(
      (r) => lvlStudentIds.has(r.studentId) || lvlCourseIds.has(r.courseId),
    );

    const grades = ["A", "B", "C", "D", "E", "F"];
    const gradeDistribution = grades.map((g) => {
      const count = lvlResults.filter((r) => r.grade === g).length;
      const pct =
        lvlResults.length > 0
          ? ((count / lvlResults.length) * 100).toFixed(1)
          : "0.0";
      return { grade: g, count, pct };
    });

    const passCount = lvlResults.filter((r) => r.grade !== "F").length;
    const passRate =
      lvlResults.length > 0
        ? ((passCount / lvlResults.length) * 100).toFixed(1)
        : "0.0";
    const avgScore =
      lvlResults.length > 0
        ? (
            lvlResults.reduce((s, r) => s + r.totalScore, 0) / lvlResults.length
          ).toFixed(1)
        : "0.0";

    const studentStats = lvlStudents
      .map((s) => {
        const sr = lvlResults.filter((r) => r.studentId === s.id);
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

    const courseStats = lvlCourses.map((c) => {
      const cr = lvlResults.filter((r) => r.courseId === c.id);
      const avg =
        cr.length > 0
          ? (cr.reduce((a, r) => a + r.totalScore, 0) / cr.length).toFixed(1)
          : "0.0";
      const pass = cr.filter((r) => r.grade !== "F").length;
      const rate =
        cr.length > 0 ? ((pass / cr.length) * 100).toFixed(1) : "0.0";
      return { course: c, avg, passRate: rate, count: cr.length };
    });

    return {
      lvlStudents,
      lvlResults,
      gradeDistribution,
      passRate,
      avgScore,
      top5,
      atRisk,
      courseStats,
    };
  }

  function buildCSVAll() {
    const lines: string[] = [
      institutionName,
      faculty?.name ?? "",
      dept?.name ?? "",
      `Session: ${session}, Semester: ${semester}`,
      "",
    ];
    for (const lvl of LEVELS) {
      const s = getLevelStats(lvl);
      if (s.lvlStudents.length === 0) continue;
      lines.push(`LEVEL ${lvl}`);
      lines.push(
        `Students: ${s.lvlStudents.length}, Pass Rate: ${s.passRate}%, Avg Score: ${s.avgScore}`,
      );
      lines.push("Grade Distribution");
      lines.push("Grade,Count,Percentage");
      for (const g of s.gradeDistribution)
        lines.push(`${g.grade},${g.count},${g.pct}%`);
      lines.push("");
      lines.push("Top 5 Students");
      lines.push("Name,Matric,Avg Score");
      for (const st of s.top5)
        lines.push(
          `${st.student.name},${st.student.matricNumber},${st.avg.toFixed(1)}`,
        );
      lines.push("");
      if (s.atRisk.length > 0) {
        lines.push("At-Risk Students");
        lines.push("Name,Matric");
        for (const st of s.atRisk)
          lines.push(`${st.student.name},${st.student.matricNumber}`);
        lines.push("");
      }
    }
    return lines.join("\n");
  }

  function doDownloadCSV() {
    const blob = new Blob([buildCSVAll()], { type: "text/csv" });
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
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "report_export",
      `Dept Report CSV exported: ${dept?.name}, ${session} ${semester}`,
    );
  }

  function doPrint() {
    window.print();
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "report_export",
      `Dept Report printed: ${dept?.name}, ${session} ${semester}`,
    );
  }

  function requestExport(fn: () => void) {
    setPendingExportFn(() => fn);
    setExportDialogOpen(true);
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
            onClick={() => requestExport(doDownloadCSV)}
            data-ocid="dept_report.download_button"
          >
            <Download className="w-4 h-4 mr-1" /> Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestExport(doPrint)}
            data-ocid="dept_report.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap no-print">
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
            <SelectItem value="First">First Semester</SelectItem>
            <SelectItem value="Second">Second Semester</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger data-ocid="dept_report.level.select" className="w-36">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={String(l)}>
                Level {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Level-separated sections */}
      {visibleLevels.map((lvl, idx) => {
        const stats = getLevelStats(lvl);
        if (stats.lvlStudents.length === 0 && stats.lvlResults.length === 0)
          return null;
        const grades = ["A", "B", "C", "D", "E", "F"];
        return (
          <div
            key={lvl}
            className={`level-section space-y-4 ${idx > 0 ? "mt-10" : ""}`}
          >
            {/* Level heading */}
            <div className="level-heading rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-base font-bold text-foreground">
                {institutionName}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {faculty?.name ?? ""}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {dept?.name ?? ""}
              </p>
              <p className="text-sm font-bold text-primary mt-1">
                LEVEL {lvl} — {semester.toUpperCase()} SEMESTER {session}
              </p>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Students",
                  value: stats.lvlStudents.length,
                  color: "text-primary",
                },
                {
                  label: "Results",
                  value: stats.lvlResults.length,
                  color: "text-foreground",
                },
                {
                  label: "Pass Rate",
                  value: `${stats.passRate}%`,
                  color:
                    Number(stats.passRate) >= 60
                      ? "text-green-600"
                      : "text-destructive",
                },
                {
                  label: "Avg Score",
                  value: `${stats.avgScore}/100`,
                  color: "text-foreground",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-xl font-bold mt-1 ${card.color}`}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Grade distribution */}
            <div className="print-area">
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Grade Distribution — Level {lvl}
              </h3>
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
                      {stats.gradeDistribution.map((g) => (
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
            {stats.courseStats.length > 0 && (
              <div className="print-area">
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Course Breakdown — Level {lvl}
                </h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead>Code</TableHead>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Avg Score</TableHead>
                        <TableHead>Pass Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.courseStats.map((cs) => (
                        <TableRow key={String(cs.course.id)}>
                          <TableCell className="font-mono text-sm">
                            {cs.course.code}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {cs.course.name}
                          </TableCell>
                          <TableCell className="text-sm">{cs.count}</TableCell>
                          <TableCell className="text-sm">{cs.avg}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                Number(cs.passRate) >= 60
                                  ? "bg-green-500/15 text-green-600"
                                  : "bg-destructive/15 text-destructive"
                              }
                            >
                              {cs.passRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Top performers */}
            <div className="print-area">
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Top 5 Performers — Level {lvl}
              </h3>
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
                    {stats.top5.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground text-sm"
                        >
                          No result data for this level
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.top5.map((s, i) => (
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

            {/* At-risk */}
            {stats.atRisk.length > 0 && (
              <div className="print-area">
                <h3 className="text-xs font-semibold mb-2 text-destructive uppercase tracking-wide">
                  At-Risk Students — Level {lvl} (F Grade)
                </h3>
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
                      {stats.atRisk.map((s) => (
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
      })}

      {/* Export Authorization Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent data-ocid="dept_report.export_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Authorization</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to export sensitive academic data. Please confirm
              you are authorized to access this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="dept_report.export_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="dept_report.export_confirm_button"
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

// keep calcGradePoint import satisfied
void calcGradePoint;
