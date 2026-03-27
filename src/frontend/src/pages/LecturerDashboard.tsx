import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileUp,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Upload,
  XCircle,
} from "lucide-react";
import { useContext, useRef, useState } from "react";
import { toast } from "sonner";
import { TabContext } from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { calcGradePoint, useApp } from "../context/AppContext";
import type {
  AmendmentRequest,
  ExtendedResult,
  GradeAppeal,
} from "../context/AppContext";
import AttendanceTab from "./tabs/AttendanceTab";
import BiometricAttendanceTab from "./tabs/BiometricAttendanceTab";
import ClassroomTimetableTab from "./tabs/ClassroomTimetableTab";
import ExamScheduleTab from "./tabs/ExamScheduleTab";
import LecturerPortalTab from "./tabs/LecturerPortalTab";
import LecturerRatingTab from "./tabs/LecturerRatingTab";
import LecturerResultsTab from "./tabs/LecturerResultsTab";
import MyEvaluationsTab from "./tabs/MyEvaluationsTab";
import NoticeBoardPanel from "./tabs/NoticeBoardPanel";
import ResultAmendmentTab from "./tabs/ResultAmendmentTab";
import ResultsProcessingTab from "./tabs/ResultsProcessingTab";
import ScoreEntrySheetTab from "./tabs/ScoreEntrySheetTab";

