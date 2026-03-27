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
  useApp,
} from "../context/AppContext";
import { CarryOverBanner } from "./tabs/CarryOverAutoTab";
import ClassroomTimetableTab from "./tabs/ClassroomTimetableTab";
import CourseEvaluationTab from "./tabs/CourseEvaluationTab";
import CourseHistoryTab from "./tabs/CourseHistoryTab";
import CourseRegSlipModal from "./tabs/CourseRegSlipModal";
import { StudentTransferTab } from "./tabs/DepartmentTransferTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import FeeStatusTab from "./tabs/FeeStatusTab";
import GPATrendChart from "./tabs/GPATrendChart";
import LecturerRatingTab from "./tabs/LecturerRatingTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import { StudentSIWESTab } from "./tabs/SIWESManagementTab";
import StudentDocumentsTab from "./tabs/StudentDocumentsTab";
import StudentEvaluationTab from "./tabs/StudentEvaluationTab";
import StudentIDCardModal from "./tabs/StudentIDCardModal";
import StudentInboxTab, { InboxUnreadBadge } from "./tabs/StudentInboxTab";
import StudentProgressTab from "./tabs/StudentProgressTab";

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
    { label: "Course History", tab: "course_history", icon: FileText },
    { label: "SIWES", tab: "siwes", icon: ClipboardList },
    { label: "Evaluate Lecturers", tab: "evaluate_lecturers", icon: Star },
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
  else if (activeTab === "class_timetable")
    content = <StudentClassTimetableTab />;
  else if (activeTab === "student_exam_timetable")
    content = <StudentExamTimetableTab />;
  else if (activeTab === "rate_lecturers")
    content = <LecturerRatingTab studentView={true} />;
  else if (activeTab === "evaluate_lecturers")
    content = <StudentEvaluationTab />;
  else if (activeTab === "course_history") content = <CourseHistoryTab />;
  else if (activeTab === "siwes") content = <StudentSIWESTab />;
  else content = <OverviewTab />;

  return (
    <>
      <NoticeBoardPanel userRole="Student" />
      <StudentStatusBanners />
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
  const { setActiveTab } = useContext(TabContext);
  const { me, myResults, cgpa } = getStudentData();
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
  const { staffMembers } = useApp();
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
  const isNewStudent = myResults.length === 0 && me;
  const onboardDismissKey = me ? `onboard_dismissed_${me.matricNumber}` : null;
  const [onboardDismissed, setOnboardDismissed] = useState<boolean>(() => {
    if (!onboardDismissKey) return true;
    return localStorage.getItem(onboardDismissKey) === "true";
  });
  function dismissOnboard() {
    if (onboardDismissKey) localStorage.setItem(onboardDismissKey, "true");
    setOnboardDismissed(true);
  }

  return (
    <div className="space-y-6">
      <CarryOverBanner />
      {isNewStudent && !onboardDismissed && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
          data-ocid="student.onboarding.card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">
                Welcome to UniResults Pro! 👋
              </p>
              <p className="text-xs text-muted-foreground">
                Complete these steps to get started:
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              data-ocid="student.onboarding.close_button"
              onClick={dismissOnboard}
            >
              Got it
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: "Complete Profile",
                tab: "progress",
                done: !!(me?.email || me?.phone),
              },
              { label: "Pay Fees", tab: "fee_status", done: false },
              { label: "Register Courses", tab: "course_reg", done: false },
              { label: "Check Timetable", tab: "timetable", done: false },
            ].map((item) => (
              <button
                key={item.tab}
                type="button"
                data-ocid={`student.onboarding.${item.tab}.button`}
                onClick={() => setActiveTab(item.tab)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-success text-success-foreground" : "bg-muted border border-border"}`}
                >
                  {item.done ? "✓" : ""}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {me && showIDCard && (
        <StudentIDCardModal
          student={me}
          open={showIDCard}
          onClose={() => setShowIDCard(false)}
        />
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Student Portal</h1>
          <p className="text-sm text-muted-foreground">
            {me?.name} &middot; {me?.matricNumber}
          </p>
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
        <StatCard label="CGPA" value={cgpa.toFixed(2)} icon={TrendingUp} />
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
    </div>
  );
}

function getLevelCreditLimits(_level: number): { min: number; max: number } {
  return { min: 16, max: 24 };
}

function CourseRegistrationTab() {
  const [showRegSlip, setShowRegSlip] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<bigint | null>(null);
  const {
    currentUser,
    students,
    courses,
    results,
    courseRegistrations,
    academicCalendars,
    addCourseRegistration,
    dropCourseRegistration,
    feeRecords,
    registrationDeadline,
    lateRegFineAmount,
    upsertFeeRecord,
  } = useApp();

  const [showLateRegDialog, setShowLateRegDialog] = useState(false);
  const [pendingCourseReg, setPendingCourseReg] = useState<{
    courseId: bigint;
    courseName: string;
  } | null>(null);
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  // Get all sessions for selector
  const allSessions = academicCalendars
    .slice()
    .sort((a, b) => a.session.localeCompare(b.session));

  // Active calendar or selected
  const activeCal = academicCalendars.find((c) => c.isActive);
  const selectedCal = activeSessionId
    ? academicCalendars.find((c) => String(c.id) === String(activeSessionId))
    : activeCal;

  // Set default to active calendar
  useEffect(() => {
    if (activeCal && !activeSessionId) {
      setActiveSessionId(activeCal.id);
    }
  }, [activeCal, activeSessionId]);

  // Carry-over courses: failed published/approved results
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

  // Student level
  const level = me ? Number(me.level) : 0;
  const meEx = me as any;
  const isPG = meEx?.programmeType === "Postgraduate";
  const pgLevel = meEx?.pgLevel as string | undefined;
  // PG credit limits
  const pgCreditLimits = (() => {
    if (!isPG) return null;
    if (pgLevel === "PhD" || pgLevel === "PGD") return { min: 6, max: 12 };
    return { min: 9, max: 18 }; // MSc, PGDE, MBA, MEd, MA
  })();
  const { min: MIN_CREDITS_BASE, max: MAX_CREDITS_BASE } =
    getLevelCreditLimits(level);
  const MIN_CREDITS = pgCreditLimits ? pgCreditLimits.min : MIN_CREDITS_BASE;
  const MAX_CREDITS = pgCreditLimits ? pgCreditLimits.max : MAX_CREDITS_BASE;
  const is100Level = level === 100;
  const isCarryoverLevel = level >= 200;
  const isFinalYear = level >= 400;

  // Level display label
  const levelYear = Math.floor(level / 100);
  const levelLabel = `Year ${levelYear} Course Registration — Level ${level}`;

  // Already registered courses for selected session
  const sessionKey = selectedCal
    ? `${selectedCal.session}_${selectedCal.semester}`
    : null;
  const sessionRegistrations =
    me && sessionKey
      ? courseRegistrations.filter(
          (r) =>
            r.studentId === me.id &&
            r.semester === (selectedCal?.semester ?? ""),
        )
      : [];
  const registeredCourseIds = new Set(
    sessionRegistrations.map((r) => r.courseId),
  );

  // Auto-register carry-over courses for 200+ levels (always, not gated on registrationOpen)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only when session changes
  useEffect(() => {
    if (!me || !selectedCal || !isCarryoverLevel) return;
    for (const cId of carryoverCourseIds) {
      if (!registeredCourseIds.has(cId)) {
        addCourseRegistration(me.id, cId, selectedCal.semester);
      }
    }
  }, [selectedCal?.id, isCarryoverLevel]);

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

  // Department courses
  // FIXED: use String() comparisons to avoid BigInt/number mismatch
  const deptCourses = isPG
    ? courses.filter(
        (c) =>
          String(c.departmentId) === String(me.departmentId) &&
          Number((c as any).level ?? 100) >= 700,
      )
    : courses.filter(
        (c) =>
          String(c.departmentId) === String(me.departmentId) &&
          Number((c as any).level ?? 100) < 700,
      );
  // Derive course level from code (e.g. CSC301 -> 300, BIO201 -> 200)
  const getCourseLevel = (code: string): number => {
    if (!code) return 100;
    const m = code.match(/[A-Za-z]+([0-9])/);
    return m ? Number.parseInt(m[1]) * 100 : 100;
  };
  // For 200+ level students, show courses at their level + carryover courses from any level
  const deptCoursesForLevel = isPG
    ? deptCourses
    : is100Level
      ? deptCourses
      : deptCourses.filter(
          (c) =>
            getCourseLevel(c.code) === level || carryoverCourseIds.has(c.id),
        );
  // Show ALL courses for the year (both semesters) so students can register for the full year
  const semCourses = deptCoursesForLevel;

  const registeredCourses = semCourses.filter((c) =>
    registeredCourseIds.has(c.id),
  );
  // Sort available: carryover first, then normal; each group sorted by creditUnits asc
  const availableCourses = semCourses
    .filter((c) => !registeredCourseIds.has(c.id))
    .sort((a, b) => {
      const aIsCo = carryoverCourseIds.has(a.id) ? 0 : 1;
      const bIsCo = carryoverCourseIds.has(b.id) ? 0 : 1;
      if (aIsCo !== bIsCo) return aIsCo - bIsCo;
      return Number(a.creditUnits) - Number(b.creditUnits);
    });

  // Per-semester splits
  const firstSemCourses = semCourses.filter((c) => c.semester === "First");
  const secondSemCourses = semCourses.filter((c) => c.semester === "Second");
  const firstSemRegistered = registeredCourses.filter(
    (c) => c.semester === "First",
  );
  const secondSemRegistered = registeredCourses.filter(
    (c) => c.semester === "Second",
  );
  const firstSemCredits = firstSemRegistered.reduce(
    (s, c) => s + Number(c.creditUnits),
    0,
  );
  const secondSemCredits = secondSemRegistered.reduce(
    (s, c) => s + Number(c.creditUnits),
    0,
  );
  const firstSemAvailable = availableCourses.filter(
    (c) => c.semester === "First",
  );
  const secondSemAvailable = availableCourses.filter(
    (c) => c.semester === "Second",
  );

  const totalCredits = registeredCourses.reduce(
    (sum, c) => sum + Number(c.creditUnits),
    0,
  );
  const creditOk = totalCredits >= MIN_CREDITS && totalCredits <= MAX_CREDITS;

  // Is registration or add/drop open?
  const regOpen = selectedCal?.registrationOpen ?? false;
  const addDropOpen = selectedCal?.addDropOpen ?? false;
  const canRegister = regOpen || addDropOpen;

  // Graduation eligibility (for final year)
  const cgpaForGrad = (() => {
    if (myResults.length === 0) return 0;
    const totalGP = myResults.reduce((s, r) => {
      const cu = Number(
        courses.find((c) => String(c.id) === String(r.courseId))?.creditUnits ??
          0,
      );
      return s + r.gradePoint * cu;
    }, 0);
    const totalCU = myResults.reduce((s, r) => {
      return (
        s +
        Number(
          courses.find((c) => String(c.id) === String(r.courseId))
            ?.creditUnits ?? 0,
        )
      );
    }, 0);
    return totalCU > 0 ? totalGP / totalCU : 0;
  })();
  const outstandingCount = myResults.filter((r) => r.grade === "F").length;
  const totalCreditsPassed = myResults
    .filter((r) => r.grade !== "F")
    .reduce(
      (s, r) =>
        s +
        Number(
          courses.find((c) => String(c.id) === String(r.courseId))
            ?.creditUnits ?? 0,
        ),
      0,
    );
  const gradEligible =
    cgpaForGrad > 1.0 &&
    outstandingCount === 0 &&
    totalCreditsPassed >= MIN_CREDITS;

  // Slip data
  const regSlipSession =
    selectedCal?.session ??
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const regSlipSemester = selectedCal
    ? `${selectedCal.semester} Semester`
    : "First Semester";

  function handleAdd(courseId: bigint, courseName: string) {
    if (!me || !selectedCal) return;
    if (
      totalCredits +
        Number(
          semCourses.find((c) => String(c.id) === String(courseId))
            ?.creditUnits ?? 0,
        ) >
      MAX_CREDITS
    ) {
      toast.error(
        `Adding this course exceeds the maximum credit units (${MAX_CREDITS})`,
      );
      return;
    }
    // Check outstanding fees
    const feeRec = feeRecords.find(
      (f) =>
        String(f.studentId) === String(me.id) &&
        f.session === selectedCal.session,
    );
    if (feeRec?.status === "outstanding" || feeRec?.status === "partial") {
      toast.error("Fee payment required before course registration.");
      return;
    }
    // Check late registration deadline
    if (registrationDeadline && new Date() > new Date(registrationDeadline)) {
      setPendingCourseReg({ courseId, courseName });
      setShowLateRegDialog(true);
      return;
    }
    addCourseRegistration(me.id, courseId, selectedCal.semester);
    toast.success(`Registered for ${courseName}`);
  }

  function confirmLateReg() {
    if (!pendingCourseReg || !me || !selectedCal) return;
    addCourseRegistration(
      me.id,
      pendingCourseReg.courseId,
      selectedCal.semester,
    );
    const existing = feeRecords.find(
      (f) =>
        String(f.studentId) === String(me.id) &&
        f.session === selectedCal.session,
    );
    if (existing) {
      upsertFeeRecord({
        ...existing,
        tuitionAmount: existing.tuitionAmount + lateRegFineAmount,
        status:
          existing.amountPaid < existing.tuitionAmount + lateRegFineAmount
            ? "outstanding"
            : existing.status,
        notes: `${existing.notes ? `${existing.notes}; ` : ""}Late Registration Fine: ₦${lateRegFineAmount.toLocaleString()}`,
      });
    } else {
      upsertFeeRecord({
        id: BigInt(Date.now()),
        studentId: me.id,
        session: selectedCal.session,
        tuitionAmount: lateRegFineAmount,
        amountPaid: 0,
        status: "outstanding",
        notes: `Late Registration Fine: ₦${lateRegFineAmount.toLocaleString()}`,
      });
    }
    toast.success(
      `Registered for ${pendingCourseReg.courseName}. Late fine of ₦${lateRegFineAmount.toLocaleString()} added.`,
    );
    setPendingCourseReg(null);
    setShowLateRegDialog(false);
  }

  function handleDrop(courseId: bigint, courseName: string) {
    if (!me || !selectedCal) return;
    dropCourseRegistration(me.id, courseId, selectedCal.semester);
    toast.success(`Dropped ${courseName}`);
  }

  function handleAutoSuggest(sem?: "First" | "Second") {
    if (!me || !selectedCal || !canRegister) return;
    const pool = sem
      ? semCourses.filter(
          (c) => c.semester === sem && !registeredCourseIds.has(c.id),
        )
      : semCourses.filter((c) => !registeredCourseIds.has(c.id));
    const sorted = [...pool].sort(
      (a, b) => Number(a.creditUnits) - Number(b.creditUnits),
    );
    const currentCredits = sem
      ? sem === "First"
        ? firstSemCredits
        : secondSemCredits
      : totalCredits;
    let running = currentCredits;
    for (const c of sorted) {
      if (running >= MIN_CREDITS) break;
      if (running + Number(c.creditUnits) <= MAX_CREDITS) {
        addCourseRegistration(me.id, c.id, selectedCal.semester);
        running += Number(c.creditUnits);
      }
    }
    toast.success("Courses auto-suggested to meet minimum credit units");
  }

  function handleAutoFillRemaining(sem?: "First" | "Second") {
    if (!me || !selectedCal || !canRegister) return;
    const pool = sem
      ? availableCourses.filter(
          (c) => c.semester === sem && !carryoverCourseIds.has(c.id),
        )
      : availableCourses.filter((c) => !carryoverCourseIds.has(c.id));
    const sorted = [...pool].sort(
      (a, b) => Number(a.creditUnits) - Number(b.creditUnits),
    );
    const currentCredits = sem
      ? sem === "First"
        ? firstSemCredits
        : secondSemCredits
      : totalCredits;
    let running = currentCredits;
    for (const c of sorted) {
      if (running >= MIN_CREDITS) break;
      if (running + Number(c.creditUnits) <= MAX_CREDITS) {
        addCourseRegistration(me.id, c.id, selectedCal.semester);
        running += Number(c.creditUnits);
      }
    }
    toast.success("Credits auto-filled to meet minimum requirement");
  }

  const creditProgressPct =
    MAX_CREDITS > 0 ? Math.min((totalCredits / MAX_CREDITS) * 100, 100) : 0;
  const creditBadgeClass =
    totalCredits === 0
      ? "bg-muted text-muted-foreground"
      : creditOk
        ? "bg-success/10 text-success border border-success/20"
        : totalCredits < MIN_CREDITS
          ? "bg-warning/10 text-warning border border-warning/20"
          : "bg-destructive/10 text-destructive border border-destructive/20";

  const progressBarColor =
    totalCredits < MIN_CREDITS
      ? "bg-destructive"
      : totalCredits > MAX_CREDITS
        ? "bg-warning"
        : "bg-success";

  return (
    <div className="space-y-6">
      {showRegSlip && (
        <CourseRegSlipModal
          student={me}
          registeredCourses={registeredCourses}
          session={regSlipSession}
          semester={regSlipSemester}
          open={showRegSlip}
          onClose={() => setShowRegSlip(false)}
        />
      )}

      {/* Late Registration Fine Dialog */}
      {showLateRegDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="bg-card rounded-xl border border-border shadow-xl p-6 max-w-sm w-full mx-4"
            data-ocid="late_reg.dialog"
          >
            <h2 className="text-base font-bold mb-2">Late Registration Fine</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The registration deadline has passed. A late registration fine of{" "}
              <span className="font-semibold text-foreground">
                ₦{lateRegFineAmount.toLocaleString()}
              </span>{" "}
              will be added to your account. Do you wish to proceed?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLateRegDialog(false);
                  setPendingCourseReg(null);
                }}
                data-ocid="late_reg.cancel_button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmLateReg}
                data-ocid="late_reg.confirm_button"
              >
                Proceed & Pay Fine
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Graduation Eligibility Panel for Level 400+ */}
      {isFinalYear && myResults.length > 0 && (
        <div
          className={`rounded-xl border p-4 ${gradEligible ? "bg-success/5 border-success/30" : "bg-warning/5 border-warning/30"}`}
          data-ocid="coursereg.grad_eligibility.panel"
        >
          <div className="flex items-start gap-3">
            <GraduationCap
              className={`w-5 h-5 mt-0.5 shrink-0 ${gradEligible ? "text-success" : "text-warning"}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-2">
                🎓 Graduation Eligibility Check
              </h3>
              <div className="flex flex-wrap gap-3 text-xs mb-2">
                <span className="px-2 py-1 rounded bg-card border border-border">
                  CGPA: <strong>{cgpaForGrad.toFixed(2)}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-card border border-border">
                  Credits Passed: <strong>{totalCreditsPassed}</strong>
                </span>
                <span className="px-2 py-1 rounded bg-card border border-border">
                  Outstanding: <strong>{outstandingCount}</strong>
                </span>
              </div>
              {gradEligible ? (
                <p className="text-xs text-success font-medium">
                  ✅ You meet all graduation requirements for this period.
                </p>
              ) : (
                <div className="space-y-1">
                  {outstandingCount > 0 && (
                    <p className="text-xs text-warning">
                      ⚠️ You have {outstandingCount} outstanding (F) course
                      {outstandingCount !== 1 ? "s" : ""} that must be cleared
                      before graduation.
                    </p>
                  )}
                  {cgpaForGrad <= 1.0 && (
                    <p className="text-xs text-destructive">
                      ⚠️ Your CGPA ({cgpaForGrad.toFixed(2)}) is below the
                      minimum threshold of 1.0.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            {levelLabel}
          </h1>
          <p className="text-sm text-muted-foreground">
            {me.name} &bull; {me.matricNumber} &bull; Level {level}
          </p>
          {isCarryoverLevel && (
            <p className="text-xs text-muted-foreground mt-0.5 italic">
              Carryover courses are automatically pre-selected
            </p>
          )}
        </div>
        {registeredCourses.length > 0 && (
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

      {/* Session Selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <CalendarCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Academic Session:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allSessions.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No sessions configured
              </span>
            )}
            {allSessions.map((cal) => (
              <button
                key={String(cal.id)}
                type="button"
                onClick={() => setActiveSessionId(cal.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedCal?.id === cal.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {cal.session} &ndash; {cal.semester} Semester
                {cal.isActive && (
                  <span className="ml-1.5 px-1 py-0.5 rounded text-[10px] bg-success/20 text-success">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* PG Programme Badge */}
        {isPG && pgLevel && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
            🎓 Postgraduate Programme — {pgLevel}
          </div>
        )}

        {selectedCal && (
          <div className="mt-3 space-y-2">
            {/* Main Portal Status Banner */}
            {selectedCal.registrationOpen ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-success/10 text-success border border-success/25">
                <CheckCircle2 className="w-4 h-4" />✓{" "}
                {isPG ? "Postgraduate" : ""} Course Registration Portal is OPEN
                — {selectedCal.session} {selectedCal.semester} Semester
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-destructive/10 text-destructive border border-destructive/25">
                <Lock className="w-4 h-4" />✗ Course Registration Portal is
                CLOSED. Contact the Registrar to open registration.
              </div>
            )}
            {/* Add/Drop Banner */}
            {selectedCal.addDropOpen ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                <CheckCircle2 className="w-3.5 h-3.5" />✓ Add/Drop Period is
                OPEN
                {(selectedCal as any).addDropDeadline && (
                  <span className="ml-1 text-muted-foreground">
                    — Deadline:{" "}
                    {new Date(
                      (selectedCal as any).addDropDeadline,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            ) : (selectedCal as any).addDropDeadline ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-muted/30 text-muted-foreground border border-border">
                <Lock className="w-3.5 h-3.5" />
                Add/Drop Period is CLOSED. Deadline was{" "}
                {new Date(
                  (selectedCal as any).addDropDeadline,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                .
              </div>
            ) : null}
          </div>
        )}

        {selectedCal && (
          <div className="mt-3 flex flex-wrap gap-3">
            {/* Registration Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                selectedCal.registrationOpen
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted/30 text-muted-foreground border-border"
              }`}
            >
              {selectedCal.registrationOpen ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              Registration: {selectedCal.registrationOpen ? "Open" : "Closed"}
            </div>
            {/* Add/Drop Status */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                selectedCal.addDropOpen
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/30 text-muted-foreground border-border"
              }`}
            >
              {selectedCal.addDropOpen ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              Add/Drop: {selectedCal.addDropOpen ? "Open" : "Closed"}
            </div>

            {/* Credit Units Summary Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${creditBadgeClass}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {totalCredits} credit units registered
              {totalCredits > 0 &&
                !creditOk &&
                totalCredits < MIN_CREDITS &&
                ` (below min ${MIN_CREDITS})`}
              {totalCredits > MAX_CREDITS && ` (exceeds max ${MAX_CREDITS})`}
              {creditOk && " ✓"}
            </div>
          </div>
        )}

        {/* Credit Progress Bar */}
        {selectedCal && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Credit Units Progress</span>
              <span
                className={
                  creditOk
                    ? "text-success font-medium"
                    : totalCredits < MIN_CREDITS
                      ? "text-warning font-medium"
                      : "text-destructive font-medium"
                }
              >
                {totalCredits} units registered &bull; Minimum: {MIN_CREDITS}{" "}
                &bull; Maximum: {MAX_CREDITS}
              </span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                style={{ width: `${creditProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span className="text-warning">Min: {MIN_CREDITS}</span>
              <span className="text-success">Max: {MAX_CREDITS}</span>
            </div>
          </div>
        )}

        {!canRegister && selectedCal && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Registration is currently <strong>closed</strong> for this
              session. You can still view and plan your courses below. Contact
              the Registrar to open registration.
            </span>
          </div>
        )}
      </div>

      {/* Level 100: Two-column semester layout */}
      {is100Level && selectedCal && (
        <div className="space-y-6">
          {semCourses.length === 0 && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No courses available for your department
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(["First", "Second"] as const).map((sem) => {
              const semCourseList =
                sem === "First" ? firstSemCourses : secondSemCourses;
              const semCredits =
                sem === "First" ? firstSemCredits : secondSemCredits;
              const semRegCount = (
                sem === "First" ? firstSemRegistered : secondSemRegistered
              ).length;
              const coreCount = (
                sem === "First" ? firstSemRegistered : secondSemRegistered
              ).filter((c) => (c as any).courseType !== "Elective").length;
              const electiveCount = semRegCount - coreCount;
              const semCreditOk =
                semCredits >= MIN_CREDITS && semCredits <= MAX_CREDITS;
              const semProgressPct =
                MAX_CREDITS > 0
                  ? Math.min((semCredits / MAX_CREDITS) * 100, 100)
                  : 0;
              const semProgressColor =
                semCredits < MIN_CREDITS
                  ? "bg-destructive"
                  : semCredits > MAX_CREDITS
                    ? "bg-warning"
                    : "bg-success";
              return (
                <div key={sem} className="space-y-4">
                  {/* Semester header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-base">
                        {sem} Semester
                      </h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Level 100
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        semCredits === 0
                          ? "bg-muted text-muted-foreground"
                          : semCreditOk
                            ? "bg-success/10 text-success border border-success/20"
                            : semCredits < MIN_CREDITS
                              ? "bg-warning/10 text-warning border border-warning/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {semCredits}/{MAX_CREDITS} units
                    </span>
                  </div>

                  {/* Credit progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${semProgressColor}`}
                        style={{ width: `${semProgressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Min: {MIN_CREDITS}</span>
                      <span>Max: {MAX_CREDITS}</span>
                    </div>
                  </div>

                  {/* Core/Elective summary */}
                  {semRegCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {coreCount} Core{coreCount !== 1 ? "" : ""},{" "}
                      {electiveCount} Elective registered
                    </p>
                  )}

                  {/* Auto-suggest button */}
                  {canRegister && semCredits < MIN_CREDITS && (
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid={`coursereg.l100.autosuggest_${sem.toLowerCase()}_button`}
                      onClick={() => handleAutoSuggest(sem)}
                      className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5 w-full"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Auto-suggest {sem} Semester Courses
                    </Button>
                  )}

                  {/* Course cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {semCourseList.map((c, i) => {
                      const isReg = registeredCourseIds.has(c.id);
                      const semCreditsForCheck =
                        sem === "First" ? firstSemCredits : secondSemCredits;
                      const wouldExceed =
                        !isReg &&
                        semCreditsForCheck + Number(c.creditUnits) >
                          MAX_CREDITS;
                      const courseType = (c as any).courseType ?? "Core";
                      return (
                        <div
                          key={String(c.id)}
                          data-ocid={`coursereg.l100.${sem.toLowerCase()}.course.${i + 1}`}
                          className={`relative flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                            isReg
                              ? "border-success/40 bg-success/5"
                              : wouldExceed
                                ? "border-border/50 bg-muted/20 opacity-60"
                                : "border-border bg-card hover:border-primary/40"
                          }`}
                        >
                          {isReg && (
                            <span className="absolute top-2 right-2">
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            </span>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-mono text-muted-foreground">
                                {c.code}
                              </p>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                  courseType === "Elective"
                                    ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                    : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                }`}
                              >
                                {courseType}
                              </span>
                            </div>
                            <p className="text-sm font-semibold mt-0.5 pr-5 line-clamp-2">
                              {c.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {String(c.creditUnits)} units
                            </p>
                          </div>
                          {canRegister ? (
                            isReg ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/5 mt-auto"
                                data-ocid={`coursereg.l100.${sem.toLowerCase()}.drop.${i + 1}`}
                                onClick={() => handleDrop(c.id, c.code)}
                              >
                                <XCircle className="w-3 h-3 mr-1" /> Drop
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                disabled={wouldExceed}
                                className="h-7 text-xs mt-auto"
                                data-ocid={`coursereg.l100.${sem.toLowerCase()}.select.${i + 1}`}
                                onClick={() => handleAdd(c.id, c.code)}
                              >
                                ✅ Select
                              </Button>
                            )
                          ) : (
                            <span
                              className={`text-xs px-2 py-1 rounded mt-auto inline-block ${isReg ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                            >
                              {isReg ? "Registered" : "Not Registered"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary table per semester */}
                  {(sem === "First" ? firstSemRegistered : secondSemRegistered)
                    .length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        {sem} Semester Registered (
                        {
                          (sem === "First"
                            ? firstSemRegistered
                            : secondSemRegistered
                          ).length
                        }
                        )
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>S/N</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Course Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Units</TableHead>
                            {canRegister && <TableHead />}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(sem === "First"
                            ? firstSemRegistered
                            : secondSemRegistered
                          ).map((c, i) => (
                            <TableRow key={String(c.id)}>
                              <TableCell className="text-muted-foreground">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.code}
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {c.name}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                    (c as any).courseType === "Elective"
                                      ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                      : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  }`}
                                >
                                  {(c as any).courseType ?? "Core"}
                                </span>
                              </TableCell>
                              <TableCell>{String(c.creditUnits)}</TableCell>
                              {canRegister && (
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => handleDrop(c.id, c.code)}
                                  >
                                    <MinusCircle className="w-3 h-3 mr-1" />{" "}
                                    Drop
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/20 font-semibold">
                            <TableCell
                              colSpan={4}
                              className="text-right text-sm"
                            >
                              Total:
                            </TableCell>
                            <TableCell
                              className={
                                semCreditOk
                                  ? "text-success font-bold"
                                  : semCredits < MIN_CREDITS
                                    ? "text-warning font-bold"
                                    : "text-destructive font-bold"
                              }
                            >
                              {semCredits}
                            </TableCell>
                            {canRegister && <TableCell />}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Level 200+: Carry-over + normal registration */}
      {isCarryoverLevel && selectedCal && (
        <div className="space-y-6">
          {/* Carry-over panel */}
          {carryoverCourseIds.size > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-destructive" />
                <h3 className="font-semibold text-sm text-destructive">
                  Carry-Over Courses ({carryoverCourseIds.size}) &mdash;
                  Auto-Registered
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                The following courses were automatically registered because you
                had an F grade. You must re-take them.
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {Array.from(carryoverCourseIds).map((cId) => {
                  const c = courses.find((x) => String(x.id) === String(cId));
                  if (!c) return null;
                  const isReg = registeredCourseIds.has(cId);
                  return (
                    <div
                      key={String(cId)}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-card border border-destructive/20"
                    >
                      <div>
                        <span className="text-xs font-mono text-destructive">
                          {c.code}
                        </span>
                        <p className="text-xs font-medium mt-0.5">{c.name}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {String(c.creditUnits)} units
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-0.5 inline-block ml-1">
                          {c.semester} Sem
                        </span>
                      </div>
                      {isReg ? (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-success/10 text-success font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Registered
                        </span>
                      ) : canRegister ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleAdd(c.id, c.code)}
                        >
                          <PlusCircle className="w-3 h-3 mr-1" /> Register
                        </Button>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Two-column semester layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(["First", "Second"] as const).map((sem) => {
              const semRegList =
                sem === "First" ? firstSemRegistered : secondSemRegistered;
              const semAvailList =
                sem === "First" ? firstSemAvailable : secondSemAvailable;
              const semCredits =
                sem === "First" ? firstSemCredits : secondSemCredits;
              const semCreditOk =
                semCredits >= MIN_CREDITS && semCredits <= MAX_CREDITS;
              const semProgressPct =
                MAX_CREDITS > 0
                  ? Math.min((semCredits / MAX_CREDITS) * 100, 100)
                  : 0;
              const semProgressColor =
                semCredits < MIN_CREDITS
                  ? "bg-destructive"
                  : semCredits > MAX_CREDITS
                    ? "bg-warning"
                    : "bg-success";
              const coreCount = semRegList.filter(
                (c) => (c as any).courseType !== "Elective",
              ).length;
              const electiveCount = semRegList.length - coreCount;
              return (
                <div key={sem} className="space-y-4">
                  {/* Semester header */}
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-base">
                      {sem} Semester Courses
                    </h2>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        semCredits === 0
                          ? "bg-muted text-muted-foreground"
                          : semCreditOk
                            ? "bg-success/10 text-success border border-success/20"
                            : semCredits < MIN_CREDITS
                              ? "bg-warning/10 text-warning border border-warning/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {semCredits}/{MAX_CREDITS} units
                    </span>
                  </div>

                  {/* Credit progress */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${semProgressColor}`}
                        style={{ width: `${semProgressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Min: {MIN_CREDITS}</span>
                      <span>Max: {MAX_CREDITS}</span>
                    </div>
                  </div>

                  {/* Core/Elective summary */}
                  {semRegList.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {coreCount} Core, {electiveCount} Elective registered
                    </p>
                  )}

                  {/* Registered courses */}
                  <div className="bg-card rounded-xl border border-border">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        Registered ({semRegList.length})
                      </h3>
                      {semCredits < MIN_CREDITS && (
                        <span className="text-xs text-warning">
                          Need {MIN_CREDITS - semCredits} more units
                        </span>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Units</TableHead>
                          {canRegister && <TableHead />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {semRegList.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={canRegister ? 5 : 4}
                              className="text-center py-4 text-muted-foreground text-sm"
                              data-ocid={`coursereg.200.${sem.toLowerCase()}.registered.empty`}
                            >
                              No courses registered yet
                            </TableCell>
                          </TableRow>
                        )}
                        {semRegList.map((c, i) => {
                          const isCo = carryoverCourseIds.has(c.id);
                          return (
                            <TableRow
                              key={String(c.id)}
                              data-ocid={`coursereg.200.${sem.toLowerCase()}.registered.${i + 1}`}
                              className={isCo ? "bg-destructive/5" : ""}
                            >
                              <TableCell className="font-medium text-sm">
                                <div className="flex items-center gap-1.5">
                                  {c.name}
                                  {isCo && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                      <RefreshCw className="w-2.5 h-2.5" /> CO
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.code}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                    (c as any).courseType === "Elective"
                                      ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                      : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  }`}
                                >
                                  {(c as any).courseType ?? "Core"}
                                </span>
                              </TableCell>
                              <TableCell>{String(c.creditUnits)}</TableCell>
                              {canRegister && (
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => handleDrop(c.id, c.code)}
                                  >
                                    <MinusCircle className="w-3 h-3 mr-1" />{" "}
                                    Drop
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/20 font-semibold">
                          <TableCell colSpan={3} className="text-right text-sm">
                            Total:
                          </TableCell>
                          <TableCell
                            className={
                              semCreditOk
                                ? "text-success font-bold"
                                : semCredits < MIN_CREDITS
                                  ? "text-warning font-bold"
                                  : "text-destructive font-bold"
                            }
                          >
                            {semCredits}
                          </TableCell>
                          {canRegister && <TableCell />}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Available courses */}
                  <div className="bg-card rounded-xl border border-border">
                    <div className="p-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        Available ({semAvailList.length})
                      </h3>
                      {canRegister && semCredits < MIN_CREDITS && (
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`coursereg.200.${sem.toLowerCase()}.autofill_button`}
                          onClick={() => handleAutoFillRemaining(sem)}
                          className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Auto-fill
                        </Button>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Course</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Units</TableHead>
                          {canRegister && <TableHead />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {semAvailList.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={canRegister ? 5 : 4}
                              className="text-center py-4 text-muted-foreground text-sm"
                            >
                              All courses registered
                            </TableCell>
                          </TableRow>
                        )}
                        {semAvailList.map((c, i) => {
                          const isCo = carryoverCourseIds.has(c.id);
                          const semCreditsForCheck =
                            sem === "First"
                              ? firstSemCredits
                              : secondSemCredits;
                          const wouldExceed =
                            semCreditsForCheck + Number(c.creditUnits) >
                            MAX_CREDITS;
                          return (
                            <TableRow
                              key={String(c.id)}
                              data-ocid={`coursereg.200.${sem.toLowerCase()}.available.${i + 1}`}
                              className={isCo ? "bg-destructive/5" : ""}
                            >
                              <TableCell className="font-medium text-sm">
                                <div className="flex items-center gap-1.5">
                                  {c.name}
                                  {isCo && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                      <RefreshCw className="w-2.5 h-2.5" /> CO
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.code}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${
                                    (c as any).courseType === "Elective"
                                      ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                                      : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  }`}
                                >
                                  {(c as any).courseType ?? "Core"}
                                </span>
                              </TableCell>
                              <TableCell>{String(c.creditUnits)}</TableCell>
                              {canRegister && (
                                <TableCell>
                                  <Button
                                    size="sm"
                                    disabled={wouldExceed}
                                    className={`h-7 text-xs ${isCo ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
                                    data-ocid={`coursereg.200.${sem.toLowerCase()}.add.${i + 1}`}
                                    onClick={() => handleAdd(c.id, c.code)}
                                  >
                                    <PlusCircle className="w-3 h-3 mr-1" />
                                    {isCo ? "Re-register" : "✅ Add"}
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* No session selected */}
      {!selectedCal && (
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

function StudentStatusBanners() {
  const {
    currentUser,
    students,
    feeRecords,
    courseRegistrations,
    academicCalendars,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  if (!me || !activeCalendar) return null;

  const feeRecord = feeRecords.find(
    (f) =>
      String(f.studentId) === String(me.id) &&
      f.session === activeCalendar.session,
  );
  const hasOutstandingFees =
    feeRecord?.status === "outstanding" || feeRecord?.status === "partial";
  const registeredCourses = courseRegistrations.filter(
    (r) =>
      String(r.studentId) === String(me.id) &&
      r.semester === activeCalendar.semester,
  );
  const hasRegistered = registeredCourses.length > 0;

  if (hasOutstandingFees && !hasRegistered) {
    return (
      <div
        className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        data-ocid="student.status.error_state"
      >
        <AlertCircle className="mt-0.5 w-4 h-4 shrink-0" />
        <div>
          <p className="font-semibold">Account Restricted</p>
          <p className="text-xs mt-0.5">
            You have unpaid school fees and have not registered courses for this
            session. Please visit the Bursary and register your courses to
            restore full access.
          </p>
        </div>
      </div>
    );
  }
  if (hasOutstandingFees) {
    return (
      <div
        className="mb-4 flex items-start gap-2 rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800"
        data-ocid="student.status.panel"
      >
        <AlertCircle className="mt-0.5 w-4 h-4 shrink-0 text-orange-500" />
        <div>
          <p className="font-semibold">Fee Payment Required</p>
          <p className="text-xs mt-0.5">
            You have an outstanding balance for {activeCalendar.session}{" "}
            session. Course registration submit is disabled until fees are
            cleared.
          </p>
        </div>
      </div>
    );
  }
  if (!hasRegistered) {
    return (
      <div
        className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800"
        data-ocid="student.status.panel"
      >
        <AlertCircle className="mt-0.5 w-4 h-4 shrink-0 text-yellow-500" />
        <div>
          <p className="font-semibold">Course Registration Pending</p>
          <p className="text-xs mt-0.5">
            You have not registered any courses for this session.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function StudentClassTimetableTab() {
  const { currentUser, students } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  if (!me)
    return (
      <div className="p-6 text-muted-foreground">Student record not found.</div>
    );
  const level = String((me as any).level ?? "100");
  return (
    <ClassroomTimetableTab
      isAdmin={false}
      filterForStudent={{ departmentId: me.departmentId, level }}
    />
  );
}

function StudentExamTimetableTab() {
  const {
    currentUser,
    students,
    courseRegistrations,
    courses,
    academicCalendars,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const myCourseIds = me
    ? courseRegistrations
        .filter(
          (r) =>
            String(r.studentId) === String(me.id) &&
            r.semester === activeCalendar?.semester,
        )
        .map((r) => r.courseId)
    : [];
  const myCourseCodes = courses
    .filter((c) => myCourseIds.some((id) => String(id) === String(c.id)))
    .map((c) => c.code);
  return <ExamScheduleTab filterCourseCodes={myCourseCodes} isAdmin={false} />;
}
