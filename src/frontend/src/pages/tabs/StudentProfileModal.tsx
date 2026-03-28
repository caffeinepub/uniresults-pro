import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, User } from "lucide-react";
import {
  getAcademicStanding,
  getStudentDepartment,
  getStudentFaculty,
  useApp,
} from "../../context/AppContext";
import PhotoAvatar from "./PhotoAvatar";

interface Props {
  studentId: bigint | null;
  onClose: () => void;
}

export default function StudentProfileModal({ studentId, onClose }: Props) {
  const {
    students,
    departments,
    faculties,
    courses,
    results,
    courseRegistrations,
    feeRecords,
    attendanceSessions,
    institutionSettings,
  } = useApp();

  const student = studentId
    ? students.find((s) => String(s.id) === String(studentId))
    : null;

  if (!student) return null;

  const es = student as any;
  const dept = getStudentDepartment(student, departments);
  const fac = getStudentFaculty(student, departments, faculties);

  // Course registrations for this student
  const myCourseRegs = courseRegistrations.filter(
    (cr) => String(cr.studentId) === String(student.id),
  );

  // Published/approved results for this student
  const myResults = results.filter(
    (r) =>
      String(r.studentId) === String(student.id) &&
      (r.status === "published" ||
        r.status === "approved" ||
        r.status === "hod_approved" ||
        r.status === "dean_approved"),
  );

  // Group results by semester
  const resultsBySemester: Record<string, typeof myResults> = {};
  for (const r of myResults) {
    const semester = (r as any).semester ?? "First Semester";
    const key = `${(r as any).session ?? "2024/2025"} — ${semester}`;
    if (!resultsBySemester[key]) resultsBySemester[key] = [];
    resultsBySemester[key].push(r);
  }

  // Compute CGPA
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  for (const r of myResults) {
    const c = courses.find((c) => String(c.id) === String(r.courseId));
    const credits = c ? Number(c.creditUnits) : 0;
    totalWeightedPoints += r.gradePoint * credits;
    totalCredits += credits;
  }
  const cgpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
  const standing = getAcademicStanding(cgpa);

  // Fee records for this student
  const myFees = feeRecords.filter(
    (f) => String(f.studentId) === String(student.id),
  );
  const totalOwed = myFees.reduce((sum, f) => sum + f.tuitionAmount, 0);
  const totalPaid = myFees.reduce((sum, f) => sum + f.amountPaid, 0);
  const outstanding = totalOwed - totalPaid;

  // Attendance per course
  const attendanceMap: Record<string, { present: number; total: number }> = {};
  for (const session of attendanceSessions) {
    const record = session.records.find(
      (r) => String(r.studentId) === String(student.id),
    );
    if (record !== undefined) {
      const key = String(session.courseId);
      if (!attendanceMap[key]) attendanceMap[key] = { present: 0, total: 0 };
      attendanceMap[key].total++;
      if (record.present) attendanceMap[key].present++;
    }
  }

  function handlePrint() {
    window.print();
  }

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-success/10 text-success border-success/20";
      case "partial":
        return "bg-warning/10 text-warning border-warning/20";
      case "outstanding":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={!!studentId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="student_profile.dialog"
        className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-border print:pb-2">
          <div className="flex items-center gap-4">
            <PhotoAvatar
              photoKey={`student_photo_url_${String(student.id)}`}
              name={student.name}
              size="md"
            />
            <div>
              <DialogTitle className="text-lg font-bold">
                {student.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {student.matricNumber} &bull; {dept?.name ?? "—"} &bull; Level{" "}
                {String(student.level)}
              </p>
              <p className="text-xs text-muted-foreground">
                {fac?.name ?? "—"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-ocid="student_profile.print_button"
            onClick={handlePrint}
            className="no-print shrink-0"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print
          </Button>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 pt-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6 mb-4 h-auto no-print">
                <TabsTrigger
                  value="personal"
                  data-ocid="student_profile.personal.tab"
                  className="text-xs py-1.5"
                >
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="courses"
                  data-ocid="student_profile.courses.tab"
                  className="text-xs py-1.5"
                >
                  Courses
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  data-ocid="student_profile.results.tab"
                  className="text-xs py-1.5"
                >
                  Results
                </TabsTrigger>
                <TabsTrigger
                  value="fees"
                  data-ocid="student_profile.fees.tab"
                  className="text-xs py-1.5"
                >
                  Fees
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  data-ocid="student_profile.attendance.tab"
                  className="text-xs py-1.5"
                >
                  Attendance
                </TabsTrigger>
                <TabsTrigger
                  value="standing"
                  data-ocid="student_profile.standing.tab"
                  className="text-xs py-1.5"
                >
                  Standing
                </TabsTrigger>
              </TabsList>

              {/* ── Personal Info ─────────────────────────── */}
              <TabsContent value="personal" className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Full Name", value: student.name },
                    { label: "Matric Number", value: student.matricNumber },
                    {
                      label: "JAMB Reg No.",
                      value: es.jambRegNo ?? es.regNo ?? "—",
                    },
                    { label: "Department", value: dept?.name ?? "—" },
                    { label: "Faculty", value: fac?.name ?? "—" },
                    { label: "Level", value: `${String(student.level)} Level` },
                    { label: "Gender", value: es.gender ?? "—" },
                    { label: "Date of Birth", value: es.dob ?? "—" },
                    { label: "Email", value: es.email ?? "—" },
                    { label: "Phone", value: es.phone ?? "—" },
                    { label: "State of Origin", value: es.state ?? "—" },
                    { label: "LGA", value: es.lga ?? "—" },
                    { label: "Status", value: student.status },
                    { label: "Entry Mode", value: es.entryMode ?? "UTME" },
                    {
                      label: "Semesters Registered",
                      value: String(es.semestersRegistered ?? 0),
                    },
                    { label: "Institution", value: institutionSettings.name },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col gap-0.5 bg-muted/30 rounded-lg px-3 py-2 border border-border/50"
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        {label}
                      </span>
                      <span className="text-sm font-semibold capitalize">
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ── Course Registrations ───────────────────── */}
              <TabsContent value="courses" className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Course Registrations
                </h2>
                {myCourseRegs.length === 0 ? (
                  <div
                    className="text-center text-muted-foreground py-10 text-sm"
                    data-ocid="student_profile.courses.empty_state"
                  >
                    No course registrations found
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          {[
                            "S/N",
                            "Course Code",
                            "Course Title",
                            "Credit Units",
                            "Semester",
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
                        {myCourseRegs.map((cr, i) => {
                          const course = courses.find(
                            (c) => String(c.id) === String(cr.courseId),
                          );
                          return (
                            <tr
                              key={String(cr.courseId) + cr.semester}
                              className="border-b border-border/50 hover:bg-muted/20"
                              data-ocid={`student_profile.courses.item.${i + 1}`}
                            >
                              <td className="px-3 py-2 text-xs text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="px-3 py-2 text-xs font-mono">
                                {course?.code ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {course?.name ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-center">
                                {course ? String(course.creditUnits) : "—"}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {cr.semester}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* ── Academic Results ───────────────────────── */}
              <TabsContent value="results" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Academic Results
                  </h2>
                  {totalCredits > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Cumulative GPA
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {cgpa.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                {myResults.length === 0 ? (
                  <div
                    className="text-center text-muted-foreground py-10 text-sm"
                    data-ocid="student_profile.results.empty_state"
                  >
                    No results published yet
                  </div>
                ) : (
                  Object.entries(resultsBySemester).map(
                    ([semKey, semResults]) => {
                      let semWP = 0;
                      let semTC = 0;
                      for (const r of semResults) {
                        const c = courses.find(
                          (c) => String(c.id) === String(r.courseId),
                        );
                        const cr = c ? Number(c.creditUnits) : 0;
                        semWP += r.gradePoint * cr;
                        semTC += cr;
                      }
                      const semGPA = semTC > 0 ? semWP / semTC : 0;
                      return (
                        <div key={semKey} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold text-foreground">
                              {semKey}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              GPA: {semGPA.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                  {[
                                    "Course Code",
                                    "Course Title",
                                    "CA",
                                    "Exam",
                                    "Total",
                                    "Grade",
                                    "GP",
                                    "Remarks",
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
                                {semResults.map((r) => {
                                  const course = courses.find(
                                    (c) => String(c.id) === String(r.courseId),
                                  );
                                  const gradeColor =
                                    r.grade === "A"
                                      ? "text-success"
                                      : r.grade === "F"
                                        ? "text-destructive"
                                        : "text-foreground";
                                  return (
                                    <tr
                                      key={
                                        String(r.courseId) +
                                        String(r.gradePoint)
                                      }
                                      className="border-b border-border/50 hover:bg-muted/20"
                                    >
                                      <td className="px-3 py-2 text-xs font-mono">
                                        {course?.code ?? "—"}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        {course?.name ?? "—"}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        {r.caScore}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        {r.examScore}
                                      </td>
                                      <td className="px-3 py-2 text-xs font-semibold">
                                        {r.totalScore}
                                      </td>
                                      <td
                                        className={`px-3 py-2 text-xs font-bold ${gradeColor}`}
                                      >
                                        {r.grade}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        {r.gradePoint}
                                      </td>
                                      <td className="px-3 py-2 text-xs">
                                        {r.remarks}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </TabsContent>

              {/* ── Fees & Payments ────────────────────────── */}
              <TabsContent value="fees" className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Fees &amp; Payments
                </h2>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Total Owed</p>
                    <p className="text-lg font-bold">
                      ₦{totalOwed.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-bold text-success">
                      ₦{totalPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p
                      className={`text-lg font-bold ${outstanding > 0 ? "text-destructive" : "text-success"}`}
                    >
                      ₦{outstanding.toLocaleString()}
                    </p>
                  </div>
                </div>
                {myFees.length === 0 ? (
                  <div
                    className="text-center text-muted-foreground py-10 text-sm"
                    data-ocid="student_profile.fees.empty_state"
                  >
                    No fee records found
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          {[
                            "Session",
                            "Amount",
                            "Paid",
                            "Outstanding",
                            "Status",
                            "Date",
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
                        {myFees.map((f, i) => (
                          <tr
                            key={String(f.id)}
                            className="border-b border-border/50 hover:bg-muted/20"
                            data-ocid={`student_profile.fees.item.${i + 1}`}
                          >
                            <td className="px-3 py-2 text-xs">{f.session}</td>
                            <td className="px-3 py-2 text-xs">
                              ₦{f.tuitionAmount.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-xs text-success">
                              ₦{f.amountPaid.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-xs text-destructive">
                              ₦
                              {(
                                f.tuitionAmount - f.amountPaid
                              ).toLocaleString()}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${statusColor(f.status)}`}
                              >
                                {f.status.charAt(0).toUpperCase() +
                                  f.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {f.paymentDate ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* ── Attendance ─────────────────────────────── */}
              <TabsContent value="attendance" className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Attendance by Course
                </h2>
                {Object.keys(attendanceMap).length === 0 ? (
                  <div
                    className="text-center text-muted-foreground py-10 text-sm"
                    data-ocid="student_profile.attendance.empty_state"
                  >
                    No attendance records found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(attendanceMap).map(([courseId, att], i) => {
                      const course = courses.find(
                        (c) => String(c.id) === courseId,
                      );
                      const pct =
                        att.total > 0
                          ? Math.round((att.present / att.total) * 100)
                          : 0;
                      return (
                        <div
                          key={courseId}
                          className="bg-card rounded-xl border border-border p-4"
                          data-ocid={`student_profile.attendance.item.${i + 1}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold">
                                {course?.name ?? "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {course?.code ?? courseId}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-lg font-bold ${pct >= 75 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive"}`}
                              >
                                {pct}%
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {att.present}/{att.total} classes
                              </p>
                            </div>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ── Academic Standing ─────────────────────── */}
              <TabsContent value="standing" className="space-y-4">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Academic Standing
                </h2>
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-4xl font-black ${cgpa >= 2.0 ? "text-success" : cgpa >= 1.0 ? "text-warning" : "text-destructive"}`}
                    >
                      {cgpa.toFixed(2)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Cumulative GPA
                      </p>
                      <span
                        className={`text-sm font-semibold px-3 py-1 rounded-full border ${standing.badgeClass}`}
                      >
                        {standing.label}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Total Credit Units:
                      </span>{" "}
                      <span className="font-semibold">{totalCredits}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Results Recorded:
                      </span>{" "}
                      <span className="font-semibold">{myResults.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Courses Failed:
                      </span>{" "}
                      <span className="font-semibold text-destructive">
                        {myResults.filter((r) => r.grade === "F").length}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Level:</span>{" "}
                      <span className="font-semibold">
                        {String(student.level)}
                      </span>
                    </div>
                  </div>
                  {es.previousStanding === "probation" && cgpa < 2.0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
                      ⚠ Two consecutive probations detected — Withdrawal Risk
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground border-t border-border pt-3">
                    Standing Scale: Good Standing ≥ 2.00 &bull; Probation
                    1.00–1.99 &bull; Withdrawal Risk &lt; 1.00
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
