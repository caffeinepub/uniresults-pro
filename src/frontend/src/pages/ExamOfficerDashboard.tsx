import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Fingerprint,
  Send,
  Users,
} from "lucide-react";
import { useContext } from "react";
import DashboardSidebar, {
  type SidebarItem,
} from "../components/DashboardSidebar";
import { TabContext } from "../components/Layout";
import { useApp } from "../context/AppContext";
import BiometricAttendanceTab from "./tabs/BiometricAttendanceTab";
import CombinedResultsTab from "./tabs/CombinedResultsTab";
import DeptAllResultsTab from "./tabs/DeptAllResultsTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import FacultyCollationTab from "./tabs/FacultyCollationTab";
import MissingResultsTab from "./tabs/MissingResultsTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import ResultsProcessingTab from "./tabs/ResultsProcessingTab";
import ScoreEntrySheetTab from "./tabs/ScoreEntrySheetTab";
import StudentAcademicRecordTab from "./tabs/StudentAcademicRecordTab";
import StudentProgressReportTab from "./tabs/StudentProgressReportTab";
import SupplementaryExamsTab from "./tabs/SupplementaryExamsTab";

function OverviewTab() {
  const { results, courses, currentUser } = useApp();
  const deptId = (currentUser as any)?.departmentId;
  const deptCourseIds = new Set(
    courses
      .filter((c) => String(c.departmentId) === String(deptId))
      .map((c) => String(c.id)),
  );
  const deptResults = deptId
    ? results.filter((r) => deptCourseIds.has(String(r.courseId)))
    : results;

  const totalCourses = courses.filter(
    (c) => !deptId || String(c.departmentId) === String(deptId),
  ).length;
  const submitted = deptResults.filter((r) => r.status === "submitted").length;
  const published = deptResults.filter((r) => r.status === "published").length;
  const pending = deptResults.filter(
    (r) => r.status === "draft" || r.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Courses",
            value: totalCourses,
            icon: ClipboardList,
            cls: "text-primary",
          },
          {
            label: "Submitted Results",
            value: submitted,
            icon: Send,
            cls: "text-amber-500",
          },
          {
            label: "Published Results",
            value: published,
            icon: ClipboardCheck,
            cls: "text-green-600",
          },
          {
            label: "Pending Entry",
            value: pending,
            icon: FileText,
            cls: "text-muted-foreground",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="bg-card border border-border rounded-xl"
          >
            <CardHeader className="pb-1 pt-4 px-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.cls}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-3xl font-bold ${s.cls}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Exam Officer Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              As an <strong className="text-foreground">Exam Officer</strong>,
              you can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-2">
              <li>Enter scores (CA &amp; Exam) for assigned courses</li>
              <li>Submit score sheets for HOD review and approval</li>
              <li>View the full results pipeline for your department</li>
              <li>View all departmental results and download reports</li>
              <li>Manage and view exam schedules</li>
              <li>Monitor biometric attendance</li>
            </ul>
            <p className="text-xs mt-3 bg-muted/40 rounded-lg p-3 border border-border">
              <strong className="text-foreground">Note:</strong> You cannot
              approve or publish results. Approval is done by the HOD, Dean, and
              Registrar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExamOfficerDashboard() {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const { currentUser, results, courses } = useApp();

  const deptId = (currentUser as any)?.departmentId;
  const deptCourseIds = new Set(
    courses
      .filter((c) => String(c.departmentId) === String(deptId))
      .map((c) => String(c.id)),
  );
  const pendingCount = results.filter(
    (r) =>
      (r.status === "draft" || r.status === "pending") &&
      (deptId ? deptCourseIds.has(String(r.courseId)) : true),
  ).length;

  const quickActions = [
    { label: "Score Sheet", tab: "score_sheet", icon: FileText },
    { label: "Results Pipeline", tab: "results_processing", icon: BarChart2 },
    { label: "Dept Results", tab: "dept_results", icon: ClipboardList },
    { label: "Exam Schedule", tab: "exam_schedule", icon: CalendarDays },
    { label: "Biometric", tab: "biometric", icon: Fingerprint },
    { label: "Faculty Collation", tab: "faculty_collation", icon: BarChart2 },
    { label: "Academic Record", tab: "academic_record", icon: ClipboardList },
    { label: "Combined Results", tab: "combined_results", icon: ClipboardList },
  ];

  let content: React.ReactNode;
  if (activeTab === "score_sheet") content = <ScoreEntrySheetTab />;
  else if (activeTab === "results_processing")
    content = <ResultsProcessingTab userRole="Lecturer" />;
  else if (activeTab === "dept_results")
    content = <DeptAllResultsTab userRole="ExamOfficer" />;
  else if (activeTab === "exam_schedule") content = <ExamScheduleTab />;
  else if (activeTab === "biometric") content = <BiometricAttendanceTab />;
  else if (activeTab === "supplementary") content = <SupplementaryExamsTab />;
  else if (activeTab === "missing_results") content = <MissingResultsTab />;
  else if (activeTab === "faculty_collation")
    content = <FacultyCollationTab userRole="ExamOfficer" />;
  else if (activeTab === "combined_results") content = <CombinedResultsTab />;
  else if (activeTab === "academic_record")
    content = <StudentAcademicRecordTab mode="admin" />;
  else if (activeTab === "student_progress")
    content = <StudentProgressReportTab />;
  else content = <OverviewTab />;

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", group: "Dashboard" },
    {
      id: "score_sheet",
      label: "Score Sheet",
      group: "Results",
      badge: pendingCount,
    },
    { id: "results_processing", label: "Results Pipeline", group: "Results" },
    { id: "dept_results", label: "Dept Results", group: "Results" },
    { id: "supplementary", label: "Supplementary Exams", group: "Results" },
    { id: "missing_results", label: "Missing Results", group: "Results" },
    { id: "faculty_collation", label: "Faculty Collation", group: "Results" },
    { id: "combined_results", label: "Combined Results", group: "Results" },
    { id: "academic_record", label: "Academic Record", group: "Results" },
    { id: "exam_schedule", label: "Exam Schedule", group: "Scheduling" },
    { id: "biometric", label: "Biometric", group: "Scheduling" },
    { id: "student_progress", label: "Student Progress", group: "Results" },
  ].map((item) => {
    const found = quickActions.find((a) => a.tab === item.id);
    return { ...item, icon: found?.icon ?? (() => null) } as SidebarItem;
  });

  return (
    <>
      <NoticeBoardPanel userRole="ExamOfficer" />
      <div className="flex min-h-[calc(100vh-8rem)]">
        <DashboardSidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          roleName="Exam Officer"
        />
        <div className="flex-1 min-w-0 overflow-auto">{content}</div>
      </div>
    </>
  );
}
