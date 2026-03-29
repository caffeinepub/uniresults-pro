import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  BookOpen,
  Building2,
  CheckCircle,
  ClipboardList,
  FileText,
  FileUp,
  ScrollText,
  Users,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useContext, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { InstitutionTypeBanner } from "../components/InstitutionTypeBanner";
import { TabContext } from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useApp } from "../context/AppContext";
import type { GraduationApplication } from "../context/AppContext";
import { useInstitutionConfig } from "../hooks/useInstitutionConfig";
import BiometricAttendanceTab from "./tabs/BiometricAttendanceTab";
import BulkRegistrationTab from "./tabs/BulkRegistrationTab";
import CarryoverReportTab from "./tabs/CarryoverReportTab";
import CombinedResultsTab from "./tabs/CombinedResultsTab";
import { CourseFeedbackView } from "./tabs/CourseEvaluationTab";
import DeansListTab from "./tabs/DeansListTab";
import DeptResultsTab from "./tabs/DeptResultsTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import FacultyCollationTab from "./tabs/FacultyCollationTab";
import FacultyReportTab from "./tabs/FacultyReportTab";
import GradeSheetTab from "./tabs/GradeSheetTab";
import JambAdmissionScannerTab from "./tabs/JambAdmissionScannerTab";
import MissingResultsTab from "./tabs/MissingResultsTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import PassFailGraduatingTab from "./tabs/PassFailGraduatingTab";
import ResultsProcessingTab from "./tabs/ResultsProcessingTab";
import ScoreEntrySheetTab from "./tabs/ScoreEntrySheetTab";
import SenateReportTab from "./tabs/SenateReportTab";
import StudentProfileModal from "./tabs/StudentProfileModal";
import SupplementaryExamsTab from "./tabs/SupplementaryExamsTab";

