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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { getStudentDepartment, useApp } from "../../context/AppContext";

type SortDir = "asc" | "desc";

function useSortable(initial: string) {
  const [col, setCol] = useState(initial);
  const [dir, setDir] = useState<SortDir>("desc");
  function toggle(c: string) {
    if (col === c) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setCol(c);
      setDir("desc");
    }
  }
  function SortIcon({ c }: { c: string }) {
    if (col !== c) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return dir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    );
  }
  return { col, dir, toggle, SortIcon };
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  color?: "primary" | "success" | "destructive" | "warning" | "muted";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            )}
          </div>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResultStatsDashboard() {
  const {
    students,
    results,
    courses,
    departments,
    courseRegistrations,
    academicCalendars,
  } = useApp();

  const { col, dir, toggle, SortIcon } = useSortable("pass");

  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSession = activeCalendar?.session;

  const stats = useMemo(() => {
    const published = results.filter((r) => r.status === "published");
    const pending = results.filter((r) =>
      ["submitted", "hod_approved", "dean_approved"].includes(r.status),
    );
    const passed = published.filter((r) => r.grade !== "F");
    const failed = published.filter((r) => r.grade === "F");
    const passRate =
      published.length > 0
        ? Math.round((passed.length / published.length) * 100)
        : 0;
    const failRate =
      published.length > 0
        ? Math.round((failed.length / published.length) * 100)
        : 0;

    const unregistered = activeSession
      ? students.filter((s) => {
          const regs = courseRegistrations.filter(
            (r) =>
              String(r.studentId) === String(s.id) &&
              r.semester?.includes(activeSession),
          );
          return regs.length === 0;
        })
      : [];

    const coursesNoScores = courses.filter(
      (c) => !results.some((r) => String(r.courseId) === String(c.id)),
    );

    return {
      totalStudents: students.length,
      pendingApprovals: pending.length,
      publishedResults: published.length,
      pendingResults: results.filter((r) => r.status === "draft").length,
      passRate,
      failRate,
      unregistered: unregistered.length,
      coursesNoScores: coursesNoScores.length,
    };
  }, [students, results, courses, courseRegistrations, activeSession]);

  const deptStats = useMemo(() => {
    return departments
      .map((dept) => {
        const deptStudents = students.filter(
          (s) => String(s.departmentId) === String(dept.id),
        );
        const deptResults = results.filter((r) => {
          const s = students.find(
            (st) => String(st.id) === String(r.studentId),
          );
          return (
            s &&
            String(s.departmentId) === String(dept.id) &&
            r.status === "published"
          );
        });
        const passed = deptResults.filter((r) => r.grade !== "F").length;
        const failed = deptResults.filter((r) => r.grade === "F").length;
        const total = deptResults.length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        return {
          dept,
          studentCount: deptStudents.length,
          passed,
          failed,
          total,
          passRate,
        };
      })
      .filter((d) => d.studentCount > 0);
  }, [departments, students, results]);

  const sorted = useMemo(() => {
    return [...deptStats].sort((a, b) => {
      let va: number;
      let vb: number;
      if (col === "students") {
        va = a.studentCount;
        vb = b.studentCount;
      } else if (col === "pass") {
        va = a.passRate;
        vb = b.passRate;
      } else if (col === "fail") {
        va = a.failed;
        vb = b.failed;
      } else {
        va = a.total;
        vb = b.total;
      }
      return dir === "asc" ? va - vb : vb - va;
    });
  }, [deptStats, col, dir]);

  return (
    <div className="space-y-6" data-ocid="result_stats.page">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Results Statistics Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          System-wide overview of student results and academic activity
          {activeSession && (
            <span className="ml-2 text-primary font-medium">
              {activeSession}
            </span>
          )}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          color={stats.pendingApprovals > 0 ? "warning" : "success"}
          sub="Awaiting HOD/Dean/Registrar"
        />
        <StatCard
          label="Pass Rate"
          value={`${stats.passRate}%`}
          icon={TrendingUp}
          color="success"
          sub={`${stats.publishedResults} published results`}
        />
        <StatCard
          label="Fail Rate"
          value={`${stats.failRate}%`}
          icon={TrendingDown}
          color={stats.failRate > 30 ? "destructive" : "muted"}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Unregistered Students"
          value={stats.unregistered}
          icon={AlertTriangle}
          color={stats.unregistered > 0 ? "warning" : "success"}
          sub={
            activeSession
              ? `No courses for ${activeSession}`
              : "No active session"
          }
        />
        <StatCard
          label="Courses With No Scores"
          value={stats.coursesNoScores}
          icon={BookOpen}
          color={stats.coursesNoScores > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Draft Results"
          value={stats.pendingResults}
          icon={XCircle}
          color="muted"
          sub="Not yet submitted"
        />
      </div>

      {/* Published vs Pending bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Results Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {(
              [
                { label: "Draft", key: "draft", color: "bg-muted" },
                { label: "Submitted", key: "submitted", color: "bg-blue-400" },
                {
                  label: "HOD Approved",
                  key: "hod_approved",
                  color: "bg-yellow-400",
                },
                {
                  label: "Dean Approved",
                  key: "dean_approved",
                  color: "bg-orange-400",
                },
                { label: "Published", key: "published", color: "bg-success" },
                { label: "Rejected", key: "rejected", color: "bg-destructive" },
              ] as const
            ).map(({ label, key, color }) => {
              const count = results.filter((r) => r.status === key).length;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Badge variant="outline" className="text-xs h-5">
                    {count}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Department breakdown */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          Pass / Fail Breakdown by Department
        </h2>
        <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center"
                    onClick={() => toggle("students")}
                  >
                    Students <SortIcon c="students" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center"
                    onClick={() => toggle("total")}
                  >
                    Results <SortIcon c="total" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center"
                    onClick={() => toggle("pass")}
                  >
                    Pass Rate <SortIcon c="pass" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center"
                    onClick={() => toggle("fail")}
                  >
                    Failures <SortIcon c="fail" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-10 text-muted-foreground"
                    data-ocid="result_stats.empty_state"
                  >
                    No department data available
                  </TableCell>
                </TableRow>
              )}
              {sorted.map((row, i) => (
                <TableRow
                  key={String(row.dept.id)}
                  data-ocid={`result_stats.item.${i + 1}`}
                >
                  <TableCell className="font-medium text-sm">
                    {row.dept.name}
                  </TableCell>
                  <TableCell>{row.studentCount}</TableCell>
                  <TableCell>{row.total}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${row.passRate}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold ${row.passRate >= 60 ? "text-success" : "text-destructive"}`}
                      >
                        {row.passRate}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.failed > 0 ? (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30">
                        {row.failed}
                      </Badge>
                    ) : (
                      <Badge className="bg-success/15 text-success border-success/30">
                        0
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
