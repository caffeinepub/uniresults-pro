import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  getSpilloverStatus,
  getStudentDepartment,
  getStudentFaculty,
  useApp,
} from "../../context/AppContext";

export default function SystemHealthTab() {
  const {
    students,
    courses,
    results,
    departments,
    faculties,
    staffMembers,
    courseRegistrations,
    academicCalendars,
    graduationRequirements,
  } = useApp();

  const [viewPanel, setViewPanel] = useState<string | null>(null);

  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSession = activeCalendar?.session;

  const noCoursesRegistered = useMemo(() => {
    if (!activeSession) return [];
    return students.filter((s) => {
      const regs = courseRegistrations.filter(
        (r) =>
          String(r.studentId) === String(s.id) &&
          r.semester?.includes(activeSession),
      );
      return regs.length === 0;
    });
  }, [students, courseRegistrations, activeSession]);

  const coursesNoScores = useMemo(() => {
    return courses.filter((c) => {
      const courseResults = results.filter(
        (r) => String(r.courseId) === String(c.id),
      );
      return courseResults.length === 0;
    });
  }, [courses, results]);

  const pendingHOD = useMemo(
    () => results.filter((r) => r.status === "submitted"),
    [results],
  );
  const pendingDean = useMemo(
    () => results.filter((r) => r.status === "hod_approved"),
    [results],
  );
  const pendingRegistrar = useMemo(
    () => results.filter((r) => r.status === "dean_approved"),
    [results],
  );

  const spilloverStudents = useMemo(() => {
    return students.filter((s) => {
      const dept = getStudentDepartment(s, departments);
      const deptId = dept ? String(dept.id) : "all";
      const req =
        graduationRequirements.find((r) => r.departmentId === deptId) ??
        graduationRequirements.find((r) => r.departmentId === "all") ??
        null;
      const status = getSpilloverStatus(s, req);
      return status.isSpillover;
    });
  }, [students, departments, graduationRequirements]);

  const unknownFaculty = useMemo(() => {
    return students.filter((s) => {
      const dept = getStudentDepartment(s, departments);
      if (!dept) return true;
      const fac = getStudentFaculty(s, departments, faculties);
      return !fac;
    });
  }, [students, departments, faculties]);

  const alerts = [
    {
      id: "no_courses",
      label: "Students with no courses registered",
      count: noCoursesRegistered.length,
      session: activeSession ? `(${activeSession})` : "",
    },
    {
      id: "no_scores",
      label: "Courses with no scores entered",
      count: coursesNoScores.length,
      session: "",
    },
    {
      id: "pending_hod",
      label: "Pending HOD approval",
      count: pendingHOD.length,
      session: "",
    },
    {
      id: "pending_dean",
      label: "Pending Dean approval",
      count: pendingDean.length,
      session: "",
    },
    {
      id: "pending_registrar",
      label: "Pending Registrar publication",
      count: pendingRegistrar.length,
      session: "",
    },
    {
      id: "spillover",
      label: "Spillover students",
      count: spilloverStudents.length,
      session: "",
    },
    {
      id: "unknown_faculty",
      label: "Students with unknown/missing faculty",
      count: unknownFaculty.length,
      session: "",
    },
  ];

  const totalAlerts = alerts.reduce((sum, a) => sum + a.count, 0);

  function getViewData() {
    switch (viewPanel) {
      case "no_courses":
        return noCoursesRegistered;
      case "spillover":
        return spilloverStudents;
      case "unknown_faculty":
        return unknownFaculty;
      default:
        return [];
    }
  }

  const viewData = getViewData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          System Health Dashboard
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-time data integrity and workflow status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Users className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{students.length}</p>
          <p className="text-xs text-muted-foreground">Total Students</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Users className="w-6 h-6 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold">{staffMembers.length}</p>
          <p className="text-xs text-muted-foreground">Total Staff</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <BookOpen className="w-6 h-6 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold">{courses.length}</p>
          <p className="text-xs text-muted-foreground">Total Courses</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Activity className="w-6 h-6 text-warning mx-auto mb-1" />
          <p className="text-2xl font-bold">{departments.length}</p>
          <p className="text-xs text-muted-foreground">Departments</p>
        </div>
      </div>

      {/* Alert Panel */}
      {totalAlerts === 0 ? (
        <div
          className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-5"
          data-ocid="health.success_state"
        >
          <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
          <div>
            <p className="font-semibold text-success">All Clear</p>
            <p className="text-sm text-muted-foreground">
              No data integrity issues detected.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            {totalAlerts} Alert{totalAlerts !== 1 ? "s" : ""} Found
          </h3>
          {alerts
            .filter((a) => a.count > 0)
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/5 px-4 py-3"
                data-ocid={`health.${a.id}.panel`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {a.label}{" "}
                      {a.session && (
                        <span className="text-muted-foreground">
                          {a.session}
                        </span>
                      )}
                    </p>
                    <Badge variant="destructive" className="text-xs mt-0.5">
                      {a.count}
                    </Badge>
                  </div>
                </div>
                {["no_courses", "spillover", "unknown_faculty"].includes(
                  a.id,
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid={`health.${a.id}.button`}
                    onClick={() =>
                      setViewPanel(viewPanel === a.id ? null : a.id)
                    }
                  >
                    {viewPanel === a.id ? "Hide" : "View"}
                  </Button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Detail Panel */}
      {viewPanel &&
        ["no_courses", "spillover", "unknown_faculty"].includes(viewPanel) && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border text-sm font-semibold">
              {alerts.find((a) => a.id === viewPanel)?.label}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/No</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-6"
                    >
                      No records.
                    </TableCell>
                  </TableRow>
                ) : (
                  viewData.map((s, i) => {
                    const dept = getStudentDepartment(s, departments);
                    return (
                      <TableRow
                        key={String(s.id)}
                        data-ocid={`health.${viewPanel}.item.${i + 1}`}
                      >
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.matricNumber}
                        </TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{dept?.name ?? "Unknown"}</TableCell>
                        <TableCell>{String(s.level)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {s.status ?? "Active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  );
}
