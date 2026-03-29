import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  ClipboardPaste,
  Download,
  FileText,
  GraduationCap,
  Info,
  Lock,
  MessageSquare,
  MinusCircle,
  PlusCircle,
  Printer,
  RefreshCw,
  ScanLine,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { TabContext } from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  type GradeAppeal,
  type GraduationApplication,
  getAcademicStanding,
  getStudentDepartment,
  getStudentFaculty,
  isCourseCore,
  useApp,
} from "../context/AppContext";
import { useInstitutionConfig } from "../hooks/useInstitutionConfig";
import { UpcomingEventsWidget } from "./tabs/AcademicCalendarEventsTab";
import { AnnouncementsNoticesPanel } from "./tabs/AnnouncementsManagerTab";
import { CarryOverBanner } from "./tabs/CarryOverAutoTab";
import CourseEvaluationTab from "./tabs/CourseEvaluationTab";
import {
  PasteCodesModal,
  ScanCourseModal,
} from "./tabs/CourseRegScannerModals";
import CourseRegSlipModal from "./tabs/CourseRegSlipModal";
import { StudentTransferTab } from "./tabs/DepartmentTransferTab";
import { StudentELibraryTab } from "./tabs/ELibraryTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import FeeStatusTab from "./tabs/FeeStatusTab";
import { FeesOutstandingBanner } from "./tabs/FinancialClearanceTab";
import GPATrendChart from "./tabs/GPATrendChart";
import IDCardTab from "./tabs/IDCardTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import PhotoAvatar from "./tabs/PhotoAvatar";
import { StudentScholarshipCard } from "./tabs/ScholarshipTab";
import { StudentClearanceCard } from "./tabs/StudentClearanceTab";
import StudentDocumentsTab from "./tabs/StudentDocumentsTab";
import StudentIDCardModal from "./tabs/StudentIDCardModal";
import StudentInboxTab, { InboxUnreadBadge } from "./tabs/StudentInboxTab";
import StudentProgressTab from "./tabs/StudentProgressTab";
import StudentResultSlipTab from "./tabs/StudentResultSlipTab";
import ThesisTrackerTab from "./tabs/ThesisTrackerTab";
import { StudentTranscriptRequestTab } from "./tabs/TranscriptRequestTab";

function classifyDegree(cgpa: number): { label: string; color: string } {
  if (cgpa >= 4.5) return { label: "First Class", color: "text-success" };
  if (cgpa >= 3.5)
    return { label: "Second Class Upper", color: "text-primary" };
  if (cgpa >= 2.4) return { label: "Second Class Lower", color: "text-accent" };
  if (cgpa >= 1.5) return { label: "Third Class", color: "text-warning" };
  if (cgpa >= 1.0) return { label: "Pass", color: "text-muted-foreground" };
  return { label: "Fail", color: "text-destructive" };
}

