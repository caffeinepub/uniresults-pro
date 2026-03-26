import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useApp } from "@/context/AppContext";
import type { ExtendedResult } from "@/context/AppContext";
import {
  AlertTriangle,
  Download,
  Loader2,
  Printer,
  Save,
  Send,
  Upload,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  readonly?: boolean;
}

function calcGrade(total: number): {
  grade: string;
  gradePoint: number;
  remarks: string;
} {
  if (total >= 70) return { grade: "A", gradePoint: 5, remarks: "Distinction" };
  if (total >= 60) return { grade: "B", gradePoint: 4, remarks: "Credit" };
  if (total >= 50) return { grade: "C", gradePoint: 3, remarks: "Merit" };
  if (total >= 45) return { grade: "D", gradePoint: 2, remarks: "Pass" };
  if (total >= 40)
    return { grade: "E", gradePoint: 1, remarks: "Marginal Pass" };
  return { grade: "F", gradePoint: 0, remarks: "Fail" };
}

function gradeBadgeClass(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "B":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "C":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "D":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "E":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    case "F":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "";
  }
}

interface RowData {
  studentId: bigint;
  matricNumber: string;
  studentName: string;
  ca: string;
  exam: string;
  total: number;
  grade: string;
  gradePoint: number;
  remarks: string;
  existingResultId?: bigint;
}

