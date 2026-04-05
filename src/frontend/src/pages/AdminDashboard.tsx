import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Download,
  Eye,
  FileText,
  FileUp,
  Filter,
  Globe,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ScanLine,
  ScrollText,
  Settings2,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bell,
  Building,
  DollarSign,
  GraduationCap,
  Mail,
  Monitor,
  QrCode,
  Shield,
  UserCheck,
} from "lucide-react";
import type React from "react";
import { useContext, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Course } from "../backend.d";
import DashboardSidebar, {
  type SidebarItem,
} from "../components/DashboardSidebar";
import { InstitutionTypeBanner } from "../components/InstitutionTypeBanner";
import { TabContext } from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  type AcademicCalendar,
  type ExtendedStudent,
  type Faculty,
  type GraduationApplication,
  type TimetableEntry,
  getAcademicStanding,
  useApp,
} from "../context/AppContext";
import { useInstitutionConfig } from "../hooks/useInstitutionConfig";
import { getPendingRegistrations, savePendingRegistrations } from "./LoginPage";
import type { PendingRegistration } from "./LoginPage";
import AcademicCalendarEventsTab, {
  UpcomingEventsWidget,
} from "./tabs/AcademicCalendarEventsTab";
import AccreditationReportTab from "./tabs/AccreditationReportTab";
import AdminInboxTab from "./tabs/AdminInboxTab";
import AdvancedAnalyticsTab from "./tabs/AdvancedAnalyticsTab";
import AdvisorAssignmentTab from "./tabs/AdvisorAssignmentTab";
import AlumniManagementTab from "./tabs/AlumniManagementTab";
import AnnouncementsManagerTab from "./tabs/AnnouncementsManagerTab";
import AuditLogTabFile from "./tabs/AuditLogTab";
import BenchmarkingTab from "./tabs/BenchmarkingTab";
import BiometricAttendanceTab from "./tabs/BiometricAttendanceTab";
import BroadcastInboxTab from "./tabs/BroadcastInboxTab";
import BulkRegistrationTab from "./tabs/BulkRegistrationTab";
import CBTExamTab from "./tabs/CBTExamTab";
import CameraSecurityTab from "./tabs/CameraSecurityTab";
import CarryoverReportTab from "./tabs/CarryoverReportTab";
import ClearanceCertificateModal from "./tabs/ClearanceCertificateModal";
import CourseScanImportModal, {
  type CourseScanRow,
} from "./tabs/CourseScanImportModal";
import DataBackupTab from "./tabs/DataBackupTab";
import DeansListTab from "./tabs/DeansListTab";
import DeferralsTab from "./tabs/DefferralsTab";
import DepartmentBudgetTab from "./tabs/DepartmentBudgetTab";
import { AdminTransferTab } from "./tabs/DepartmentTransferTab";
import DeptResultsTab from "./tabs/DeptResultsTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import ExamSupervisionTab from "./tabs/ExamSupervisionTab";
import FeeManagementTab from "./tabs/FeeManagementTab";
import FinancialClearanceTab from "./tabs/FinancialClearanceTab";
import GradeScaleConfigTab from "./tabs/GradeScaleConfigTab";
import GradeSheetTab from "./tabs/GradeSheetTab";
import GraduationListTab from "./tabs/GraduationListTab";
import HostelManagementTab from "./tabs/HostelManagementTab";
import IDCardTab from "./tabs/IDCardTab";
import InvigilationAssignmentTab from "./tabs/InvigilationAssignmentTab";
import JambAdmissionScannerTab from "./tabs/JambAdmissionScannerTab";
import LibraryClearanceTab from "./tabs/LibraryClearanceTab";
import MissingResultsTab from "./tabs/MissingResultsTab";
import ModerationWorkflowTab from "./tabs/ModerationWorkflowTab";
import MultiClearanceTab from "./tabs/MultiClearanceTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import NoticeManagementTab from "./tabs/NoticeManagementTab";
import PGAdmissionTab from "./tabs/PGAdmissionTab";
import PassFailGraduatingTab from "./tabs/PassFailGraduatingTab";
import PayrollTab from "./tabs/PayrollTab";
import QRScannerModal from "./tabs/QRScannerModal";
import ReportMonitorTab from "./tabs/ReportMonitorTab";
import ResultAmendmentTab from "./tabs/ResultAmendmentTab";
import ResultStatsDashboard from "./tabs/ResultStatsDashboard";
import ResultsProcessingTab from "./tabs/ResultsProcessingTab";
import ScholarshipTab from "./tabs/ScholarshipTab";
import ScoreEntrySheetTab from "./tabs/ScoreEntrySheetTab";
import SenateReportTab from "./tabs/SenateReportTab";
import SettingsTab from "./tabs/SettingsTab";
import StaffAppraisalTab from "./tabs/StaffAppraisalTab";
import StaffTab from "./tabs/StaffTab";
import StudentAcademicRecordTab from "./tabs/StudentAcademicRecordTab";
import StudentClearanceTab from "./tabs/StudentClearanceTab";
import { DocumentUploadDialog } from "./tabs/StudentDocumentsTab";
import StudentProfileModal from "./tabs/StudentProfileModal";
import SupplementaryExamsTab from "./tabs/SupplementaryExamsTab";
import SystemHealthTab from "./tabs/SystemHealthTab";
import ThesisTrackerTab from "./tabs/ThesisTrackerTab";
import TranscriptRequestTab from "./tabs/TranscriptRequestTab";

export default function AdminDashboard() {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const { currentUser: adminUser } = useApp();
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const _instConfig = useInstitutionConfig();
  const pendingCount = getPendingRegistrations().filter(
    (r) => r.status === "pending",
  ).length;

  const allQuickActions = [
    { label: "Add Student", tab: "students", icon: Users },
    { label: "Publish Results", tab: "results", icon: CheckCircle },
    { label: "Fee Reports", tab: "fee_management", icon: BarChart3 },
    { label: "Add Course", tab: "courses", icon: BookOpen },
    { label: "Settings", tab: "settings", icon: Settings2 },
    { label: "Senate Report", tab: "senate_report", icon: ScrollText },
    { label: "Academic Record", tab: "academic_record", icon: BookOpen },
    { label: "Score Sheet", tab: "score_sheet", icon: ScrollText },
    { label: "Results Pipeline", tab: "results_processing", icon: BarChart3 },
    { label: "Dept. Results", tab: "dept_results", icon: BarChart3 },
    { label: "Bulk Reg", tab: "bulkReg", icon: FileUp },
    {
      label: "JAMB Import",
      tab: "jamb_import",
      icon: ScanLine,
      show: _instConfig.showJAMBImport,
    },
    { label: "System Health", tab: "system_health", icon: BarChart3 },
    { label: "Fin. Clearance", tab: "financial_clearance", icon: BarChart3 },
    { label: "ID Cards", tab: "id_cards", icon: BarChart3 },
    { label: "Graduation List", tab: "graduation_list", icon: GraduationCap },
    { label: "Data Backup", tab: "data_backup", icon: Shield },
    { label: "Scholarships", tab: "scholarships", icon: DollarSign },
    { label: "Analytics", tab: "adv_analytics", icon: BarChart3 },
    { label: "Invigilation", tab: "invigilation", icon: UserCheck },
    { label: "Clearance", tab: "multi_clearance", icon: ClipboardList },
    { label: "Announcements", tab: "announcements_mgr", icon: Bell },
    { label: "Budget", tab: "dept_budget", icon: DollarSign },
    { label: "Appraisal", tab: "staff_appraisal", icon: ClipboardList },
    { label: "CBT Exams", tab: "cbt_exam", icon: Monitor },
    { label: "PG Admission", tab: "pg_admission", icon: GraduationCap },
  ];

  const _quickActions = allQuickActions.filter((a) => a.show !== false);

  let view: React.ReactNode;
  if (activeTab === "overview") view = <OverviewTab />;
  else if (activeTab === "departments") view = <DepartmentsTab />;
  else if (activeTab === "students") view = <StudentsTab />;
  else if (activeTab === "courses") view = <CoursesTab />;
  else if (activeTab === "course_mgmt") view = <CourseManagementTab />;
  else if (activeTab === "results") view = <ResultsTab />;
  else if (activeTab === "summaries") view = <SummariesTab />;
  else if (activeTab === "carryovers") view = <CarryoversTab />;
  else if (activeTab === "statistics") view = <StatisticsTab />;
  else if (activeTab === "roles") view = <RolesTab />;
  else if (activeTab === "calendar") view = <AcademicCalendarTab />;
  else if (activeTab === "audit") view = <AuditLogTab />;
  else if (activeTab === "faculties") view = <FacultiesTab />;
  else if (activeTab === "graduation") view = <GraduationClearanceTab />;
  else if (activeTab === "timetable") view = <TimetableBuilderTab />;
  else if (activeTab === "fee_management") view = <FeeManagementTab />;
  else if (activeTab === "staff") view = <StaffTab />;
  else if (activeTab === "deferrals") view = <DeferralsTab />;
  else if (activeTab === "benchmarking") view = <BenchmarkingTab />;
  else if (activeTab === "exam_schedule") view = <ExamScheduleTab isAdmin />;
  else if (activeTab === "settings") view = <SettingsTab />;
  else if (activeTab === "grade_scale") view = <GradeScaleConfigTab />;
  else if (activeTab === "advisors") view = <AdvisorAssignmentTab />;
  else if (activeTab === "notices_mgmt") view = <NoticeManagementTab />;
  else if (activeTab === "transfers") view = <AdminTransferTab />;
  else if (activeTab === "senate_report")
    view = <SenateReportTab userRole="Registrar" />;
  else if (activeTab === "dept_results")
    view = <DeptResultsTab userRole="Registrar" />;
  else if (activeTab === "pending_registrations")
    view = <PendingRegistrationsTab />;
  else if (activeTab === "biometric") view = <BiometricAttendanceTab />;
  else if (activeTab === "cam_security") view = <CameraSecurityTab />;
  else if (activeTab === "report_monitor") view = <ReportMonitorTab />;
  else if (activeTab === "score_sheet") view = <ScoreEntrySheetTab />;
  else if (activeTab === "results_processing")
    view = <ResultsProcessingTab userRole="Registrar" />;
  else if (activeTab === "alumni") view = <AlumniManagementTab />;
  else if (activeTab === "payroll") view = <PayrollTab />;
  else if (activeTab === "hostel") view = <HostelManagementTab />;
  else if (activeTab === "library") view = <LibraryClearanceTab />;
  else if (activeTab === "admin_inbox") view = <AdminInboxTab />;
  else if (activeTab === "bulkReg") view = <BulkRegistrationTab />;
  else if (activeTab === "jamb_import") view = <JambAdmissionScannerTab />;
  else if (activeTab === "data_backup") view = <DataBackupTab />;
  else if (activeTab === "financial_clearance")
    view = <FinancialClearanceTab />;
  else if (activeTab === "id_cards") view = <IDCardTab mode="admin" />;
  else if (activeTab === "result_stats") view = <ResultStatsDashboard />;
  else if (activeTab === "audit_log") view = <AuditLogTabFile />;
  else if (activeTab === "graduation_list") view = <GraduationListTab />;
  else if (activeTab === "system_health") view = <SystemHealthTab />;
  else if (activeTab === "broadcast") view = <BroadcastInboxTab />;
  else if (activeTab === "transcript_requests") view = <TranscriptRequestTab />;
  else if (activeTab === "accreditation") view = <AccreditationReportTab />;
  else if (activeTab === "exam_supervision") view = <ExamSupervisionTab />;
  else if (activeTab === "student_clearance") view = <StudentClearanceTab />;
  else if (activeTab === "cal_events") view = <AcademicCalendarEventsTab />;
  else if (activeTab === "thesis_tracker")
    view = <ThesisTrackerTab mode="admin" />;
  else if (activeTab === "supplementary") view = <SupplementaryExamsTab />;
  else if (activeTab === "missing_results") view = <MissingResultsTab />;
  else if (activeTab === "moderation") view = <ModerationWorkflowTab />;
  else if (activeTab === "deans_list") view = <DeansListTab />;
  else if (activeTab === "carryover_report") view = <CarryoverReportTab />;
  else if (activeTab === "grade_sheet") view = <GradeSheetTab />;
  else if (activeTab === "pass_fail_list") view = <PassFailGraduatingTab />;
  else if (activeTab === "scholarships") view = <ScholarshipTab />;
  else if (activeTab === "adv_analytics") view = <AdvancedAnalyticsTab />;
  else if (activeTab === "academic_record")
    view = <StudentAcademicRecordTab mode="admin" />;
  else if (activeTab === "invigilation") view = <InvigilationAssignmentTab />;
  else if (activeTab === "multi_clearance") view = <MultiClearanceTab />;
  else if (activeTab === "announcements_mgr")
    view = <AnnouncementsManagerTab />;
  else if (activeTab === "dept_budget") view = <DepartmentBudgetTab />;
  else if (activeTab === "staff_appraisal") view = <StaffAppraisalTab />;
  else if (activeTab === "cbt_exam") view = <CBTExamTab />;
  else if (activeTab === "pg_admission") view = <PGAdmissionTab />;
  else if (activeTab === "result_amendment")
    view = <ResultAmendmentTab userRole="Registrar" />;
  else view = <OverviewTab />;

  const sidebarItems: SidebarItem[] = [
    { id: "overview", label: "Overview", group: "Dashboard" },
    { id: "students", label: "Students", group: "Academic" },
    { id: "staff", label: "Staff", group: "Academic" },
    { id: "faculties", label: "Faculties", group: "Academic" },
    { id: "departments", label: "Departments", group: "Academic" },
    { id: "courses", label: "Courses", group: "Academic" },
    { id: "course_mgmt", label: "Course Management", group: "Academic" },
    { id: "bulkReg", label: "Bulk Registration", group: "Academic" },
    { id: "jamb_import", label: "JAMB Import", group: "Academic" },
    { id: "pg_admission", label: "PG Admission", group: "Academic" },
    {
      id: "pending_registrations",
      label: "Pending Registrations",
      group: "Academic",
      badge: pendingCount,
    },
    { id: "score_sheet", label: "Score Sheet", group: "Results" },
    { id: "results_processing", label: "Results Pipeline", group: "Results" },
    { id: "results", label: "Publish Results", group: "Results" },
    { id: "dept_results", label: "Dept Results", group: "Results" },
    { id: "senate_report", label: "Senate Report", group: "Results" },
    { id: "academic_record", label: "Academic Record", group: "Results" },
    { id: "summaries", label: "Result Summaries", group: "Results" },
    { id: "supplementary", label: "Supplementary Exams", group: "Results" },
    { id: "missing_results", label: "Missing Results", group: "Results" },
    { id: "moderation", label: "Moderation", group: "Results" },
    { id: "deans_list", label: "Dean's List", group: "Results" },
    { id: "carryover_report", label: "Carryover Report", group: "Results" },
    { id: "grade_sheet", label: "Grade Sheet", group: "Results" },
    { id: "pass_fail_list", label: "Pass/Fail Lists", group: "Results" },
    { id: "result_amendment", label: "Result Amendment", group: "Results" },
    { id: "result_stats", label: "Result Stats", group: "Results" },
    { id: "graduation", label: "Graduation", group: "Graduation" },
    { id: "graduation_list", label: "Graduation List", group: "Graduation" },
    {
      id: "student_clearance",
      label: "Student Clearance",
      group: "Graduation",
    },
    { id: "multi_clearance", label: "Multi Clearance", group: "Graduation" },
    { id: "alumni", label: "Alumni", group: "Graduation" },
    { id: "timetable", label: "Timetable", group: "Scheduling" },
    { id: "exam_schedule", label: "Exam Schedule", group: "Scheduling" },
    { id: "invigilation", label: "Invigilation", group: "Scheduling" },
    { id: "calendar", label: "Academic Calendar", group: "Scheduling" },
    { id: "cal_events", label: "Calendar Events", group: "Scheduling" },
    { id: "fee_management", label: "Fee Management", group: "Finance" },
    {
      id: "financial_clearance",
      label: "Financial Clearance",
      group: "Finance",
    },
    { id: "scholarships", label: "Scholarships", group: "Finance" },
    { id: "payroll", label: "Payroll", group: "Finance" },
    { id: "hostel", label: "Hostel", group: "Admin" },
    { id: "library", label: "Library", group: "Admin" },
    { id: "admin_inbox", label: "Inbox", group: "Admin" },
    { id: "broadcast", label: "Broadcast", group: "Admin" },
    { id: "notices_mgmt", label: "Notice Board", group: "Admin" },
    { id: "announcements_mgr", label: "Announcements", group: "Admin" },
    { id: "id_cards", label: "ID Cards", group: "Admin" },
    { id: "biometric", label: "Biometric", group: "Admin" },
    { id: "transfers", label: "Transfers", group: "Admin" },
    { id: "deferrals", label: "Deferrals", group: "Admin" },
    { id: "dept_budget", label: "Dept Budget", group: "Admin" },
    { id: "staff_appraisal", label: "Staff Appraisal", group: "Admin" },
    { id: "adv_analytics", label: "Analytics", group: "Reports" },
    { id: "accreditation", label: "Accreditation", group: "Reports" },
    { id: "benchmarking", label: "Benchmarking", group: "Reports" },
    { id: "report_monitor", label: "Report Monitor", group: "Reports" },
    { id: "thesis_tracker", label: "Thesis Tracker", group: "Reports" },
    { id: "cbt_exam", label: "CBT Exams", group: "Reports" },
    { id: "settings", label: "Settings", group: "System" },
    { id: "grade_scale", label: "Grade Scale", group: "System" },
    { id: "advisors", label: "Advisors", group: "System" },
    { id: "roles", label: "User Roles", group: "System" },
    { id: "audit_log", label: "Audit Log", group: "System" },
    { id: "data_backup", label: "Data Backup", group: "System" },
    { id: "cam_security", label: "Cam Security", group: "System" },
  ].map((item) => {
    const found = allQuickActions.find((a) => a.tab === item.id);
    return {
      ...item,
      icon: found?.icon ?? (() => null),
    } as SidebarItem;
  });

  return (
    <>
      <QRScannerModal
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
      />
      <NoticeBoardPanel userRole={adminUser?.role ?? "SuperAdmin"} />
      <UpcomingEventsWidget />
      <div className="flex items-center gap-2 mb-2 no-print">
        <InstitutionTypeBanner />
      </div>
      <div className="flex min-h-[calc(100vh-8rem)]">
        <DashboardSidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          roleName="Admin / Registrar"
          institutionName={adminUser?.name ?? "UniResults Pro"}
        />
        <div className="flex-1 min-w-0 overflow-auto">{view}</div>
      </div>
    </>
  );
}