export default function LecturerDashboard() {
  const { activeTab, setActiveTab } = useContext(TabContext);

  const quickActions = [
    { label: "Enter Results", tab: "results", icon: ClipboardList },
    { label: "Score Sheet", tab: "score_sheet", icon: ClipboardList },
    {
      label: "Results Pipeline",
      tab: "results_processing",
      icon: ClipboardCheck,
    },
    { label: "Mark Attendance", tab: "attendance", icon: ClipboardCheck },
    { label: "View Courses", tab: "overview", icon: BookOpen },
    { label: "My Results", tab: "my_results", icon: ClipboardList },
    { label: "My Portal", tab: "my_portal", icon: BookOpen },
    { label: "Class Timetable", tab: "class_timetable", icon: ClipboardList },
    { label: "My Ratings", tab: "my_ratings", icon: ClipboardList },
    { label: "My Evaluations", tab: "my_evaluations", icon: ClipboardList },
  ];

  return (
    <>
      <NoticeBoardPanel userRole="Lecturer" />
      <div className="flex flex-wrap gap-2 px-0 pb-3 pt-1 border-b border-border/50 mb-4 no-print">
        {quickActions.map((a) => (
          <button
            key={a.tab}
            type="button"
            data-ocid={`lecturer_quick.${a.tab}.button`}
            onClick={() => setActiveTab(a.tab)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${activeTab === a.tab ? "bg-primary/10 text-primary border-primary/30" : ""}`}
          >
            <a.icon className="w-3 h-3" />
            {a.label}
          </button>
        ))}
      </div>
      {activeTab === "bulk_upload" ? (
        <BulkUploadView />
      ) : activeTab === "appeals" ? (
        <LecturerAppealsTab />
      ) : activeTab === "schedule" ? (
        <TeachingScheduleTab />
      ) : activeTab === "attendance" ? (
        <AttendanceTab />
      ) : activeTab === "biometric" ? (
        <BiometricAttendanceTab />
      ) : activeTab === "exam_schedule" ? (
        <LecturerExamScheduleTab />
      ) : activeTab === "score_sheet" ? (
        <ScoreEntrySheetTab />
      ) : activeTab === "results_processing" ? (
        <ResultsProcessingTab userRole="Lecturer" />
      ) : activeTab === "result_amendment" ? (
        <ResultAmendmentTab userRole="Lecturer" />
      ) : activeTab === "my_results" ? (
        <LecturerResultsTab />
      ) : activeTab === "my_portal" ? (
        <LecturerPortalTab />
      ) : activeTab === "class_timetable" ? (
        <LecturerClassTimetableTab />
      ) : activeTab === "exam_timetable" ? (
        <LecturerExamTimetableTab />
      ) : activeTab === "my_ratings" ? (
        <LecturerRatingTab studentView={false} />
      ) : (
        <CoursesView />
      )}
    </>
  );
}

function gradePreviewBg(grade: string): string {
  if (grade === "A") return "bg-green-50 border-green-200 text-green-800";
  if (grade === "B") return "bg-blue-50 border-blue-200 text-blue-800";
  if (grade === "C") return "bg-yellow-50 border-yellow-200 text-yellow-800";
  if (grade === "D" || grade === "E")
    return "bg-orange-50 border-orange-200 text-orange-800";
  return "bg-red-50 border-red-200 text-red-800";
}

function CoursesView() {
  const {
    currentUser,
    courses,
    students,
    results,
    upsertResult,
    updateResultStatus,
    addAmendmentRequest,
    amendmentRequests,
  } = useApp();
  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );
  const [selectedCourse, setSelectedCourse] = useState<bigint | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [editResult, setEditResult] = useState<ExtendedResult | null>(null);
  const [form, setForm] = useState({ studentId: "", ca: "", exam: "" });

  // Amendment dialog state
  const [amendTarget, setAmendTarget] = useState<ExtendedResult | null>(null);
  const [amendForm, setAmendForm] = useState({
    newCa: "",
    newExam: "",
    reason: "",
  });

  const courseResults = selectedCourse
    ? (results.filter((r) => r.courseId === selectedCourse) as ExtendedResult[])
    : [];
  const selectedCourseObj = myCourses.find((c) => c.id === selectedCourse);
  const courseStudents = students.filter(
    (s) => s.departmentId === selectedCourseObj?.departmentId,
  );

  const liveTotal =
    form.ca !== "" && form.exam !== ""
      ? Number.parseFloat(form.ca || "0") + Number.parseFloat(form.exam || "0")
      : null;
  const liveCalc = liveTotal !== null ? calcGradePoint(liveTotal) : null;

  const amendLiveTotal =
    amendForm.newCa !== "" && amendForm.newExam !== ""
      ? Number.parseFloat(amendForm.newCa || "0") +
        Number.parseFloat(amendForm.newExam || "0")
      : null;
  const amendLiveCalc =
    amendLiveTotal !== null ? calcGradePoint(amendLiveTotal) : null;

  function handleEnterResult() {
    if (!form.studentId || !form.ca || !form.exam || !selectedCourse) return;
    const ca = Number.parseFloat(form.ca);
    const exam = Number.parseFloat(form.exam);
    if (ca < 0 || ca > 40 || exam < 0 || exam > 60) {
      toast.error("CA must be 0-40 and Exam must be 0-60");
      return;
    }
    const total = ca + exam;
    const { grade, gradePoint, remarks } = calcGradePoint(total);
    const result: ExtendedResult = {
      id: editResult?.id ?? BigInt(Date.now()),
      studentId: BigInt(form.studentId),
      courseId: selectedCourse,
      caScore: ca,
      examScore: exam,
      totalScore: total,
      grade,
      gradePoint,
      remarks,
      status: "draft",
    };
    upsertResult(result);
    setForm({ studentId: "", ca: "", exam: "" });
    setEditResult(null);
    setEntryOpen(false);
    toast.success(editResult ? "Result updated" : "Result entered");
  }

  function handleSubmit(id: bigint) {
    updateResultStatus(id, "submitted");
    toast.success("Result submitted for approval");
  }

  function openEdit(r: ExtendedResult) {
    setEditResult(r);
    setForm({
      studentId: String(r.studentId),
      ca: String(r.caScore),
      exam: String(r.examScore),
    });
    setEntryOpen(true);
  }

  function openAmendment(r: ExtendedResult) {
    setAmendTarget(r);
    setAmendForm({
      newCa: String(r.caScore),
      newExam: String(r.examScore),
      reason: "",
    });
  }

  function handleSubmitAmendment() {
    if (!amendTarget || !amendForm.reason.trim()) {
      toast.error("Please provide a reason for the amendment");
      return;
    }
    const newCa = Number(amendForm.newCa);
    const newExam = Number(amendForm.newExam);
    if (newCa < 0 || newCa > 40 || newExam < 0 || newExam > 60) {
      toast.error("CA must be 0-40 and Exam must be 0-60");
      return;
    }
    const req: AmendmentRequest = {
      id: BigInt(Date.now()),
      resultId: amendTarget.id,
      studentId: amendTarget.studentId,
      courseId: amendTarget.courseId,
      originalCa: amendTarget.caScore,
      originalExam: amendTarget.examScore,
      newCa,
      newExam,
      reason: amendForm.reason.trim(),
      lecturerName: currentUser?.name ?? "Lecturer",
      status: "pending_hod",
      createdAt: new Date().toISOString(),
    };
    addAmendmentRequest(req);
    setAmendTarget(null);
    setAmendForm({ newCa: "", newExam: "", reason: "" });
    toast.success("Amendment request submitted to HOD");
  }

  function hasPendingAmendment(resultId: bigint): boolean {
    return amendmentRequests.some(
      (a) =>
        a.resultId === resultId &&
        (a.status === "pending_hod" ||
          a.status === "pending_dean" ||
          a.status === "pending_registrar"),
    );
  }

  function handleDownloadScoreSheet() {
    if (!selectedCourse || courseResults.length === 0) return;
    const courseName = selectedCourseObj?.name ?? "Course";
    const courseCode = selectedCourseObj?.code ?? "";
    const header =
      "S/N,Student Name,Matric Number,CA (/40),Exam (/60),Total (/100),Grade,Grade Points,Remarks,Status";
    const rows = courseResults.map((r, i) => {
      const student = students.find(
        (s) => String(s.id) === String(r.studentId),
      );
      return [
        i + 1,
        student?.name ?? "-",
        student?.matricNumber ?? "-",
        r.caScore,
        r.examScore,
        r.totalScore,
        r.grade,
        r.gradePoint.toFixed(1),
        r.remarks,
        r.status,
      ].join(",");
    });
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${courseCode}_score_sheet.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Score sheet downloaded: ${courseName}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          {myCourses.length} assigned courses
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myCourses.map((c, i) => (
          <button
            type="button"
            key={String(c.id)}
            data-ocid={`courses.item.${i + 1}`}
            onClick={() => setSelectedCourse(c.id)}
            className={`text-left bg-card rounded-xl border p-4 shadow-xs transition-all hover:shadow-md ${
              selectedCourse === c.id
                ? "border-primary ring-1 ring-primary"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <span className="font-mono text-sm font-semibold">{c.code}</span>
            </div>
            <p className="text-sm font-medium text-foreground">{c.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {String(c.creditUnits)} units &middot; {c.semester} Semester
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {results.filter((r) => r.courseId === c.id).length} results
              entered
            </p>
          </button>
        ))}
        {myCourses.length === 0 && (
          <div
            className="col-span-3 bg-card rounded-xl border border-border p-8 text-center"
            data-ocid="courses.empty_state"
          >
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No courses assigned yet
            </p>
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-sm">
                {selectedCourseObj?.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {courseResults.length} results
              </p>
            </div>
            <div className="flex gap-2">
              {courseResults.length > 0 && (
                <Button
                  data-ocid="results.download_button"
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadScoreSheet}
                  className="h-8 text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Score Sheet
                </Button>
              )}
              <Button
                data-ocid="results.open_modal_button"
                size="sm"
                onClick={() => {
                  setEditResult(null);
                  setForm({ studentId: "", ca: "", exam: "" });
                  setEntryOpen(true);
                }}
                className="bg-primary text-primary-foreground h-8 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Enter Result
              </Button>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>CA (/40)</TableHead>
                <TableHead>Exam (/60)</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseResults.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-6 text-muted-foreground"
                    data-ocid="results.empty_state"
                  >
                    No results yet
                  </TableCell>
                </TableRow>
              )}
              {courseResults.map((r, i) => {
                const student = students.find(
                  (s) => String(s.id) === String(r.studentId),
                );
                const pendingAmend = hasPendingAmendment(r.id);
                return (
                  <TableRow
                    key={String(r.id)}
                    data-ocid={`results.item.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm">
                      {student?.name ?? "-"}
                    </TableCell>
                    <TableCell>{r.caScore}</TableCell>
                    <TableCell>{r.examScore}</TableCell>
                    <TableCell className="font-medium">
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
                      <div className="flex flex-col gap-1">
                        {r.status === "draft" && (
                          <div className="flex gap-1">
                            <Button
                              data-ocid={`results.edit_button.${i + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(r)}
                              className="h-7 text-xs"
                            >
                              <Pencil className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button
                              data-ocid={`results.submit_button.${i + 1}`}
                              size="sm"
                              onClick={() => handleSubmit(r.id)}
                              className="h-7 text-xs bg-primary text-primary-foreground"
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Submit
                            </Button>
                          </div>
                        )}
                        {(r.status === "published" ||
                          r.status === "approved") &&
                          !pendingAmend && (
                            <Button
                              data-ocid={`results.edit_button.${i + 1}`}
                              size="sm"
                              variant="outline"
                              onClick={() => openAmendment(r)}
                              className="h-7 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
                            >
                              <Pencil className="w-3 h-3 mr-1" /> Request
                              Amendment
                            </Button>
                          )}
                        {(r.status === "published" ||
                          r.status === "approved") &&
                          pendingAmend && (
                            <span className="text-xs text-amber-600 font-medium">
                              ⏳ Amendment Pending
                            </span>
                          )}
                        {r.status === "draft" && r.rejectionReason && (
                          <span
                            className="text-xs text-orange-600 font-medium"
                            data-ocid={`results.error_state.${i + 1}`}
                          >
                            ⚠ Rejected: {r.rejectionReason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Entry Dialog */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent data-ocid="results.dialog">
          <DialogHeader>
            <DialogTitle>
              {editResult ? "Edit Result" : "Enter Result"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Student</Label>
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
                disabled={!!editResult}
              >
                <SelectTrigger data-ocid="results.student.select">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {courseStudents.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name} ({s.matricNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CA Score (0–40)</Label>
                <Input
                  data-ocid="results.ca.input"
                  type="number"
                  min={0}
                  max={40}
                  value={form.ca}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ca: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Exam Score (0–60)</Label>
                <Input
                  data-ocid="results.exam.input"
                  type="number"
                  min={0}
                  max={60}
                  value={form.exam}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, exam: e.target.value }))
                  }
                />
              </div>
            </div>
            {liveCalc && liveTotal !== null && (
              <div
                className={`p-4 rounded-xl border-2 ${gradePreviewBg(
                  liveCalc.grade,
                )}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Live Preview
                  </span>
                  <span className="text-2xl font-black">{liveCalc.grade}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs opacity-60">Total</p>
                    <p className="font-bold text-lg">{liveTotal}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">Points</p>
                    <p className="font-bold text-lg">
                      {liveCalc.gradePoint.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs opacity-60">Remarks</p>
                    <p className="font-bold text-sm">{liveCalc.remarks}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              data-ocid="results.cancel_button"
              variant="outline"
              onClick={() => setEntryOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="results.save_button"
              onClick={handleEnterResult}
              className="bg-primary text-primary-foreground"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment Dialog */}
      <Dialog
        open={!!amendTarget}
        onOpenChange={(open) => {
          if (!open) setAmendTarget(null);
        }}
      >
        <DialogContent data-ocid="amendment.dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Score Amendment</DialogTitle>
          </DialogHeader>
          {amendTarget && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Original Scores
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">CA</p>
                    <p className="font-bold">{amendTarget.caScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Exam</p>
                    <p className="font-bold">{amendTarget.examScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold">{amendTarget.totalScore}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>New CA Score (0–40)</Label>
                  <Input
                    data-ocid="amendment.ca.input"
                    type="number"
                    min={0}
                    max={40}
                    value={amendForm.newCa}
                    onChange={(e) =>
                      setAmendForm((f) => ({ ...f, newCa: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>New Exam Score (0–60)</Label>
                  <Input
                    data-ocid="amendment.exam.input"
                    type="number"
                    min={0}
                    max={60}
                    value={amendForm.newExam}
                    onChange={(e) =>
                      setAmendForm((f) => ({ ...f, newExam: e.target.value }))
                    }
                  />
                </div>
              </div>
              {amendLiveCalc && amendLiveTotal !== null && (
                <div
                  className={`p-3 rounded-lg border-2 ${gradePreviewBg(
                    amendLiveCalc.grade,
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      New: {amendLiveTotal}/100 &rarr; {amendLiveCalc.grade} (
                      {amendLiveCalc.remarks})
                    </span>
                    <span className="text-xl font-black">
                      {amendLiveCalc.grade}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <Label>
                  Reason for Amendment{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  data-ocid="amendment.reason.textarea"
                  placeholder="Explain why this amendment is needed..."
                  value={amendForm.reason}
                  onChange={(e) =>
                    setAmendForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              data-ocid="amendment.cancel_button"
              variant="outline"
              onClick={() => setAmendTarget(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="amendment.submit_button"
              onClick={handleSubmitAmendment}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Submit Amendment Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type BulkRow = {
  matric: string;
  courseCode: string;
  ca: string;
  exam: string;
  error?: string;
};

function BulkUploadView() {
  const { currentUser, courses, students, upsertResult } = useApp();
  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDownloadTemplate() {
    const header = "StudentMatric,CourseCode,CAScore,ExamScore";
    const examples = myCourses.map((c) => {
      const s = students.find((st) => st.departmentId === c.departmentId);
      return `${s?.matricNumber ?? "CSC/2021/001"},${c.code},35,55`;
    });
    const csv = [header, ...examples].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_results_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const data = lines.slice(1).map((line) => {
        const cols = line.split(",");
        return {
          matric: cols[0]?.trim() ?? "",
          courseCode: cols[1]?.trim() ?? "",
          ca: cols[2]?.trim() ?? "",
          exam: cols[3]?.trim() ?? "",
        };
      });
      const validated = data.map((row) => {
        const student = students.find(
          (s) => s.matricNumber.toLowerCase() === row.matric.toLowerCase(),
        );
        const course = myCourses.find(
          (c) => c.code.toLowerCase() === row.courseCode.toLowerCase(),
        );
        const ca = Number(row.ca);
        const exam = Number(row.exam);
        let error: string | undefined;
        if (!student) error = `Matric ${row.matric} not found`;
        else if (!course)
          error = `Course ${row.courseCode} not found or not assigned`;
        else if (Number.isNaN(ca) || ca < 0 || ca > 40)
          error = "CA must be 0-40";
        else if (Number.isNaN(exam) || exam < 0 || exam > 60)
          error = "Exam must be 0-60";
        return { ...row, error };
      });
      setRows(validated);
      setImported(false);
    };
    reader.readAsText(file);
  }

  function handleImport() {
    let count = 0;
    for (const row of rows) {
      if (row.error) continue;
      const student = students.find(
        (s) => s.matricNumber.toLowerCase() === row.matric.toLowerCase(),
      );
      const course = myCourses.find(
        (c) => c.code.toLowerCase() === row.courseCode.toLowerCase(),
      );
      if (!student || !course) continue;
      const ca = Number(row.ca);
      const exam = Number(row.exam);
      const total = ca + exam;
      const { grade, gradePoint, remarks } = calcGradePoint(total);
      upsertResult({
        id: BigInt(Date.now() + count),
        studentId: student.id,
        courseId: course.id,
        caScore: ca,
        examScore: exam,
        totalScore: total,
        grade,
        gradePoint,
        remarks,
        status: "draft",
      });
      count++;
    }
    setImported(true);
    toast.success(`${count} result${count !== 1 ? "s" : ""} imported`);
  }

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Bulk Result Upload</h1>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to enter results for multiple students at once
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium mb-1">
              Step 1 — Download Template
            </p>
            <Button
              data-ocid="bulk.download_button"
              size="sm"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-1.5"
            >
              <Download className="w-4 h-4" /> Download CSV Template
            </Button>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">
              Step 2 — Upload Filled CSV
            </p>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="hidden"
                id="bulk-upload-input"
              />
              <Button
                data-ocid="bulk.upload_button"
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="w-4 h-4" /> Choose CSV File
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
          <p className="font-semibold mb-1">CSV Columns:</p>
          <p>
            <span className="font-mono">StudentMatric</span> — Student matric
            number (e.g. CSC/2021/001)
          </p>
          <p>
            <span className="font-mono">CourseCode</span> — Course code (e.g.
            CSC301) — must be one of your assigned courses
          </p>
          <p>
            <span className="font-mono">CAScore</span> — CA score (0–40)
          </p>
          <p>
            <span className="font-mono">ExamScore</span> — Exam score (0–60)
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Preview ({rows.length} rows)</h2>
              <p className="text-sm text-muted-foreground">
                {validRows.length} valid &middot; {errorRows.length} errors
              </p>
            </div>
            <Button
              data-ocid="bulk.primary_button"
              size="sm"
              disabled={validRows.length === 0 || imported}
              onClick={handleImport}
              className="bg-primary text-primary-foreground gap-1.5"
            >
              <FileUp className="w-4 h-4" />
              {imported ? "Imported" : `Import ${validRows.length} Results`}
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matric</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>CA</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => {
                  const ca = Number(row.ca);
                  const exam = Number(row.exam);
                  const total = !row.error ? ca + exam : null;
                  const calc = total !== null ? calcGradePoint(total) : null;
                  return (
                    <TableRow
                      key={`${row.matric}-${row.courseCode}-${i}`}
                      data-ocid={`bulk.item.${i + 1}`}
                      className={row.error ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="font-mono text-xs">
                        {row.matric}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.courseCode}
                      </TableCell>
                      <TableCell>{row.ca}</TableCell>
                      <TableCell>{row.exam}</TableCell>
                      <TableCell>{total ?? "-"}</TableCell>
                      <TableCell className="font-bold">
                        {calc?.grade ?? "-"}
                      </TableCell>
                      <TableCell>
                        {row.error ? (
                          <span
                            className="text-xs text-destructive"
                            data-ocid={`bulk.error_state.${i + 1}`}
                          >
                            ⚠ {row.error}
                          </span>
                        ) : (
                          <span className="text-xs text-success">✓ Valid</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div
          className="bg-card rounded-xl border border-dashed border-border p-10 text-center"
          data-ocid="bulk.dropzone"
        >
          <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">
            Upload a CSV file to preview results
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Download the template above to get started
          </p>
        </div>
      )}
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

function LecturerAppealsTab() {
  const { currentUser, courses, gradeAppeals, respondToAppeal } = useApp();
  const myCourseIds = new Set(
    courses
      .filter((c) => c.lecturerPrincipal === currentUser?.principal)
      .map((c) => c.id),
  );

  const myAppeals = gradeAppeals.filter(
    (a) => myCourseIds.has(a.courseId) && a.status === "pending_lecturer",
  );
  const resolvedAppeals = gradeAppeals.filter(
    (a) => myCourseIds.has(a.courseId) && a.status !== "pending_lecturer",
  );

  const [responseText, setResponseText] = useState<Record<string, string>>({});

  function handleRespond(appeal: GradeAppeal, action: "uphold" | "revise") {
    const response = responseText[String(appeal.id)] ?? "";
    if (!response.trim()) {
      toast.error("Please enter a response before submitting");
      return;
    }
    const newStatus: GradeAppeal["status"] =
      action === "uphold" ? "pending_hod" : "pending_hod";
    respondToAppeal(appeal.id, response.trim(), newStatus);
    setResponseText((prev) => {
      const next = { ...prev };
      delete next[String(appeal.id)];
      return next;
    });
    toast.success(
      action === "uphold"
        ? "Appeal upheld — forwarded to HOD"
        : "Revision suggested — forwarded to HOD",
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
          Review and respond to student grade appeals for your courses
        </p>
      </div>

      {myAppeals.length === 0 ? (
        <div
          className="bg-card rounded-xl border border-dashed border-border p-10 text-center"
          data-ocid="lecturer_appeals.empty_state"
        >
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            No pending grade appeals
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">
            Pending Appeals ({myAppeals.length})
          </h2>
          {myAppeals.map((appeal, i) => (
            <div
              key={String(appeal.id)}
              data-ocid={`lecturer_appeals.item.${i + 1}`}
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
              <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 border-l-2 border-primary/30">
                <span className="font-medium">Reason:</span> {appeal.reason}
              </p>
              <div>
                <label
                  htmlFor={`lecturer-response-${String(appeal.id)}`}
                  className="text-xs font-medium text-muted-foreground mb-1 block"
                >
                  Your Response
                </label>
                <textarea
                  id={`lecturer-response-${String(appeal.id)}`}
                  data-ocid={`lecturer_appeals.response.${i + 1}`}
                  value={responseText[String(appeal.id)] ?? ""}
                  onChange={(e) =>
                    setResponseText((prev) => ({
                      ...prev,
                      [String(appeal.id)]: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Enter your response..."
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-ocid={`lecturer_appeals.uphold_button.${i + 1}`}
                  onClick={() => handleRespond(appeal, "uphold")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 border border-border transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Uphold Grade
                </button>
                <button
                  type="button"
                  data-ocid={`lecturer_appeals.revise_button.${i + 1}`}
                  onClick={() => handleRespond(appeal, "revise")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Suggest Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedAppeals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Resolved / Forwarded ({resolvedAppeals.length})
          </h2>
          {resolvedAppeals.map((appeal, i) => (
            <div
              key={String(appeal.id)}
              data-ocid={`lecturer_appeals.resolved.${i + 1}`}
              className="bg-card rounded-xl border border-border p-4 shadow-xs opacity-70"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {appeal.studentName} · {appeal.courseName}
                </p>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {appeal.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== TEACHING SCHEDULE TAB =====================
function TeachingScheduleTab() {
  const { currentUser, timetableEntries, courses } = useApp();
  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );
  const myCourseIds = new Set(myCourses.map((c) => c.id));
  const myEntries = [...timetableEntries]
    .filter((e) => myCourseIds.has(e.courseId))
    .sort((a, b) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const di = days.indexOf(a.day) - days.indexOf(b.day);
      if (di !== 0) return di;
      return a.startTime.localeCompare(b.startTime);
    });

  const dayColor: Record<string, string> = {
    Monday: "bg-blue-100 text-blue-700",
    Tuesday: "bg-purple-100 text-purple-700",
    Wednesday: "bg-green-100 text-green-700",
    Thursday: "bg-orange-100 text-orange-700",
    Friday: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">My Teaching Schedule</h1>
        <p className="text-sm text-muted-foreground">
          {myEntries.length} scheduled class{myEntries.length !== 1 ? "es" : ""}{" "}
          across {myCourses.length} course{myCourses.length !== 1 ? "s" : ""}
        </p>
      </div>
      {myEntries.length === 0 ? (
        <div
          className="bg-card rounded-xl border border-border p-10 text-center"
          data-ocid="schedule.empty_state"
        >
          <p className="text-muted-foreground">
            No timetable entries for your courses yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact the Registrar to add your schedule.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {myEntries.map((entry, i) => {
            const course = courses.find(
              (c) => String(c.id) === String(entry.courseId),
            );
            return (
              <div
                key={String(entry.id)}
                data-ocid={`schedule.item.${i + 1}`}
                className="bg-card rounded-xl border border-border p-4 shadow-xs flex items-center gap-4 hover:bg-muted/30 transition-colors border-l-4 border-l-primary"
              >
                <div className="flex-shrink-0 text-center w-24">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${dayColor[entry.day] ?? "bg-muted text-muted-foreground"}`}
                  >
                    {entry.day}
                  </span>
                  <p className="text-xs font-mono font-semibold mt-1">
                    {entry.startTime} – {entry.endTime}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {course?.code ?? "?"} – {course?.name ?? "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    📍 {entry.venue} · {entry.semester} Semester
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LecturerExamScheduleTab() {
  const { currentUser, courses } = useApp();
  // Show courses where lecturerPrincipal matches current user
  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );
  const myCourseCodes = myCourses.map((c) => c.code);
  return <ExamScheduleTab filterCourseCodes={myCourseCodes} isAdmin={false} />;
}

function LecturerClassTimetableTab() {
  const { currentUser, staffMembers } = useApp();
  const me = staffMembers.find(
    (s) => s.staffId === currentUser?.principal || s.name === currentUser?.name,
  );
  return (
    <ClassroomTimetableTab filterForStaffId={me?.staffId} isAdmin={false} />
  );
}

function LecturerExamTimetableTab() {
  const { currentUser, courses } = useApp();
  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );
  const myCourseCodes = myCourses.map((c) => c.code);
  return <ExamScheduleTab filterCourseCodes={myCourseCodes} isAdmin={false} />;
}
