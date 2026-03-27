import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Download, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";

interface Props {
  userRole: "HOD" | "ExamOfficer";
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    submitted: {
      label: "Submitted",
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    hod_approved: {
      label: "HOD Approved",
      cls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    dean_approved: {
      label: "Dean Approved",
      cls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    },
    approved: {
      label: "Approved",
      cls: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    published: {
      label: "Published",
      cls: "bg-green-600/10 text-green-700 border-green-600/20",
    },
    rejected: {
      label: "Rejected",
      cls: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };
  return (
    map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" }
  );
}

export default function DeptAllResultsTab({ userRole: _userRole }: Props) {
  const { currentUser, results, courses, students, academicCalendars } =
    useApp();

  const hodDeptId = (currentUser as any)?.departmentId;

  const [levelFilter, setLevelFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const deptCourses = useMemo(
    () => courses.filter((c) => String(c.departmentId) === String(hodDeptId)),
    [courses, hodDeptId],
  );
  const deptCourseMap = useMemo(
    () => new Map(deptCourses.map((c) => [String(c.id), c])),
    [deptCourses],
  );
  const studentMap = useMemo(
    () => new Map(students.map((s) => [String(s.id), s])),
    [students],
  );

  const sessions = useMemo(
    () => [...new Set(academicCalendars.map((c) => c.session))],
    [academicCalendars],
  );
  const levels = [100, 200, 300, 400, 500, 600];

  const rows = useMemo(() => {
    return results
      .filter((r) => deptCourseMap.has(String(r.courseId)))
      .filter((r) => {
        if (levelFilter !== "all") {
          const course = deptCourseMap.get(String(r.courseId));
          if (String((course as any)?.level) !== levelFilter) return false;
        }
        if (sessionFilter !== "all" && (r as any).session !== sessionFilter)
          return false;
        if (semesterFilter !== "all") {
          const course = deptCourseMap.get(String(r.courseId));
          if (course?.semester !== semesterFilter) return false;
        }
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search.trim()) {
          const student = studentMap.get(String(r.studentId));
          const q = search.toLowerCase();
          if (
            !student?.name.toLowerCase().includes(q) &&
            !student?.matricNumber?.toLowerCase().includes(q) &&
            !(r as any).studentName?.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .map((r) => {
        const course = deptCourseMap.get(String(r.courseId))!;
        const student = studentMap.get(String(r.studentId));
        const name = student?.name ?? (r as any).studentName ?? "Unknown";
        const matric = student?.matricNumber ?? (r as any).matricNumber ?? "—";
        const gp = (r as any).gradePoints ?? (r as any).gp ?? 0;
        return { r, course, name, matric, gp };
      });
  }, [
    results,
    deptCourseMap,
    studentMap,
    levelFilter,
    sessionFilter,
    semesterFilter,
    statusFilter,
    search,
  ]);

  const passCount = rows.filter(
    (row) => (row.r.grade ?? "") !== "F" && (row.r.grade ?? "") !== "",
  ).length;
  const failCount = rows.filter((row) => row.r.grade === "F").length;
  const avgScore =
    rows.length > 0
      ? Math.round(
          rows.reduce(
            (sum, row) =>
              sum + ((row.r as any).total ?? (row.r as any).score ?? 0),
            0,
          ) / rows.length,
        )
      : 0;
  const passRate =
    rows.length > 0 ? Math.round((passCount / rows.length) * 100) : 0;

  const handleDownloadCSV = () => {
    const headers = [
      "S/N",
      "Matric No",
      "Student Name",
      "Course Code",
      "Course Title",
      "CA",
      "Exam",
      "Total",
      "Grade",
      "GP",
      "Status",
    ];
    const csvRows = rows.map((row, i) =>
      [
        i + 1,
        row.matric,
        `"${row.name}"`,
        row.course.code,
        `"${row.course.name}"`,
        (row.r as any).ca ?? "",
        (row.r as any).exam ?? "",
        (row.r as any).total ?? (row.r as any).score ?? "",
        row.r.grade ?? "",
        row.gp,
        row.r.status,
      ].join(","),
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dept_results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Results",
            value: rows.length,
            cls: "text-foreground",
          },
          { label: "Pass Rate", value: `${passRate}%`, cls: "text-green-600" },
          { label: "Failed", value: failCount, cls: "text-destructive" },
          { label: "Avg Score", value: avgScore, cls: "text-blue-600" },
        ].map((s) => (
          <Card
            key={s.label}
            className="bg-card border border-border rounded-xl"
          >
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center no-print">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            data-ocid="dept_results.search_input"
            className="pl-8 h-8 text-xs"
            placeholder="Search name or matric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger
            data-ocid="dept_results.select"
            className="h-8 text-xs w-28"
          >
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((l) => (
              <SelectItem key={l} value={String(l)}>
                Level {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sessionFilter} onValueChange={setSessionFilter}>
          <SelectTrigger
            data-ocid="dept_results.select"
            className="h-8 text-xs w-32"
          >
            <SelectValue placeholder="Session" />
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
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger
            data-ocid="dept_results.select"
            className="h-8 text-xs w-32"
          >
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value="First">First</SelectItem>
            <SelectItem value="Second">Second</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            data-ocid="dept_results.select"
            className="h-8 text-xs w-32"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="hod_approved">HOD Approved</SelectItem>
            <SelectItem value="dean_approved">Dean Approved</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          data-ocid="dept_results.upload_button"
          className="h-8 text-xs gap-1.5"
          onClick={handleDownloadCSV}
        >
          <Download className="w-3.5 h-3.5" />
          Download CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          data-ocid="dept_results.button"
          className="h-8 text-xs gap-1.5 no-print"
          onClick={() => window.print()}
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </Button>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div
          data-ocid="dept_results.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-sm text-muted-foreground">
            No results found for current filters
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold">S/N</TableHead>
                <TableHead className="text-xs font-semibold">
                  Matric No
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Student Name
                </TableHead>
                <TableHead className="text-xs font-semibold">Code</TableHead>
                <TableHead className="text-xs font-semibold">
                  Course Title
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  CA
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Exam
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Grade
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  GP
                </TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                const sl = statusLabel(row.r.status);
                return (
                  <TableRow
                    key={String(row.r.id)}
                    data-ocid={`dept_results.row.${idx + 1}`}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {row.matric}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {row.course.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate">
                      {row.course.name}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {(row.r as any).ca ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {(row.r as any).exam ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-center font-medium">
                      {(row.r as any).total ?? (row.r as any).score ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <span
                        className={`font-bold ${
                          row.r.grade === "A"
                            ? "text-green-600"
                            : row.r.grade === "F"
                              ? "text-destructive"
                              : "text-foreground"
                        }`}
                      >
                        {row.r.grade ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      {row.gp}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${sl.cls}`}>
                        {sl.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
