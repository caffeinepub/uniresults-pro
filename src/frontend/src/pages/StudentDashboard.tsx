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
  BookOpen,
  Download,
  FileText,
  GraduationCap,
  MessageSquare,
  MinusCircle,
  PlusCircle,
  Printer,
  RefreshCw,
  Star,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useContext, useMemo, useState } from "react";
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
import CourseEvaluationTab from "./tabs/CourseEvaluationTab";
import CourseRegSlipModal from "./tabs/CourseRegSlipModal";
import { StudentTransferTab } from "./tabs/DepartmentTransferTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import FeeStatusTab from "./tabs/FeeStatusTab";
import GPATrendChart from "./tabs/GPATrendChart";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import StudentDocumentsTab from "./tabs/StudentDocumentsTab";
import StudentIDCardModal from "./tabs/StudentIDCardModal";
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

  const quickActions = [
    { label: "View Transcript", tab: "transcript", icon: FileText },
    { label: "Submit Appeal", tab: "appeals", icon: MessageSquare },
    { label: "View Progress", tab: "progress", icon: TrendingUp },
    { label: "My Documents", tab: "documents", icon: Award },
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
  else content = <OverviewTab />;

  return (
    <>
      <NoticeBoardPanel userRole="Student" />
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
    const course = courses.find((c) => c.id === r.courseId);
    const credits = course ? Number(course.creditUnits) : 0;
    totalWeightedPoints += r.gradePoint * credits;
    totalCreditUnits += credits;
  }
  const cgpa =
    totalCreditUnits > 0 ? totalWeightedPoints / totalCreditUnits : 0;

  return { me, myResults, cgpa, courses };
}

