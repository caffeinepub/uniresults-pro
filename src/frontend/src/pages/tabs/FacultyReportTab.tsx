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
import { useApp } from "../../context/AppContext";

const LEVELS = [100, 200, 300, 400, 500, 600];

export default function FacultyReportTab() {
  const {
    faculties,
    departments,
    courses,
    students,
    results,
    academicCalendars,
    institutionSettings,
    currentUser,
    logAudit,
  } = useApp();

  const institutionName = institutionSettings?.name ?? "University";

  const sessions = useMemo(() => {
    const set = new Set<string>();
    for (const c of academicCalendars) set.add(c.session);
    set.add("2024/2025");
    return Array.from(set).sort().reverse();
  }, [academicCalendars]);

  const [facultyId, setFacultyId] = useState(String(faculties[0]?.id ?? 1));
  const [session, setSession] = useState(sessions[0] ?? "2024/2025");
  const [semester, setSemester] = useState("First");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [pendingExportFn, setPendingExportFn] = useState<(() => void) | null>(
    null,
  );

  const faculty = faculties.find((f) => String(f.id) === facultyId);
  const facultyDepts = departments.filter(
    (d) => String(d.facultyId) === facultyId,
  );

  const activeLevel = filterLevel === "all" ? null : Number(filterLevel);
  const visibleLevels = LEVELS.filter(
    (lvl) => activeLevel === null || lvl === activeLevel,
  );

  function getLevelStats(lvl: number) {
    const lvlStudents = students.filter(
      (s) =>
        facultyDepts.some((d) => String(d.id) === String(s.departmentId)) &&
        Number(s.level ?? 100) === lvl,
    );
    const lvlStudentIds = new Set(lvlStudents.map((s) => s.id));

    const deptStats = facultyDepts.map((dept) => {
      const deptCourses = courses.filter(
        (c) => c.departmentId === dept.id && c.semester === semester,
      );
      const deptCourseIds = new Set(deptCourses.map((c) => c.id));
      const deptLvlStudents = lvlStudents.filter(
        (s) => s.departmentId === dept.id,
      );
      const deptResults = results.filter(
        (r) =>
          lvlStudentIds.has(r.studentId) &&
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
        studentCount: deptLvlStudents.length,
        resultCount: deptResults.length,
        passRate,
        avgScore,
        gradeDistrib,
      };
    });

    const facultyCourseIds = new Set(
      courses
        .filter(
          (c) =>
            facultyDepts.some((d) => String(d.id) === String(c.departmentId)) &&
            c.semester === semester,
        )
        .map((c) => c.id),
    );
    const facultyLvlResults = results.filter(
      (r) =>
        lvlStudentIds.has(r.studentId) &&
        facultyCourseIds.has(r.courseId) &&
        (r.status === "published" || r.status === "approved"),
    );

    const top5 = lvlStudents
      .map((s) => {
        const sr = facultyLvlResults.filter((r) => r.studentId === s.id);
        const avg =
          sr.length > 0
            ? sr.reduce((a, r) => a + r.totalScore, 0) / sr.length
            : 0;
        return { student: s, avg, count: sr.length };
      })
      .filter((s) => s.count > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);

    return { lvlStudents, deptStats, top5, facultyLvlResults };
  }

  function buildCSVAll() {
    const lines: string[] = [
      institutionName,
      faculty?.name ?? "",
      `Session: ${session}, Semester: ${semester}`,
      "",
    ];
    for (const lvl of LEVELS) {
      const s = getLevelStats(lvl);
      if (s.lvlStudents.length === 0) continue;
      lines.push(`LEVEL ${lvl}`);
      lines.push("Department,Students,Results,Avg Score,Pass Rate,A,B,C,D,E,F");
      for (const d of s.deptStats) {
        lines.push(
          `${d.dept.name},${d.studentCount},${d.resultCount},${d.avgScore},${d.passRate}%,${d.gradeDistrib.join(",")}`,
        );
      }
      lines.push("");
      lines.push("Top 5 Performers");
      lines.push("Name,Matric,Avg Score");
      for (const st of s.top5)
        lines.push(
          `${st.student.name},${st.student.matricNumber},${st.avg.toFixed(1)}`,
        );
      lines.push("");
    }
    return lines.join("\n");
  }

  function doDownloadCSV() {
    const blob = new Blob([buildCSVAll()], { type: "text/csv" });
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
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "report_export",
      `Faculty Report CSV exported: ${faculty?.name}, ${session} ${semester}`,
    );
  }

  function doPrint() {
    window.print();
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "report_export",
      `Faculty Report printed: ${faculty?.name}, ${session} ${semester}`,
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
          <h1 className="text-2xl font-bold">Faculty Report</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {faculty?.name ?? ""}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestExport(doDownloadCSV)}
            data-ocid="faculty_report.download_button"
          >
            <Download className="w-4 h-4 mr-1" /> Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestExport(doPrint)}
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
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger
            data-ocid="faculty_report.level.select"
            className="w-36"
          >
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
        if (stats.lvlStudents.length === 0) return null;
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
              <p className="text-sm font-bold text-primary mt-1">
                LEVEL {lvl} — {semester.toUpperCase()} SEMESTER {session}
              </p>
            </div>

            {/* Department comparison table */}
            <div className="print-area">
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Department Comparison — Level {lvl}
              </h3>
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
                    {stats.deptStats.filter((d) => d.studentCount > 0)
                      .length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={11}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No students at Level {lvl} in this faculty
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.deptStats
                        .filter((d) => d.studentCount > 0)
                        .map(
                          ({
                            dept,
                            studentCount,
                            resultCount,
                            passRate,
                            avgScore,
                            gradeDistrib,
                          }) => (
                            <TableRow key={String(dept.id)}>
                              <TableCell className="font-medium">
                                {dept.name}
                              </TableCell>
                              <TableCell className="text-sm">
                                {studentCount}
                              </TableCell>
                              <TableCell className="text-sm">
                                {resultCount}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {avgScore}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    Number(passRate) >= 60
                                      ? "bg-green-500/15 text-green-600"
                                      : "bg-destructive/15 text-destructive"
                                  }
                                >
                                  {passRate}%
                                </Badge>
                              </TableCell>
                              {gradeDistrib.map((count, gIdx) => (
                                <TableCell
                                  key={["A", "B", "C", "D", "E", "F"][gIdx]}
                                  className="text-sm text-center"
                                >
                                  {count}
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
              <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Top Performers — Level {lvl} (Faculty-wide)
              </h3>
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
                    {stats.top5.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No result data for this level
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.top5.map((s, i) => {
                        const dept = departments.find(
                          (d) =>
                            String(d.id) === String(s.student.departmentId),
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
      })}

      {/* Export Authorization Dialog */}
      <AlertDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <AlertDialogContent data-ocid="faculty_report.export_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Authorization</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to export sensitive academic data. Please confirm
              you are authorized to access this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="faculty_report.export_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="faculty_report.export_confirm_button"
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