export default function ScoreEntrySheetTab({ readonly = false }: Props) {
  const {
    courses,
    students,
    results,
    courseRegistrations,
    departments,
    faculties,
    staffMembers,
    currentUser,
    institutionSettings,
    academicCalendars,
    upsertResult,
    syncStatus,
    moderatorNames,
    setModeratorName,
    submitCourseResults,
  } = useApp();

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moderatorInput, setModeratorInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter courses based on role
  const visibleCourses = courses.filter((c) => {
    if (currentUser?.role === "Lecturer") {
      return (
        c.lecturerPrincipal === currentUser?.principal ||
        c.lecturerPrincipal === currentUser?.name
      );
    }
    return true;
  });

  const selectedCourse = courses.find(
    (c) => c.id.toString() === selectedCourseId,
  );

  const dept = selectedCourse
    ? departments.find(
        (d) => String(d.id) === String(selectedCourse.departmentId),
      )
    : null;
  const faculty = dept
    ? faculties.find((f) => String(f.id) === String((dept as any).facultyId))
    : null;

  // Staff lookups
  const lecturerStaff = selectedCourse
    ? staffMembers.find(
        (s) =>
          s.name === selectedCourse.lecturerPrincipal ||
          s.id?.toString() === selectedCourse.lecturerPrincipal,
      )
    : null;
  const lecturerName =
    lecturerStaff?.name ?? selectedCourse?.lecturerPrincipal ?? "";

  // HOD: match staff by departmentId
  const hodStaff = dept
    ? staffMembers.find((s) => s.departmentId === dept.id)
    : null;
  const activeCal = academicCalendars.find((c) => c.isActive);
  const session = activeCal
    ? activeCal.session
    : `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  // Moderator name stored per course
  useEffect(() => {
    if (selectedCourseId) {
      setModeratorInput(moderatorNames[selectedCourseId] ?? "");
    }
  }, [selectedCourseId, moderatorNames]);

  // Build rows when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setRows([]);
      return;
    }
    const enrolled = courseRegistrations.filter(
      (cr) => cr.courseId === selectedCourse.id,
    );

    let enrolledStudents =
      enrolled.length > 0
        ? enrolled
            .map((cr) =>
              students.find((s) => String(s.id) === String(cr.studentId)),
            )
            .filter(Boolean)
        : students.filter(
            (s) => s.departmentId === selectedCourse.departmentId,
          );

    const newRows: RowData[] = (enrolledStudents as any[]).map((s) => {
      const existing = results.find(
        (r) => r.studentId === s.id && r.courseId === selectedCourse.id,
      );
      const ca = existing ? existing.caScore.toString() : "";
      const exam = existing ? existing.examScore.toString() : "";
      const total = existing ? existing.totalScore : 0;
      const { grade, gradePoint, remarks } = calcGrade(total);
      return {
        studentId: s.id,
        matricNumber: s.matricNumber,
        studentName: s.name,
        ca,
        exam,
        total,
        grade: existing ? existing.grade : "-",
        gradePoint: existing ? existing.gradePoint : 0,
        remarks: existing ? existing.remarks : "-",
        existingResultId: existing?.id,
        _grade: grade,
        _gradePoint: gradePoint,
        _remarks: remarks,
      } as RowData;
    });
    setRows(newRows);
  }, [selectedCourse, courseRegistrations, students, results]);

  const handleCaChange = (idx: number, val: string) => {
    const ca = Math.min(40, Math.max(0, Number(val) || 0));
    setRows((prev) => {
      const next = [...prev];
      const exam = Number(next[idx].exam) || 0;
      const total = ca + exam;
      const { grade, gradePoint, remarks } = calcGrade(total);
      next[idx] = {
        ...next[idx],
        ca: val === "" ? "" : ca.toString(),
        total,
        grade,
        gradePoint,
        remarks,
      };
      return next;
    });
  };

  const handleExamChange = (idx: number, val: string) => {
    const exam = Math.min(60, Math.max(0, Number(val) || 0));
    setRows((prev) => {
      const next = [...prev];
      const ca = Number(next[idx].ca) || 0;
      const total = ca + exam;
      const { grade, gradePoint, remarks } = calcGrade(total);
      next[idx] = {
        ...next[idx],
        exam: val === "" ? "" : exam.toString(),
        total,
        grade,
        gradePoint,
        remarks,
      };
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      for (const row of rows) {
        if (row.ca === "" && row.exam === "") continue;
        const ca = Number(row.ca) || 0;
        const exam = Number(row.exam) || 0;
        const total = ca + exam;
        const { grade, gradePoint, remarks } = calcGrade(total);
        const result: ExtendedResult = {
          id: row.existingResultId ?? BigInt(Date.now() + Math.random() * 1000),
          studentId: row.studentId,
          courseId: selectedCourse.id,
          caScore: ca,
          examScore: exam,
          totalScore: total,
          grade,
          gradePoint,
          remarks,
          status: "pending",
        };
        upsertResult(result);
      }
      if (moderatorInput) {
        setModeratorName(selectedCourse.id, moderatorInput);
      }
      if (!syncStatus.isOnline) {
        toast.warning("Saved offline. Will sync when connection is restored.");
      } else {
        toast.success("Scores saved successfully!");
      }
    } finally {
      setSaving(false);
    }
  }, [
    selectedCourse,
    rows,
    moderatorInput,
    upsertResult,
    setModeratorName,
    syncStatus,
  ]);

  // Derive course status from first result for selected course
  const courseStatusInfo = (() => {
    if (!selectedCourse)
      return { status: "draft" as const, rejectionComment: "" };
    const courseResults = results.filter(
      (r) => r.courseId === selectedCourse.id,
    );
    if (courseResults.length === 0)
      return { status: "draft" as const, rejectionComment: "" };
    const statuses = courseResults.map((r) => r.status);
    const rejComment =
      courseResults.find((r) => (r as any).rejectionReason)?.rejectionReason ??
      "";
    const hasSaved = courseResults.length > 0;
    if (statuses.some((s) => s === "published"))
      return { status: "published" as const, rejectionComment: "" };
    if (statuses.some((s) => s === "approved" || s === "dean_approved"))
      return { status: "dean_approved" as const, rejectionComment: "" };
    if (statuses.some((s) => s === "hod_approved"))
      return { status: "hod_approved" as const, rejectionComment: "" };
    if (statuses.some((s) => s === "submitted"))
      return { status: "submitted" as const, rejectionComment: "" };
    if (rejComment && hasSaved)
      return { status: "rejected" as const, rejectionComment: rejComment };
    if (hasSaved) return { status: "draft" as const, rejectionComment: "" };
    return { status: "draft" as const, rejectionComment: "" };
  })();

  const handleSubmitForApproval = async () => {
    if (!selectedCourse) return;
    setSubmitting(true);
    try {
      submitCourseResults(selectedCourse.id);
      toast.success("Results submitted for approval!");
    } finally {
      setSubmitting(false);
    }
  };

  // Download blank template
  const downloadTemplate = (filled = false) => {
    if (!selectedCourse) return;
    const headers = filled
      ? [
          "S/N",
          "Matric Number",
          "Student Name",
          "CA",
          "Exam",
          "Total",
          "Grade",
          "Remarks",
        ]
      : ["S/N", "Matric Number", "Student Name", "CA", "Exam"];
    const csvRows = rows.map((r, i) => {
      if (filled) {
        return [
          i + 1,
          r.matricNumber,
          `"${r.studentName}"`,
          r.ca,
          r.exam,
          r.total,
          r.grade,
          `"${r.remarks}"`,
        ].join(",");
      }
      return [i + 1, r.matricNumber, `"${r.studentName}"`, "", ""].join(",");
    });
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCourse.code}_score_sheet${filled ? "_filled" : "_template"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Upload CSV
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid.");
        return;
      }
      // Find CA and Exam column indices from header
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const caIdx = header.findIndex((h) => h === "ca");
      const examIdx = header.findIndex((h) => h === "exam");
      const matricIdx = header.findIndex(
        (h) => h.includes("matric") || h === "matric number",
      );
      if (matricIdx === -1 || caIdx === -1 || examIdx === -1) {
        toast.error("CSV must have Matric Number, CA, and Exam columns.");
        return;
      }
      let matched = 0;
      let errors: string[] = [];
      setRows((prev) => {
        const next = [...prev];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]
            .split(",")
            .map((c) => c.trim().replace(/^"|"$/g, ""));
          const matric = cols[matricIdx]?.trim();
          if (!matric) continue;
          const rowIdx = next.findIndex(
            (r) => r.matricNumber.toLowerCase() === matric.toLowerCase(),
          );
          if (rowIdx === -1) {
            errors.push(matric);
            continue;
          }
          const ca = Math.min(40, Math.max(0, Number(cols[caIdx]) || 0));
          const exam = Math.min(60, Math.max(0, Number(cols[examIdx]) || 0));
          const total = ca + exam;
          const { grade, gradePoint, remarks } = calcGrade(total);
          next[rowIdx] = {
            ...next[rowIdx],
            ca: ca.toString(),
            exam: exam.toString(),
            total,
            grade,
            gradePoint,
            remarks,
          };
          matched++;
        }
        return next;
      });
      if (errors.length > 0) {
        toast.error(
          `${errors.length} matric number(s) not found: ${errors.slice(0, 3).join(", ")}${errors.length > 3 ? "..." : ""}`,
        );
      }
      if (matched > 0) {
        toast.success(`${matched} student score(s) imported successfully.`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const today = new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Offline Banner */}
      {!syncStatus.isOnline && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700 no-print"
          data-ocid="score_sheet.offline_state"
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">
            You are offline. Scores will be saved locally and synced when
            connection is restored.
          </span>
        </div>
      )}

      {/* Course Selector */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Score Entry Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs mb-1 block">Select Course</Label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger data-ocid="score_sheet.select">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {visibleCourses.map((c) => (
                    <SelectItem key={c.id.toString()} value={c.id.toString()}>
                      {c.code} – {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCourse && (
              <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                <span>
                  <strong>Code:</strong> {selectedCourse.code}
                </span>
                <span>
                  <strong>Units:</strong>{" "}
                  {selectedCourse.creditUnits.toString()}
                </span>
                <span>
                  <strong>Semester:</strong> {selectedCourse.semester}
                </span>
                <span>
                  <strong>Dept:</strong> {dept?.name ?? "—"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <>
          {/* Score Sheet Header — visible on screen AND print */}
          <Card className="print-sheet-header" data-ocid="score_sheet.panel">
            <CardContent className="pt-5 pb-3">
              <div className="text-center space-y-0.5 mb-4">
                <p className="font-bold text-base uppercase tracking-wide">
                  {institutionSettings.name}
                </p>
                {faculty && (
                  <p className="text-sm font-semibold">
                    Faculty of {faculty.name}
                  </p>
                )}
                {dept && <p className="text-sm">Department of {dept.name}</p>}
                <p className="text-sm font-semibold uppercase mt-1">
                  COURSE SCORE SHEET
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-sm border-t border-border pt-3">
                <div>
                  <span className="font-medium">Course Code:</span>{" "}
                  {selectedCourse.code}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Course Title:</span>{" "}
                  {selectedCourse.name}
                </div>
                <div>
                  <span className="font-medium">Credit Units:</span>{" "}
                  {selectedCourse.creditUnits.toString()}
                </div>
                <div>
                  <span className="font-medium">Session:</span> {session}
                </div>
                <div>
                  <span className="font-medium">Semester:</span>{" "}
                  {selectedCourse.semester}
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="font-medium">Lecturer in Charge:</span>{" "}
                  {lecturerName || "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Badge + Rejection Banner */}
          <div className="flex flex-wrap items-center gap-3 no-print">
            {(() => {
              const { status } = courseStatusInfo;
              const statusMap: Record<string, { label: string; cls: string }> =
                {
                  draft: {
                    label: "Draft",
                    cls: "bg-muted text-muted-foreground",
                  },
                  submitted: {
                    label: "Submitted — Awaiting HOD Review",
                    cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                  },
                  hod_approved: {
                    label: "HOD Approved — Awaiting Dean",
                    cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
                  },
                  dean_approved: {
                    label: "Dean Approved — Awaiting Publication",
                    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                  },
                  approved: {
                    label: "Approved — Awaiting Publication",
                    cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
                  },
                  published: {
                    label: "Published",
                    cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                  },
                  rejected: {
                    label: "Rejected",
                    cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
                  },
                };
              const entry = statusMap[status] ?? statusMap.draft;
              return (
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${entry.cls}`}
                  data-ocid="score_sheet.success_state"
                >
                  {entry.label}
                </span>
              );
            })()}
          </div>
          {courseStatusInfo.status === "rejected" &&
            courseStatusInfo.rejectionComment && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-md bg-yellow-50 border border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700 no-print"
                data-ocid="score_sheet.error_state"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                    Results Rejected
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                    {courseStatusInfo.rejectionComment}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 italic">
                    Please revise the scores and resubmit for approval.
                  </p>
                </div>
              </div>
            )}

          {/* Action Buttons */}
          {!readonly && (
            <div
              className="flex flex-wrap gap-2 no-print"
              data-ocid="score_sheet.section"
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                data-ocid="score_sheet.save_button"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save Scores
              </Button>
              {["draft", "rejected"].includes(courseStatusInfo.status) &&
                rows.some((r) => r.ca !== "" || r.exam !== "") && (
                  <Button
                    onClick={handleSubmitForApproval}
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-ocid="score_sheet.submit_button"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    Submit for Approval
                  </Button>
                )}
              <Button
                variant="outline"
                onClick={() => downloadTemplate(false)}
                data-ocid="score_sheet.upload_button"
              >
                <Download className="w-4 h-4 mr-1" />
                Blank Template (CSV)
              </Button>
              <Button
                variant="outline"
                onClick={() => downloadTemplate(true)}
                data-ocid="score_sheet.secondary_button"
              >
                <Download className="w-4 h-4 mr-1" />
                Filled Sheet (CSV)
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="score_sheet.dropzone"
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                onClick={() => window.print()}
                data-ocid="score_sheet.primary_button"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          )}
          {readonly && (
            <div className="flex gap-2 no-print">
              <Button
                variant="outline"
                onClick={() => downloadTemplate(true)}
                data-ocid="score_sheet.secondary_button"
              >
                <Download className="w-4 h-4 mr-1" />
                Download Filled Sheet
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                data-ocid="score_sheet.primary_button"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          )}

          {/* Score Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              {rows.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 text-muted-foreground"
                  data-ocid="score_sheet.empty_state"
                >
                  <AlertTriangle className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">
                    No students enrolled in this course.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">S/N</TableHead>
                      <TableHead>Matric No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-20 text-center">
                        CA (/40)
                      </TableHead>
                      <TableHead className="w-20 text-center">
                        Exam (/60)
                      </TableHead>
                      <TableHead className="w-16 text-center">Total</TableHead>
                      <TableHead className="w-14 text-center">Grade</TableHead>
                      <TableHead className="w-10 text-center">GP</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow
                        key={row.studentId.toString()}
                        data-ocid={`score_sheet.item.${idx + 1}`}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.matricNumber}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {row.studentName}
                        </TableCell>
                        <TableCell className="text-center">
                          {readonly ? (
                            <span className="text-sm">{row.ca || "—"}</span>
                          ) : (
                            <Input
                              type="number"
                              min={0}
                              max={40}
                              className="h-7 w-16 text-center text-xs mx-auto"
                              value={row.ca}
                              onChange={(e) =>
                                handleCaChange(idx, e.target.value)
                              }
                              data-ocid="score_sheet.input"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {readonly ? (
                            <span className="text-sm">{row.exam || "—"}</span>
                          ) : (
                            <Input
                              type="number"
                              min={0}
                              max={60}
                              className="h-7 w-16 text-center text-xs mx-auto"
                              value={row.exam}
                              onChange={(e) =>
                                handleExamChange(idx, e.target.value)
                              }
                              data-ocid="score_sheet.input"
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-sm">
                          {row.ca !== "" || row.exam !== "" ? row.total : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.ca !== "" || row.exam !== "" ? (
                            <span
                              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${gradeBadgeClass(row.grade)}`}
                            >
                              {row.grade}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {row.ca !== "" || row.exam !== ""
                            ? row.gradePoint
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.ca !== "" || row.exam !== "" ? row.remarks : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Signature Blocks */}
          <Card>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Lecturer */}
                <div className="space-y-2 border-t-2 border-border pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Lecturer in Charge
                  </p>
                  <div className="text-sm">
                    <p>
                      Name:{" "}
                      <span className="font-medium">
                        {lecturerName || "_______________"}
                      </span>
                    </p>
                    <p className="mt-3">
                      Signature:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                    <p className="mt-3">
                      Date:{" "}
                      <span className="text-muted-foreground text-xs">
                        {today}
                      </span>
                    </p>
                  </div>
                </div>

                {/* HOD */}
                <div className="space-y-2 border-t-2 border-border pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    HOD
                  </p>
                  <div className="text-sm">
                    <p>
                      Name:{" "}
                      <span className="font-medium">
                        {hodStaff?.name || "_______________"}
                      </span>
                    </p>
                    <p className="mt-3">
                      Signature:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                    <p className="mt-3">
                      Date:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                  </div>
                </div>

                {/* Dean */}
                <div className="space-y-2 border-t-2 border-border pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Dean
                  </p>
                  <div className="text-sm">
                    <p>
                      Name:{" "}
                      <span className="font-medium">{"_______________"}</span>
                    </p>
                    <p className="mt-3">
                      Signature:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                    <p className="mt-3">
                      Date:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                  </div>
                </div>

                {/* Moderator */}
                <div className="space-y-2 border-t-2 border-border pt-3">
                  <p className="text-xs font-bold uppercase tracking-wide">
                    Moderator
                  </p>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <span>Name:</span>
                      {readonly ? (
                        <span className="font-medium">
                          {moderatorInput || "_______________"}
                        </span>
                      ) : (
                        <Input
                          className="h-6 text-xs ml-1 w-32"
                          placeholder="Enter name"
                          value={moderatorInput}
                          onChange={(e) => setModeratorInput(e.target.value)}
                          data-ocid="score_sheet.input"
                        />
                      )}
                    </div>
                    <p className="mt-3">
                      Signature:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                    <p className="mt-3">
                      Date:{" "}
                      <span className="inline-block w-24 border-b border-foreground" />
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