function OverviewTab() {
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

  return (
    <div className="space-y-6">
      <CarryOverBanner />
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

function CourseRegistrationTab() {
  const [showRegSlip, setShowRegSlip] = useState(false);
  const {
    currentUser,
    students,
    courses,
    results,
    courseRegistrations,
    academicCalendars: cals,
    addCourseRegistration,
    dropCourseRegistration,
  } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  const MIN_CREDITS = 12;
  const MAX_CREDITS = 24;

  const semesters = ["First", "Second"];

  // Find carry-over courses (F grade, published/approved)
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

  const deptCourses = courses.filter((c) => c.departmentId === me.departmentId);

  // active semester for slip
  const activeCalSlip = cals.find((c) => c.isActive);
  const regSlipSession =
    activeCalSlip?.session ??
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
  const regSlipSemester = activeCalSlip
    ? `${activeCalSlip.semester} Semester`
    : "First Semester";

  // All registered courses for slip
  const allRegCourses = courses.filter((c) =>
    semesters.some((sem) =>
      courseRegistrations.some(
        (r) =>
          r.studentId === me.id && r.courseId === c.id && r.semester === sem,
      ),
    ),
  );

  return (
    <div className="space-y-6">
      {showRegSlip && (
        <CourseRegSlipModal
          student={me}
          registeredCourses={allRegCourses}
          session={regSlipSession}
          semester={regSlipSemester}
          open={showRegSlip}
          onClose={() => setShowRegSlip(false)}
        />
      )}
      <div>
        <h1 className="text-xl font-bold">Course Registration</h1>
        <p className="text-sm text-muted-foreground">
          Select courses for each semester (Min: {MIN_CREDITS} | Max:{" "}
          {MAX_CREDITS} credit units)
        </p>
      </div>

      {semesters.map((semester) => {
        const registered = courseRegistrations.filter(
          (r) => r.studentId === me.id && r.semester === semester,
        );
        const registeredCourseIds = registered.map((r) => r.courseId);
        const semCourses = deptCourses.filter((c) => c.semester === semester);
        const registeredCourses = semCourses.filter((c) =>
          registeredCourseIds.some((id) => id === c.id),
        );
        const availableCourses = semCourses.filter(
          (c) => !registeredCourseIds.some((id) => id === c.id),
        );
        const totalCredits = registeredCourses.reduce(
          (sum, c) => sum + Number(c.creditUnits),
          0,
        );
        const creditOk = totalCredits >= MIN_CREDITS;

        return (
          <div key={semester} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{semester} Semester</h2>
              <div
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  totalCredits === 0
                    ? "bg-muted text-muted-foreground"
                    : creditOk && totalCredits <= MAX_CREDITS
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {totalCredits} / {MAX_CREDITS} credit units
                {totalCredits > 0 && !creditOk && " (min not met)"}
                {totalCredits > MAX_CREDITS && " (exceeds max)"}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Registered courses */}
              <div className="bg-card rounded-xl border border-border shadow-xs">
                <div className="p-4 border-b border-border flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    Registered Courses ({registeredCourses.length})
                  </h3>
                  {registeredCourses.length > 0 && me && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      data-ocid="coursereg.print_slip_button"
                      onClick={() => setShowRegSlip(true)}
                    >
                      <Printer className="w-3 h-3 mr-1" /> Print Slip
                    </Button>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredCourses.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground text-sm"
                          data-ocid={`coursereg.${semester.toLowerCase()}.empty_state`}
                        >
                          No courses registered
                        </TableCell>
                      </TableRow>
                    )}
                    {registeredCourses.map((c, i) => {
                      const isCarryover = carryoverCourseIds.has(c.id);
                      return (
                        <TableRow
                          key={String(c.id)}
                          data-ocid={`coursereg.registered.item.${i + 1}`}
                          className={isCarryover ? "bg-destructive/5" : ""}
                        >
                          <TableCell className="font-medium text-sm">
                            <div className="flex items-center gap-2">
                              {c.name}
                              {isCarryover && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  Carry-over
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {c.code}
                          </TableCell>
                          <TableCell>{String(c.creditUnits)}</TableCell>
                          <TableCell>
                            <Button
                              data-ocid={`coursereg.drop_button.${i + 1}`}
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                dropCourseRegistration(me.id, c.id, semester);
                                toast.success(`Dropped ${c.code}`);
                              }}
                              className="h-7 text-xs"
                            >
                              <MinusCircle className="w-3 h-3 mr-1" /> Drop
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Available courses */}
              <div className="bg-card rounded-xl border border-border shadow-xs">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-semibold">
                    Available Courses ({availableCourses.length})
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableCourses.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-muted-foreground text-sm"
                        >
                          All courses registered
                        </TableCell>
                      </TableRow>
                    )}
                    {availableCourses.map((c, i) => {
                      const wouldExceed =
                        totalCredits + Number(c.creditUnits) > MAX_CREDITS;
                      const isCarryover = carryoverCourseIds.has(c.id);
                      return (
                        <TableRow
                          key={String(c.id)}
                          data-ocid={`coursereg.available.item.${i + 1}`}
                          className={isCarryover ? "bg-destructive/5" : ""}
                        >
                          <TableCell className="font-medium text-sm">
                            <div className="flex items-center gap-2">
                              {c.name}
                              {isCarryover && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  Carry-over
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {c.code}
                          </TableCell>
                          <TableCell>{String(c.creditUnits)}</TableCell>
                          <TableCell>
                            <Button
                              data-ocid={`coursereg.add_button.${i + 1}`}
                              size="sm"
                              disabled={wouldExceed}
                              onClick={() => {
                                addCourseRegistration(me.id, c.id, semester);
                                toast.success(`Registered for ${c.code}`);
                              }}
                              className={`h-7 text-xs ${
                                isCarryover
                                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <PlusCircle className="w-3 h-3 mr-1" />
                              {isCarryover ? "Re-register" : "Add"}
                            </Button>
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
      })}
    </div>
  );
}

function ResultsTab() {
  const { me, myResults, courses, cgpa } = getStudentData();

  function handleDownloadTranscript() {
    if (!me) return;
    const header =
      "Course Code,Course Name,Credit Units,CA (/40),Exam (/60),Total (/100),Grade,Grade Points,Remarks";
    const rows = myResults.map((r) => {
      const course = courses.find((c) => c.id === r.courseId);
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
            {myResults.length === 0 && (
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
            {myResults.map((r, i) => {
              const course = courses.find((c) => c.id === r.courseId);
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
      const course = courses.find((c) => c.id === r.courseId);
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
        const course = courses.find((c) => c.id === r.courseId);
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
        const course = courses.find((c) => c.id === r.courseId);
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
                      const course = courses.find((c) => c.id === r.courseId);
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
    const course = courses.find((c) => c.id === r.courseId);
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
                const course = courses.find((c) => c.id === r.courseId);
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

  const department = departments.find((d) => d.id === me?.departmentId);

  // Group by semester
  const semesterGroups = useMemo(() => {
    const groups: Record<
      string,
      { results: typeof publishedResults; gpa: number; totalCredits: number }
    > = {};
    for (const r of publishedResults) {
      const course = courses.find((c) => c.id === r.courseId);
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
        const course = courses.find((c) => c.id === r.courseId);
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
                      const course = courses.find((c) => c.id === r.courseId);
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
    const course = courses.find((c) => c.id === result.courseId);
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
              const course = courses.find((c) => c.id === r.courseId);
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
  const dept = departments.find((d) => d.id === me?.departmentId);
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
                    const course = courses.find((c) => c.id === entry.courseId);
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