function OverviewTab() {
  const { departments, courses, students, results } = useApp();
  const pending = results.filter((r) => r.status === "dean_approved").length;
  const gradeData = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          University Results Processing System
        </p>
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
          label="Pending Approvals"
          value={pending}
          icon={ClipboardList}
          color="text-warning"
        />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Grade Distribution
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
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Results</h2>
        </div>
        <RecentResultsTable />
      </div>
    </div>
  );
}

function RecentResultsTable() {
  const { results, courses, students } = useApp();
  const recent = results.slice(-5).reverse();
  return (
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
        {recent.map((r, i) => {
          const student = students.find(
            (s) => String(s.id) === String(r.studentId),
          );
          const course = courses.find(
            (c) => String(c.id) === String(r.courseId),
          );
          return (
            <TableRow key={String(r.id)} data-ocid={`results.item.${i + 1}`}>
              <TableCell className="text-sm">{student?.name ?? "-"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {course?.code ?? "-"}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {r.totalScore}
              </TableCell>
              <TableCell className="text-sm font-bold">{r.grade}</TableCell>
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
  );
}

function DepartmentsTab() {
  const { departments, faculties, addDepartment, bulkAddDepartments } =
    useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [bulkDeptOpen, setBulkDeptOpen] = useState(false);
  const [bulkDeptRows, setBulkDeptRows] = useState<
    {
      deptCode: string;
      deptName: string;
      facultyName: string;
      hodName: string;
    }[]
  >([]);

  function downloadDeptTemplate() {
    const csv =
      "deptCode,deptName,facultyName,hodName\nCSC,Computer Science,Faculty of Sciences,Dr. Emeka\nEEE,Electrical Engineering,Faculty of Engineering,Prof. Balogun";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "departments_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleDeptFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const rows = lines
        .slice(1)
        .map((line) => {
          const [deptCode, deptName, facultyName, hodName] = line.split(",");
          return {
            deptCode: deptCode?.trim() || "",
            deptName: deptName?.trim() || "",
            facultyName: facultyName?.trim() || "",
            hodName: hodName?.trim() || "",
          };
        })
        .filter((r) => r.deptName);
      setBulkDeptRows(rows);
    };
    reader.readAsText(file);
  }

  function handleDeptImport() {
    const newDepts = bulkDeptRows.map((r) => {
      const fac = faculties.find(
        (f) => f.name.toLowerCase() === r.facultyName.toLowerCase(),
      );
      return {
        id: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
        name: r.deptName,
        facultyId: fac?.id,
      };
    });
    bulkAddDepartments(newDepts);
    toast.success(`${newDepts.length} departments imported`);
    setBulkDeptOpen(false);
    setBulkDeptRows([]);
  }

  function handleAdd() {
    if (!name.trim()) return;
    const facultyId = selectedFacultyId
      ? BigInt(selectedFacultyId)
      : (faculties[0]?.id ?? BigInt(0));
    addDepartment({ id: BigInt(Date.now()), name: name.trim(), facultyId });
    setName("");
    setSelectedFacultyId("");
    setOpen(false);
    toast.success("Department added");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Departments</h1>
          <p className="text-sm text-muted-foreground">
            {departments.length} departments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="dept.bulk_upload_button"
            variant="outline"
            size="sm"
            onClick={() => setBulkDeptOpen(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            Bulk Upload
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="dept.open_modal_button"
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Department
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="dept.dialog">
              <DialogHeader>
                <DialogTitle>New Department</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Name</Label>
                <Input
                  data-ocid="dept.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Computer Science"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <Label>Faculty</Label>
                <Select
                  value={selectedFacultyId}
                  onValueChange={setSelectedFacultyId}
                >
                  <SelectTrigger data-ocid="dept.select">
                    <SelectValue
                      placeholder={faculties[0]?.name ?? "Select faculty"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={String(f.id)} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  data-ocid="dept.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="dept.submit_button"
                  onClick={handleAdd}
                  className="bg-primary text-primary-foreground"
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Dialog open={bulkDeptOpen} onOpenChange={setBulkDeptOpen}>
          <DialogContent data-ocid="dept.bulk.dialog" className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Departments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDeptTemplate}
                data-ocid="dept.bulk.download_button"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </Button>
              <div>
                <Label>Upload CSV</Label>
                <input
                  data-ocid="dept.bulk.upload_button"
                  type="file"
                  accept=".csv"
                  className="block w-full text-sm mt-1"
                  onChange={handleDeptFile}
                />
              </div>
              {bulkDeptRows.length > 0 && (
                <div className="overflow-auto max-h-40 border rounded">
                  <table className="text-xs w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-1.5 text-left">Code</th>
                        <th className="p-1.5 text-left">Dept Name</th>
                        <th className="p-1.5 text-left">Faculty</th>
                        <th className="p-1.5 text-left">HOD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkDeptRows.map((r) => (
                        <tr
                          key={`dept-${r.deptCode}-${r.deptName}`}
                          className="border-t"
                        >
                          <td className="p-1.5 font-mono">{r.deptCode}</td>
                          <td className="p-1.5">{r.deptName}</td>
                          <td className="p-1.5">{r.facultyName}</td>
                          <td className="p-1.5">{r.hodName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkDeptOpen(false)}
                data-ocid="dept.bulk.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeptImport}
                disabled={bulkDeptRows.length === 0}
                className="bg-primary text-primary-foreground"
                data-ocid="dept.bulk.submit_button"
              >
                Import {bulkDeptRows.length} Departments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d, i) => (
              <TableRow key={String(d.id)} data-ocid={`dept.item.${i + 1}`}>
                <TableCell className="text-muted-foreground text-sm">
                  {String(d.id)}
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface ScanRow {
  sn: string;
  regNo: string;
  name: string;
  state: string;
  lga: string;
  sex: string;
  status: string;
}

type CsvRow = {
  regNo: string;
  name: string;
  matric: string;
  dept: string;
  level: string;
  state: string;
  lga: string;
  gender: string;
  status: string;
};

function StudentsTab() {
  const {
    students,
    departments,
    addStudent,
    updateStudent,
    results,
    courses,
    deferralApplications,
    faculties,
  } = useApp();

  function _getStudentGpa(studentId: bigint) {
    const sResults = results.filter(
      (r) =>
        r.studentId === studentId &&
        (r.status === "published" || r.status === "approved"),
    );
    if (sResults.length === 0) return null;
    let wp = 0;
    let tc = 0;
    for (const r of sResults) {
      const c = courses.find((c) => String(c.id) === String(r.courseId));
      const credits = c ? Number(c.creditUnits) : 0;
      wp += r.gradePoint * credits;
      tc += credits;
    }
    return tc > 0 ? wp / tc : 0;
  }

  function isDeferred(studentId: bigint) {
    return deferralApplications.some(
      (a) => a.studentId === studentId && a.status === "approved",
    );
  }
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [docStudentId, setDocStudentId] = useState<bigint | null>(null);
  const [docStudentName, setDocStudentName] = useState("");
  const [docOpen, setDocOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    matric: "",
    regNo: "",
    deptId: "",
    level: "100",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    state: "",
    lga: "",
    status: "accepted",
    entryMode: "UTME",
  });

  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanRows, setScanRows] = useState<ScanRow[]>([]);
  const [scanDeptId, setScanDeptId] = useState("");
  const [scanLevel, setScanLevel] = useState("100");

  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facultyFilter, setFacultyFilter] = useState<string>("all");
  const [viewStudent, setViewStudent] = useState<ExtendedStudent | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<bigint | null>(
    null,
  );

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.matricNumber.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (facultyFilter !== "all") {
      const dept = departments.find(
        (d) => String(d.id) === String(s.departmentId),
      );
      const fac = dept
        ? faculties.find((f) => String(f.id) === String(dept.facultyId))
        : null;
      if (!fac || String(fac.id) !== facultyFilter) return false;
    }
    return true;
  });

  function resetManualForm() {
    setForm({
      name: "",
      matric: "",
      regNo: "",
      deptId: "",
      level: "100",
      gender: "",
      dob: "",
      email: "",
      phone: "",
      state: "",
      lga: "",
      status: "accepted",
      entryMode: "UTME",
    });
  }

  function handleManualAdd() {
    if (!form.name || !form.matric || !form.deptId) {
      toast.error("Name, Matric Number, and Department are required");
      return;
    }
    addStudent({
      id: BigInt(Date.now()),
      name: form.name,
      matricNumber: form.matric,
      departmentId: BigInt(form.deptId),
      level: BigInt(form.level),
      status: (form.status as any) || "accepted",
      userPrincipal: `student-${Date.now()}`,
      gender: form.gender || undefined,
      dob: form.dob || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      regNo: form.regNo || undefined,
      state: form.state || undefined,
      lga: form.lga || undefined,
      entryMode: (form.entryMode as any) || "UTME",
    } as any);
    resetManualForm();
    setOpen(false);
    toast.success("Student registered successfully");
  }

  function handleDownloadTemplate() {
    const headers =
      "Full Name,Matric Number,Department Name,Level,Gender,Date of Birth,Email,Phone";
    const rows = [
      "Adaeze Okafor,CSC/2022/010,Computer Science,300,Female,2003-04-12,adaeze@university.edu,08011223344",
      "Babatunde Adewale,EEE/2022/005,Electrical Engineering,200,Male,2004-01-28,babatunde@university.edu,08099887766",
    ];
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_registration_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const dataLines = lines.slice(1);
      const parsed: CsvRow[] = dataLines.map((line) => {
        const cols = line.split(",");
        return {
          regNo: cols[1]?.trim() ?? "",
          name: cols[2]?.trim() ?? "",
          matric: cols[3]?.trim() ?? "",
          dept: cols[4]?.trim() ?? "",
          level: cols[5]?.trim() ?? "100",
          state: cols[6]?.trim() ?? "",
          lga: cols[7]?.trim() ?? "",
          gender: cols[8]?.trim() ?? "",
          status: cols[9]?.trim() ?? "accepted",
        };
      });
      setCsvRows(parsed.filter((r) => r.name && r.matric));
    };
    reader.readAsText(file);
  }

  function handleImportAll() {
    if (csvRows.length === 0) return;
    let count = 0;
    for (const row of csvRows) {
      const matchedDept =
        departments.find(
          (d) => d.name.toLowerCase() === row.dept.toLowerCase(),
        ) ?? departments[0];
      if (!matchedDept) continue;
      addStudent({
        id: BigInt(Date.now() + count),
        name: row.name,
        matricNumber: row.matric,
        departmentId: matchedDept.id,
        level: BigInt(Number(row.level) || 100),
        status: (row.status as any) || "accepted",
        userPrincipal: `student-bulk-${Date.now()}-${count}`,
        gender: row.gender || undefined,
        regNo: row.regNo || undefined,
        state: row.state || undefined,
        lga: row.lga || undefined,
      } as any);
      count++;
    }
    setCsvRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOpen(false);
    toast.success(
      `${count} student${count !== 1 ? "s" : ""} imported successfully`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} registered
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="w-44" data-ocid="students.select">
              <SelectValue placeholder="All Faculties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties.map((f) => (
                <SelectItem key={String(f.id)} value={String(f.id)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            data-ocid="students.search_input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                resetManualForm();
                setCsvRows([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                data-ocid="students.open_modal_button"
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent
              data-ocid="students.dialog"
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <DialogHeader>
                <DialogTitle>Student Registration</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="manual">
                <TabsList className="w-full">
                  <TabsTrigger
                    value="manual"
                    className="flex-1"
                    data-ocid="students.tab"
                  >
                    Manual Registration
                  </TabsTrigger>
                  <TabsTrigger
                    value="bulk"
                    className="flex-1"
                    data-ocid="students.tab"
                  >
                    Bulk CSV Upload
                  </TabsTrigger>
                  <TabsTrigger
                    value="scanner"
                    className="flex-1"
                    data-ocid="students.scanner.tab"
                  >
                    <ScanLine className="w-3.5 h-3.5 mr-1.5" />
                    AI Scanner
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        data-ocid="students.name.input"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="e.g. Amara Okonkwo"
                      />
                    </div>
                    <div>
                      <Label>Matric Number *</Label>
                      <Input
                        data-ocid="students.matric.input"
                        value={form.matric}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, matric: e.target.value }))
                        }
                        placeholder="e.g. CSC/2022/007"
                      />
                    </div>
                    <div>
                      <Label>Reg No / Admission No</Label>
                      <Input
                        data-ocid="students.regno.input"
                        value={form.regNo}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, regNo: e.target.value }))
                        }
                        placeholder="e.g. 20255067348614"
                      />
                    </div>
                    <div>
                      <Label>Level *</Label>
                      <Select
                        value={form.level}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, level: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.level.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["100", "200", "300", "400", "500"].map((l) => (
                            <SelectItem key={l} value={l}>
                              {l} Level
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Department *</Label>
                      <Select
                        value={form.deptId}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, deptId: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.dept.select">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={String(d.id)} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, gender: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.gender.select">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input
                        data-ocid="students.dob.input"
                        type="date"
                        value={form.dob}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dob: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        data-ocid="students.email.input"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="student@university.edu"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        data-ocid="students.phone.input"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="080XXXXXXXX"
                      />
                    </div>
                    <div>
                      <Label>State of Origin</Label>
                      <Input
                        data-ocid="students.state.input"
                        value={form.state}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, state: e.target.value }))
                        }
                        placeholder="e.g. Niger"
                      />
                    </div>
                    <div>
                      <Label>LGA</Label>
                      <Input
                        data-ocid="students.lga.input"
                        value={form.lga}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, lga: e.target.value }))
                        }
                        placeholder="e.g. Kontagora"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, status: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.status.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="deferred">Deferred</SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Entry Mode</Label>
                      <Select
                        value={form.entryMode}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, entryMode: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.entry_mode.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTME">UTME (Regular)</SelectItem>
                          <SelectItem value="DE">Direct Entry (DE)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="students.cancel_button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="students.submit_button"
                      onClick={handleManualAdd}
                      className="bg-primary text-primary-foreground"
                    >
                      Register Student
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4 pt-2">
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Step 1: Download Template
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Fill in the CSV template and upload it below.
                        </p>
                      </div>
                      <Button
                        data-ocid="students.upload_button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Template
                      </Button>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-sm font-medium mb-2">
                        Step 2: Upload Filled CSV
                      </p>
                      <label
                        data-ocid="students.dropzone"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border border-border bg-background p-6 text-center hover:bg-muted/40 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to select .csv file
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  {csvRows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {csvRows.length} student
                          {csvRows.length !== 1 ? "s" : ""} ready to import
                        </p>
                        <Button
                          data-ocid="students.primary_button"
                          size="sm"
                          onClick={handleImportAll}
                          className="bg-primary text-primary-foreground"
                        >
                          Import All
                        </Button>
                      </div>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">#</TableHead>
                              <TableHead className="text-xs">Reg No</TableHead>
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-xs">Matric</TableHead>
                              <TableHead className="text-xs">Dept</TableHead>
                              <TableHead className="text-xs">Level</TableHead>
                              <TableHead className="text-xs">State</TableHead>
                              <TableHead className="text-xs">LGA</TableHead>
                              <TableHead className="text-xs">Sex</TableHead>
                              <TableHead className="text-xs">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvRows.map((row, i) => (
                              <TableRow
                                key={`${row.matric}-${i}`}
                                data-ocid={`students.item.${i + 1}`}
                              >
                                <TableCell className="text-xs text-muted-foreground">
                                  {i + 1}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.regNo}
                                </TableCell>
                                <TableCell className="text-xs font-medium">
                                  {row.name}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {row.matric}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.dept}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.level}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.state}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.lga}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.gender}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.status}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scanner" className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Department</Label>
                        <Select
                          value={scanDeptId}
                          onValueChange={setScanDeptId}
                        >
                          <SelectTrigger
                            data-ocid="students.scanner.dept.select"
                            className="text-xs h-8"
                          >
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem
                                key={String(d.id)}
                                value={String(d.id)}
                              >
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Level</Label>
                        <Select value={scanLevel} onValueChange={setScanLevel}>
                          <SelectTrigger
                            data-ocid="students.scanner.level.select"
                            className="text-xs h-8"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["100", "200", "300", "400", "500"].map((l) => (
                              <SelectItem key={l} value={l}>
                                {l} Level
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <label
                      data-ocid="students.scanner.dropzone"
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center hover:bg-primary/10 transition-colors"
                    >
                      <ScanLine className="w-8 h-8 text-primary/60" />
                      <span className="text-sm font-medium text-foreground">
                        Upload Document to Scan
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Supports JPG, PNG images of printed student lists
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setScanImage(ev.target?.result as string);
                            setScanning(true);
                            setScanRows([]);
                            setTimeout(() => {
                              setScanning(false);
                              setScanRows([
                                {
                                  sn: "1",
                                  regNo: "20255067348614",
                                  name: "Aisha Musa Ibrahim",
                                  state: "Niger",
                                  lga: "Kontagora",
                                  sex: "Female",
                                  status: "accepted",
                                },
                                {
                                  sn: "2",
                                  regNo: "20255089123456",
                                  name: "Emeka Chukwu Obi",
                                  state: "Anambra",
                                  lga: "Onitsha",
                                  sex: "Male",
                                  status: "accepted",
                                },
                                {
                                  sn: "3",
                                  regNo: "20255045678901",
                                  name: "Fatima Aliyu Sule",
                                  state: "Kano",
                                  lga: "Nasarawa",
                                  sex: "Female",
                                  status: "accepted",
                                },
                              ]);
                              toast.success(
                                "3 students extracted. Review and edit before importing.",
                              );
                            }, 1500);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    {scanImage && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <img
                          src={scanImage}
                          alt="Scanned doc"
                          className="h-12 w-12 object-cover rounded border border-border"
                        />
                        <div className="text-xs">
                          {scanning ? (
                            <span className="text-warning flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />{" "}
                              Scanning document...
                            </span>
                          ) : (
                            <span className="text-success">
                              ✓ Scan complete — {scanRows.length} rows extracted
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {scanRows.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground font-medium">
                            Review extracted data — click cells to edit
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() =>
                                setScanRows((prev) => [
                                  ...prev,
                                  {
                                    sn: String(prev.length + 1),
                                    regNo: "",
                                    name: "",
                                    state: "",
                                    lga: "",
                                    sex: "Male",
                                    status: "accepted",
                                  },
                                ])
                              }
                            >
                              + Add Row
                            </Button>
                            <Button
                              data-ocid="students.scanner.import_button"
                              type="button"
                              size="sm"
                              className="bg-primary text-primary-foreground text-xs h-7"
                              onClick={() => {
                                if (!scanDeptId) {
                                  toast.error("Please select a department");
                                  return;
                                }
                                const dept = departments.find(
                                  (d) => String(d.id) === scanDeptId,
                                );
                                const deptCode = dept
                                  ? dept.name
                                      .split(" ")
                                      .map((w) => w[0])
                                      .join("")
                                      .toUpperCase()
                                  : "STU";
                                let count = 0;
                                for (const row of scanRows) {
                                  if (!row.name) continue;
                                  const matric = `${deptCode}/2025/${String(count + 1).padStart(3, "0")}`;
                                  addStudent({
                                    id: BigInt(
                                      Date.now() +
                                        count +
                                        Math.floor(Math.random() * 1000),
                                    ),
                                    name: row.name,
                                    matricNumber: matric,
                                    departmentId: BigInt(scanDeptId),
                                    level: BigInt(Number(scanLevel) || 100),
                                    status: (row.status as any) || "accepted",
                                    userPrincipal: `scanner-${Date.now()}-${count}`,
                                    gender: row.sex || undefined,
                                    regNo: row.regNo || undefined,
                                    state: row.state || undefined,
                                    lga: row.lga || undefined,
                                  } as any);
                                  count++;
                                }
                                setScanRows([]);
                                setScanImage(null);
                                setOpen(false);
                                toast.success(
                                  `${count} student${count !== 1 ? "s" : ""} imported from scan`,
                                );
                              }}
                            >
                              Import All
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs w-8">
                                  S/N
                                </TableHead>
                                <TableHead className="text-xs">
                                  Reg No
                                </TableHead>
                                <TableHead className="text-xs">Name</TableHead>
                                <TableHead className="text-xs">State</TableHead>
                                <TableHead className="text-xs">LGA</TableHead>
                                <TableHead className="text-xs">Sex</TableHead>
                                <TableHead className="text-xs">
                                  Status
                                </TableHead>
                                <TableHead className="text-xs w-8" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scanRows.map((row, ri) => (
                                <TableRow
                                  key={`scan-${ri}-${row.regNo || ri}`}
                                  data-ocid={`students.scanner.item.${ri + 1}`}
                                >
                                  <TableCell className="text-xs p-1">
                                    {ri + 1}
                                  </TableCell>
                                  {(
                                    [
                                      "regNo",
                                      "name",
                                      "state",
                                      "lga",
                                      "sex",
                                      "status",
                                    ] as (keyof ScanRow)[]
                                  ).map((field) => (
                                    <TableCell key={field} className="p-1">
                                      <input
                                        className="w-full text-xs border-0 bg-transparent focus:bg-muted px-1 py-0.5 rounded outline-none focus:outline-1 focus:outline-primary/50"
                                        value={row[field]}
                                        onChange={(e) =>
                                          setScanRows((prev) =>
                                            prev.map((r, i2) =>
                                              i2 === ri
                                                ? {
                                                    ...r,
                                                    [field]: e.target.value,
                                                  }
                                                : r,
                                            ),
                                          )
                                        }
                                      />
                                    </TableCell>
                                  ))}
                                  <TableCell className="p-1">
                                    <button
                                      type="button"
                                      data-ocid={`students.scanner.delete_button.${ri + 1}`}
                                      className="text-destructive hover:opacity-70 text-xs"
                                      onClick={() =>
                                        setScanRows((prev) =>
                                          prev.filter((_, i2) => i2 !== ri),
                                        )
                                      }
                                    >
                                      ✕
                                    </button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Docs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="students.empty_state"
                >
                  No students found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s, i) => {
              const dept = departments.find(
                (d) => String(d.id) === String(s.departmentId),
              );
              const es = s as ExtendedStudent;
              return (
                <TableRow
                  key={String(s.id)}
                  data-ocid={`students.item.${i + 1}`}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {es.regNo ?? es.jambRegNo ?? "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.matricNumber}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.name}
                      {isDeferred(s.id) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground border border-border">
                          Deferred
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{dept?.name ?? "-"}</TableCell>
                  <TableCell className="text-xs">{es.state ?? "-"}</TableCell>
                  <TableCell className="text-xs">{es.lga ?? "-"}</TableCell>
                  <TableCell className="text-xs">{es.gender ?? "-"}</TableCell>
                  <TableCell>
                    <select
                      data-ocid={`students.status.select.${i + 1}`}
                      value={s.status}
                      onChange={(e) =>
                        updateStudent(s.id, { status: e.target.value as any })
                      }
                      className="text-xs border border-border rounded px-1.5 py-0.5 bg-background cursor-pointer"
                    >
                      <option value="accepted">Accepted</option>
                      <option value="active">Active</option>
                      <option value="deferred">Deferred</option>
                      <option value="graduated">Graduated</option>
                      <option value="withdrawn">Withdrawn</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        type="button"
                        data-ocid={`students.open_modal_button.${i + 1}`}
                        onClick={() => {
                          setDocStudentId(s.id);
                          setDocStudentName(s.name);
                          setDocOpen(true);
                        }}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Docs
                      </button>
                      <button
                        type="button"
                        data-ocid={`students.secondary_button.${i + 1}`}
                        onClick={() => {
                          const code = Math.random()
                            .toString(36)
                            .substring(2, 10)
                            .toUpperCase();
                          const codes = JSON.parse(
                            localStorage.getItem("resultVerificationCodes") ||
                              "[]",
                          );
                          const filtered2 = codes.filter(
                            (c: any) => c.matricNumber !== s.matricNumber,
                          );
                          filtered2.push({
                            matricNumber: s.matricNumber,
                            code,
                            generatedAt: new Date().toISOString(),
                          });
                          localStorage.setItem(
                            "resultVerificationCodes",
                            JSON.stringify(filtered2),
                          );
                          toast.success(
                            `Verification code: ${code} (for ${s.name})`,
                            { duration: 10000 },
                          );
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        Gen Code
                      </button>
                      <button
                        type="button"
                        data-ocid={`students.view_profile.button.${i + 1}`}
                        onClick={() => setSelectedProfileId(s.id)}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Profile
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {docStudentId && (
        <DocumentUploadDialog
          studentId={docStudentId}
          studentName={docStudentName}
          open={docOpen}
          onOpenChange={setDocOpen}
        />
      )}

      {/* Student Detail Modal */}
      <Dialog
        open={!!viewStudent}
        onOpenChange={(v) => {
          if (!v) setViewStudent(null);
        }}
      >
        <DialogContent data-ocid="students.dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewStudent &&
            (() => {
              const dept = departments.find(
                (d) => String(d.id) === String(viewStudent.departmentId),
              );
              const fac = dept
                ? faculties.find((f) => String(f.id) === String(dept.facultyId))
                : null;
              const rows: { label: string; value: string | undefined }[] = [
                { label: "Full Name", value: viewStudent.name },
                { label: "Matric Number", value: viewStudent.matricNumber },
                { label: "Department", value: dept?.name ?? "-" },
                { label: "Faculty", value: fac?.name ?? "-" },
                { label: "Level", value: `${String(viewStudent.level)} Level` },
                { label: "Gender", value: viewStudent.gender },
                { label: "Date of Birth", value: viewStudent.dob },
                { label: "Email", value: viewStudent.email },
                { label: "Phone", value: viewStudent.phone },
                { label: "State of Origin", value: viewStudent.state },
                { label: "LGA", value: viewStudent.lga },
                { label: "JAMB Reg. No.", value: viewStudent.jambRegNo },
                { label: "Status", value: viewStudent.status },
              ];
              return (
                <div className="space-y-2 mt-2">
                  {rows.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between gap-4 py-1 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-muted-foreground font-medium">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-right">
                        {value ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
      <StudentProfileModal
        studentId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
}

function CoursesTab() {
  const { courses, departments, addCourse, bulkAddCourses } = useApp();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extraForm, setExtraForm] = useState({
    name: "",
    code: "",
    credits: "2",
    deptId: "",
    semester: "First",
    status: "Elective",
  });
  // Track course source types in localStorage
  const [courseSources, setCourseSources] = useState<
    Record<string, "official" | "auto" | "extra">
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("courseSources") || "{}");
    } catch {
      return {};
    }
  });
  const BIOLOGY_ED_DEPT_ID = "27";
  function getCourseSource(
    courseId: string,
    deptId: string,
  ): "official" | "auto" | "extra" {
    if (courseSources[courseId]) return courseSources[courseId];
    if (String(deptId) === BIOLOGY_ED_DEPT_ID || String(deptId) === "25")
      return "official";
    return "auto";
  }
  function handleScanImport(
    deptId: string,
    rows: CourseScanRow[],
    _fileName: string,
    _fileType: string,
  ) {
    const newCourses = rows.map(
      (r, i) =>
        ({
          id: BigInt(Date.now() + i),
          name: r.title,
          code: r.courseCode,
          creditUnits: BigInt(r.creditUnits || "2"),
          departmentId: BigInt(deptId),
          lecturerPrincipal: "unassigned",
          semester: r.semester,
        }) as import("../backend.d").Course,
    );
    bulkAddCourses(newCourses);
    const newSources: Record<string, "official" | "auto" | "extra"> = {};
    for (const c of newCourses) {
      newSources[String(c.id)] = "official";
    }
    const updated = { ...courseSources, ...newSources };
    setCourseSources(updated);
    localStorage.setItem("courseSources", JSON.stringify(updated));
  }
  function handleAddExtra() {
    if (!extraForm.name || !extraForm.code || !extraForm.deptId) return;
    const id = BigInt(Date.now());
    addCourse({
      id,
      name: extraForm.name,
      code: extraForm.code,
      creditUnits: BigInt(extraForm.credits),
      departmentId: BigInt(extraForm.deptId),
      lecturerPrincipal: "unassigned",
      semester: extraForm.semester,
    });
    const updated = { ...courseSources, [String(id)]: "extra" as const };
    setCourseSources(updated);
    localStorage.setItem("courseSources", JSON.stringify(updated));
    setExtraForm({
      name: "",
      code: "",
      credits: "2",
      deptId: "",
      semester: "First",
      status: "Elective",
    });
    setExtraOpen(false);
    toast.success("Extra course added");
  }
  const [bulkPasteText, setBulkPasteText] = useState("");
  const [bulkFileError, setBulkFileError] = useState("");
  const [bulkRows, setBulkRows] = useState<
    {
      courseCode: string;
      courseName: string;
      creditUnits: string;
      department: string;
      level: string;
      description: string;
    }[]
  >([]);
  function downloadCourseTemplate() {
    const csv =
      "courseCode,courseName,creditUnits,department,level,description\nCSC401,Advanced Programming,3,Computer Science,400,";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "courses_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function parseCourseText(text: string) {
    const lines = text.split("\n").filter(Boolean);
    const firstLine = lines[0]?.toLowerCase() || "";
    const startIdx =
      firstLine.includes("code") || firstLine.includes("course") ? 1 : 0;
    return lines
      .slice(startIdx)
      .map((line) => {
        // support comma or tab separated
        const sep = line.includes("\t") ? "\t" : ",";
        const [
          courseCode,
          courseName,
          creditUnits,
          department,
          level,
          description,
        ] = line.split(sep);
        return {
          courseCode: courseCode?.trim().replace(/^["']|["']$/g, "") || "",
          courseName: courseName?.trim().replace(/^["']|["']$/g, "") || "",
          creditUnits: creditUnits?.trim().replace(/^["']|["']$/g, "") || "3",
          department: department?.trim().replace(/^["']|["']$/g, "") || "",
          level: level?.trim().replace(/^["']|["']$/g, "") || "",
          description: description?.trim().replace(/^["']|["']$/g, "") || "",
        };
      })
      .filter((r) => r.courseCode && r.courseName);
  }

  function handleBulkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFileError("");
    // Reject non-CSV files
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setBulkFileError(
        "Only CSV files are supported. Please save your Word/Excel document as CSV first, or use the Paste option below.",
      );
      setBulkRows([]);
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCourseText(text);
      if (rows.length === 0) {
        setBulkFileError(
          "No valid courses found in the CSV. Make sure columns are: Course Code, Course Name, Credit Units, Department, Level.",
        );
      }
      setBulkRows(rows);
    };
    reader.readAsText(file);
  }

  function handleBulkPaste() {
    setBulkFileError("");
    const rows = parseCourseText(bulkPasteText);
    if (rows.length === 0) {
      setBulkFileError(
        "Could not parse any courses from the pasted text. Make sure each row has: Course Code, Course Name, Credit Units (tab or comma separated).",
      );
    }
    setBulkRows(rows);
  }

  function handleBulkImport() {
    const newCourses = bulkRows.map((r) => {
      const dept = departments.find(
        (d) => d.name.toLowerCase() === r.department.toLowerCase(),
      );
      return {
        id: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
        name: r.courseName,
        code: r.courseCode,
        creditUnits: BigInt(r.creditUnits || "3"),
        departmentId: dept?.id ?? BigInt(1),
        lecturerPrincipal: "unassigned",
        semester: "First",
      } as import("../backend.d").Course;
    });
    bulkAddCourses(newCourses);
    toast.success(`${newCourses.length} courses imported`);
    setBulkOpen(false);
    setBulkRows([]);
  }
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    credits: "3",
    deptId: "",
    lecturer: "",
    semester: "First",
  });

  function handleAdd() {
    if (!form.name || !form.code || !form.deptId) return;
    addCourse({
      id: BigInt(Date.now()),
      name: form.name,
      code: form.code,
      creditUnits: BigInt(form.credits),
      departmentId: BigInt(form.deptId),
      lecturerPrincipal: form.lecturer || "unassigned",
      semester: form.semester,
    });
    setForm({
      name: "",
      code: "",
      credits: "3",
      deptId: "",
      lecturer: "",
      semester: "First",
    });
    setOpen(false);
    toast.success("Course added");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} courses
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            data-ocid="courses.scan.open_modal_button"
            variant="outline"
            size="sm"
            className="border-violet-300 text-violet-700 hover:bg-violet-50"
            onClick={() => setScanOpen(true)}
          >
            <ScanLine className="w-4 h-4 mr-1" /> Scan &amp; Import
          </Button>
          <Button
            data-ocid="courses.extra.open_modal_button"
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => setExtraOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Extra Course
          </Button>
          <Button
            data-ocid="courses.bulk_upload_button"
            variant="outline"
            size="sm"
            onClick={() => setBulkOpen(true)}
          >
            <Upload className="w-4 h-4 mr-1" /> Bulk Upload
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="courses.open_modal_button"
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="courses.dialog">
              <DialogHeader>
                <DialogTitle>New Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Course Name</Label>
                  <Input
                    data-ocid="courses.name.input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g. Data Structures"
                  />
                </div>
                <div>
                  <Label>Course Code</Label>
                  <Input
                    data-ocid="courses.code.input"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    placeholder="e.g. CSC301"
                  />
                </div>
                <div>
                  <Label>Credit Units</Label>
                  <Select
                    value={form.credits}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, credits: v }))
                    }
                  >
                    <SelectTrigger data-ocid="courses.credits.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4", "6"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c} unit{c !== "1" ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select
                    value={form.deptId}
                    onValueChange={(v) => setForm((f) => ({ ...f, deptId: v }))}
                  >
                    <SelectTrigger data-ocid="courses.dept.select">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={String(d.id)} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={form.semester}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, semester: v }))
                    }
                  >
                    <SelectTrigger data-ocid="courses.semester.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First">First</SelectItem>
                      <SelectItem value="Second">Second</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  data-ocid="courses.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="courses.submit_button"
                  onClick={handleAdd}
                  className="bg-primary text-primary-foreground"
                >
                  Add Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Bulk Upload Dialog */}
        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
          <DialogContent data-ocid="courses.bulk.dialog" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Courses</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCourseTemplate}
                data-ocid="courses.bulk.download_button"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </Button>
              <div>
                <Label>Upload CSV</Label>
                <input
                  data-ocid="courses.bulk.upload_button"
                  type="file"
                  accept=".csv"
                  className="block w-full text-sm mt-1"
                  onChange={handleBulkFile}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only .csv files accepted. To upload from Word/Excel, save the
                  file as CSV first.
                </p>
                {bulkFileError && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                    ⚠️ {bulkFileError}
                  </div>
                )}
              </div>
              <div>
                <Label>Or Paste Course Data</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Paste rows from Word/Excel (tab or comma separated: Code,
                  Name, Credits, Department, Level)
                </p>
                <textarea
                  className="w-full border rounded p-2 text-xs font-mono min-h-[80px] mt-1"
                  placeholder={
                    "BIO 101\tGeneral Biology I\t2\tBiology Education\t100\nGST 111\tCommunication in English\t2\tAll\t100"
                  }
                  value={bulkPasteText}
                  onChange={(e) => {
                    setBulkPasteText(e.target.value);
                    setBulkRows([]);
                    setBulkFileError("");
                  }}
                />
                <button
                  type="button"
                  className="mt-1 px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                  onClick={handleBulkPaste}
                  disabled={!bulkPasteText.trim()}
                >
                  Parse Pasted Data
                </button>
              </div>
              {bulkRows.length > 0 && (
                <div className="overflow-auto max-h-48 border rounded">
                  <table className="text-xs w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-1.5 text-left">Code</th>
                        <th className="p-1.5 text-left">Name</th>
                        <th className="p-1.5 text-left">Credits</th>
                        <th className="p-1.5 text-left">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((r) => (
                        <tr key={`course-${r.courseCode}`} className="border-t">
                          <td className="p-1.5 font-mono">{r.courseCode}</td>
                          <td className="p-1.5">{r.courseName}</td>
                          <td className="p-1.5">{r.creditUnits}</td>
                          <td className="p-1.5">{r.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkOpen(false);
                  setBulkRows([]);
                  setBulkPasteText("");
                  setBulkFileError("");
                }}
                data-ocid="courses.bulk.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={bulkRows.length === 0}
                className="bg-primary text-primary-foreground"
                data-ocid="courses.bulk.submit_button"
              >
                Import {bulkRows.length} Courses
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c, i) => {
              const dept = departments.find(
                (d) => String(d.id) === String(c.departmentId),
              );
              return (
                <TableRow
                  key={String(c.id)}
                  data-ocid={`courses.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {c.code}
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dept?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {String(c.creditUnits)}
                  </TableCell>
                  <TableCell className="text-sm">{c.semester}</TableCell>
                  <TableCell>
                    {getCourseSource(String(c.id), String(c.departmentId)) ===
                    "official" ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs border-0">
                        Official
                      </Badge>
                    ) : getCourseSource(
                        String(c.id),
                        String(c.departmentId),
                      ) === "extra" ? (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs border-0">
                        Extra
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Auto
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Scan & Import Modal */}
      <CourseScanImportModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        departments={departments}
        onImport={handleScanImport}
      />

      {/* Add Extra Course Dialog */}
      <Dialog open={extraOpen} onOpenChange={setExtraOpen}>
        <DialogContent data-ocid="courses.extra.dialog">
          <DialogHeader>
            <DialogTitle>Add Extra Course</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2 mb-2">
            Extra courses get a blue badge and do not affect official course
            lists.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Course Name</Label>
              <Input
                data-ocid="courses.extra.name.input"
                value={extraForm.name}
                onChange={(e) =>
                  setExtraForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Special Topics in Education"
              />
            </div>
            <div>
              <Label>Course Code</Label>
              <Input
                data-ocid="courses.extra.code.input"
                value={extraForm.code}
                onChange={(e) =>
                  setExtraForm((f) => ({ ...f, code: e.target.value }))
                }
                placeholder="e.g. EDU499"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Credit Units</Label>
                <Select
                  value={extraForm.credits}
                  onValueChange={(v) =>
                    setExtraForm((f) => ({ ...f, credits: v }))
                  }
                >
                  <SelectTrigger data-ocid="courses.extra.credits.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "2", "3", "4", "6"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c} unit{c !== "1" ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Semester</Label>
                <Select
                  value={extraForm.semester}
                  onValueChange={(v) =>
                    setExtraForm((f) => ({ ...f, semester: v }))
                  }
                >
                  <SelectTrigger data-ocid="courses.extra.semester.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First</SelectItem>
                    <SelectItem value="Second">Second</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={extraForm.deptId}
                onValueChange={(v) =>
                  setExtraForm((f) => ({ ...f, deptId: v }))
                }
              >
                <SelectTrigger data-ocid="courses.extra.dept.select">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExtraOpen(false)}
              data-ocid="courses.extra.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExtra}
              className="bg-blue-600 text-white hover:bg-blue-700"
              data-ocid="courses.extra.submit_button"
            >
              Add Extra Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResultsTab() {
  const {
    results,
    courses,
    students,
    updateResultStatus,
    amendmentRequests,
    approveAmendmentFinal,
    rejectAmendment,
    semesterSeals,
    sealSemester,
    academicCalendars,
  } = useApp();
  const [filter, setFilter] = useState("all");

  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const currentSession = activeCalendar?.session ?? "2024/2025";

  function isSemesterSealed(semester: string) {
    return semesterSeals.some(
      (s) => s.semester === semester && s.session === currentSession,
    );
  }

  function getSeal(semester: string) {
    return semesterSeals.find(
      (s) => s.semester === semester && s.session === currentSession,
    );
  }

  const pendingAmendments = amendmentRequests.filter(
    (a) => a.status === "pending_registrar",
  );

  // Group dean_approved results by semester for bulk publish
  const semesterGroups = useMemo(() => {
    const groups: Record<
      string,
      { total: number; deanApproved: number; published: number }
    > = {};
    for (const r of results) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      if (!course) continue;
      const key = course.semester;
      if (!groups[key])
        groups[key] = { total: 0, deanApproved: 0, published: 0 };
      groups[key].total++;
      if (r.status === "dean_approved") groups[key].deanApproved++;
      if (r.status === "published" || r.status === "approved")
        groups[key].published++;
    }
    return groups;
  }, [results, courses]);

  function publishSemester(semester: string) {
    let count = 0;
    for (const r of results) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      if (course?.semester === semester && r.status === "dean_approved") {
        updateResultStatus(r.id, "published");
        count++;
      }
    }
    toast.success(
      `${count} result${count !== 1 ? "s" : ""} published for ${semester} Semester`,
    );
  }

  const filtered = results.filter(
    (r) => filter === "all" || r.status === filter,
  );

  function handlePublish(id: bigint) {
    updateResultStatus(id, "published");
    toast.success("Result published");
  }

  return (
    <div className="space-y-6">
      {/* Publication Control */}
      <div className="bg-card rounded-xl border border-border shadow-xs p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Publication Control</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Publish all approved results for a semester at once. Students will
          only see published results.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(semesterGroups).map(([semester, stats]) => {
            const allPublished =
              stats.deanApproved === 0 && stats.published > 0;
            const hasApproved = stats.deanApproved > 0;
            const sealed = isSemesterSealed(semester);
            const seal = getSeal(semester);
            return (
              <div
                key={semester}
                className="rounded-lg border border-border bg-muted/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{semester} Semester</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.published} published &middot; {stats.deanApproved}{" "}
                      awaiting publication &middot; {stats.total} total
                    </p>
                  </div>
                  {allPublished ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                      <CheckCircle className="w-3 h-3" /> Published
                    </span>
                  ) : hasApproved ? (
                    <Button
                      data-ocid={`publication.${semester.toLowerCase()}.primary_button`}
                      size="sm"
                      onClick={() => publishSemester(semester)}
                      className="bg-primary text-primary-foreground text-xs h-7"
                    >
                      <Globe className="w-3 h-3 mr-1" /> Publish{" "}
                      {stats.deanApproved}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No results ready
                    </span>
                  )}
                </div>
                <div>
                  {sealed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                      &#10003; Verified &amp; Sealed &middot;{" "}
                      {new Date(seal?.sealedAt ?? "").toLocaleDateString()}
                    </span>
                  ) : (
                    <Button
                      data-ocid={`publication.${semester.toLowerCase()}.seal_button`}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        sealSemester(semester, currentSession);
                        toast.success(
                          `${semester} semester sealed and verified`,
                        );
                      }}
                      className="h-7 text-xs border-success/30 text-success hover:bg-success/10"
                    >
                      &#128274; Seal Semester
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {Object.keys(semesterGroups).length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">
              No results in the system yet
            </p>
          )}
        </div>
      </div>
      {pendingAmendments.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-200 shadow-xs">
          <div className="p-4 bg-amber-50 border-b border-amber-200 rounded-t-xl flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-sm text-amber-700">
              Pending Amendment Requests ({pendingAmendments.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Original CA/Exam</TableHead>
                <TableHead>New CA/Exam</TableHead>
                <TableHead>New Total</TableHead>
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
                        {a.originalCa}/{a.originalExam} ={" "}
                        {a.originalCa + a.originalExam}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-amber-700">
                      {a.newCa}/{a.newExam} = {a.newCa + a.newExam}
                    </TableCell>
                    <TableCell className="font-bold">
                      {a.newCa + a.newExam}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {a.reason}
                    </TableCell>
                    <TableCell className="text-xs">{a.lecturerName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`amendments.confirm_button.${i + 1}`}
                          size="sm"
                          onClick={() => approveAmendmentFinal(a.id)}
                          className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          data-ocid={`amendments.delete_button.${i + 1}`}
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
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">All Results</h1>
            <p className="text-sm text-muted-foreground">
              {results.length} total
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger data-ocid="results.filter.select" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="hod_approved">HOD Approved</SelectItem>
              <SelectItem value="dean_approved">Dean Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="results.empty_state"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r, i) => {
                const student = students.find(
                  (s) => String(s.id) === String(r.studentId),
                );
                const course = courses.find(
                  (c) => String(c.id) === String(r.courseId),
                );
                return (
                  <TableRow
                    key={String(r.id)}
                    data-ocid={`results.item.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm">
                      {student?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {course?.code ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">{r.caScore}</TableCell>
                    <TableCell className="text-sm">{r.examScore}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.totalScore}
                    </TableCell>
                    <TableCell className="font-bold">{r.grade}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.remarks}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      {r.status === "dean_approved" &&
                        (() => {
                          const course = courses.find(
                            (c) => String(c.id) === String(r.courseId),
                          );
                          const sealed = course
                            ? isSemesterSealed(course.semester)
                            : false;
                          return sealed ? (
                            <span className="text-xs text-muted-foreground">
                              Sealed
                            </span>
                          ) : (
                            <Button
                              data-ocid={`results.publish_button.${i + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => handlePublish(r.id)}
                              className="h-7 text-xs gap-1"
                            >
                              <Globe className="w-3 h-3" /> Publish
                            </Button>
                          );
                        })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function SummariesTab() {
  const { students, courses, results, departments } = useApp();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Build per-student per-semester summaries
  const summaries = useMemo(() => {
    const rows: {
      studentId: bigint;
      studentName: string;
      matric: string;
      dept: string;
      semester: string;
      courseCount: number;
      totalCredits: number;
      gpa: number;
      results: typeof results;
    }[] = [];

    for (const student of students) {
      const dept = departments.find(
        (d) => String(d.id) === String(student.departmentId),
      );
      const studentResults = results.filter(
        (r) =>
          r.studentId === student.id &&
          (r.status === "published" || r.status === "approved"),
      );

      // Group by semester
      const semGroups: Record<string, typeof results> = {};
      for (const r of studentResults) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        if (!course) continue;
        const sem = course.semester;
        if (!semGroups[sem]) semGroups[sem] = [];
        semGroups[sem].push(r);
      }

      for (const [semester, semResults] of Object.entries(semGroups)) {
        let weightedPoints = 0;
        let creditSum = 0;
        for (const r of semResults) {
          const course = courses.find(
            (c) => String(c.id) === String(r.courseId),
          );
          const credits = course ? Number(course.creditUnits) : 0;
          weightedPoints += r.gradePoint * credits;
          creditSum += credits;
        }
        const gpa = creditSum > 0 ? weightedPoints / creditSum : 0;
        rows.push({
          studentId: student.id,
          studentName: student.name,
          matric: student.matricNumber,
          dept: dept?.name ?? "-",
          semester,
          courseCount: semResults.length,
          totalCredits: creditSum,
          gpa,
          results: semResults,
        });
      }
    }

    return rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [students, courses, results, departments]);

  function handleDownloadAll() {
    const lines = [
      "Student Name,Matric,Department,Semester,Courses,Total Credits,GPA",
    ];
    for (const row of summaries) {
      lines.push(
        [
          `"${row.studentName}"`,
          row.matric,
          `"${row.dept}"`,
          row.semester,
          row.courseCount,
          row.totalCredits,
          row.gpa.toFixed(2),
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result_summaries.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Result summaries downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Result Summaries</h1>
          <p className="text-sm text-muted-foreground">
            Per-student semester GPA summaries
          </p>
        </div>
        {summaries.length > 0 && (
          <Button
            data-ocid="summaries.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadAll}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download All
          </Button>
        )}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Matric</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Total Credits</TableHead>
              <TableHead>GPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="summaries.empty_state"
                >
                  No published results available
                </TableCell>
              </TableRow>
            )}
            {summaries.map((row, i) => {
              const key = `${String(row.studentId)}-${row.semester}`;
              const isExpanded = expandedKey === key;
              return (
                <>
                  <TableRow
                    key={key}
                    data-ocid={`summaries.item.${i + 1}`}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                  >
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.matric}
                    </TableCell>
                    <TableCell className="text-sm">{row.dept}</TableCell>
                    <TableCell className="text-sm">
                      {row.semester} Semester
                    </TableCell>
                    <TableCell>{row.courseCount}</TableCell>
                    <TableCell>{row.totalCredits}</TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          row.gpa >= 3.5
                            ? "text-success"
                            : row.gpa >= 2.0
                              ? "text-warning"
                              : "text-destructive"
                        }`}
                      >
                        {row.gpa.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${key}-expanded`}>
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-muted/20 border-t border-b border-border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-8">
                                  Course Code
                                </TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Credits</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Points</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {row.results.map((r) => {
                                const course = courses.find(
                                  (c) => String(c.id) === String(r.courseId),
                                );
                                return (
                                  <TableRow key={String(r.id)}>
                                    <TableCell className="pl-8 font-mono text-xs">
                                      {course?.code ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {course?.name ?? "-"}
                                    </TableCell>
                                    <TableCell>
                                      {String(course?.creditUnits ?? 0)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {r.totalScore}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                      {r.grade}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {r.gradePoint.toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CarryoversTab() {
  const { students, courses, results, departments } = useApp();

  const carryovers = results.filter(
    (r) =>
      r.grade === "F" && (r.status === "published" || r.status === "approved"),
  );

  function handleDownloadCSV() {
    const lines = [
      "Student Name,Matric,Department,Course Code,Course Name,Semester,Total Score,Grade",
    ];
    for (const r of carryovers) {
      const student = students.find(
        (s) => String(s.id) === String(r.studentId),
      );
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const dept = student
        ? departments.find((d) => String(d.id) === String(student.departmentId))
        : null;
      lines.push(
        [
          `"${student?.name ?? "-"}"`,
          student?.matricNumber ?? "-",
          `"${dept?.name ?? "-"}"`,
          course?.code ?? "-",
          `"${course?.name ?? "-"}"`,
          course?.semester ?? "-",
          r.totalScore,
          r.grade,
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carryover_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Carry-over report downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Carry-over Students</h1>
          <p className="text-sm text-muted-foreground">
            {carryovers.length} carry-over result
            {carryovers.length !== 1 ? "s" : ""} institution-wide
          </p>
        </div>
        {carryovers.length > 0 && (
          <Button
            data-ocid="carryovers.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadCSV}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download CSV
          </Button>
        )}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Course Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carryovers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="carryovers.empty_state"
                >
                  <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
                  No carry-over students
                </TableCell>
              </TableRow>
            )}
            {carryovers.map((r, i) => {
              const student = students.find(
                (s) => String(s.id) === String(r.studentId),
              );
              const course = courses.find(
                (c) => String(c.id) === String(r.courseId),
              );
              const dept = student
                ? departments.find(
                    (d) => String(d.id) === String(student.departmentId),
                  )
                : null;
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
                  <TableCell className="text-sm">{dept?.name ?? "-"}</TableCell>
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

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#a855f7",
  F: "#ef4444",
};

function StatisticsTab() {
  const { students, courses, results, departments } = useApp();

  const totalResults = results.length;
  const passCount = results.filter((r) => r.grade !== "F").length;
  const passRate =
    totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

  const gradeDistribution = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
  }));

  // Top/Bottom 5 courses by avg score
  const coursePerf = useMemo(() => {
    return courses
      .map((c) => {
        const cResults = results.filter((r) => r.courseId === c.id);
        if (cResults.length === 0) return null;
        const avg =
          cResults.reduce((sum, r) => sum + r.totalScore, 0) / cResults.length;
        const pass = cResults.filter((r) => r.grade !== "F").length;
        const passRateC = Math.round((pass / cResults.length) * 100);
        return {
          code: c.code,
          name: c.name,
          avgScore: Math.round(avg * 10) / 10,
          passRate: passRateC,
          count: cResults.length,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [courses, results]);

  const top5 = coursePerf.slice(0, 5);
  const bottom5 = [...coursePerf].reverse().slice(0, 5);

  // Department summary
  const deptSummary = useMemo(() => {
    return departments.map((dept) => {
      const deptStudents = students.filter(
        (s) => s.departmentId === dept.id,
      ).length;
      const deptResults = results.filter((r) => {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        return course?.departmentId === dept.id;
      });
      const avg =
        deptResults.length > 0
          ? Math.round(
              (deptResults.reduce((sum, r) => sum + r.totalScore, 0) /
                deptResults.length) *
                10,
            ) / 10
          : 0;
      const pass = deptResults.filter((r) => r.grade !== "F").length;
      const pr =
        deptResults.length > 0
          ? Math.round((pass / deptResults.length) * 100)
          : 0;
      return {
        name: dept.name,
        studentCount: deptStudents,
        avgScore: avg,
        passRate: pr,
      };
    });
  }, [departments, students, courses, results]);

  function handleDownloadStatistics() {
    const lines: string[] = [
      "=== INSTITUTION STATISTICS ===",
      `Total Students,${students.length}`,
      `Total Courses,${courses.length}`,
      `Total Results,${totalResults}`,
      `Institution Pass Rate,${passRate}%`,
      "",
      "=== GRADE DISTRIBUTION ===",
      "Grade,Count",
      ...gradeDistribution.map((g) => `${g.grade},${g.count}`),
      "",
      "=== TOP 5 PERFORMING COURSES ===",
      "Course Code,Course Name,Avg Score,Pass Rate,Results",
      ...top5.map(
        (c) => `${c.code},"${c.name}",${c.avgScore},${c.passRate}%,${c.count}`,
      ),
      "",
      "=== BOTTOM 5 PERFORMING COURSES ===",
      "Course Code,Course Name,Avg Score,Pass Rate,Results",
      ...bottom5.map(
        (c) => `${c.code},"${c.name}",${c.avgScore},${c.passRate}%,${c.count}`,
      ),
      "",
      "=== DEPARTMENT SUMMARY ===",
      "Department,Student Count,Avg Score,Pass Rate",
      ...deptSummary.map(
        (d) => `"${d.name}",${d.studentCount},${d.avgScore},${d.passRate}%`,
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "institution_statistics.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statistics report downloaded");
  }

  function handleExportFullSemester() {
    const header =
      "Name,Matric,Department,Semester,Course Code,Course Name,CA,Exam,Total,Grade,Remarks,Status";
    const rows = results.map((r) => {
      const student = students.find(
        (s) => String(s.id) === String(r.studentId),
      );
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const dept = departments.find(
        (d) => String(d.id) === String(course?.departmentId),
      );
      return [
        `"${student?.name ?? ""}"`,
        student?.matricNumber ?? "",
        `"${dept?.name ?? ""}"`,
        course?.semester ?? "",
        course?.code ?? "",
        `"${course?.name ?? ""}"`,
        r.caScore,
        r.examScore,
        r.totalScore,
        r.grade,
        `"${r.remarks}"`,
        r.status,
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "full_semester_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Full semester report downloaded");
  }

  function handleExportDeptSummary() {
    const header =
      "Department,Total Students,Total Results,Pass Rate,Avg Score,A Count,B Count,C Count,D Count,E Count,F Count";
    const rows = deptSummary.map((d) => {
      const dept = departments.find((dep) => dep.name === d.name);
      const deptResults = results.filter((r) => {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        return course?.departmentId === dept?.id;
      });
      const gradeCount = (g: string) =>
        deptResults.filter((r) => r.grade === g).length;
      return `"${d.name}",${d.studentCount},${deptResults.length},${d.passRate}%,${d.avgScore},${gradeCount("A")},${gradeCount("B")},${gradeCount("C")},${gradeCount("D")},${gradeCount("E")},${gradeCount("F")}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "department_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Department summary downloaded");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Institution Statistics</h1>
          <p className="text-sm text-muted-foreground">
            Overview of academic performance across the institution
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            data-ocid="statistics.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadStatistics}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Report
          </Button>
          <Button
            data-ocid="statistics.full_semester_export_button"
            size="sm"
            variant="outline"
            onClick={handleExportFullSemester}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Full Semester CSV
          </Button>
          <Button
            data-ocid="statistics.dept_summary_export_button"
            size="sm"
            variant="outline"
            onClick={handleExportDeptSummary}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Dept Summary CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <Users className="w-3 h-3" /> Total Students
          </p>
          <p className="text-3xl font-bold">{students.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3" /> Total Courses
          </p>
          <p className="text-3xl font-bold">{courses.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <ClipboardList className="w-3 h-3" /> Results Processed
          </p>
          <p className="text-3xl font-bold">{totalResults}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3" /> Institution Pass Rate
          </p>
          <p
            className={`text-3xl font-bold ${
              passRate >= 70 ? "text-success" : "text-warning"
            }`}
          >
            {passRate}%
          </p>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold mb-4">Grade Distribution</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gradeDistribution}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.93 0.01 250)"
            />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 */}
        <div className="bg-card border border-border rounded-xl shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-success">
              🏆 Top 5 Performing Courses
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                    data-ocid="statistics.top5.empty_state"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                top5.map((c, i) => (
                  <TableRow
                    key={c.code}
                    data-ocid={`statistics.top5.item.${i + 1}`}
                  >
                    <TableCell className="font-mono font-medium">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-sm">{c.name}</TableCell>
                    <TableCell className="font-bold text-success">
                      {c.avgScore}
                    </TableCell>
                    <TableCell className="text-success font-medium">
                      {c.passRate}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom 5 */}
        <div className="bg-card border border-border rounded-xl shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-destructive">
              ⚠️ Bottom 5 Performing Courses
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bottom5.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                    data-ocid="statistics.bottom5.empty_state"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                bottom5.map((c, i) => (
                  <TableRow
                    key={c.code}
                    data-ocid={`statistics.bottom5.item.${i + 1}`}
                  >
                    <TableCell className="font-mono font-medium">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-sm">{c.name}</TableCell>
                    <TableCell className="font-bold text-destructive">
                      {c.avgScore}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {c.passRate}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Department Summary */}
      <div className="bg-card border border-border rounded-xl shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Department Summary</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Student Count</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Pass Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptSummary.map((d, i) => (
              <TableRow
                key={d.name}
                data-ocid={`statistics.dept.item.${i + 1}`}
              >
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.studentCount}</TableCell>
                <TableCell className="font-medium">{d.avgScore}</TableCell>
                <TableCell>
                  <span
                    className={`font-semibold ${
                      d.passRate >= 70
                        ? "text-success"
                        : d.passRate >= 50
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {d.passRate}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RolesTab() {
  const [principal, setPrincipal] = useState("");
  const [role, setRole] = useState("");

  function handleAssign() {
    if (!principal || !role) return;
    toast.success(`Role "${role}" assigned to ${principal}`);
    setPrincipal("");
    setRole("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Assign User Roles</h1>
        <p className="text-sm text-muted-foreground">
          Set roles for users by their principal ID
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 shadow-xs max-w-md">
        <div className="space-y-4">
          <div>
            <Label>Principal ID</Label>
            <Input
              data-ocid="roles.principal.input"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g. aaaaa-bbbbb-ccccc"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-ocid="roles.role.select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {["SuperAdmin", "Registrar", "HOD", "Lecturer", "Student"].map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            data-ocid="roles.submit_button"
            onClick={handleAssign}
            className="w-full bg-primary text-primary-foreground"
            disabled={!principal || !role}
          >
            Assign Role
          </Button>
        </div>
      </div>
    </div>
  );
}

function CourseManagementTab() {
  const { courses, departments, addCourse, updateCourse, removeCourse } =
    useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    credits: "3",
    deptId: "",
    lecturer: "",
    semester: "First",
  });

  function resetForm() {
    setForm({
      name: "",
      code: "",
      credits: "3",
      deptId: "",
      lecturer: "",
      semester: "First",
    });
    setEditing(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      name: course.name,
      code: course.code,
      credits: String(course.creditUnits),
      deptId: String(course.departmentId),
      lecturer: course.lecturerPrincipal,
      semester: course.semester,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.code || !form.deptId) {
      toast.error("Name, code, and department are required");
      return;
    }
    const courseData: Course = {
      id: editing?.id ?? BigInt(Date.now()),
      name: form.name,
      code: form.code,
      creditUnits: BigInt(form.credits),
      departmentId: BigInt(form.deptId),
      lecturerPrincipal: form.lecturer || "unassigned",
      semester: form.semester,
    };
    if (editing) {
      updateCourse(courseData);
      toast.success("Course updated");
    } else {
      addCourse(courseData);
      toast.success("Course added");
    }
    resetForm();
    setOpen(false);
  }

  function handleDelete(id: bigint) {
    removeCourse(id);
    toast.success("Course removed");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Course Management</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} courses
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) resetForm();
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="coursemgmt.open_modal_button"
              size="sm"
              onClick={openAdd}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="coursemgmt.dialog">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Course" : "New Course"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Course Name</Label>
                <Input
                  data-ocid="coursemgmt.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div>
                <Label>Course Code</Label>
                <Input
                  data-ocid="coursemgmt.code.input"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="e.g. CSC301"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Credit Units</Label>
                  <Select
                    value={form.credits}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, credits: v }))
                    }
                  >
                    <SelectTrigger data-ocid="coursemgmt.credits.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4", "6"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c} unit{c !== "1" ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={form.semester}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, semester: v }))
                    }
                  >
                    <SelectTrigger data-ocid="coursemgmt.semester.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First">First</SelectItem>
                      <SelectItem value="Second">Second</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  value={form.deptId}
                  onValueChange={(v) => setForm((f) => ({ ...f, deptId: v }))}
                >
                  <SelectTrigger data-ocid="coursemgmt.dept.select">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={String(d.id)} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lecturer Principal (optional)</Label>
                <Input
                  data-ocid="coursemgmt.lecturer.input"
                  value={form.lecturer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lecturer: e.target.value }))
                  }
                  placeholder="e.g. lecturer-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="coursemgmt.cancel_button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="coursemgmt.save_button"
                onClick={handleSave}
                className="bg-primary text-primary-foreground"
              >
                {editing ? "Save Changes" : "Add Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                  data-ocid="coursemgmt.empty_state"
                >
                  No courses yet
                </TableCell>
              </TableRow>
            )}
            {courses.map((c, i) => {
              const dept = departments.find(
                (d) => String(d.id) === String(c.departmentId),
              );
              return (
                <TableRow
                  key={String(c.id)}
                  data-ocid={`coursemgmt.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {c.code}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dept?.name ?? "-"}
                  </TableCell>
                  <TableCell>{String(c.creditUnits)}</TableCell>
                  <TableCell>{c.semester}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.lecturerPrincipal}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`coursemgmt.edit_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(c)}
                        className="h-7 text-xs"
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button
                        data-ocid={`coursemgmt.delete_button.${i + 1}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(c.id)}
                        className="h-7 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
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
  );
}

function AcademicCalendarTab() {
  const {
    academicCalendars,
    addAcademicCalendar,
    setActiveCalendar,
    toggleRegistrationOpen,
    toggleAddDropOpen,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    session: "",
    semester: "First" as "First" | "Second",
    startDate: "",
    endDate: "",
  });

  function handleAdd() {
    if (!form.session || !form.startDate || !form.endDate) {
      toast.error("All fields are required");
      return;
    }
    const cal: AcademicCalendar = {
      id: BigInt(Date.now()),
      session: form.session,
      semester: form.semester,
      isActive: false,
      startDate: form.startDate,
      endDate: form.endDate,
      registrationOpen: false,
      addDropOpen: false,
    };
    addAcademicCalendar(cal);
    setForm({ session: "", semester: "First", startDate: "", endDate: "" });
    setOpen(false);
    toast.success("Academic calendar added");
  }

  function handleSetActive(id: bigint) {
    setActiveCalendar(id);
    toast.success("Active calendar updated");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Academic Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage sessions and active semesters
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="calendar.open_modal_button"
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Session
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="calendar.dialog">
            <DialogHeader>
              <DialogTitle>New Academic Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Session (e.g. 2024/2025)</Label>
                <Input
                  data-ocid="calendar.session.input"
                  value={form.session}
                  onChange={(e) =>
                    setForm({ ...form, session: e.target.value })
                  }
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <Label>Semester</Label>
                <Select
                  value={form.semester}
                  onValueChange={(v) =>
                    setForm({ ...form, semester: v as "First" | "Second" })
                  }
                >
                  <SelectTrigger data-ocid="calendar.semester.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First</SelectItem>
                    <SelectItem value="Second">Second</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    data-ocid="calendar.start_date.input"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    data-ocid="calendar.end_date.input"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="calendar.cancel_button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="calendar.submit_button"
                onClick={handleAdd}
                className="bg-primary text-primary-foreground"
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Add/Drop</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {academicCalendars.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="calendar.empty_state"
                >
                  No academic calendars yet
                </TableCell>
              </TableRow>
            )}
            {academicCalendars.map((cal, i) => (
              <TableRow
                key={String(cal.id)}
                data-ocid={`calendar.item.${i + 1}`}
                className={cal.isActive ? "bg-success/5" : ""}
              >
                <TableCell className="font-semibold">{cal.session}</TableCell>
                <TableCell>{cal.semester}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cal.startDate} &ndash; {cal.endDate}
                </TableCell>
                <TableCell>
                  {cal.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={cal.registrationOpen ? "default" : "outline"}
                    onClick={() => {
                      toggleRegistrationOpen(cal.id);
                      toast.success(
                        cal.registrationOpen
                          ? "Registration closed"
                          : "Registration opened",
                      );
                    }}
                    className={`h-7 text-xs ${cal.registrationOpen ? "bg-success text-success-foreground hover:bg-success/90" : ""}`}
                    data-ocid={`calendar.toggle_reg.${i + 1}`}
                  >
                    {cal.registrationOpen ? "✓ Open" : "Closed"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={cal.addDropOpen ? "default" : "outline"}
                    onClick={() => {
                      toggleAddDropOpen(cal.id);
                      toast.success(
                        cal.addDropOpen ? "Add/Drop closed" : "Add/Drop opened",
                      );
                    }}
                    className={`h-7 text-xs ${cal.addDropOpen ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                    data-ocid={`calendar.toggle_add_drop.${i + 1}`}
                  >
                    {cal.addDropOpen ? "✓ Open" : "Closed"}
                  </Button>
                </TableCell>
                <TableCell>
                  {!cal.isActive && (
                    <Button
                      data-ocid={`calendar.set_active_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetActive(cal.id)}
                      className="h-7 text-xs"
                    >
                      Set Active
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AuditLogTab() {
  const { auditLog } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const roles = Array.from(new Set(auditLog.map((e) => e.actorRole))).filter(
    Boolean,
  );

  const filtered = auditLog.filter((entry) => {
    const matchSearch =
      !search ||
      entry.actorName.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.details.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || entry.actorRole === roleFilter;
    const matchDate = !dateFilter || entry.timestamp.startsWith(dateFilter);
    return matchSearch && matchRole && matchDate;
  });

  function handleDownload() {
    const header = "Timestamp,Actor,Role,Action,Details";
    const rows = filtered.map((e) =>
      [
        e.timestamp,
        `"${e.actorName}"`,
        e.actorRole,
        `"${e.action}"`,
        `"${e.details}"`,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_log.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log downloaded");
  }

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} entries
          </p>
        </div>
        <Button
          data-ocid="audit.download_button"
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" /> Download CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          data-ocid="audit.search_input"
          placeholder="Search by actor, action, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-8 text-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger
            data-ocid="audit.role.select"
            className="w-40 h-8 text-sm"
          >
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          data-ocid="audit.date.input"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40 h-8 text-sm"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                  data-ocid="audit.empty_state"
                >
                  No audit entries found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((entry, i) => (
              <TableRow
                key={String(entry.id)}
                data-ocid={`audit.item.${i + 1}`}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {fmt(entry.timestamp)}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {entry.actorName}
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {entry.actorRole}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {entry.action}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {entry.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ===================== FACULTIES TAB =====================
function FacultiesTab() {
  const { faculties, addFaculty, bulkAddFaculties, resetToDefaultData } =
    useApp();
  const [open, setOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [name, setName] = useState("");
  const [bulkFacOpen, setBulkFacOpen] = useState(false);
  const [bulkFacRows, setBulkFacRows] = useState<
    { facultyCode: string; facultyName: string; deanName: string }[]
  >([]);

  function downloadFacTemplate() {
    const csv =
      "facultyCode,facultyName,deanName\nFSCI,Faculty of Sciences,Prof. Adebayo\nFENG,Faculty of Engineering,Dr. Okafor";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "faculties_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleFacFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const rows = lines
        .slice(1)
        .map((line) => {
          const [facultyCode, facultyName, deanName] = line.split(",");
          return {
            facultyCode: facultyCode?.trim() || "",
            facultyName: facultyName?.trim() || "",
            deanName: deanName?.trim() || "",
          };
        })
        .filter((r) => r.facultyName);
      setBulkFacRows(rows);
    };
    reader.readAsText(file);
  }

  function handleFacImport() {
    const newFacs = bulkFacRows.map((r) => ({
      id: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
      name: r.facultyName,
    }));
    bulkAddFaculties(newFacs);
    toast.success(`${newFacs.length} faculties imported`);
    setBulkFacOpen(false);
    setBulkFacRows([]);
  }

  function handleAdd() {
    if (!name.trim()) return;
    addFaculty({ id: BigInt(Date.now()), name: name.trim() });
    setName("");
    setOpen(false);
    toast.success("Faculty added");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Faculties</h1>
          <p className="text-sm text-muted-foreground">
            {faculties.length} faculties registered
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            data-ocid="faculties.generate_data_button"
            variant="outline"
            size="sm"
            onClick={() => setShowResetDialog(true)}
          >
            ⚡ Generate Default Data
          </Button>
          <Button
            data-ocid="faculties.bulk_upload_button"
            variant="outline"
            size="sm"
            onClick={() => setBulkFacOpen(true)}
          >
            <Upload className="w-4 h-4 mr-1" />
            Bulk Upload
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-ocid="faculties.open_modal_button"
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Faculty
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="faculties.dialog">
              <DialogHeader>
                <DialogTitle>New Faculty</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Faculty Name</Label>
                <Input
                  data-ocid="faculties.input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Faculty of Sciences"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </div>
              <DialogFooter>
                <Button
                  data-ocid="faculties.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="faculties.submit_button"
                  onClick={handleAdd}
                  className="bg-primary text-primary-foreground"
                >
                  Add Faculty
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Generate Default Data Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent data-ocid="faculties.reset_dialog">
            <DialogHeader>
              <DialogTitle>Generate Default University Data</DialogTitle>
              <DialogDescription>
                This will populate the system with a comprehensive Nigerian
                university structure including 6 faculties, 24 departments, and
                130+ courses. Existing students and results will NOT be
                affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                data-ocid="faculties.reset_cancel_button"
                variant="outline"
                onClick={() => setShowResetDialog(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="faculties.reset_confirm_button"
                onClick={() => {
                  resetToDefaultData();
                  setShowResetDialog(false);
                  toast.success(
                    "Default university data generated successfully!",
                  );
                }}
              >
                Generate Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={bulkFacOpen} onOpenChange={setBulkFacOpen}>
          <DialogContent data-ocid="faculties.bulk.dialog" className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Bulk Upload Faculties</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFacTemplate}
                data-ocid="faculties.bulk.download_button"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </Button>
              <div>
                <Label>Upload CSV</Label>
                <input
                  data-ocid="faculties.bulk.upload_button"
                  type="file"
                  accept=".csv"
                  className="block w-full text-sm mt-1"
                  onChange={handleFacFile}
                />
              </div>
              {bulkFacRows.length > 0 && (
                <div className="overflow-auto max-h-40 border rounded">
                  <table className="text-xs w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-1.5 text-left">Code</th>
                        <th className="p-1.5 text-left">Faculty Name</th>
                        <th className="p-1.5 text-left">Dean</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkFacRows.map((r) => (
                        <tr
                          key={`fac-${r.facultyCode}-${r.facultyName}`}
                          className="border-t"
                        >
                          <td className="p-1.5 font-mono">{r.facultyCode}</td>
                          <td className="p-1.5">{r.facultyName}</td>
                          <td className="p-1.5">{r.deanName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkFacOpen(false)}
                data-ocid="faculties.bulk.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleFacImport}
                disabled={bulkFacRows.length === 0}
                className="bg-primary text-primary-foreground"
                data-ocid="faculties.bulk.submit_button"
              >
                Import {bulkFacRows.length} Faculties
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Faculty Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faculties.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="faculties.empty_state"
                >
                  No faculties found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {faculties.map((f: Faculty, i: number) => (
              <TableRow
                key={String(f.id)}
                data-ocid={`faculties.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell className="text-muted-foreground text-sm font-mono">
                  {String(f.id)}
                </TableCell>
                <TableCell className="font-medium">{f.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ===================== GRADUATION CLEARANCE TAB =====================
function GraduationClearanceTab() {
  const { graduationApplications, updateGraduationStatus } = useApp();
  const [filter, setFilter] = useState<"all" | GraduationApplication["status"]>(
    "all",
  );
  const [noteOpen, setNoteOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<GraduationApplication | null>(
    null,
  );
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [certApp, setCertApp] = useState<GraduationApplication | null>(null);
  const [certOpen, setCertOpen] = useState(false);

  const filtered =
    filter === "all"
      ? graduationApplications
      : graduationApplications.filter((a) => a.status === filter);

  function openAction(app: GraduationApplication, type: "approve" | "reject") {
    setSelectedApp(app);
    setActionType(type);
    setNote("");
    setNoteOpen(true);
  }

  function confirmAction() {
    if (!selectedApp) return;
    const newStatus: GraduationApplication["status"] =
      actionType === "approve" ? "approved" : "rejected";
    updateGraduationStatus(
      selectedApp.id,
      newStatus,
      note || undefined,
      "registrarNote",
    );
    setNoteOpen(false);
    toast.success(
      actionType === "approve" ? "Graduation approved" : "Application rejected",
    );
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      pending_hod: "bg-yellow-100 text-yellow-700",
      pending_dean: "bg-blue-100 text-blue-700",
      pending_registrar: "bg-purple-100 text-purple-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Graduation Clearance</h1>
          <p className="text-sm text-muted-foreground">
            {graduated(graduationApplications)} approved,{" "}
            {
              graduationApplications.filter(
                (a) => a.status === "pending_registrar",
              ).length
            }{" "}
            pending your review
          </p>
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <SelectTrigger
            data-ocid="graduation.filter.select"
            className="w-48 h-8 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending_hod">Pending HOD</SelectItem>
            <SelectItem value="pending_dean">Pending Dean</SelectItem>
            <SelectItem value="pending_registrar">Pending Registrar</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Matric</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Checks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="graduation.empty_state"
                >
                  No applications found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((app, i) => (
              <TableRow
                key={String(app.id)}
                data-ocid={`graduation.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell className="font-medium">{app.studentName}</TableCell>
                <TableCell className="font-mono text-sm">
                  {app.matric}
                </TableCell>
                <TableCell className="text-sm">{app.department}</TableCell>
                <TableCell className="text-sm">{app.session}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${app.creditCheck ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      Credits {app.creditCheck ? "✓" : "✗"}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${app.carryoverCheck ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      No F {app.carryoverCheck ? "✓" : "✗"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(app.status)}`}
                  >
                    {app.status.replace(/_/g, " ")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {app.status === "pending_registrar" && (
                      <>
                        <Button
                          data-ocid={`graduation.confirm_button.${i + 1}`}
                          size="sm"
                          onClick={() => openAction(app, "approve")}
                          className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                        >
                          Approve
                        </Button>
                        <Button
                          data-ocid={`graduation.delete_button.${i + 1}`}
                          size="sm"
                          variant="destructive"
                          onClick={() => openAction(app, "reject")}
                          className="h-7 text-xs"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {app.status === "approved" && (
                      <Button
                        data-ocid={`graduation.print_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setCertApp(app);
                          setCertOpen(true);
                        }}
                      >
                        🎓 Print Certificate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {certApp && (
        <ClearanceCertificateModal
          app={certApp}
          open={certOpen}
          onClose={() => setCertOpen(false)}
        />
      )}

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent data-ocid="graduation.dialog">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Graduation"
                : "Reject Application"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Student: <strong>{selectedApp?.studentName}</strong>
            </p>
            <Label>Note (optional)</Label>
            <Textarea
              data-ocid="graduation.textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="graduation.cancel_button"
              variant="outline"
              onClick={() => setNoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="graduation.confirm_button.1"
              onClick={confirmAction}
              className={
                actionType === "approve"
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              }
            >
              {actionType === "approve"
                ? "Confirm Approval"
                : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function graduated(apps: GraduationApplication[]) {
  return apps.filter((a) => a.status === "approved").length;
}

// ===================== TIMETABLE BUILDER TAB =====================
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

function TimetableBuilderTab() {
  const { timetableEntries, addTimetableEntry, removeTimetableEntry, courses } =
    useApp();
  const [open, setOpen] = useState(false);
  const [clashWarning, setClashWarning] = useState<string | null>(null);
  const [pendingEntry, setPendingEntry] = useState<TimetableEntry | null>(null);
  const [form, setForm] = useState<{
    courseId: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    semester: string;
  }>({
    courseId: "",
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    venue: "",
    semester: "First",
  });

  function detectClashes(entry: TimetableEntry): string[] {
    const newCourse = courses.find(
      (c) => String(c.id) === String(entry.courseId),
    );
    const clashes: string[] = [];
    for (const existing of timetableEntries) {
      if (existing.day !== entry.day) continue;
      // Check time overlap
      const overlap =
        entry.startTime < existing.endTime &&
        entry.endTime > existing.startTime;
      if (!overlap) continue;
      const existingCourse = courses.find(
        (c) => String(c.id) === String(existing.courseId),
      );
      // Same department clash
      if (
        newCourse &&
        existingCourse &&
        newCourse.departmentId === existingCourse.departmentId
      ) {
        clashes.push(
          `${existingCourse.code} (${existing.startTime}-${existing.endTime}) - same department`,
        );
      }
    }
    return clashes;
  }

  function handleAdd() {
    if (!form.courseId || !form.venue) {
      toast.error("Please fill all required fields");
      return;
    }
    const entry: TimetableEntry = {
      id: BigInt(Date.now()),
      courseId: BigInt(form.courseId),
      day: form.day as TimetableEntry["day"],
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue.trim(),
      semester: form.semester,
    };
    const clashes = detectClashes(entry);
    if (clashes.length > 0) {
      setClashWarning(`Clash detected: ${clashes.join("; ")}`);
      setPendingEntry(entry);
      return;
    }
    commitEntry(entry);
  }

  function commitEntry(entry: TimetableEntry) {
    addTimetableEntry(entry);
    setOpen(false);
    setClashWarning(null);
    setPendingEntry(null);
    setForm({
      courseId: "",
      day: "Monday",
      startTime: "08:00",
      endTime: "10:00",
      venue: "",
      semester: "First",
    });
    toast.success("Timetable entry added");
  }

  // Detect all current clashes for the summary panel
  const allClashes: {
    entry1: TimetableEntry;
    entry2: TimetableEntry;
    reason: string;
  }[] = [];
  for (let i = 0; i < timetableEntries.length; i++) {
    for (let j = i + 1; j < timetableEntries.length; j++) {
      const a = timetableEntries[i];
      const b = timetableEntries[j];
      if (a.day !== b.day) continue;
      const overlap = a.startTime < b.endTime && a.endTime > b.startTime;
      if (!overlap) continue;
      const ca = courses.find((c) => String(c.id) === String(a.courseId));
      const cb = courses.find((c) => String(c.id) === String(b.courseId));
      if (ca && cb && ca.departmentId === cb.departmentId) {
        allClashes.push({ entry1: a, entry2: b, reason: "same department" });
      }
    }
  }

  const sorted = [...timetableEntries].sort((a, b) => {
    const di =
      DAYS.indexOf(a.day as (typeof DAYS)[number]) -
      DAYS.indexOf(b.day as (typeof DAYS)[number]);
    if (di !== 0) return di;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Course Timetable</h1>
          <p className="text-sm text-muted-foreground">
            {timetableEntries.length} scheduled classes
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="timetable.open_modal_button"
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="timetable.dialog">
            <DialogHeader>
              <DialogTitle>New Timetable Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Course</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) => setForm((p) => ({ ...p, courseId: v }))}
                >
                  <SelectTrigger
                    data-ocid="timetable.course.select"
                    className="mt-1"
                  >
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={String(c.id)} value={String(c.id)}>
                        {c.code} – {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Day</Label>
                  <Select
                    value={form.day}
                    onValueChange={(v) => setForm((p) => ({ ...p, day: v }))}
                  >
                    <SelectTrigger
                      data-ocid="timetable.day.select"
                      className="mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={form.semester}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, semester: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="timetable.semester.select"
                      className="mt-1"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First">First</SelectItem>
                      <SelectItem value="Second">Second</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    data-ocid="timetable.start_time.input"
                    type="time"
                    className="mt-1"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startTime: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    data-ocid="timetable.end_time.input"
                    type="time"
                    className="mt-1"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Venue</Label>
                <Input
                  data-ocid="timetable.venue.input"
                  className="mt-1"
                  value={form.venue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, venue: e.target.value }))
                  }
                  placeholder="e.g. Room 101"
                />
              </div>
            </div>
            {clashWarning && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                ⚠ {clashWarning}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingEntry) commitEntry(pendingEntry);
                    }}
                    className="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                    data-ocid="timetable.confirm_button"
                  >
                    Override & Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClashWarning(null);
                      setPendingEntry(null);
                    }}
                    className="px-2 py-1 border border-border rounded text-xs"
                    data-ocid="timetable.cancel_button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {!clashWarning && (
              <DialogFooter>
                <Button
                  data-ocid="timetable.cancel_button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="timetable.submit_button"
                  onClick={handleAdd}
                  className="bg-primary text-primary-foreground"
                >
                  Add Entry
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {allClashes.length > 0 && (
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-2"
          data-ocid="timetable.error_state"
        >
          <h3 className="text-sm font-semibold text-destructive">
            ⚠ Timetable Clashes ({allClashes.length})
          </h3>
          {allClashes.map((clash, _i) => {
            const ca = courses.find(
              (c) => String(c.id) === String(clash.entry1.courseId),
            );
            const cb = courses.find(
              (c) => String(c.id) === String(clash.entry2.courseId),
            );
            return (
              <p
                key={`${String(clash.entry1.id)}-${String(clash.entry2.id)}`}
                className="text-xs text-destructive"
              >
                {clash.entry1.day} {clash.entry1.startTime}-
                {clash.entry1.endTime}: {ca?.code ?? "?"} vs {cb?.code ?? "?"} —{" "}
                {clash.reason}
              </p>
            );
          })}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="timetable.empty_state"
                >
                  No timetable entries. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((entry, i) => {
              const course = courses.find(
                (c) => String(c.id) === String(entry.courseId),
              );
              return (
                <TableRow
                  key={String(entry.id)}
                  data-ocid={`timetable.item.${i + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-medium">{entry.day}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.startTime} – {entry.endTime}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{course?.code ?? "?"}</span>
                    <span className="text-muted-foreground text-sm ml-1">
                      – {course?.name ?? "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{entry.venue}</TableCell>
                  <TableCell className="text-sm">{entry.semester}</TableCell>
                  <TableCell>
                    <Button
                      data-ocid={`timetable.delete_button.${i + 1}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        removeTimetableEntry(entry.id);
                        toast.success("Entry removed");
                      }}
                      className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
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

function PendingRegistrationsTab() {
  const { students, addStudent } = useApp();
  const [registrations, setRegistrations] = useState<PendingRegistration[]>(
    () => getPendingRegistrations(),
  );

  function refresh() {
    setRegistrations(getPendingRegistrations());
  }

  function handleApprove(reg: PendingRegistration) {
    // Create a new user account in the students/users structure
    const existing = getPendingRegistrations();
    const updated = existing.map((r) =>
      r.id === reg.id ? { ...r, status: "approved" as const } : r,
    );
    savePendingRegistrations(updated);

    // If student role, create a student record
    if (reg.roleRequested === "Student") {
      const newId = BigInt(Date.now());
      const matricNum = `STU/${new Date().getFullYear()}/${String(students.length + 1).padStart(3, "0")}`;
      addStudent({
        id: newId,
        name: reg.name,
        matricNumber: matricNum,
        departmentId: BigInt(1),
        level: 100,
        session: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        status: "active",
        email: reg.email,
        phone: "",
        admissionDate: new Date().toISOString().slice(0, 10),
        academicStanding: "good_standing",
        advisorId: undefined,
      } as any);
    }

    toast.success(`${reg.name}'s request has been approved.`);
    refresh();
  }

  function handleReject(reg: PendingRegistration) {
    const existing = getPendingRegistrations();
    const updated = existing.filter((r) => r.id !== reg.id);
    savePendingRegistrations(updated);
    toast.success(`${reg.name}'s request has been rejected.`);
    refresh();
  }

  const pending = registrations.filter((r) => r.status === "pending");
  const processed = registrations.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Pending Registrations
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve user access requests submitted via the login page.
        </p>
      </div>

      {pending.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="pending_reg.empty_state"
        >
          <UserCheck className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            No pending registrations
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            New access requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="pending_reg.list">
          {pending.map((reg, idx) => (
            <div
              key={reg.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card"
              data-ocid={`pending_reg.item.${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">
                  {reg.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-foreground">
                    {reg.name}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                    {reg.roleRequested}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reg.email}
                </p>
                {reg.department && (
                  <p className="text-xs text-muted-foreground">
                    Department: {reg.department}
                  </p>
                )}
                {reg.message && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    &ldquo;{reg.message}&rdquo;
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Submitted: {new Date(reg.submittedAt).toLocaleString("en-NG")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-900/20 text-xs h-8"
                  onClick={() => handleApprove(reg)}
                  data-ocid={`pending_reg.confirm_button.${idx + 1}`}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10 text-xs h-8"
                  onClick={() => handleReject(reg)}
                  data-ocid={`pending_reg.delete_button.${idx + 1}`}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Recently Processed
          </h3>
          <div className="space-y-2">
            {processed.slice(0, 10).map((reg) => (
              <div
                key={reg.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-border/50 bg-muted/20"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {reg.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reg.email} · {reg.roleRequested}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    reg.status === "approved"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {reg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
