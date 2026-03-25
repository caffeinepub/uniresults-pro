import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BarChart2,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Download,
  MessageSquare,
  RefreshCw,
  ScrollText,
  Users,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useContext, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { TabContext } from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { calcGradePoint, useApp } from "../context/AppContext";
import type { GraduationApplication } from "../context/AppContext";
import type { ExtendedResult, GradeAppeal } from "../context/AppContext";
import BiometricAttendanceTab from "./tabs/BiometricAttendanceTab";
import CourseAssignmentsTab from "./tabs/CourseAssignmentsTab";
import { CourseFeedbackView } from "./tabs/CourseEvaluationTab";
import { HODTransferTab } from "./tabs/DepartmentTransferTab";
import DeptReportTab from "./tabs/DeptReportTab";
import DeptResultsTab from "./tabs/DeptResultsTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import GPATrendChart from "./tabs/GPATrendChart";
import LecturerPerformanceTab from "./tabs/LecturerPerformanceTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import ScoreEntrySheetTab from "./tabs/ScoreEntrySheetTab";
import SenateReportTab from "./tabs/SenateReportTab";

export default function HODDashboard() {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const { currentUser: hodUser } = useApp();

  const quickActions = [
    { label: "Approve Results", tab: "approvals", icon: CheckCircle },
    { label: "Score Sheet", tab: "score_sheet", icon: ClipboardList },
    { label: "View Analytics", tab: "analytics", icon: BarChart2 },
    { label: "Dept Report", tab: "dept_report", icon: ClipboardList },
    { label: "Senate Report", tab: "senate_report", icon: ScrollText },
    { label: "Dept. Results", tab: "dept_results", icon: ClipboardList },
  ];

  let content: React.ReactNode;
  if (activeTab === "approvals") content = <ApprovalsTab />;
  else if (activeTab === "analytics") content = <AnalyticsTab />;
  else if (activeTab === "carryovers") content = <CarryoversTab />;
  else if (activeTab === "courses") content = <HODCoursesTab />;
  else if (activeTab === "results") content = <HODResultsTab />;
  else if (activeTab === "appeals") content = <HODAppealsTab />;
  else if (activeTab === "graduation") content = <HODGraduationTab />;
  else if (activeTab === "dept_report") content = <DeptReportTab />;
  else if (activeTab === "course_assignments")
    content = <CourseAssignmentsTab />;
  else if (activeTab === "exam_schedule") content = <HodExamScheduleTab />;
  else if (activeTab === "course_feedback") content = <HodCourseFeedbackTab />;
  else if (activeTab === "lecturer_performance")
    content = <LecturerPerformanceTab />;
  else if (activeTab === "hod_transfers") content = <HODTransferTab />;
  else if (activeTab === "biometric") content = <BiometricAttendanceTab />;
  else if (activeTab === "senate_report")
    content = (
      <SenateReportTab
        userRole="HOD"
        hodDepartmentId={(hodUser as any)?.departmentId}
      />
    );
  else if (activeTab === "dept_results")
    content = <DeptResultsTab userRole="HOD" />;
  else if (activeTab === "score_sheet") content = <ScoreEntrySheetTab />;
  else content = <OverviewTab />;

  return (
    <>
      <NoticeBoardPanel userRole={hodUser?.role ?? "HOD"} />
      <div className="flex flex-wrap gap-2 pb-3 pt-1 border-b border-border/50 mb-4 no-print">
        {quickActions.map((a) => (
          <button
            key={a.tab}
            type="button"
            data-ocid={`hod_quick.${a.tab}.button`}
            onClick={() => setActiveTab(a.tab)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${activeTab === a.tab ? "bg-primary/10 text-primary border-primary/30" : ""}`}
          >
            <a.icon className="w-3 h-3" />
            {a.label}
          </button>
        ))}
      </div>
      {content}
    </>
  );
}

function OverviewTab() {
  const { currentUser, departments, courses, students, results } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);
  const deptStudents = students.filter((s) => s.departmentId === deptId);
  const pending = results.filter(
    (r) =>
      r.status === "submitted" && deptCourses.some((c) => c.id === r.courseId),
  );
  const dept = departments.find((d) => d.id === deptId);
  const published = results.filter(
    (r) =>
      r.status === "published" && deptCourses.some((c) => c.id === r.courseId),
  );
  const carryovers = results.filter(
    (r) =>
      r.grade === "F" &&
      (r.status === "published" || r.status === "approved") &&
      deptCourses.some((c) => c.id === r.courseId),
  );
  const gradeData = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: published.filter((r) => r.grade === g).length,
  }));

  const workflowStatuses = [
    "draft",
    "submitted",
    "hod_approved",
    "dean_approved",
    "published",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {dept?.name ?? "Department"}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Approval Workflow
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {["Lecturer", "HOD", "Dean", "Registrar"].map((step, i, arr) => (
            <span key={step} className="inline-flex items-center gap-1">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {step}
              </span>
              {i < arr.length - 1 && (
                <span className="text-muted-foreground text-sm">→</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={deptStudents.length}
          icon={Users}
        />
        <StatCard
          label="Total Courses"
          value={deptCourses.length}
          icon={BookOpen}
        />
        <StatCard
          label="Pending Approvals"
          value={pending.length}
          icon={ClipboardList}
          color="text-warning"
        />
        <StatCard
          label="Carry-overs"
          value={carryovers.length}
          icon={RefreshCw}
          color="text-destructive"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-4">
            Grade Distribution (Published)
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.93 0.01 250)"
              />
              <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="oklch(0.29 0.09 258)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-3">Results by Stage</h2>
          <div className="space-y-2">
            {workflowStatuses.map((s) => (
              <div
                key={s}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <StatusBadge status={s} />
                <span className="text-sm font-medium">
                  {
                    results.filter(
                      (r) =>
                        r.status === s &&
                        deptCourses.some((c) => c.id === r.courseId),
                    ).length
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab() {
  const {
    currentUser,
    courses,
    students,
    results,
    updateResultStatus,
    amendmentRequests,
    updateAmendmentStatus,
    rejectAmendment,
  } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);
  const pending = results.filter(
    (r) =>
      r.status === "submitted" && deptCourses.some((c) => c.id === r.courseId),
  ) as ExtendedResult[];

  const pendingAmendments = amendmentRequests.filter(
    (a) =>
      a.status === "pending_hod" &&
      deptCourses.some((c) => c.id === a.courseId),
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<ExtendedResult | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const allSelected = pending.length > 0 && selected.size === pending.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((r) => String(r.id))));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApprove(id: bigint) {
    updateResultStatus(id, "hod_approved");
    toast.success("Result approved — forwarded to Dean");
  }

  function handleBatchApprove() {
    let count = 0;
    for (const idStr of selected) {
      const r = pending.find((p) => String(p.id) === idStr);
      if (r) {
        updateResultStatus(r.id, "hod_approved");
        count++;
      }
    }
    setSelected(new Set());
    toast.success(
      `${count} result${count !== 1 ? "s" : ""} approved — forwarded to Dean`,
    );
  }

  function openRejectDialog(r: ExtendedResult) {
    setRejectTarget(r);
    setRejectionReason("");
  }

  function confirmReject() {
    if (!rejectTarget) return;
    updateResultStatus(rejectTarget.id, "draft", rejectionReason || undefined);
    toast.error("Result rejected — returned to Lecturer");
    setRejectTarget(null);
    setRejectionReason("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Pending Approvals</h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} result{pending.length !== 1 ? "s" : ""} awaiting
            HOD approval
          </p>
        </div>
        {someSelected && (
          <Button
            data-ocid="approvals.primary_button"
            size="sm"
            onClick={handleBatchApprove}
            className="bg-success/10 text-success hover:bg-success/20 border-0 shrink-0"
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Approve {selected.size} Selected → Dean
          </Button>
        )}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  data-ocid="approvals.toggle"
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>CA</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="approvals.empty_state"
                >
                  No pending approvals
                </TableCell>
              </TableRow>
            )}
            {pending.map((r, i) => {
              const student = students.find((s) => s.id === r.studentId);
              const course = courses.find((c) => c.id === r.courseId);
              const idStr = String(r.id);
              return (
                <TableRow
                  key={idStr}
                  data-ocid={`approvals.item.${i + 1}`}
                  className={selected.has(idStr) ? "bg-primary/5" : ""}
                >
                  <TableCell>
                    <Checkbox
                      data-ocid={`approvals.checkbox.${i + 1}`}
                      checked={selected.has(idStr)}
                      onCheckedChange={() => toggleOne(idStr)}
                      aria-label={`Select result ${i + 1}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course?.code ?? "-"}
                  </TableCell>
                  <TableCell>{r.caScore}</TableCell>
                  <TableCell>{r.examScore}</TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell className="font-bold">{r.grade}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.remarks}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        data-ocid={`approvals.confirm_button.${i + 1}`}
                        size="sm"
                        onClick={() => handleApprove(r.id)}
                        className="h-7 text-xs bg-success/10 text-success hover:bg-success/20 border-0"
                      >
                        Approve → Dean
                      </Button>
                      <Button
                        data-ocid={`approvals.delete_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => openRejectDialog(r)}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Amendment Requests Section */}
      {pendingAmendments.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Amendment Requests</h2>
            <p className="text-sm text-muted-foreground">
              {pendingAmendments.length} pending amendment
              {pendingAmendments.length !== 1 ? "s" : ""} awaiting HOD review
            </p>
          </div>
          <div className="bg-card rounded-xl border border-amber-200 shadow-xs">
            <div className="p-3 bg-amber-50 border-b border-amber-200 rounded-t-xl">
              <p className="text-xs font-semibold text-amber-700">
                ⚠️ Score Amendment Requests
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Original CA/Exam</TableHead>
                  <TableHead>New CA/Exam</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAmendments.map((a, i) => {
                  const student = students.find((s) => s.id === a.studentId);
                  const course = courses.find((c) => c.id === a.courseId);
                  return (
                    <TableRow
                      key={String(a.id)}
                      data-ocid={`amendments.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {student?.name ?? "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {course?.code ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="line-through text-muted-foreground">
                          {a.originalCa}/{a.originalExam}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-amber-700">
                        {a.newCa}/{a.newExam} (Total: {a.newCa + a.newExam})
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {a.reason}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.lecturerName}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            data-ocid={`amendments.confirm_button.${i + 1}`}
                            size="sm"
                            onClick={() =>
                              updateAmendmentStatus(a.id, "pending_dean")
                            }
                            className="h-7 text-xs bg-success/10 text-success hover:bg-success/20 border-0"
                          >
                            Approve → Dean
                          </Button>
                          <Button
                            data-ocid={`amendments.delete_button.${i + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() => rejectAmendment(a.id)}
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      >
        <DialogContent data-ocid="approvals.dialog">
          <DialogHeader>
            <DialogTitle>Reject Result</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This result will be returned to the Lecturer as a draft. You may
              optionally provide a reason.
            </p>
            <div>
              <label
                className="text-sm font-medium mb-1 block"
                htmlFor="rejection-reason"
              >
                Rejection Reason{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Textarea
                id="rejection-reason"
                data-ocid="approvals.textarea"
                placeholder="e.g. Scores appear inconsistent, please review and resubmit."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="approvals.cancel_button"
              variant="outline"
              onClick={() => setRejectTarget(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="approvals.confirm_button"
              variant="destructive"
              onClick={confirmReject}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CarryoversTab() {
  const { currentUser, courses, students, results } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);

  const carryovers = results.filter(
    (r) =>
      r.grade === "F" &&
      (r.status === "published" || r.status === "approved") &&
      deptCourses.some((c) => c.id === r.courseId),
  ) as ExtendedResult[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Carry-over Students</h1>
        <p className="text-sm text-muted-foreground">
          {carryovers.length} carry-over result
          {carryovers.length !== 1 ? "s" : ""} in this department
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Course Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Total Score</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carryovers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="carryovers.empty_state"
                >
                  <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
                  No carry-over students in this department
                </TableCell>
              </TableRow>
            )}
            {carryovers.map((r, i) => {
              const student = students.find((s) => s.id === r.studentId);
              const course = courses.find((c) => c.id === r.courseId);
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`carryovers.item.${i + 1}`}
                  className="bg-destructive/5"
                >
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {student?.matricNumber ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold">
                    {course?.code ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {course?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {course?.semester ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell>
                    <span className="font-bold text-destructive">
                      {r.grade}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface StudentStat {
  id: bigint;
  name: string;
  matric: string;
  level: number;
  resultCount: number;
  avgScore: number;
  passes: number;
  fails: number;
  estGpa: number;
}

interface LevelStat {
  level: number;
  studentCount: number;
  resultCount: number;
  avgScore: number;
  passRate: number;
}

interface AtRiskEntry {
  student: ReturnType<typeof useApp>["students"][0];
  failedCourses: { code: string; total: number }[];
}

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#a855f7",
  F: "#ef4444",
};

function AnalyticsTab() {
  const { currentUser, courses, students, results, attendanceSessions } =
    useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);
  const deptStudents = students.filter((s) => s.departmentId === deptId);
  const deptResults = results.filter((r) =>
    deptCourses.some((c) => c.id === r.courseId),
  ) as ExtendedResult[];

  const [sortKey, setSortKey] = useState<
    "name" | "avgScore" | "gpa" | "passes" | "fails"
  >("name");
  const [sortAsc, setSortAsc] = useState(true);

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const totalResults = deptResults.length;
  const passCount = deptResults.filter((r) => r.grade !== "F").length;
  const failCount = totalResults - passCount;
  const passRate =
    totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;
  const avgScore =
    totalResults > 0
      ? Math.round(
          deptResults.reduce((sum, r) => sum + r.totalScore, 0) / totalResults,
        )
      : 0;

  const courseStats = deptCourses.map((c) => {
    const cResults = deptResults.filter((r) => r.courseId === c.id);
    const cPass = cResults.filter((r) => r.grade !== "F").length;
    const cAvg =
      cResults.length > 0
        ? Math.round(
            cResults.reduce((sum, r) => sum + r.totalScore, 0) /
              cResults.length,
          )
        : 0;
    const cPassRate =
      cResults.length > 0 ? Math.round((cPass / cResults.length) * 100) : 0;
    return {
      code: c.code,
      name: c.name,
      results: cResults.length,
      avgScore: cAvg,
      passRate: cPassRate,
      gradeA: cResults.filter((r) => r.grade === "A").length,
      gradeB: cResults.filter((r) => r.grade === "B").length,
      gradeC: cResults.filter((r) => r.grade === "C").length,
      gradeD: cResults.filter((r) => r.grade === "D").length,
      gradeE: cResults.filter((r) => r.grade === "E").length,
      gradeF: cResults.filter((r) => r.grade === "F").length,
    };
  });

  const gradeDistribution = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: deptResults.filter((r) => r.grade === g).length,
  }));

  const avgScorePerCourse = courseStats.map((cs) => ({
    name: cs.code,
    avgScore: cs.avgScore,
    passRate: cs.passRate,
  }));

  const studentStats = useMemo(() => {
    return deptStudents
      .map((s) => {
        const sResults = deptResults.filter((r) => r.studentId === s.id);
        if (sResults.length === 0) return null;
        const avgTotal =
          Math.round(
            (sResults.reduce((sum, r) => sum + r.totalScore, 0) /
              sResults.length) *
              10,
          ) / 10;
        const passes = sResults.filter((r) => r.grade !== "F").length;
        const fails = sResults.length - passes;
        const estGpa =
          Math.round(
            (sResults.reduce(
              (sum, r) => sum + calcGradePoint(r.totalScore).gradePoint,
              0,
            ) /
              sResults.length) *
              100,
          ) / 100;
        return {
          id: s.id,
          name: s.name,
          matric: s.matricNumber,
          level: Number(s.level),
          resultCount: sResults.length,
          avgScore: avgTotal,
          passes,
          fails,
          estGpa,
        };
      })
      .filter((x): x is StudentStat => x !== null);
  }, [deptStudents, deptResults]);

  const sortedStudentStats = useMemo(() => {
    return [...studentStats].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      else if (sortKey === "avgScore") diff = a.avgScore - b.avgScore;
      else if (sortKey === "gpa") diff = a.estGpa - b.estGpa;
      else if (sortKey === "passes") diff = a.passes - b.passes;
      else if (sortKey === "fails") diff = a.fails - b.fails;
      return sortAsc ? diff : -diff;
    });
  }, [studentStats, sortKey, sortAsc]);

  const atRiskStudents = useMemo(() => {
    return deptStudents
      .map((s) => {
        const failedResults = deptResults.filter(
          (r) => r.studentId === s.id && r.grade === "F",
        );
        if (failedResults.length === 0) return null;
        return {
          student: s,
          failedCourses: failedResults.map((r) => {
            const course = courses.find((c) => c.id === r.courseId);
            return { code: course?.code ?? "?", total: r.totalScore };
          }),
        };
      })
      .filter((x): x is AtRiskEntry => x !== null);
  }, [deptStudents, deptResults, courses]);

  const levelBreakdown = useMemo(() => {
    const levels = [100, 200, 300, 400, 500];
    return levels
      .map((lvl) => {
        const lvlStudents = deptStudents.filter((s) => Number(s.level) === lvl);
        if (lvlStudents.length === 0) return null;
        const lvlResults = deptResults.filter((r) =>
          lvlStudents.some((s) => s.id === r.studentId),
        );
        const lvlPass = lvlResults.filter((r) => r.grade !== "F").length;
        const lvlAvg =
          lvlResults.length > 0
            ? Math.round(
                lvlResults.reduce((sum, r) => sum + r.totalScore, 0) /
                  lvlResults.length,
              )
            : 0;
        const lvlPassRate =
          lvlResults.length > 0
            ? Math.round((lvlPass / lvlResults.length) * 100)
            : 0;
        return {
          level: lvl,
          studentCount: lvlStudents.length,
          resultCount: lvlResults.length,
          avgScore: lvlAvg,
          passRate: lvlPassRate,
        };
      })
      .filter((x): x is LevelStat => x !== null);
  }, [deptStudents, deptResults]);

  function handleDownloadReport() {
    const lines: string[] = [];
    lines.push("=== COURSE-LEVEL STATS ===");
    lines.push("Code,Course Name,Results,Avg Score,Pass Rate,A,B,C,D,E,F");
    for (const cs of courseStats) {
      lines.push(
        [
          cs.code,
          `"${cs.name}"`,
          cs.results,
          cs.avgScore,
          `${cs.passRate}%`,
          cs.gradeA,
          cs.gradeB,
          cs.gradeC,
          cs.gradeD,
          cs.gradeE,
          cs.gradeF,
        ].join(","),
      );
    }
    lines.push("");
    lines.push("=== STUDENT-LEVEL STATS ===");
    lines.push("Name,Matric,Level,Results,Avg Score,Passes,Fails,Est GPA");
    for (const ss of studentStats) {
      lines.push(
        [
          `"${ss.name}"`,
          ss.matric,
          ss.level,
          ss.resultCount,
          ss.avgScore,
          ss.passes,
          ss.fails,
          ss.estGpa.toFixed(2),
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "department_analytics_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics report downloaded");
  }

  function sortIcon(key: typeof sortKey) {
    if (sortKey !== key) return " ↕";
    return sortAsc ? " ↑" : " ↓";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Department Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance overview for all courses in your department
          </p>
        </div>
        <Button
          data-ocid="analytics.download_button"
          size="sm"
          variant="outline"
          onClick={handleDownloadReport}
          className="gap-1.5 shrink-0"
        >
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Results</p>
          <p className="text-3xl font-bold">{totalResults}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
          <p className="text-3xl font-bold">{avgScore}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Pass Rate</p>
          <p className="text-3xl font-bold text-success">{passRate}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Failure Count</p>
          <p className="text-3xl font-bold text-destructive">{failCount}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">Grade Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.93 0.01 250)"
              />
              <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {gradeDistribution.map((entry) => (
                  <Cell
                    key={entry.grade}
                    fill={GRADE_COLORS[entry.grade] ?? "#94a3b8"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4">
            Avg Score &amp; Pass Rate by Course
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={avgScorePerCourse}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.93 0.01 250)"
              />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="avgScore"
                name="Avg Score"
                fill="oklch(0.61 0.15 250)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="passRate"
                name="Pass %"
                fill="oklch(0.70 0.15 150)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Course-Level Breakdown</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Pass Rate</TableHead>
              <TableHead>A</TableHead>
              <TableHead>B</TableHead>
              <TableHead>C</TableHead>
              <TableHead>D</TableHead>
              <TableHead>F</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courseStats.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                >
                  No results data available
                </TableCell>
              </TableRow>
            )}
            {courseStats.map((cs, i) => (
              <TableRow key={cs.code} data-ocid={`analytics.item.${i + 1}`}>
                <TableCell className="font-mono font-medium">
                  {cs.code}
                </TableCell>
                <TableCell className="text-sm">{cs.name}</TableCell>
                <TableCell>{cs.results}</TableCell>
                <TableCell className="font-medium">{cs.avgScore}</TableCell>
                <TableCell>
                  <span
                    className={`font-semibold ${
                      cs.passRate >= 70
                        ? "text-success"
                        : cs.passRate >= 50
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {cs.passRate}%
                  </span>
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  {cs.gradeA}
                </TableCell>
                <TableCell className="text-blue-600 font-medium">
                  {cs.gradeB}
                </TableCell>
                <TableCell className="text-amber-600 font-medium">
                  {cs.gradeC}
                </TableCell>
                <TableCell className="text-orange-600 font-medium">
                  {cs.gradeD}
                </TableCell>
                <TableCell className="text-destructive font-medium">
                  {cs.gradeF}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Student Performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click column headers to sort
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("name")}
              >
                Student Name{sortIcon("name")}
              </TableHead>
              <TableHead>Matric</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Results</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("avgScore")}
              >
                Avg Score{sortIcon("avgScore")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("passes")}
              >
                Passes{sortIcon("passes")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("fails")}
              >
                Fails{sortIcon("fails")}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort("gpa")}
              >
                Est. GPA{sortIcon("gpa")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudentStats.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="analytics.student.empty_state"
                >
                  No student results available
                </TableCell>
              </TableRow>
            )}
            {sortedStudentStats.map((ss, i) => (
              <TableRow
                key={String(ss.id)}
                data-ocid={`analytics.row.${i + 1}`}
              >
                <TableCell className="font-medium">{ss.name}</TableCell>
                <TableCell className="font-mono text-xs">{ss.matric}</TableCell>
                <TableCell>{ss.level}</TableCell>
                <TableCell>{ss.resultCount}</TableCell>
                <TableCell className="font-medium">{ss.avgScore}</TableCell>
                <TableCell className="text-success font-medium">
                  {ss.passes}
                </TableCell>
                <TableCell className="text-destructive font-medium">
                  {ss.fails}
                </TableCell>
                <TableCell>
                  <span
                    className={`font-bold ${
                      ss.estGpa >= 3.5
                        ? "text-success"
                        : ss.estGpa >= 2.0
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {ss.estGpa.toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold">At-Risk Students</h2>
        </div>
        {atRiskStudents.length === 0 ? (
          <div
            className="p-6 text-center"
            data-ocid="analytics.at_risk.empty_state"
          >
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-success font-medium text-sm">
              All students are on track
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No F grades recorded in the department
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {atRiskStudents.map((entry, i) => (
              <div
                key={String(entry.student.id)}
                className="p-4 flex items-start gap-4"
                data-ocid={`analytics.at_risk.item.${i + 1}`}
              >
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{entry.student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.student.matricNumber} &middot; Level{" "}
                    {String(entry.student.level)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.failedCourses.map((fc) => (
                      <span
                        key={fc.code}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"
                      >
                        {fc.code} — {fc.total}/100
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Level Breakdown</h2>
        </div>
        {levelBreakdown.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            No level data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Results</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levelBreakdown.map((lb, i) => (
                <TableRow
                  key={lb.level}
                  data-ocid={`analytics.level.item.${i + 1}`}
                >
                  <TableCell className="font-bold">{lb.level}L</TableCell>
                  <TableCell>{lb.studentCount}</TableCell>
                  <TableCell>{lb.resultCount}</TableCell>
                  <TableCell className="font-medium">{lb.avgScore}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${
                        lb.passRate >= 70
                          ? "text-success"
                          : lb.passRate >= 50
                            ? "text-warning"
                            : "text-destructive"
                      }`}
                    >
                      {lb.passRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">
            Attendance Summary per Course
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Courses below 75% avg attendance are highlighted
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead className="text-center">Sessions</TableHead>
              <TableHead className="text-center">Avg Attendance</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptCourses.map((c, i) => {
              const sessions = attendanceSessions.filter(
                (s) => s.courseId === c.id,
              );
              const avgPct =
                sessions.length === 0
                  ? null
                  : Math.round(
                      sessions.reduce((sum, s) => {
                        const pct =
                          s.records.length === 0
                            ? 0
                            : (s.records.filter((r) => r.present).length /
                                s.records.length) *
                              100;
                        return sum + pct;
                      }, 0) / sessions.length,
                    );
              return (
                <TableRow
                  key={String(c.id)}
                  data-ocid={`attendance_stats.item.${i + 1}`}
                  className={
                    avgPct !== null && avgPct < 75 ? "bg-destructive/5" : ""
                  }
                >
                  <TableCell className="font-medium">
                    {c.code}{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      {c.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {sessions.length}
                  </TableCell>
                  <TableCell className="text-center">
                    {avgPct === null ? (
                      <span className="text-muted-foreground text-xs">
                        No data
                      </span>
                    ) : (
                      <span
                        className={
                          avgPct >= 75
                            ? "text-success font-semibold"
                            : "text-destructive font-semibold"
                        }
                      >
                        {avgPct}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {avgPct === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : avgPct >= 75 ? (
                      <span className="text-xs bg-success/10 text-success border border-success/20 rounded-full px-2 py-0.5 font-medium">
                        Good
                      </span>
                    ) : (
                      <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-full px-2 py-0.5 font-medium">
                        Low
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Semester Trend by Course</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Average score: First vs Second semester
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead className="text-center">First Sem Avg</TableHead>
              <TableHead className="text-center">Second Sem Avg</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptCourses.map((c, i) => {
              const cResults = deptResults.filter((r) => r.courseId === c.id);
              const firstAvg =
                c.semester === "First" && cResults.length > 0
                  ? Math.round(
                      cResults.reduce((s, r) => s + r.totalScore, 0) /
                        cResults.length,
                    )
                  : null;
              const secondAvg =
                c.semester === "Second" && cResults.length > 0
                  ? Math.round(
                      cResults.reduce((s, r) => s + r.totalScore, 0) /
                        cResults.length,
                    )
                  : null;
              return (
                <TableRow key={String(c.id)} data-ocid={`trend.item.${i + 1}`}>
                  <TableCell className="font-medium">{c.code}</TableCell>
                  <TableCell className="text-center">
                    {firstAvg !== null ? (
                      <span className="font-semibold">{firstAvg}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {secondAvg !== null ? (
                      <span className="font-semibold">{secondAvg}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {firstAvg !== null && secondAvg !== null ? (
                      <span
                        className={
                          secondAvg > firstAvg
                            ? "text-success"
                            : secondAvg < firstAvg
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {secondAvg > firstAvg
                          ? "↑ Improved"
                          : secondAvg < firstAvg
                            ? "↓ Declined"
                            : "→ Same"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Single sem
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function HODCoursesTab() {
  const { currentUser, courses, departments } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);
  const dept = departments.find((d) => d.id === deptId);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Department Courses</h1>
        <p className="text-sm text-muted-foreground">
          {dept?.name} — {deptCourses.length} courses
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Semester</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptCourses.map((c, i) => (
              <TableRow key={String(c.id)} data-ocid={`courses.item.${i + 1}`}>
                <TableCell className="font-mono font-medium">
                  {c.code}
                </TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{String(c.creditUnits)}</TableCell>
                <TableCell>{c.semester}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function HODResultsTab() {
  const { currentUser, courses, students, results } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);
  const deptResults = results.filter((r) =>
    deptCourses.some((c) => c.id === r.courseId),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">All Department Results</h1>
        <p className="text-sm text-muted-foreground">
          {deptResults.length} results
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptResults.map((r, i) => {
              const student = students.find((s) => s.id === r.studentId);
              const course = courses.find((c) => c.id === r.courseId);
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`hod_results.item.${i + 1}`}
                >
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course?.code ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell className="font-bold">{r.grade}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.remarks}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function gradeColor(grade: string) {
  if (grade === "A") return "bg-green-100 text-green-800";
  if (grade === "B") return "bg-teal-100 text-teal-800";
  if (grade === "C") return "bg-blue-100 text-blue-800";
  if (grade === "D") return "bg-yellow-100 text-yellow-800";
  if (grade === "E") return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function HODAppealsTab() {
  const { currentUser, courses, gradeAppeals, respondToAppeal } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourseIds = new Set(
    courses.filter((c) => c.departmentId === deptId).map((c) => c.id),
  );

  const pendingAppeals = gradeAppeals.filter(
    (a) => deptCourseIds.has(a.courseId) && a.status === "pending_hod",
  );
  const resolvedAppeals = gradeAppeals.filter(
    (a) =>
      deptCourseIds.has(a.courseId) &&
      (a.status === "resolved_upheld" || a.status === "resolved_revised"),
  );

  const [responseText, setResponseText] = useState<Record<string, string>>({});

  function handleResolve(appeal: GradeAppeal, action: "uphold" | "revise") {
    const response = responseText[String(appeal.id)] ?? "";
    if (!response.trim()) {
      toast.error("Please enter a response before resolving");
      return;
    }
    const newStatus: GradeAppeal["status"] =
      action === "uphold" ? "resolved_upheld" : "resolved_revised";
    respondToAppeal(appeal.id, response.trim(), newStatus);
    setResponseText((prev) => {
      const next = { ...prev };
      delete next[String(appeal.id)];
      return next;
    });
    toast.success(
      action === "uphold"
        ? "Grade upheld — appeal resolved"
        : "Revision approved — appeal resolved",
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Grade Appeals
        </h1>
        <p className="text-sm text-muted-foreground">
          Final resolution of department grade appeals
        </p>
      </div>

      {pendingAppeals.length === 0 ? (
        <div
          className="bg-card rounded-xl border border-dashed border-border p-10 text-center"
          data-ocid="hod_appeals.empty_state"
        >
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No pending grade appeals for your department
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">
            Pending Appeals ({pendingAppeals.length})
          </h2>
          {pendingAppeals.map((appeal, i) => (
            <div
              key={String(appeal.id)}
              data-ocid={`hod_appeals.item.${i + 1}`}
              className="bg-card rounded-xl border border-border p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{appeal.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {appeal.courseName} ·{" "}
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${gradeColor(appeal.originalGrade)}`}
                    >
                      {appeal.originalGrade}
                    </span>{" "}
                    · {new Date(appeal.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 border-l-2 border-border pl-2">
                <span className="font-medium">Student reason:</span>{" "}
                {appeal.reason}
              </p>
              {appeal.lecturerResponse && (
                <p className="text-xs bg-blue-50 text-blue-800 rounded p-2">
                  <span className="font-medium">Lecturer response:</span>{" "}
                  {appeal.lecturerResponse}
                </p>
              )}
              <div>
                <label
                  htmlFor={`hod-response-${String(appeal.id)}`}
                  className="text-xs font-medium text-muted-foreground mb-1 block"
                >
                  HOD Response
                </label>
                <textarea
                  id={`hod-response-${String(appeal.id)}`}
                  data-ocid={`hod_appeals.response.${i + 1}`}
                  value={responseText[String(appeal.id)] ?? ""}
                  onChange={(e) =>
                    setResponseText((prev) => ({
                      ...prev,
                      [String(appeal.id)]: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Enter your final response..."
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid={`hod_appeals.uphold_button.${i + 1}`}
                  onClick={() => handleResolve(appeal, "uphold")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Uphold Grade
                </button>
                <button
                  type="button"
                  data-ocid={`hod_appeals.revise_button.${i + 1}`}
                  onClick={() => handleResolve(appeal, "revise")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Approve Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedAppeals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Resolved ({resolvedAppeals.length})
          </h2>
          {resolvedAppeals.map((appeal, i) => (
            <div
              key={String(appeal.id)}
              data-ocid={`hod_appeals.resolved.${i + 1}`}
              className="bg-card rounded-xl border border-border p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {appeal.studentName} · {appeal.courseName}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    appeal.status === "resolved_revised"
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {appeal.status === "resolved_revised"
                    ? "Revision Approved"
                    : "Grade Upheld"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== HOD GRADUATION TAB =====================
function HODGraduationTab() {
  const {
    currentUser,
    departments,
    graduationApplications,
    updateGraduationStatus,
  } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const dept = departments.find((d) => d.id === deptId);
  const [noteOpen, setNoteOpen] = useState(false);
  const [selected, setSelected] = useState<GraduationApplication | null>(null);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const myApps = graduationApplications.filter(
    (a) => a.status === "pending_hod" && a.department === (dept?.name ?? ""),
  );

  function openAction(app: GraduationApplication, type: "approve" | "reject") {
    setSelected(app);
    setActionType(type);
    setNote("");
    setNoteOpen(true);
  }

  function confirmAction() {
    if (!selected) return;
    const newStatus: GraduationApplication["status"] =
      actionType === "approve" ? "pending_dean" : "rejected";
    updateGraduationStatus(
      selected.id,
      newStatus,
      note || undefined,
      "hodNote",
    );
    setNoteOpen(false);
    toast.success(
      actionType === "approve" ? "Forwarded to Dean" : "Application rejected",
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Graduation Applications</h1>
        <p className="text-sm text-muted-foreground">
          {myApps.length} application{myApps.length !== 1 ? "s" : ""} pending
          your review in {dept?.name}
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Matric</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Credit Check</TableHead>
              <TableHead>No F Grades</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myApps.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="hod_graduation.empty_state"
                >
                  No pending graduation applications
                </TableCell>
              </TableRow>
            )}
            {myApps.map((app, i) => (
              <TableRow
                key={String(app.id)}
                data-ocid={`hod_graduation.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell className="font-medium">{app.studentName}</TableCell>
                <TableCell className="font-mono text-sm">
                  {app.matric}
                </TableCell>
                <TableCell className="text-sm">{app.session}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${app.creditCheck ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {app.creditCheck ? "✓ Pass" : "✗ Fail"}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${app.carryoverCheck ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {app.carryoverCheck ? "✓ Clear" : "✗ Has F"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      data-ocid={`hod_graduation.confirm_button.${i + 1}`}
                      size="sm"
                      onClick={() => openAction(app, "approve")}
                      className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                    >
                      Approve → Dean
                    </Button>
                    <Button
                      data-ocid={`hod_graduation.delete_button.${i + 1}`}
                      size="sm"
                      variant="destructive"
                      onClick={() => openAction(app, "reject")}
                      className="h-7 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent data-ocid="hod_graduation.dialog">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Application"
                : "Reject Application"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Student: <strong>{selected?.studentName}</strong>
            </p>
            <label className="text-sm font-medium" htmlFor="hod-grad-note">
              HOD Note (optional)
            </label>
            <Textarea
              data-ocid="hod_graduation.textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="hod_graduation.cancel_button"
              variant="outline"
              onClick={() => setNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="hod_graduation.confirm_button.1"
              onClick={confirmAction}
              className={
                actionType === "approve"
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              }
            >
              {actionType === "approve"
                ? "Approve & Forward"
                : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HodExamScheduleTab() {
  const { currentUser, courses } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourseCodes = courses
    .filter((c) => c.departmentId === deptId)
    .map((c) => c.code);
  return (
    <ExamScheduleTab filterCourseCodes={deptCourseCodes} isAdmin={false} />
  );
}

function HodCourseFeedbackTab() {
  const { currentUser, courses } = useApp();
  const deptId = currentUser?.departmentId ?? BigInt(1);
  return <CourseFeedbackView departmentIds={[deptId]} courses={courses} />;
}