export default function StudentDashboard() {
  const { activeTab, setActiveTab } = useContext(TabContext);
  const { currentUser, students } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  const quickActions = [
    { label: "View Transcript", tab: "transcript", icon: FileText },
    { label: "Submit Appeal", tab: "appeals", icon: MessageSquare },
    { label: "View Progress", tab: "progress", icon: TrendingUp },
    { label: "My Documents", tab: "documents", icon: Award },
    { label: "E-Library", tab: "elibrary", icon: BookOpen },
    { label: "My Awards", tab: "scholarships", icon: Award },
  ];

  let content: React.ReactNode;
  if (activeTab === "course_reg") content = <CourseRegistrationTab />;
  else if (activeTab === "results") content = <ResultsTab />;
  else if (activeTab === "semester_summary") content = <SemesterSummaryTab />;
  else if (activeTab === "gpa") content = <GPATab />;
  else if (activeTab === "transcript") content = <TranscriptTab />;
  else if (activeTab === "appeals") content = <GradeAppealsTab />;
  else if (activeTab === "graduation") content = <StudentGraduationTab />;
  else if (activeTab === "timetable") content = <StudentTimetableTab />;
  else if (activeTab === "fee_status") content = <FeeStatusTab />;
  else if (activeTab === "deferral") content = <DeferralTab />;
  else if (activeTab === "progress") content = <StudentProgressTab />;
  else if (activeTab === "documents") content = <StudentDocumentsTab />;
  else if (activeTab === "exam_schedule") content = <StudentExamScheduleTab />;
  else if (activeTab === "course_eval") content = <CourseEvaluationTab />;
  else if (activeTab === "transfer") content = <StudentTransferTab />;
  else if (activeTab === "inbox") content = <StudentInboxTab />;
  else if (activeTab === "id_card") content = <IDCardTab mode="student" />;
  else if (activeTab === "transcript_request")
    content = <StudentTranscriptRequestTab />;
  else if (activeTab === "thesis_tracker")
    content = <ThesisTrackerTab mode="student" />;
  else if (activeTab === "result_slip") content = <StudentResultSlipTab />;
  else if (activeTab === "elibrary") content = <StudentELibrarySection />;
  else if (activeTab === "scholarships")
    content = <StudentScholarshipsSection />;
  else content = <OverviewTab />;

  return (
    <>
      <NoticeBoardPanel userRole="Student" />
      <AnnouncementsNoticesPanel userRole="Student" />
      <UpcomingEventsWidget />
      <div className="flex flex-wrap gap-2 pb-3 pt-1 border-b border-border/50 mb-4 no-print">
        {quickActions.map((a) => (
          <button
            key={a.tab}
            type="button"
            data-ocid={`student_quick.${a.tab}.button`}
            onClick={() => setActiveTab(a.tab)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${activeTab === a.tab ? "bg-primary/10 text-primary border-primary/30" : ""}`}
          >
            <a.icon className="w-3 h-3" />
            {a.label}
          </button>
        ))}
        <button
          type="button"
          data-ocid="student_quick.inbox.button"
          onClick={() => setActiveTab("inbox")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
            activeTab === "inbox"
              ? "bg-primary/10 text-primary border-primary/30"
              : ""
          }`}
        >
          <Bell className="w-3 h-3" />
          Inbox
          {me && <InboxUnreadBadge studentId={String(me.id)} />}
        </button>
      </div>
      {content}
    </>
  );
}

function getStudentData() {
  const { currentUser, students, courses, results } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const myResults = me
    ? results.filter(
        (r) =>
          r.studentId === me.id &&
          (r.status === "published" || r.status === "approved"),
      )
    : [];

  let totalWeightedPoints = 0;
  let totalCreditUnits = 0;
  for (const r of myResults) {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    const credits = course ? Number(course.creditUnits) : 0;
    totalWeightedPoints += r.gradePoint * credits;
    totalCreditUnits += credits;
  }
  const cgpa =
    totalCreditUnits > 0 ? totalWeightedPoints / totalCreditUnits : 0;

  return { me, myResults, cgpa, courses };
}

function OverviewTab() {
  const _instConfig = useInstitutionConfig();
  const { me, myResults, cgpa, courses } = getStudentData();
  const [showIDCard, setShowIDCard] = useState(false);
  // Get advisor
  const advisorAssignments: { studentMatric: string; staffId: string }[] =
    (() => {
      try {
        return JSON.parse(localStorage.getItem("advisorAssignments") || "[]");
      } catch {
        return [];
      }
    })();
  const { staffMembers, departments, faculties } = useApp();
  const myAdvisorAssignment = me
    ? advisorAssignments.find((a) => a.studentMatric === me.matricNumber)
    : null;
  const myAdvisor = myAdvisorAssignment
    ? staffMembers.find((s) => s.staffId === myAdvisorAssignment.staffId)
    : null;
  const classification = classifyDegree(cgpa);
  const gradeData = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: myResults.filter((r) => r.grade === g).length,
  }));
  const carryoverCount = myResults.filter((r) => r.grade === "F").length;

  return (
    <div className="space-y-6">
      <CarryOverBanner />
      <FeesOutstandingBanner />
      {me && showIDCard && (
        <StudentIDCardModal
          student={me}
          open={showIDCard}
          onClose={() => setShowIDCard(false)}
        />
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {me && (
            <PhotoAvatar
              photoKey={`student_photo_url_${String(me.id)}`}
              name={me.name}
              size="lg"
              editable
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">Student Portal</h1>
            <p className="text-sm text-muted-foreground">
              {me?.name} &middot; {me?.matricNumber}
            </p>
            {me &&
              (() => {
                const dept = getStudentDepartment(me, departments);
                return (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Level {String(me.level)} &middot; {dept?.name ?? "—"}
                  </p>
                );
              })()}
            {myResults.length > 0 &&
              (() => {
                const standing = getAcademicStanding(cgpa);
                return (
                  <span
                    className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${standing.badgeClass}`}
                  >
                    {standing.label}
                  </span>
                );
              })()}
          </div>
        </div>
        {me && (
          <Button
            size="sm"
            variant="outline"
            data-ocid="student.print_id_button"
            onClick={() => setShowIDCard(true)}
          >
            <Printer className="w-4 h-4 mr-1" /> Print ID Card
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Published Results"
          value={myResults.length}
          icon={BookOpen}
        />
        {_instConfig.showCGPA && (
          <StatCard label="CGPA" value={cgpa.toFixed(2)} icon={TrendingUp} />
        )}
        <StatCard
          label="Classification"
          value={classification.label}
          icon={Award}
        />
        {carryoverCount > 0 ? (
          <StatCard
            label="Carry-overs"
            value={carryoverCount}
            icon={RefreshCw}
            color="text-destructive"
          />
        ) : (
          <StatCard
            label="Level"
            value={`${me ? String(me.level) : "-"} Level`}
            icon={Star}
          />
        )}
      </div>
      {/* My Profile Card */}
      {me &&
        (() => {
          const dept = getStudentDepartment(me, departments);
          const fac = getStudentFaculty(me, departments, faculties);
          return (
            <div
              className="bg-card border border-border rounded-xl p-5 shadow-xs"
              data-ocid="student.profile.card"
            >
              <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                My Profile
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Full Name
                  </span>
                  <span className="font-medium">{me.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Matric No.
                  </span>
                  <span className="font-medium">{me.matricNumber}</span>
                </div>
                {me.jambRegNo && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      JAMB Reg No.
                    </span>
                    <span className="font-medium">{me.jambRegNo}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Level
                  </span>
                  <span className="font-medium">{String(me.level)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Department
                  </span>
                  <span className="font-medium">{dept?.name ?? "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Faculty
                  </span>
                  <span className="font-medium">{fac?.name ?? "—"}</span>
                </div>
                {me.state && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      State of Origin
                    </span>
                    <span className="font-medium">{me.state}</span>
                  </div>
                )}
                {me.lga && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      LGA
                    </span>
                    <span className="font-medium">{me.lga}</span>
                  </div>
                )}
                {me.gender && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Gender
                    </span>
                    <span className="font-medium">{me.gender}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Status
                  </span>
                  <span className="font-medium">{me.status ?? "Active"}</span>
                </div>
                {me.nin && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      NIN
                    </span>
                    <span className="font-medium">{me.nin}</span>
                  </div>
                )}
                {me.dateOfBirth && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Date of Birth
                    </span>
                    <span className="font-medium">{me.dateOfBirth}</span>
                  </div>
                )}
                {me.programmeType && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      Programme
                    </span>
                    <span className="font-medium">{me.programmeType}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      {carryoverCount > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-destructive" />
            <p className="text-sm font-semibold text-destructive">
              You have {carryoverCount} carry-over course
              {carryoverCount !== 1 ? "s" : ""}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Register for these courses again in the Course Registration tab.
          </p>
        </div>
      )}
      {myAdvisor && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            MY ACADEMIC ADVISOR
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">
                {myAdvisor.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">{myAdvisor.name}</p>
              <p className="text-xs text-muted-foreground">
                {myAdvisor.designation}
              </p>
            </div>
          </div>
        </div>
      )}
      {myResults.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-4">My Grade Distribution</h2>
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
                fill="oklch(0.61 0.15 250)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Graduation Progress Card */}
      {(() => {
        const allPub = myResults;
        const creditsPassed = allPub
          .filter((r) => r.grade !== "F")
          .reduce((s, r) => {
            const c = courses.find((x) => String(x.id) === String(r.courseId));
            return s + Number(c?.creditUnits ?? 0);
          }, 0);
        const eMode = (me as any)?.entryMode ?? "UTME";
        const reqCredits = eMode === "DE" ? 90 : 120;
        const semReg = (me as any)?.semestersRegistered ?? 0;
        const maxSem = eMode === "DE" ? 10 : 12;
        const semRemaining = Math.max(0, maxSem - semReg);
        const coreCourseIds = courses
          .filter((c) => isCourseCore(c.code))
          .map((c) => String(c.id));
        const coreOutstanding = allPub.filter(
          (r) => r.grade === "F" && coreCourseIds.includes(String(r.courseId)),
        ).length;
        return (
          <div
            className="bg-card border border-border rounded-xl p-5 shadow-xs"
            data-ocid="student.graduation_progress.card"
          >
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Graduation Progress</h2>
              <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                {eMode}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Credits Passed</span>
                  <span
                    className={`font-semibold ${creditsPassed >= reqCredits ? "text-success" : "text-warning"}`}
                  >
                    {creditsPassed} / {reqCredits}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${creditsPassed >= reqCredits ? "bg-success" : "bg-warning"}`}
                    style={{
                      width: `${Math.min((creditsPassed / reqCredits) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center">
                  <p className="text-sm font-bold">
                    {coreOutstanding === 0 ? "✓" : coreOutstanding}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {coreOutstanding === 0
                      ? "Core courses passed"
                      : "Core outstanding"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{semReg}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Semesters done
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{semRemaining}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Semesters left (max)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <StudentClearanceCard />
    </div>
  );
}

function CourseRegistrationTab() {
  const [showRegSlip, setShowRegSlip] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [showScanModal, setShowScanModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const {
    currentUser,
    students,
    courses,
    results,
    courseRegistrations,
    academicCalendars,
    addCourseRegistration,
    dropCourseRegistration,
    updateStudent,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const _instConfig = useInstitutionConfig();
  const MIN_CREDITS: number =
    (_instConfig.creditRules?.minPerSem as number) ?? 15;
  const MAX_CREDITS: number =
    (_instConfig.creditRules?.maxPerSem as number) ?? 24;

  // Unique sessions
  const uniqueSessions = useMemo(() => {
    const sessions = [...new Set(academicCalendars.map((c) => c.session))];
    return sessions.sort();
  }, [academicCalendars]);

  // Default to active session
  useEffect(() => {
    if (!selectedSession) {
      const active = academicCalendars.find((c) => c.isActive);
      if (active) setSelectedSession(active.session);
      else if (uniqueSessions.length > 0)
        setSelectedSession(uniqueSessions[uniqueSessions.length - 1]);
    }
  }, [academicCalendars, uniqueSessions, selectedSession]);

  const firstSemCal = academicCalendars.find(
    (c) => c.session === selectedSession && c.semester === "First",
  );
  const secondSemCal = academicCalendars.find(
    (c) => c.session === selectedSession && c.semester === "Second",
  );

  const level = me ? Number(me.level) : 0;

  // Carryover courses from published/approved results with grade F
  const myResults = me
    ? results.filter(
        (r) =>
          r.studentId === me.id &&
          (r.status === "published" || r.status === "approved"),
      )
    : [];
  const carryoverCourseIds = new Set(
    myResults.filter((r) => r.grade === "F").map((r) => r.courseId),
  );

  // Level filter helper
  function courseCodeLevel(code: string): number {
    const m = code.match(/(\d{3})/);
    if (!m) return 100;
    return Math.floor(Number(m[1]) / 100) * 100;
  }

  const deptCourses = me
    ? courses.filter((c) => String(c.departmentId) === String(me.departmentId))
    : [];

  const firstSemAllCourses = deptCourses.filter(
    (c) => c.semester === "First" && courseCodeLevel(c.code) === level,
  );
  const secondSemAllCourses = deptCourses.filter(
    (c) => c.semester === "Second" && courseCodeLevel(c.code) === level,
  );

  // Registered IDs per semester
  const firstSemRegIds = new Set(
    me
      ? courseRegistrations
          .filter((r) => r.studentId === me.id && r.semester === "First")
          .map((r) => r.courseId)
      : [],
  );
  const secondSemRegIds = new Set(
    me
      ? courseRegistrations
          .filter((r) => r.studentId === me.id && r.semester === "Second")
          .map((r) => r.courseId)
      : [],
  );

  // DE students: 100-level GST courses auto-register (computed from me, but safe even if me is null)
  const _entryModeEarly = (me as any)?.entryMode ?? "UTME";
  const isDE = _entryModeEarly === "DE";
  const gst100Courses = courses.filter(
    (c) => c.code.startsWith("GST") && courseCodeLevel(c.code) === 100,
  );

  // Carryover + DE auto-register effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (!me) return;
    const doReg = (
      sem: "First" | "Second",
      regIds: Set<bigint>,
      cal?: typeof firstSemCal,
    ) => {
      if (!cal || (!cal.registrationOpen && !cal.addDropOpen)) return;
      // Carryover auto-register (200+ level)
      if (level >= 200) {
        for (const cId of carryoverCourseIds) {
          const c = courses.find((x) => String(x.id) === String(cId));
          if (!c || c.semester !== sem) continue;
          if (!regIds.has(cId)) addCourseRegistration(me.id, cId, sem);
        }
      }
      // DE: auto-register 100-level GST courses in first semester
      if (isDE && sem === "First") {
        for (const c of gst100Courses) {
          if (c.semester !== "First") continue;
          if (!regIds.has(c.id)) addCourseRegistration(me.id, c.id, sem);
        }
      }
    };
    doReg("First", firstSemRegIds, firstSemCal);
    doReg("Second", secondSemRegIds, secondSemCal);
  }, [selectedSession, me?.id]);

  // Submit registration handler (increments semestersRegistered)
  function handleSubmitRegistration() {
    if (!me) return;
    const currentCount = (me as any).semestersRegistered ?? 0;
    updateStudent(me.id, { semestersRegistered: currentCount + 1 } as any);
    toast.success("Course registration submitted successfully!");
  }

  if (!me) {
    return (
      <div
        className="bg-card rounded-xl border border-border p-8 text-center"
        data-ocid="coursereg.empty_state"
      >
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Student profile not found</p>
      </div>
    );
  }

  const firstSemRegistered = firstSemAllCourses.filter((c) =>
    firstSemRegIds.has(c.id),
  );
  const firstSemAvailable = firstSemAllCourses.filter(
    (c) => !firstSemRegIds.has(c.id),
  );
  const firstSemCredits = firstSemRegistered.reduce(
    (s, c) => s + Number(c.creditUnits),
    0,
  );
  const secondSemRegistered = secondSemAllCourses.filter((c) =>
    secondSemRegIds.has(c.id),
  );
  const secondSemAvailable = secondSemAllCourses.filter(
    (c) => !secondSemRegIds.has(c.id),
  );
  const secondSemCredits = secondSemRegistered.reduce(
    (s, c) => s + Number(c.creditUnits),
    0,
  );

  // Graduation eligibility for 400+ level
  const isGradLevel = level >= 400;
  const allPublished = results.filter(
    (r) =>
      r.studentId === me.id &&
      (r.status === "published" || r.status === "approved"),
  );
  const totalCreditsPassed = allPublished
    .filter((r) => r.grade !== "F")
    .reduce((s, r) => {
      const c = courses.find((x) => String(x.id) === String(r.courseId));
      return s + Number(c?.creditUnits ?? 0);
    }, 0);
  const cgpa =
    allPublished.length > 0
      ? allPublished.reduce((s, r) => s + r.gradePoint, 0) / allPublished.length
      : 0;
  const outstandingCourses = Array.from(carryoverCourseIds)
    .map((id) => courses.find((c) => String(c.id) === String(id)))
    .filter(Boolean);
  const entryMode = _entryModeEarly;
  const requiredCredits = entryMode === "DE" ? 90 : 120;
  const minSemesters = entryMode === "DE" ? 6 : 8;
  const maxSemesters = entryMode === "DE" ? 10 : 12;
  const semestersRegistered = (me as any)?.semestersRegistered ?? 0;
  const graduationEligible =
    cgpa >= 1.0 &&
    carryoverCourseIds.size === 0 &&
    totalCreditsPassed >= requiredCredits;

  // All registered for slip
  const allRegistered = [...firstSemRegistered, ...secondSemRegistered];

  function handleAdd(
    courseId: bigint,
    courseName: string,
    sem: "First" | "Second",
    currentCredits: number,
    course: (typeof courses)[number],
  ) {
    if (!me) return;
    const newTotal = currentCredits + Number(course.creditUnits);
    if (newTotal > MAX_CREDITS) {
      toast.error(
        `Adding this course exceeds the maximum credit units (${MAX_CREDITS}) for ${sem} Semester`,
      );
      return;
    }
    addCourseRegistration(me.id, courseId, sem);
    toast.success(`Registered for ${courseName}`);
  }

  function handleDrop(
    courseId: bigint,
    courseName: string,
    sem: "First" | "Second",
    canReg: boolean,
  ) {
    if (!me || !canReg) return;
    if (carryoverCourseIds.has(courseId)) {
      toast.error("Carry-over courses cannot be dropped");
      return;
    }
    dropCourseRegistration(me.id, courseId, sem);
    toast.success(`Dropped ${courseName}`);
  }

  function doAutoSuggest(
    sem: "First" | "Second",
    available: typeof courses,
    currentCredits: number,
  ) {
    if (!me) return;
    const cal = sem === "First" ? firstSemCal : secondSemCal;
    if (!cal?.registrationOpen && !cal?.addDropOpen) {
      toast.error("Registration is not open");
      return;
    }
    let credits = currentCredits;
    const sorted = [
      ...available.filter((c) => isCourseCore(c.code)),
      ...available.filter((c) => !isCourseCore(c.code)),
    ];
    for (const c of sorted) {
      if (credits >= MIN_CREDITS) break;
      if (credits + Number(c.creditUnits) <= MAX_CREDITS) {
        addCourseRegistration(me.id, c.id, sem);
        credits += Number(c.creditUnits);
      }
    }
    toast.success(`Auto-suggested courses for ${sem} Semester`);
  }

  const regStatus1 = !selectedSession
    ? "no-session"
    : !firstSemCal
      ? "no-cal"
      : firstSemCal.registrationOpen
        ? "open"
        : firstSemCal.addDropOpen
          ? "add-drop"
          : "closed";
  const regStatus2 = !selectedSession
    ? "no-session"
    : !secondSemCal
      ? "no-cal"
      : secondSemCal.registrationOpen
        ? "open"
        : secondSemCal.addDropOpen
          ? "add-drop"
          : "closed";
  const canReg1 = regStatus1 === "open" || regStatus1 === "add-drop";
  const canReg2 = regStatus2 === "open" || regStatus2 === "add-drop";
  const overallStatus =
    canReg1 && canReg2
      ? "both-open"
      : canReg1 || canReg2
        ? "one-open"
        : "both-closed";

  function CreditBar({ credits, sem }: { credits: number; sem: string }) {
    const pct = Math.min((credits / MAX_CREDITS) * 100, 100);
    const ok = credits >= MIN_CREDITS && credits <= MAX_CREDITS;
    const over = credits > MAX_CREDITS;
    return (
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">{sem} Semester Credits</span>
          <span
            className={`font-semibold ${
              over ? "text-destructive" : ok ? "text-success" : "text-warning"
            }`}
          >
            {credits} / {MAX_CREDITS} units
            {ok && " ✓"}
            {credits < MIN_CREDITS && ` (need ${MIN_CREDITS - credits} more)`}
            {over && ` (over by ${credits - MAX_CREDITS})`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              over ? "bg-destructive" : ok ? "bg-success" : "bg-warning"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Min: {MIN_CREDITS} &bull; Max: {MAX_CREDITS} credit units
        </p>
      </div>
    );
  }

  function RegStatusBadge({ status }: { status: string }) {
    if (status === "open")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">
          <span className="w-1.5 h-1.5 rounded-full bg-success" /> Open
        </span>
      );
    if (status === "add-drop")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20">
          <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Add/Drop
        </span>
      );
    if (status === "closed")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
          <Lock className="w-2.5 h-2.5" /> Closed
        </span>
      );
    return null;
  }

  function SemesterColumn({
    sem,
    allCourses: _allCourses,
    registered,
    available,
    credits,
    canReg,
    regIds,
    search,
    onSearch,
    status,
    deGstCourseIds,
  }: {
    sem: "First" | "Second";
    allCourses: typeof courses;
    registered: typeof courses;
    available: typeof courses;
    credits: number;
    canReg: boolean;
    regIds: Set<bigint>;
    search: string;
    onSearch: (v: string) => void;
    status: string;
    deGstCourseIds?: Set<bigint>;
  }) {
    // Helper: check if a course is locked (carryover or DE GST)
    function isLocked(courseId: bigint): boolean {
      if (carryoverCourseIds.has(courseId)) return true;
      if (deGstCourseIds?.has(courseId)) return true;
      return false;
    }

    // Prerequisite check: returns missing prereqs if student hasn't passed them
    function getMissingPrereqs(course: (typeof courses)[number]): string[] {
      const extCourse = course as any;
      if (!extCourse.prerequisiteIds?.length) return [];
      return extCourse.prerequisiteIds
        .filter((prereqId: string) => {
          const passed = myResults.some(
            (r) =>
              String(r.courseId) === prereqId && r.grade && r.grade !== "F",
          );
          return !passed;
        })
        .map((prereqId: string) => {
          const pc = courses.find((c) => String(c.id) === prereqId);
          return pc?.code ?? prereqId;
        });
    }
    const filteredAvailable = available.filter(
      (c) =>
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()),
    );
    const filteredRegistered = registered.filter(
      (c) =>
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()),
    );

    const carryoverInSem = Array.from(carryoverCourseIds).filter((id) => {
      const c = courses.find((x) => String(x.id) === String(id));
      return c?.semester === sem;
    });
    const semIdx = sem === "First" ? "1" : "2";

    return (
      <div className="flex flex-col gap-4">
        {/* Semester header */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              {sem} Semester
            </h3>
            <RegStatusBadge status={status} />
          </div>
          <CreditBar credits={credits} sem={sem} />
          {status === "closed" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Contact the Registrar to open
              registration
            </p>
          )}
          {canReg && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full text-xs h-7"
              data-ocid={`coursereg.${semIdx}.autosuggest_button`}
              onClick={() => doAutoSuggest(sem, available, credits)}
            >
              <PlusCircle className="w-3 h-3 mr-1" /> Auto-suggest Courses
            </Button>
          )}
        </div>

        {/* Carryover panel */}
        {carryoverInSem.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-3.5 h-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">
                Carry-Over ({carryoverInSem.length}) — Auto-Registered
              </span>
            </div>
            <div className="space-y-1.5">
              {carryoverInSem.map((cId) => {
                const c = courses.find((x) => String(x.id) === String(cId));
                if (!c) return null;
                return (
                  <div
                    key={String(cId)}
                    className="flex items-center justify-between bg-card rounded-lg border border-destructive/20 px-3 py-2"
                  >
                    <div>
                      <span className="text-xs font-mono text-destructive">
                        {c.code}
                      </span>
                      <p className="text-xs font-medium">{c.name}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {String(c.creditUnits)} units
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {regIds.has(cId) ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                          ✓ Registered
                        </span>
                      ) : canReg ? (
                        <Button
                          size="sm"
                          className="h-6 text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() =>
                            handleAdd(c.id, c.code, sem, credits, c)
                          }
                        >
                          Register
                        </Button>
                      ) : null}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold">
                        CO
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Registered courses */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-3 border-b border-border">
            <h4 className="text-xs font-semibold">
              Registered ({registered.length})
            </h4>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {registered.length === 0 && (
              <p
                className="text-xs text-muted-foreground text-center py-4"
                data-ocid={`coursereg.${semIdx}.registered.empty_state`}
              >
                No courses registered for {sem} Semester
              </p>
            )}
            {(search ? filteredRegistered : registered).map((c, i) => {
              const isCarryover = carryoverCourseIds.has(c.id);
              const isCore = isCourseCore(c.code);
              return (
                <div
                  key={String(c.id)}
                  className={`flex items-start justify-between px-3 py-2.5 ${isCarryover ? "bg-destructive/5" : ""}`}
                  data-ocid={`coursereg.${semIdx}.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-primary">
                        {c.code}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          isCore
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isCore ? "Core" : "Elective"}
                      </span>
                      {isCarryover && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-destructive/10 text-destructive border border-destructive/20">
                          CO
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-tight text-foreground">
                      {c.name}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {String(c.creditUnits)} units
                    </span>
                  </div>
                  {canReg && !isLocked(c.id) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-[10px] shrink-0"
                      data-ocid={`coursereg.${semIdx}.drop.${i + 1}`}
                      onClick={() => handleDrop(c.id, c.code, sem, canReg)}
                    >
                      Drop
                    </Button>
                  )}
                  {isLocked(c.id) && (
                    <div
                      className="flex items-center gap-1 shrink-0"
                      title="Cannot be dropped"
                    >
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Available courses */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-3 border-b border-border space-y-2">
            <h4 className="text-xs font-semibold">
              Available ({available.length})
              {credits < MIN_CREDITS && (
                <span className="ml-2 text-[10px] text-warning font-normal">
                  Add {MIN_CREDITS - credits} or more credits
                </span>
              )}
            </h4>
            <Input
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="h-7 text-xs"
              data-ocid={`coursereg.${semIdx}.search_input`}
            />
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {filteredAvailable.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {search
                  ? "No courses match your search"
                  : `All ${sem} Semester courses registered`}
              </p>
            )}
            {filteredAvailable.map((c, i) => {
              const isCarryover = carryoverCourseIds.has(c.id);
              const isCore = isCourseCore(c.code);
              const wouldExceed = credits + Number(c.creditUnits) > MAX_CREDITS;
              const missingPrereqs = getMissingPrereqs(c);
              const prereqBlocked = missingPrereqs.length > 0;
              return (
                <div
                  key={String(c.id)}
                  className={`flex items-start justify-between px-3 py-2.5 ${isCarryover ? "bg-destructive/5" : prereqBlocked ? "bg-muted/20 opacity-70" : ""}`}
                  data-ocid={`coursereg.${semIdx}.available.${i + 1}`}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-muted-foreground">
                        {c.code}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          isCore
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isCore ? "Core" : "Elective"}
                      </span>
                      {isCarryover && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-destructive/10 text-destructive border border-destructive/20">
                          CO
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 leading-tight">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {String(c.creditUnits)} units
                    </span>
                    {prereqBlocked && (
                      <p className="text-[10px] text-destructive mt-0.5">
                        Requires: {missingPrereqs.join(", ")}
                      </p>
                    )}
                  </div>
                  {canReg && (
                    <Button
                      size="sm"
                      disabled={wouldExceed || prereqBlocked}
                      title={
                        prereqBlocked
                          ? `Requires: ${missingPrereqs.join(", ")}`
                          : wouldExceed
                            ? "Exceeds max credits"
                            : undefined
                      }
                      className={`h-6 text-[10px] shrink-0 ${
                        isCarryover
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          : ""
                      }`}
                      data-ocid={`coursereg.${semIdx}.add.${i + 1}`}
                      onClick={() => handleAdd(c.id, c.code, sem, credits, c)}
                    >
                      ✅ Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showRegSlip && (
        <CourseRegSlipModal
          student={me}
          registeredCourses={allRegistered}
          session={selectedSession ?? ""}
          semester="Both Semesters"
          open={showRegSlip}
          onClose={() => setShowRegSlip(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Course Registration
          </h1>
          <p className="text-sm text-muted-foreground">
            {me.name} &bull; {me.matricNumber} &bull; Level {level}
          </p>
        </div>
        {(firstSemRegistered.length > 0 || secondSemRegistered.length > 0) && (
          <Button
            size="sm"
            variant="outline"
            data-ocid="coursereg.print_slip_button"
            onClick={() => setShowRegSlip(true)}
          >
            <Printer className="w-3 h-3 mr-1" /> Print Reg. Slip
          </Button>
        )}
      </div>

      {/* Overall status banner */}
      {overallStatus === "both-open" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Registration is open for both semesters. Register, add or drop courses
          now.
        </div>
      )}
      {overallStatus === "one-open" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
          <Info className="w-4 h-4" />
          Registration is open for only one semester. Contact the Registrar for
          the other.
        </div>
      )}
      {overallStatus === "both-closed" && selectedSession && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <Lock className="w-4 h-4" />
          Registration is closed for both semesters. Contact the Registrar to
          open registration.
        </div>
      )}

      {/* Session Selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-primary" /> Academic Session:
          </span>
          <div className="flex flex-wrap gap-2">
            {uniqueSessions.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No sessions configured
              </span>
            )}
            {uniqueSessions.map((session) => {
              const hasCal = academicCalendars.some(
                (c) => c.session === session && c.isActive,
              );
              return (
                <button
                  key={session}
                  type="button"
                  onClick={() => setSelectedSession(session)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedSession === session
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-ocid="coursereg.session.tab"
                >
                  {session}
                  {hasCal && (
                    <span className="ml-1.5 px-1 py-0.5 rounded text-[10px] bg-success/20 text-success">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Graduation Eligibility Panel (400+ level) */}
      {isGradLevel && (
        <div
          className={`rounded-xl border p-4 ${
            graduationEligible
              ? "bg-success/5 border-success/20"
              : "bg-warning/5 border-warning/20"
          }`}
          data-ocid="coursereg.graduation_panel"
        >
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Graduation Eligibility</h3>
            <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
              {entryMode}
            </span>
            <span
              className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${
                graduationEligible
                  ? "bg-success/20 text-success"
                  : "bg-warning/20 text-warning"
              }`}
            >
              {graduationEligible ? "✓ Eligible" : "Not Yet Eligible"}
            </span>
          </div>
          {/* Credits Progress */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Credits Passed</span>
              <span
                className={`font-semibold ${totalCreditsPassed >= requiredCredits ? "text-success" : "text-warning"}`}
              >
                {totalCreditsPassed} / {requiredCredits} required
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${totalCreditsPassed >= requiredCredits ? "bg-success" : "bg-warning"}`}
                style={{
                  width: `${Math.min((totalCreditsPassed / requiredCredits) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
            <div className="text-center bg-muted/30 rounded-lg p-2">
              <p className="text-xl font-bold">{cgpa.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">CGPA</p>
            </div>
            <div className="text-center bg-muted/30 rounded-lg p-2">
              <p className="text-xl font-bold">{carryoverCourseIds.size}</p>
              <p className="text-xs text-muted-foreground">
                Outstanding Courses
              </p>
            </div>
            <div className="text-center bg-muted/30 rounded-lg p-2">
              <p className="text-xl font-bold">{semestersRegistered}</p>
              <p className="text-xs text-muted-foreground">
                Semesters (min {minSemesters} / max {maxSemesters})
              </p>
            </div>
          </div>
          {outstandingCourses.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-destructive mb-1">
                Outstanding core courses:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {outstandingCourses.map((c) => (
                  <span
                    key={String(c?.id)}
                    className="text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive font-mono"
                  >
                    {c?.code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DE Student Banner */}
      {isDE && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Direct Entry Student:</strong> All 100-level GST courses are
            required and have been auto-selected. You must register these before
            other courses.
          </span>
        </div>
      )}

      {/* Scanner / Paste toolbar */}
      {(canReg1 || canReg2) && (
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-xs h-8"
            data-ocid="coursereg.scan_course_button"
            onClick={() => setShowScanModal(true)}
          >
            <ScanLine className="w-3.5 h-3.5" />
            Scan Course Code
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 text-xs h-8"
            data-ocid="coursereg.paste_codes_button"
            onClick={() => setShowPasteModal(true)}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Paste Course Codes
          </Button>
        </div>
      )}

      {/* Scan Course Modal */}
      <ScanCourseModal
        open={showScanModal}
        onClose={() => setShowScanModal(false)}
        deptCourses={deptCourses}
        firstSemCredits={firstSemCredits}
        secondSemCredits={secondSemCredits}
        maxCredits={MAX_CREDITS}
        firstSemRegIds={firstSemRegIds}
        secondSemRegIds={secondSemRegIds}
        canReg1={canReg1}
        canReg2={canReg2}
        carryoverCourseIds={carryoverCourseIds}
        onAdd={handleAdd}
      />

      {/* Paste Codes Modal */}
      <PasteCodesModal
        open={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        deptCourses={deptCourses}
        firstSemCredits={firstSemCredits}
        secondSemCredits={secondSemCredits}
        maxCredits={MAX_CREDITS}
        firstSemRegIds={firstSemRegIds}
        secondSemRegIds={secondSemRegIds}
        canReg1={canReg1}
        canReg2={canReg2}
        carryoverCourseIds={carryoverCourseIds}
        onAdd={handleAdd}
      />

      {/* Two-column layout */}
      {selectedSession ? (
        <>
          <div className="grid xl:grid-cols-2 gap-6">
            <SemesterColumn
              sem="First"
              allCourses={firstSemAllCourses}
              registered={firstSemRegistered}
              available={firstSemAvailable}
              credits={firstSemCredits}
              canReg={canReg1}
              regIds={firstSemRegIds}
              search={search1}
              onSearch={setSearch1}
              status={regStatus1}
              deGstCourseIds={
                isDE ? new Set(gst100Courses.map((c) => c.id)) : undefined
              }
            />
            <SemesterColumn
              sem="Second"
              allCourses={secondSemAllCourses}
              registered={secondSemRegistered}
              available={secondSemAvailable}
              credits={secondSemCredits}
              canReg={canReg2}
              regIds={secondSemRegIds}
              search={search2}
              onSearch={setSearch2}
              status={regStatus2}
              deGstCourseIds={
                isDE ? new Set(gst100Courses.map((c) => c.id)) : undefined
              }
            />
          </div>
          {(canReg1 || canReg2) &&
            (firstSemRegistered.length > 0 ||
              secondSemRegistered.length > 0) && (
              <div className="flex justify-end">
                <Button
                  data-ocid="coursereg.submit_button"
                  onClick={handleSubmitRegistration}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Course Registration
                </Button>
              </div>
            )}
        </>
      ) : (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <CalendarCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No academic session available. Contact the Registrar.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultsTab() {
  const { me, myResults, courses, cgpa } = getStudentData();
  const { courseRegistrations } = useApp();
  const [activeSemFilter, setActiveSemFilter] = useState("all");

  // Group published results by semester
  const semesterGroups = useMemo(() => {
    const groups: Record<string, typeof myResults> = {};
    for (const r of myResults) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      const sem = course?.semester ?? "Unknown";
      if (!groups[sem]) groups[sem] = [];
      groups[sem].push(r);
    }
    return groups;
  }, [myResults, courses]);

  // Registered courses with no published result = awaiting
  const awaitingCourses = useMemo(() => {
    if (!me) return [];
    const publishedCourseIds = new Set(
      myResults.map((r) => r.courseId.toString()),
    );
    return courseRegistrations
      .filter(
        (cr) =>
          cr.studentId === me.id &&
          !publishedCourseIds.has(cr.courseId.toString()),
      )
      .map((cr) => courses.find((c) => String(c.id) === String(cr.courseId)))
      .filter(Boolean);
  }, [me, myResults, courseRegistrations, courses]);

  const displayedResults =
    activeSemFilter === "all"
      ? myResults
      : (semesterGroups[activeSemFilter] ?? []);

  function handleDownloadTranscript() {
    if (!me) return;
    const header =
      "Course Code,Course Name,Credit Units,CA (/40),Exam (/60),Total (/100),Grade,Grade Points,Remarks";
    const rows = myResults.map((r) => {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      return [
        course?.code ?? "-",
        `"${course?.name ?? "-"}"`,
        String(course?.creditUnits ?? 0),
        r.caScore,
        r.examScore,
        r.totalScore,
        r.grade,
        r.gradePoint.toFixed(1),
        r.remarks,
      ].join(",");
    });
    const footer = `,,,,,,,,CGPA: ${cgpa.toFixed(2)}`;
    const studentInfo = `Student: ${me.name},Matric No.: ${me.matricNumber}`;
    const csvContent = [studentInfo, "", header, ...rows, "", footer].join(
      "\n",
    );
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${me.matricNumber.replace(/\//g, "-")}_transcript.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
  }

  return (
    <div className="space-y-4">
      {/* Semester Filter Tabs */}
      {Object.keys(semesterGroups).length > 1 && (
        <div className="flex gap-2 flex-wrap no-print">
          <button
            type="button"
            onClick={() => setActiveSemFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${activeSemFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"}`}
            data-ocid="results.tab"
          >
            All Semesters
          </button>
          {Object.keys(semesterGroups).map((sem) => (
            <button
              key={sem}
              type="button"
              onClick={() => setActiveSemFilter(sem)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${activeSemFilter === sem ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"}`}
              data-ocid="results.tab"
            >
              {sem} Semester
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Results</h1>
          <p className="text-sm text-muted-foreground">
            Published results only
          </p>
          {myResults.length > 0 &&
            (() => {
              const standing = getAcademicStanding(cgpa);
              return (
                <span
                  className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${standing.badgeClass}`}
                >
                  Academic Standing: {standing.label}
                </span>
              );
            })()}
        </div>
        {myResults.length > 0 && (
          <Button
            data-ocid="results.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadTranscript}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Transcript
          </Button>
        )}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>CA</TableHead>
              <TableHead>Exam</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedResults.length === 0 && awaitingCourses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="results.empty_state"
                >
                  No published results yet
                </TableCell>
              </TableRow>
            )}
            {displayedResults.map((r, i) => {
              const course = courses.find(
                (c) => String(c.id) === String(r.courseId),
              );
              const isCarryover = r.grade === "F";
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`results.item.${i + 1}`}
                  className={isCarryover ? "bg-destructive/5" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {course?.name ?? "-"}
                      {isCarryover && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-destructive text-destructive-foreground">
                          <RefreshCw className="w-2.5 h-2.5" />
                          CARRY-OVER
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {course?.code ?? "-"}
                  </TableCell>
                  <TableCell>{r.caScore}</TableCell>
                  <TableCell>{r.examScore}</TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell>
                    <span
                      className={`font-bold text-sm ${
                        r.grade === "A"
                          ? "text-success"
                          : r.grade === "B"
                            ? "text-primary"
                            : r.grade === "F"
                              ? "text-destructive"
                              : "text-foreground"
                      }`}
                    >
                      {r.grade}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.gradePoint.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.remarks}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              );
            })}
            {awaitingCourses.length > 0 &&
              awaitingCourses.map((c, i) => (
                <TableRow
                  key={c!.id.toString()}
                  data-ocid={`results.item.${displayedResults.length + i + 1}`}
                >
                  <TableCell className="font-medium text-muted-foreground">
                    {c!.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {c!.code}
                  </TableCell>
                  <TableCell colSpan={7}>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                      Awaiting Publication
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

function SemesterSummaryTab() {
  const { me, myResults, courses, cgpa } = getStudentData();
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null);

  const semesterGroups = useMemo(() => {
    const groups: Record<
      string,
      { results: typeof myResults; totalCredits: number; gpa: number }
    > = {};

    for (const r of myResults) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      if (!course) continue;
      const key = course.semester;
      if (!groups[key]) {
        groups[key] = { results: [], totalCredits: 0, gpa: 0 };
      }
      groups[key].results.push(r);
      groups[key].totalCredits += Number(course.creditUnits);
    }

    // Calculate GPA per semester
    for (const key of Object.keys(groups)) {
      const g = groups[key];
      let weightedPoints = 0;
      let creditSum = 0;
      for (const r of g.results) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        const credits = course ? Number(course.creditUnits) : 0;
        weightedPoints += r.gradePoint * credits;
        creditSum += credits;
      }
      g.gpa = creditSum > 0 ? weightedPoints / creditSum : 0;
    }

    return groups;
  }, [myResults, courses]);

  const semesters = Object.keys(semesterGroups).sort();

  function handleDownloadSemesterSummary() {
    if (!me) return;
    const lines: string[] = [
      `Student: ${me.name},Matric: ${me.matricNumber}`,
      "",
      "Semester,Course Code,Course Name,Credit Units,CA,Exam,Total,Grade,Grade Points,Remarks",
    ];
    for (const sem of semesters) {
      const g = semesterGroups[sem];
      for (const r of g.results) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        lines.push(
          [
            sem,
            course?.code ?? "-",
            `"${course?.name ?? "-"}"`,
            String(course?.creditUnits ?? 0),
            r.caScore,
            r.examScore,
            r.totalScore,
            r.grade,
            r.gradePoint.toFixed(1),
            r.remarks,
          ].join(","),
        );
      }
      lines.push(
        `${sem} GPA:,${g.gpa.toFixed(2)},Total Credits:,${g.totalCredits}`,
      );
      lines.push("");
    }
    lines.push(`Overall CGPA:,${cgpa.toFixed(2)}`);
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${me.matricNumber.replace(/\//g, "-")}_semester_summary.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Semester summary downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Semester Summary</h1>
          <p className="text-sm text-muted-foreground">
            GPA history by semester
          </p>
        </div>
        {semesters.length > 0 && (
          <Button
            data-ocid="semester_summary.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadSemesterSummary}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Summary
          </Button>
        )}
      </div>

      {/* CGPA summary card */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs text-center">
          <p className="text-xs text-muted-foreground mb-1">Overall CGPA</p>
          <p className="text-4xl font-bold">{cgpa.toFixed(2)}</p>
          <p
            className={`text-sm font-semibold mt-1 ${
              classifyDegree(cgpa).color
            }`}
          >
            {classifyDegree(cgpa).label}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <p className="text-xs text-muted-foreground mb-3">
            Semesters Completed
          </p>
          <div className="space-y-2">
            {semesters.map((sem) => {
              const g = semesterGroups[sem];
              return (
                <div key={sem} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{sem} Semester</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {g.results.length} courses &middot; {g.totalCredits}{" "}
                      credits
                    </span>
                    <span
                      className={`font-bold text-sm ${
                        g.gpa >= 3.5
                          ? "text-success"
                          : g.gpa >= 2.0
                            ? "text-warning"
                            : "text-destructive"
                      }`}
                    >
                      GPA: {g.gpa.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
            {semesters.length === 0 && (
              <p className="text-sm text-muted-foreground">No results yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Semester breakdown tables */}
      {semesters.map((sem, semIdx) => {
        const g = semesterGroups[sem];
        const isExpanded = expandedSemester === sem;
        return (
          <div
            key={sem}
            className="bg-card rounded-xl border border-border shadow-xs overflow-hidden"
            data-ocid={`semester_summary.item.${semIdx + 1}`}
          >
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedSemester(isExpanded ? null : sem)}
              data-ocid={`semester_summary.toggle.${semIdx + 1}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-semibold text-sm">{sem} Semester</p>
                  <p className="text-xs text-muted-foreground">
                    {g.results.length} course{g.results.length !== 1 ? "s" : ""}{" "}
                    &middot; {g.totalCredits} credit units
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Semester GPA</p>
                  <p
                    className={`text-lg font-bold ${
                      g.gpa >= 3.5
                        ? "text-success"
                        : g.gpa >= 2.0
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {g.gpa.toFixed(2)}
                  </p>
                </div>
                <span className="text-muted-foreground text-sm">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.results.map((r, i) => {
                      const course = courses.find(
                        (c) => String(c.id) === String(r.courseId),
                      );
                      return (
                        <TableRow
                          key={String(r.id)}
                          data-ocid={`semester_summary.row.${i + 1}`}
                          className={r.grade === "F" ? "bg-destructive/5" : ""}
                        >
                          <TableCell className="font-mono font-medium">
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
                          <TableCell>
                            <span
                              className={`font-bold ${
                                r.grade === "A"
                                  ? "text-success"
                                  : r.grade === "F"
                                    ? "text-destructive"
                                    : "text-foreground"
                              }`}
                            >
                              {r.grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.gradePoint.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.remarks}
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
      })}

      {semesters.length === 0 && (
        <div
          className="bg-card rounded-xl border border-border p-10 text-center"
          data-ocid="semester_summary.empty_state"
        >
          <p className="text-muted-foreground">
            No published results available yet
          </p>
        </div>
      )}
    </div>
  );
}

const GRADING_SCALE = [
  { grade: "A", range: "70 – 100", points: "5.0", remarks: "Distinction" },
  { grade: "B", range: "60 – 69", points: "4.0", remarks: "Credit" },
  { grade: "C", range: "50 – 59", points: "3.0", remarks: "Merit" },
  { grade: "D", range: "45 – 49", points: "2.0", remarks: "Pass" },
  { grade: "E", range: "40 – 44", points: "1.0", remarks: "Marginal Pass" },
  { grade: "F", range: "0 – 39", points: "0.0", remarks: "Fail" },
];

function GPATab() {
  const { myResults, cgpa, courses } = getStudentData();
  const classification = classifyDegree(cgpa);
  const tiers = [
    { label: "First Class", range: "4.50 – 5.00", min: 4.5 },
    { label: "Second Class Upper", range: "3.50 – 4.49", min: 3.5 },
    { label: "Second Class Lower", range: "2.40 – 3.49", min: 2.4 },
    { label: "Third Class", range: "1.50 – 2.39", min: 1.5 },
    { label: "Pass", range: "1.00 – 1.49", min: 1.0 },
    { label: "Fail", range: "Below 1.00", min: 0 },
  ];

  let totalWeightedPoints = 0;
  let totalCreditUnits = 0;
  for (const r of myResults) {
    const course = courses.find((c) => String(c.id) === String(r.courseId));
    const credits = course ? Number(course.creditUnits) : 0;
    totalWeightedPoints += r.gradePoint * credits;
    totalCreditUnits += credits;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">GPA / CGPA</h1>
        <p className="text-sm text-muted-foreground">
          Academic standing summary
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-6 shadow-xs text-center">
          <p className="text-sm text-muted-foreground mb-1">
            Cumulative GPA (Weighted)
          </p>
          <p className="text-5xl font-bold text-foreground">
            {cgpa.toFixed(2)}
          </p>
          <p className={`text-sm font-semibold mt-2 ${classification.color}`}>
            {classification.label}
          </p>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>
              Total Quality Points:{" "}
              <span className="font-semibold text-foreground">
                {totalWeightedPoints.toFixed(1)}
              </span>
            </p>
            <p>
              Total Credit Units:{" "}
              <span className="font-semibold text-foreground">
                {totalCreditUnits}
              </span>
            </p>
            <p>
              Results counted:{" "}
              <span className="font-semibold text-foreground">
                {myResults.length}
              </span>
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-3">Classification Scale</h2>
          <div className="space-y-2">
            {tiers.map((tier) => (
              <div
                key={tier.label}
                className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs ${
                  cgpa >= tier.min &&
                  tiers.find((t) => t.min > tier.min && cgpa >= t.min) ===
                    undefined
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <span>{tier.label}</span>
                <span className="font-mono">{tier.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Grading Scale Reference</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Score Range</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GRADING_SCALE.map((row) => (
              <TableRow key={row.grade}>
                <TableCell className="font-bold">{row.grade}</TableCell>
                <TableCell className="font-mono text-sm">{row.range}</TableCell>
                <TableCell className="font-medium">{row.points}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {row.remarks}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {myResults.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Course Breakdown</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Credit Units</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Grade Points</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myResults.map((r, i) => {
                const course = courses.find(
                  (c) => String(c.id) === String(r.courseId),
                );
                return (
                  <TableRow key={String(r.id)} data-ocid={`gpa.item.${i + 1}`}>
                    <TableCell className="font-medium">
                      {course?.code ?? "-"}
                    </TableCell>
                    <TableCell>{String(course?.creditUnits ?? "-")}</TableCell>
                    <TableCell className="font-bold">{r.grade}</TableCell>
                    <TableCell>{r.gradePoint.toFixed(1)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.remarks}
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

function TranscriptTab() {
  const { me, courses, cgpa } = getStudentData();
  const { results, departments, institutionSettings } = useApp();

  // Only published results
  const publishedResults = me
    ? results.filter((r) => r.studentId === me.id && r.status === "published")
    : [];

  const department = departments.find(
    (d) => String(d.id) === String(me?.departmentId),
  );

  // Group by semester
  const semesterGroups = useMemo(() => {
    const groups: Record<
      string,
      { results: typeof publishedResults; gpa: number; totalCredits: number }
    > = {};
    for (const r of publishedResults) {
      const course = courses.find((c) => String(c.id) === String(r.courseId));
      if (!course) continue;
      const key = course.semester;
      if (!groups[key]) groups[key] = { results: [], gpa: 0, totalCredits: 0 };
      groups[key].results.push(r);
      groups[key].totalCredits += Number(course.creditUnits);
    }
    for (const key of Object.keys(groups)) {
      const g = groups[key];
      let wp = 0;
      let cu = 0;
      for (const r of g.results) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        const credits = course ? Number(course.creditUnits) : 0;
        wp += r.gradePoint * credits;
        cu += credits;
      }
      g.gpa = cu > 0 ? wp / cu : 0;
    }
    return groups;
  }, [publishedResults, courses]);

  const semesters = Object.keys(semesterGroups).sort();
  const classification = classifyDegree(cgpa);
  const today = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (publishedResults.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Academic Transcript</h1>
          <p className="text-sm text-muted-foreground">
            Official PDF-style view
          </p>
        </div>
        <div
          className="bg-card rounded-xl border border-border p-16 text-center"
          data-ocid="transcript.empty_state"
        >
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            No Published Results Yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No published results available yet. Results will appear here once
            officially released by the Registrar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #transcript-area, #transcript-area * { visibility: visible; }
          #transcript-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Controls (hidden in print) */}
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Academic Transcript</h1>
          <p className="text-sm text-muted-foreground">
            Official PDF-style view
          </p>
        </div>
        <Button
          data-ocid="transcript.primary_button"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </Button>
      </div>

      {/* Transcript area */}
      <div
        id="transcript-area"
        className="relative bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Diagonal UNOFFICIAL watermark */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-30deg)",
            fontSize: "6rem",
            fontWeight: 900,
            color: "rgba(0,0,0,0.05)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            letterSpacing: "0.15em",
          }}
        >
          UNOFFICIAL
        </div>

        <div className="relative z-10 p-8">
          {/* University Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-gray-300 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-10 h-10 text-gray-600" />
            </div>
            <h1
              className="text-2xl font-black tracking-widest uppercase mb-1"
              style={{ letterSpacing: "0.2em" }}
            >
              {institutionSettings.name}
            </h1>
            <p className="text-sm text-gray-500 tracking-wide uppercase">
              Office of the Registrar — Academic Transcript
            </p>
            <div className="mt-3 flex justify-center gap-6 text-xs text-gray-400">
              <span>{institutionSettings.address}</span>
              <span>|</span>
              <span>{institutionSettings.email}</span>
              <span>|</span>
              <span>{institutionSettings.website}</span>
            </div>
          </div>

          {/* Student Info */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-1 border-b border-gray-200">
              Student Information
            </h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600 min-w-[140px]">
                  Full Name:
                </span>
                <span className="font-bold flex-1">{me?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600 min-w-[140px]">
                  Matric Number:
                </span>
                <span className="font-mono font-bold flex-1">
                  {me?.matricNumber ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600 min-w-[140px]">
                  Department:
                </span>
                <span className="flex-1">{department?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600 min-w-[140px]">
                  Level:
                </span>
                <span className="flex-1">
                  {me ? `${String(me.level)} Level` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600 min-w-[140px]">
                  Gender:
                </span>
                <span className="flex-1">{(me as any)?.gender ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600 min-w-[140px]">
                  Date of Birth:
                </span>
                <span className="flex-1">{(me as any)?.dob ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Semester Results */}
          {semesters.map((sem) => {
            const g = semesterGroups[sem];
            return (
              <div key={sem} className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 pb-1 border-b border-gray-200">
                  {sem} Semester
                </h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-3 py-2 text-left text-xs font-semibold">
                        Course Code
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">
                        Course Title
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">
                        Cr. Units
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">
                        CA (40)
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">
                        Exam (60)
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">
                        Total
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">
                        Grade
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold">
                        Grd. Pts
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.results.map((r, i) => {
                      const course = courses.find(
                        (c) => String(c.id) === String(r.courseId),
                      );
                      return (
                        <tr
                          key={String(r.id)}
                          className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-3 py-2 font-mono font-medium text-xs border-b border-gray-100">
                            {course?.code ?? "—"}
                          </td>
                          <td className="px-3 py-2 border-b border-gray-100">
                            {course?.name ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-center border-b border-gray-100">
                            {String(course?.creditUnits ?? 0)}
                          </td>
                          <td className="px-3 py-2 text-center border-b border-gray-100">
                            {r.caScore}
                          </td>
                          <td className="px-3 py-2 text-center border-b border-gray-100">
                            {r.examScore}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold border-b border-gray-100">
                            {r.totalScore}
                          </td>
                          <td
                            className={`px-3 py-2 text-center font-bold border-b border-gray-100 ${
                              r.grade === "A"
                                ? "text-green-700"
                                : r.grade === "F"
                                  ? "text-red-700"
                                  : "text-gray-800"
                            }`}
                          >
                            {r.grade}
                          </td>
                          <td className="px-3 py-2 text-center border-b border-gray-100">
                            {r.gradePoint.toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                            {r.remarks}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-2 flex justify-end">
                  <span className="text-xs bg-gray-100 border border-gray-200 rounded px-3 py-1 font-semibold">
                    Semester GPA: {g.gpa.toFixed(2)}
                    &nbsp;&nbsp;|&nbsp;&nbsp;Total Credit Units:{" "}
                    {g.totalCredits}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Summary Box */}
          <div className="mb-10 border-2 border-gray-800 rounded-lg p-5 bg-gray-50">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              Academic Summary
            </h2>
            <div className="flex flex-wrap gap-8 items-center">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">
                  Cumulative GPA (CGPA)
                </p>
                <p className="text-4xl font-black text-gray-900">
                  {cgpa.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">
                  Degree Classification
                </p>
                <p
                  className={`text-xl font-bold ${
                    cgpa >= 4.5
                      ? "text-green-700"
                      : cgpa >= 3.5
                        ? "text-blue-700"
                        : cgpa >= 2.4
                          ? "text-yellow-700"
                          : cgpa >= 1.5
                            ? "text-orange-700"
                            : "text-red-700"
                  }`}
                >
                  {classification.label}
                </p>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  <span className="font-semibold">First Class:</span> ≥ 4.50
                </div>
                <div>
                  <span className="font-semibold">2nd Class Upper:</span> ≥ 3.50
                </div>
                <div>
                  <span className="font-semibold">2nd Class Lower:</span> ≥ 2.40
                </div>
                <div>
                  <span className="font-semibold">Third Class:</span> ≥ 1.50
                </div>
              </div>
            </div>
          </div>

          {/* Registrar Signature Section */}
          <div className="border-t-2 border-gray-300 pt-6 grid grid-cols-3 gap-8 items-end">
            {/* Signature line */}
            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-800 mb-1" />
              <p className="text-xs text-gray-500 font-semibold">
                Registrar&apos;s Signature
              </p>
            </div>

            {/* Date */}
            <div className="text-center">
              <div className="h-12 flex items-end justify-center mb-1">
                <p className="text-sm font-semibold text-gray-700">
                  Date: ___________
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Document generated: {today}
              </p>
            </div>

            {/* Official stamp placeholder */}
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center mx-auto mb-1">
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-semibold leading-tight">
                    OFFICIAL
                  </p>
                  <p className="text-xs text-gray-400 font-semibold leading-tight">
                    STAMP
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">University Seal</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 italic">
              This transcript is generated electronically and is valid without a
              physical signature.
            </p>
          </div>
        </div>
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

function appealStatusColor(status: GradeAppeal["status"]): string {
  if (status === "resolved_revised")
    return "bg-success/10 text-success border-success/20";
  if (status === "resolved_upheld")
    return "bg-muted text-muted-foreground border-border";
  if (status === "pending_hod")
    return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function appealStatusLabel(status: GradeAppeal["status"]): string {
  if (status === "resolved_revised") return "Revision Approved";
  if (status === "resolved_upheld") return "Grade Upheld";
  if (status === "pending_hod") return "Pending HOD Review";
  return "Pending Lecturer Review";
}

function GradeAppealsTab() {
  const {
    currentUser,
    students,
    results,
    courses,
    gradeAppeals,
    submitGradeAppeal,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const myResults = me
    ? results.filter(
        (r) =>
          r.studentId === me.id &&
          (r.status === "published" || r.status === "approved"),
      )
    : [];

  const myAppeals = me ? gradeAppeals.filter((a) => a.studentId === me.id) : [];

  const [selectedResultId, setSelectedResultId] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit() {
    if (!me) return;
    if (!selectedResultId || !reason.trim()) {
      toast.error("Please select a result and provide a reason");
      return;
    }
    const result = results.find((r) => r.id === BigInt(selectedResultId));
    if (!result) return;
    const course = courses.find(
      (c) => String(c.id) === String(result.courseId),
    );
    const appeal: GradeAppeal = {
      id: BigInt(Date.now()),
      resultId: result.id,
      studentId: me.id,
      studentName: me.name,
      courseId: result.courseId,
      courseName: course?.name ?? "-",
      originalGrade: result.grade,
      reason: reason.trim(),
      status: "pending_lecturer",
      createdAt: new Date().toISOString(),
    };
    submitGradeAppeal(appeal);
    setSelectedResultId("");
    setReason("");
    toast.success("Grade appeal submitted successfully");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Grade Appeals
        </h1>
        <p className="text-sm text-muted-foreground">
          Submit and track your grade appeal requests
        </p>
      </div>

      {/* Submit new appeal */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold">Submit New Appeal</h2>
        <div>
          <label
            htmlFor="appeal-result-select"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Select Result to Appeal
          </label>
          <select
            id="appeal-result-select"
            data-ocid="appeals.result.select"
            value={selectedResultId}
            onChange={(e) => setSelectedResultId(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Select a published result --</option>
            {myResults.map((r) => {
              const course = courses.find(
                (c) => String(c.id) === String(r.courseId),
              );
              const alreadyAppealed = myAppeals.some(
                (a) => a.resultId === r.id && a.status !== "resolved_upheld",
              );
              return (
                <option
                  key={String(r.id)}
                  value={String(r.id)}
                  disabled={alreadyAppealed}
                >
                  {course?.code ?? "-"} - {course?.name ?? "-"} | Grade:{" "}
                  {r.grade} {alreadyAppealed ? "(Appeal pending)" : ""}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label
            htmlFor="appeal-reason"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Reason for Appeal
          </label>
          <textarea
            id="appeal-reason"
            data-ocid="appeals.reason.textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain your reason for appealing this grade..."
            className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
        <button
          type="button"
          data-ocid="appeals.submit_button"
          onClick={handleSubmit}
          disabled={!selectedResultId || !reason.trim()}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Submit Appeal
        </button>
      </div>

      {/* Appeal history */}
      <div>
        <h2 className="text-sm font-semibold mb-3">My Appeals</h2>
        {myAppeals.length === 0 ? (
          <div
            className="bg-card rounded-xl border border-dashed border-border p-10 text-center"
            data-ocid="appeals.empty_state"
          >
            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No grade appeals submitted yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myAppeals.map((appeal, i) => (
              <div
                key={String(appeal.id)}
                data-ocid={`appeals.item.${i + 1}`}
                className="bg-card rounded-xl border border-border p-4 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{appeal.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Original grade:{" "}
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${gradeColor(appeal.originalGrade)}`}
                      >
                        {appeal.originalGrade}
                      </span>{" "}
                      · Submitted{" "}
                      {new Date(appeal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap ${appealStatusColor(appeal.status)}`}
                  >
                    {appealStatusLabel(appeal.status)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground border-l-2 border-border pl-2">
                  {appeal.reason}
                </p>
                {appeal.lecturerResponse && (
                  <p className="text-xs bg-muted/50 rounded p-2">
                    <span className="font-medium">Lecturer response:</span>{" "}
                    {appeal.lecturerResponse}
                  </p>
                )}
                {appeal.hodResponse && (
                  <p className="text-xs bg-muted/50 rounded p-2">
                    <span className="font-medium">HOD response:</span>{" "}
                    {appeal.hodResponse}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== STUDENT GRADUATION TAB =====================
function StudentGraduationTab() {
  const {
    currentUser,
    students,
    results,
    departments,
    graduationApplications,
    submitGraduationApplication,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const dept = departments.find(
    (d) => String(d.id) === String(me?.departmentId),
  );
  const myResults = results.filter((r) => r.studentId === me?.id);
  const publishedResults = myResults.filter((r) => r.status === "published");

  const existing = me
    ? graduationApplications.find((a) => a.studentId === me.id)
    : undefined;

  const [session, setSession] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const creditCheck = publishedResults.length > 0;
  const carryoverCheck = !publishedResults.some((r) => r.grade === "F");

  function handleSubmit() {
    if (!me) return;
    if (!session.trim()) {
      toast.error("Please enter your session/year");
      return;
    }
    if (!confirmed) {
      toast.error("Please confirm your application");
      return;
    }

    const app: GraduationApplication = {
      id: BigInt(Date.now()),
      studentId: me.id,
      studentName: me.name,
      matric: me.matricNumber,
      department: dept?.name ?? "Unknown",
      session: session.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending_hod",
      creditCheck,
      carryoverCheck,
    };
    submitGraduationApplication(app);
    setSubmitted(true);
    toast.success("Graduation application submitted successfully");
  }

  function statusLabel(status: GraduationApplication["status"]) {
    const map: Record<string, string> = {
      pending_hod: "Pending HOD Review",
      pending_dean: "Pending Dean Review",
      pending_registrar: "Pending Registrar Review",
      approved: "Approved ✓",
      rejected: "Rejected",
    };
    return map[status] ?? status;
  }

  function statusColor(status: GraduationApplication["status"]) {
    if (status === "approved")
      return "bg-green-100 text-green-700 border-green-200";
    if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  if (!me) {
    return (
      <div
        className="p-8 text-center text-muted-foreground"
        data-ocid="graduation.empty_state"
      >
        Student record not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Graduation Clearance
        </h1>
        <p className="text-sm text-muted-foreground">
          Apply for graduation clearance for your final session
        </p>
      </div>

      {existing || submitted ? (
        <div
          className={`rounded-xl border p-5 ${existing ? statusColor(existing.status) : "bg-green-50 text-green-700 border-green-200"}`}
          data-ocid="graduation.panel"
        >
          <p className="font-semibold text-lg mb-1">Application Status</p>
          <p className="font-medium">
            {existing
              ? statusLabel(existing.status)
              : "Submitted — Pending HOD Review"}
          </p>
          {existing?.session && (
            <p className="text-sm mt-1">Session: {existing.session}</p>
          )}
          {existing?.hodNote && (
            <p className="text-sm mt-1">HOD Note: {existing.hodNote}</p>
          )}
          {existing?.deanNote && (
            <p className="text-sm mt-1">Dean Note: {existing.deanNote}</p>
          )}
          {existing?.registrarNote && (
            <p className="text-sm mt-1">
              Registrar Note: {existing.registrarNote}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-5 space-y-5 shadow-xs">
          <h2 className="font-semibold">Eligibility Checks</h2>
          <div className="space-y-2">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${creditCheck ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <span
                className={`text-lg ${creditCheck ? "text-green-600" : "text-red-500"}`}
              >
                {creditCheck ? "✓" : "✗"}
              </span>
              <div>
                <p className="text-sm font-medium">Published Results</p>
                <p className="text-xs text-muted-foreground">
                  {publishedResults.length} published result
                  {publishedResults.length !== 1 ? "s" : ""} on record
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${carryoverCheck ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
            >
              <span
                className={`text-lg ${carryoverCheck ? "text-green-600" : "text-red-500"}`}
              >
                {carryoverCheck ? "✓" : "✗"}
              </span>
              <div>
                <p className="text-sm font-medium">No Outstanding Failures</p>
                <p className="text-xs text-muted-foreground">
                  {carryoverCheck
                    ? "No F grades in published results"
                    : "You have F grades that need to be cleared"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grad-session">Graduation Session / Year</Label>
            <Input
              id="grad-session"
              data-ocid="graduation.input"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2024/2025"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="grad-confirm"
              data-ocid="graduation.checkbox"
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
            />
            <label
              htmlFor="grad-confirm"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I confirm that all information is accurate and I am eligible for
              graduation based on university requirements.
            </label>
          </div>

          <Button
            data-ocid="graduation.submit_button"
            onClick={handleSubmit}
            disabled={!creditCheck}
            className="w-full bg-primary text-primary-foreground"
          >
            Submit Graduation Application
          </Button>
          {!creditCheck && (
            <p className="text-xs text-destructive">
              You must have at least one published result to apply for
              graduation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== STUDENT TIMETABLE TAB =====================
function StudentTimetableTab() {
  const {
    currentUser,
    students,
    courseRegistrations,
    timetableEntries,
    courses,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const myRegCourseIds = new Set(
    courseRegistrations
      .filter((r) => r.studentId === me?.id)
      .map((r) => r.courseId),
  );
  const myEntries = [...timetableEntries]
    .filter((e) => myRegCourseIds.has(e.courseId))
    .sort((a, b) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const di = days.indexOf(a.day) - days.indexOf(b.day);
      if (di !== 0) return di;
      return a.startTime.localeCompare(b.startTime);
    });

  const dayColor: Record<string, string> = {
    Monday: "bg-blue-100 text-blue-700 border-blue-200",
    Tuesday: "bg-purple-100 text-purple-700 border-purple-200",
    Wednesday: "bg-green-100 text-green-700 border-green-200",
    Thursday: "bg-orange-100 text-orange-700 border-orange-200",
    Friday: "bg-pink-100 text-pink-700 border-pink-200",
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          My Weekly Timetable
        </h1>
        <p className="text-sm text-muted-foreground">
          {myEntries.length} class{myEntries.length !== 1 ? "es" : ""} scheduled
          for your registered courses
        </p>
      </div>

      {myEntries.length === 0 ? (
        <div
          className="bg-card rounded-xl border border-border p-10 text-center"
          data-ocid="timetable.empty_state"
        >
          <p className="text-muted-foreground">
            No timetable entries for your registered courses.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Register for courses or check back later when your schedule is
            posted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const dayEntries = myEntries.filter((e) => e.day === day);
            if (dayEntries.length === 0) return null;
            return (
              <div
                key={day}
                className="bg-card rounded-xl border border-border shadow-xs overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
                  <h3 className="font-semibold text-sm">{day}</h3>
                </div>
                <div className="divide-y divide-border">
                  {dayEntries.map((entry, i) => {
                    const course = courses.find(
                      (c) => String(c.id) === String(entry.courseId),
                    );
                    return (
                      <div
                        key={String(entry.id)}
                        data-ocid={`timetable.item.${i + 1}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className={`text-xs font-mono font-medium px-2 py-1 rounded-md border ${dayColor[day] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {entry.startTime}–{entry.endTime}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {course?.code ?? "?"} – {course?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            📍 {entry.venue} · {entry.semester} Semester
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeferralTab() {
  const {
    currentUser,
    students,
    deferralApplications,
    submitDeferralApplication,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const [reason, setReason] = useState("");
  const [returnDate, setReturnDate] = useState("");

  if (!me) return null;

  const myApps = deferralApplications.filter((a) => a.studentId === me.id);
  const hasApproved = myApps.some((a) => a.status === "approved");
  const hasPending = myApps.some((a) => a.status === "pending");

  function handleSubmit() {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    if (!returnDate) {
      toast.error("Please provide an expected return date");
      return;
    }
    if (!me) return;
    submitDeferralApplication({
      id: BigInt(Date.now()),
      studentId: me.id,
      studentName: me.name,
      matric: me.matricNumber,
      reason: reason.trim(),
      returnDate,
      submittedAt: new Date().toISOString(),
      status: "pending",
    });
    setReason("");
    setReturnDate("");
    toast.success("Deferral application submitted");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Deferral / Leave of Absence</h1>
        <p className="text-sm text-muted-foreground">
          Apply for academic deferral
        </p>
      </div>

      {hasApproved && (
        <div className="bg-success/10 border border-success/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-success">
            ✓ You have an approved deferral
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your academic standing is paused. Contact the Registrar for more
            information.
          </p>
        </div>
      )}

      {/* Application form */}
      {!hasApproved && !hasPending && (
        <div className="bg-card rounded-xl border border-border shadow-xs p-5 space-y-4">
          <h2 className="text-sm font-semibold">Submit Application</h2>
          <div className="space-y-3">
            <div>
              <label
                className="text-sm font-medium block mb-1"
                htmlFor="deferral-reason"
              >
                Reason for Deferral *
              </label>
              <textarea
                id="deferral-reason"
                data-ocid="deferral.textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain your reason for requesting deferral (medical, financial, personal)..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label
                className="text-sm font-medium block mb-1"
                htmlFor="deferral-return"
              >
                Expected Return Date *
              </label>
              <input
                id="deferral-return"
                type="date"
                data-ocid="deferral.input"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="button"
              data-ocid="deferral.submit_button"
              onClick={handleSubmit}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Submit Application
            </button>
          </div>
        </div>
      )}

      {hasPending && !hasApproved && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-warning">
            ⏳ Application Pending
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your deferral application is under review by the Registrar.
          </p>
        </div>
      )}

      {/* History */}
      {myApps.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">Application History</h2>
          </div>
          <div className="divide-y divide-border">
            {myApps.map((app) => (
              <div key={String(app.id)} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Return Date:{" "}
                    {new Date(app.returnDate).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {app.status === "pending" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                      Pending
                    </span>
                  )}
                  {app.status === "approved" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                      Approved
                    </span>
                  )}
                  {app.status === "rejected" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                      Rejected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{app.reason}</p>
                {app.registrarNote && (
                  <p className="text-xs text-foreground bg-muted/40 rounded p-2 mt-1">
                    <span className="font-medium">Registrar note:</span>{" "}
                    {app.registrarNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentExamScheduleTab() {
  const {
    currentUser,
    students,
    courseRegistrations,
    courses,
    academicCalendars,
  } = useApp();
  const student = students.find(
    (s) => s.userPrincipal === currentUser?.principal,
  );
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSemester = activeCalendar?.semester ?? "First";
  const myRegistrations = student
    ? courseRegistrations.filter(
        (r) => r.studentId === student.id && r.semester === activeSemester,
      )
    : [];
  const myCourseIds = myRegistrations.map((r) => r.courseId);
  const myCourseCodes = courses
    .filter((c) => myCourseIds.includes(c.id))
    .map((c) => c.code);
  return <ExamScheduleTab filterCourseCodes={myCourseCodes} isAdmin={false} />;
}

function StudentELibrarySection() {
  const { currentUser, students, departments } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const dept = me
    ? departments.find((d) => String(d.id) === String(me.departmentId))
    : null;
  return <StudentELibraryTab department={dept?.name ?? ""} />;
}

function StudentScholarshipsSection() {
  const { currentUser, students } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span>My Scholarships &amp; Awards</span>
      </h2>
      <StudentScholarshipCard matricNo={me?.matricNumber ?? ""} />
    </div>
  );
}