export default function DeanDashboard() {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const _instConfig = useInstitutionConfig();

  const allQuickActions = [
    { label: "Faculty Report", tab: "faculty_report", icon: FileText },
    { label: "Score Sheet", tab: "score_sheet", icon: FileText },
    { label: "Results Pipeline", tab: "results_processing", icon: FileText },
    { label: "Approve Results", tab: "approvals", icon: CheckCircle },
    { label: "Senate Report", tab: "senate_report", icon: ScrollText },
    { label: "Dept. Results", tab: "dept_results", icon: FileText },
    { label: "Students", tab: "students", icon: Users },
    { label: "Bulk Reg", tab: "bulkReg", icon: FileUp },
    {
      label: "JAMB Import",
      tab: "jamb_import",
      icon: FileUp,
      show: _instConfig.showJAMBImport,
    },
    { label: "Faculty Collation", tab: "faculty_collation", icon: FileText },
    { label: "Combined Results", tab: "combined_results", icon: FileText },
  ];

  const quickActions = allQuickActions.filter((a) => a.show !== false);

  let view: React.ReactNode;
  if (activeTab === "approvals") view = <ApprovalsTab />;
  else if (activeTab === "departments") view = <DepartmentsTab />;
  else if (activeTab === "results") view = <AllResultsTab />;
  else if (activeTab === "graduation") view = <DeanGraduationTab />;
  else if (activeTab === "faculty_report") view = <FacultyReportTab />;
  else if (activeTab === "exam_schedule") view = <DeanExamScheduleTab />;
  else if (activeTab === "course_feedback") view = <DeanCourseFeedbackTab />;
  else if (activeTab === "biometric") view = <BiometricAttendanceTab />;
  else if (activeTab === "senate_report")
    view = <SenateReportTab userRole="Dean" />;
  else if (activeTab === "dept_results")
    view = <DeptResultsTab userRole="Dean" />;
  else if (activeTab === "score_sheet")
    view = <ScoreEntrySheetTab readonly={true} />;
  else if (activeTab === "results_processing")
    view = <ResultsProcessingTab userRole="Dean" />;
  else if (activeTab === "students") view = <DeanStudentsTab />;
  else if (activeTab === "bulkReg") view = <BulkRegistrationTab />;
  else if (activeTab === "jamb_import") view = <JambAdmissionScannerTab />;
  else if (activeTab === "supplementary") view = <SupplementaryExamsTab />;
  else if (activeTab === "missing_results") view = <MissingResultsTab />;
  else if (activeTab === "deans_list") view = <DeansListTab />;
  else if (activeTab === "carryover_report") view = <CarryoverReportTab />;
  else if (activeTab === "grade_sheet") view = <GradeSheetTab />;
  else if (activeTab === "pass_fail_list") view = <PassFailGraduatingTab />;
  else if (activeTab === "faculty_collation")
    view = <FacultyCollationTab userRole="Dean" />;
  else if (activeTab === "combined_results") view = <CombinedResultsTab />;
  else view = <OverviewTab />;

  return (
    <>
      <NoticeBoardPanel userRole="Dean" />
      <div className="flex items-center gap-2 mb-2 no-print">
        <InstitutionTypeBanner />
      </div>
      <div className="flex flex-wrap gap-2 pb-3 pt-1 border-b border-border/50 mb-4 no-print">
        {quickActions.map((a) => (
          <button
            key={a.tab}
            type="button"
            data-ocid={`dean_quick.${a.tab}.button`}
            onClick={() => setActiveTab(a.tab)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${activeTab === a.tab ? "bg-primary/10 text-primary border-primary/30" : ""}`}
          >
            <a.icon className="w-3 h-3" />
            {a.label}
          </button>
        ))}
      </div>
      {view}
    </>
  );
}

function OverviewTab() {
  const { departments, courses, students, results } = useApp();
  const hodApproved = results.filter((r) => r.status === "hod_approved").length;
  const published = results.filter((r) => r.status === "published").length;

  const gradeData = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
  }));

  const deptData = departments.map((dept) => {
    const deptStudents = students.filter(
      (s) => s.departmentId === dept.id,
    ).length;
    const deptResults = results.filter((r) => {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      return course?.departmentId === dept.id;
    });
    const avgScore =
      deptResults.length > 0
        ? deptResults.reduce((sum, r) => sum + r.totalScore, 0) /
          deptResults.length
        : 0;
    return {
      name: dept.name.split(" ")[0],
      students: deptStudents,
      avgScore: Math.round(avgScore),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dean's Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Faculty of Engineering &amp; Sciences
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Approval Workflow
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {["Lecturer", "HOD", "Dean", "Registrar"].map((step, i, arr) => (
            <span key={step} className="inline-flex items-center gap-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  step === "Dean"
                    ? "bg-violet-500/20 text-violet-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
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
        <StatCard label="Total Students" value={students.length} icon={Users} />
        <StatCard
          label="Total Courses"
          value={courses.length}
          icon={BookOpen}
        />
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building2}
        />
        <StatCard
          label="Pending Dean Approval"
          value={hodApproved}
          icon={ClipboardList}
          color="text-warning"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-4">
            Faculty Grade Distribution
          </h2>
          <ResponsiveContainer width="100%" height={200}>
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
          <h2 className="text-sm font-semibold mb-4">Department Comparison</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.93 0.01 250)"
              />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="students"
                name="Students"
                fill="oklch(0.61 0.15 250)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="avgScore"
                name="Avg Score"
                fill="oklch(0.70 0.15 150)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <p className="text-xs text-muted-foreground mb-1">
            Awaiting Dean Approval (HOD Approved)
          </p>
          <p className="text-3xl font-bold text-warning">{hodApproved}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <p className="text-xs text-muted-foreground mb-1">
            Published Results
          </p>
          <p className="text-3xl font-bold text-success">{published}</p>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab() {
  const {
    results,
    courses,
    students,
    updateResultStatus,
    amendmentRequests,
    updateAmendmentStatus,
    rejectAmendment,
  } = useApp();
  const pending = results.filter((r) => r.status === "hod_approved");
  const pendingAmendments = amendmentRequests.filter(
    (a) => a.status === "pending_dean",
  );

  function handleApprove(id: bigint) {
    updateResultStatus(id, "dean_approved");
    toast.success("Result approved by Dean — forwarded to Registrar");
  }

  function handleReject(id: bigint) {
    updateResultStatus(id, "submitted");
    toast.error("Result returned to HOD for review");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Faculty Approvals</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} result{pending.length !== 1 ? "s" : ""} awaiting Dean
          approval — will forward to Registrar
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Course</TableHead>
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
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="approvals.empty_state"
                >
                  No results pending Dean approval
                </TableCell>
              </TableRow>
            )}
            {pending.map((r, i) => {
              const student = students.find(
                (s) => String(s.id) === String(r.studentId),
              );
              const course = courses.find(
                (c) => String(c.id) === String(r.courseId),
              );
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`approvals.item.${i + 1}`}
                >
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {student?.matricNumber ?? "-"}
                  </TableCell>
                  <TableCell>{course?.code ?? "-"}</TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell className="font-bold">{r.grade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.remarks}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`approvals.confirm_button.${i + 1}`}
                        size="sm"
                        onClick={() => handleApprove(r.id)}
                        className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve → Registrar
                      </Button>
                      <Button
                        data-ocid={`approvals.delete_button.${i + 1}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(r.id)}
                        className="h-7 text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Return to HOD
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Amendment Requests */}
      {pendingAmendments.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Amendment Requests</h2>
            <p className="text-sm text-muted-foreground">
              {pendingAmendments.length} amendment
              {pendingAmendments.length !== 1 ? "s" : ""} forwarded by HOD
            </p>
          </div>
          <div className="bg-card rounded-xl border border-amber-200 shadow-xs">
            <div className="p-3 bg-amber-50 border-b border-amber-200 rounded-t-xl">
              <p className="text-xs font-semibold text-amber-700">
                ⚠️ Score Amendment Requests (HOD Approved)
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Proposed</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Lecturer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAmendments.map((a, i) => {
                  const student = students.find(
                    (s) => String(s.id) === String(a.studentId),
                  );
                  const course = courses.find(
                    (c) => String(c.id) === String(a.courseId),
                  );
                  return (
                    <TableRow
                      key={String(a.id)}
                      data-ocid={`dean_amendments.item.${i + 1}`}
                    >
                      <TableCell className="font-medium text-sm">
                        {student?.name ?? "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {course?.code ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="line-through text-muted-foreground">
                          {a.originalCa}/{a.originalExam} ={" "}
                          {a.originalCa + a.originalExam}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-amber-700">
                        {a.newCa}/{a.newExam} = {a.newCa + a.newExam}
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
                            data-ocid={`dean_amendments.confirm_button.${i + 1}`}
                            size="sm"
                            onClick={() =>
                              updateAmendmentStatus(a.id, "pending_registrar")
                            }
                            className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            data-ocid={`dean_amendments.delete_button.${i + 1}`}
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectAmendment(a.id)}
                            className="h-7 text-xs"
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
    </div>
  );
}

function DepartmentsTab() {
  const { departments, students, courses, results } = useApp();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Departments Overview</h1>
        <p className="text-sm text-muted-foreground">
          Faculty-wide department statistics
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {departments.map((dept, i) => {
          const deptStudents = students.filter(
            (s) => s.departmentId === dept.id,
          );
          const deptCourses = courses.filter((c) => c.departmentId === dept.id);
          const deptResults = results.filter((r) => {
            const course = courses.find(
              (c) => String(c.id) === String(r.courseId),
            );
            return course?.departmentId === dept.id;
          });
          const passed = deptResults.filter((r) => r.grade !== "F").length;
          const passRate =
            deptResults.length > 0
              ? Math.round((passed / deptResults.length) * 100)
              : 0;
          return (
            <div
              key={String(dept.id)}
              data-ocid={`dept.item.${i + 1}`}
              className="bg-card rounded-xl border border-border p-5 shadow-xs"
            >
              <h2 className="font-semibold mb-3">{dept.name}</h2>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{deptStudents.length}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold">{deptCourses.length}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Results</p>
                  <p className="text-2xl font-bold">{deptResults.length}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                  <p
                    className={`text-2xl font-bold ${
                      passRate >= 70 ? "text-success" : "text-warning"
                    }`}
                  >
                    {passRate}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllResultsTab() {
  const { results, courses, students } = useApp();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">All Faculty Results</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} total results
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
            {results.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="dean_results.empty_state"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
            {results.map((r, i) => {
              const student = students.find(
                (s) => String(s.id) === String(r.studentId),
              );
              const course = courses.find(
                (c) => String(c.id) === String(r.courseId),
              );
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`dean_results.item.${i + 1}`}
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

// ===================== DEAN GRADUATION TAB =====================
function DeanGraduationTab() {
  const { graduationApplications, updateGraduationStatus } = useApp();
  const [noteOpen, setNoteOpen] = useState(false);
  const [selected, setSelected] = useState<GraduationApplication | null>(null);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  const pending = graduationApplications.filter(
    (a) => a.status === "pending_dean",
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
      actionType === "approve" ? "pending_registrar" : "rejected";
    updateGraduationStatus(
      selected.id,
      newStatus,
      note || undefined,
      "deanNote",
    );
    setNoteOpen(false);
    toast.success(
      actionType === "approve"
        ? "Forwarded to Registrar"
        : "Application rejected",
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Graduation Applications</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} application{pending.length !== 1 ? "s" : ""} pending
          Dean approval
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Matric</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Credit Check</TableHead>
              <TableHead>No F Grades</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="dean_graduation.empty_state"
                >
                  No pending graduation applications
                </TableCell>
              </TableRow>
            )}
            {pending.map((app, i) => (
              <TableRow
                key={String(app.id)}
                data-ocid={`dean_graduation.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell className="font-medium">{app.studentName}</TableCell>
                <TableCell className="font-mono text-sm">
                  {app.matric}
                </TableCell>
                <TableCell className="text-sm">{app.department}</TableCell>
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
                      data-ocid={`dean_graduation.confirm_button.${i + 1}`}
                      size="sm"
                      onClick={() => openAction(app, "approve")}
                      className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                    >
                      Approve → Registrar
                    </Button>
                    <Button
                      data-ocid={`dean_graduation.delete_button.${i + 1}`}
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
        <DialogContent data-ocid="dean_graduation.dialog">
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
            <label htmlFor="dean-note" className="text-sm font-medium">
              Dean's Note (optional)
            </label>
            <Textarea
              id="dean-note"
              data-ocid="dean_graduation.textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="dean_graduation.cancel_button"
              variant="outline"
              onClick={() => setNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="dean_graduation.confirm_button.1"
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

function DeanExamScheduleTab() {
  return <ExamScheduleTab filterCourseCodes={undefined} isAdmin={false} />;
}

function DeanCourseFeedbackTab() {
  const { courses } = useApp();
  return <CourseFeedbackView courses={courses} />;
}

function DeanStudentsTab() {
  const { currentUser, students, departments, faculties } = useApp();
  const [selectedProfileId, setSelectedProfileId] = useState<bigint | null>(
    null,
  );
  // Find dean's faculty based on their department
  const deanDept = departments.find(
    (d) => String(d.id) === String(currentUser?.departmentId),
  );
  const facultyId = deanDept?.facultyId;
  const faculty = faculties.find((f) => String(f.id) === String(facultyId));
  const facultyDepts = departments.filter(
    (d) => String(d.facultyId) === String(facultyId),
  );
  const facultyDeptIds = new Set(facultyDepts.map((d) => String(d.id)));
  const facultyStudents = students.filter((s) =>
    facultyDeptIds.has(String(s.departmentId)),
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">
          Students — {faculty?.name ?? "Faculty"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {facultyStudents.length} student
          {facultyStudents.length !== 1 ? "s" : ""} across {facultyDepts.length}{" "}
          departments
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {[
                  "S/N",
                  "Reg No",
                  "Matric No",
                  "Name",
                  "Department",
                  "State",
                  "LGA",
                  "Sex",
                  "Status",
                  "Level",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-muted-foreground px-3 py-2"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facultyStudents.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center text-muted-foreground py-8 text-sm"
                    data-ocid="dean.students.empty_state"
                  >
                    No students found
                  </td>
                </tr>
              )}
              {facultyStudents.map((s, i) => {
                const es = s as any;
                const dept = departments.find(
                  (d) => String(d.id) === String(s.departmentId),
                );
                return (
                  <tr
                    key={String(s.id)}
                    className="border-b border-border/50 hover:bg-muted/30"
                    data-ocid={`dean.students.item.${i + 1}`}
                  >
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {es.regNo ?? es.jambRegNo ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-xs">{s.matricNumber}</td>
                    <td className="px-3 py-2 text-xs font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-xs">{dept?.name ?? "-"}</td>
                    <td className="px-3 py-2 text-xs">{es.state ?? "-"}</td>
                    <td className="px-3 py-2 text-xs">{es.lga ?? "-"}</td>
                    <td className="px-3 py-2 text-xs">{es.gender ?? "-"}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {String(s.level)} Level
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        data-ocid={`dean.students.view_profile.button.${i + 1}`}
                        onClick={() => setSelectedProfileId(s.id)}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <StudentProfileModal
        studentId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
}
