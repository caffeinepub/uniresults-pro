import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardEdit,
  Edit2,
  FileText,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type AmendmentRequest,
  calcGradePoint,
  useApp,
} from "../../context/AppContext";

interface Props {
  userRole: "Lecturer" | "HOD" | "Registrar" | "Dean";
}

const STATUS_LABELS: Record<AmendmentRequest["status"], string> = {
  pending_lecturer: "Awaiting Lecturer Review",
  pending_hod: "Pending HOD Review",
  pending_dean: "Pending Dean Review",
  pending_registrar: "Pending Registrar",
  approved: "Approved & Applied",
  rejected: "Rejected",
};

const STATUS_FLOW: AmendmentRequest["status"][] = [
  "pending_lecturer",
  "pending_hod",
  "pending_dean",
  "pending_registrar",
  "approved",
];

function statusColor(status: AmendmentRequest["status"]) {
  switch (status) {
    case "approved":
      return "bg-success/10 text-success border-success/30";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "pending_registrar":
      return "bg-primary/10 text-primary border-primary/30";
    default:
      return "bg-warning/10 text-warning border-warning/30";
  }
}

function StageTrail({ amendment }: { amendment: AmendmentRequest }) {
  const stages = [
    {
      key: "pending_lecturer",
      label: "Submitted",
      comment: undefined,
      role: "Student",
    },
    {
      key: "pending_hod",
      label: "Lecturer Reviewed",
      comment: amendment.lecturerComment,
      role: "Lecturer",
    },
    {
      key: "pending_dean",
      label: "HOD Approved",
      comment: amendment.hodComment,
      role: "HOD",
    },
    {
      key: "pending_registrar",
      label: "Dean Approved",
      comment: amendment.deanComment,
      role: "Dean",
    },
    {
      key: "approved",
      label: "Registrar Approved",
      comment: amendment.registrarComment,
      role: "Registrar",
    },
  ] as const;

  const currentIdx =
    amendment.status === "rejected"
      ? STATUS_FLOW.indexOf(
          amendment.rejectedBy === "Lecturer"
            ? "pending_hod"
            : amendment.rejectedBy === "HOD"
              ? "pending_dean"
              : amendment.rejectedBy === "Dean"
                ? "pending_registrar"
                : "approved",
        )
      : STATUS_FLOW.indexOf(amendment.status);

  return (
    <div className="flex items-start gap-1 mt-2 overflow-x-auto pb-1">
      {stages.map((s, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isRejected = amendment.status === "rejected" && i === currentIdx;
        return (
          <div key={s.key} className="flex items-center min-w-0">
            <div className="flex flex-col items-center min-w-[80px]">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isRejected
                    ? "bg-destructive text-destructive-foreground border-destructive"
                    : isPast || (isCurrent && amendment.status === "approved")
                      ? "bg-success text-white border-success"
                      : isCurrent
                        ? "bg-warning text-white border-warning"
                        : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {isRejected
                  ? "✕"
                  : isPast || amendment.status === "approved"
                    ? "✓"
                    : i + 1}
              </div>
              <span className="text-[10px] text-center text-muted-foreground mt-1 leading-tight">
                {s.label}
              </span>
              {s.comment && (
                <span className="text-[9px] italic text-primary/70 text-center px-1">
                  "{s.comment.slice(0, 30)}
                  {s.comment.length > 30 ? "…" : ""}"
                </span>
              )}
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-px w-4 mx-0.5 mt-[-10px] ${isPast ? "bg-success" : "bg-border"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResultAmendmentTab({ userRole }: Props) {
  const {
    amendmentRequests,
    addAmendmentRequest,
    updateAmendmentWithComment,
    approveAmendmentFinal,
    rejectAmendment,
    results,
    courses,
    students,
    currentUser,
    logAudit,
  } = useApp();

  const [requestOpen, setRequestOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<AmendmentRequest | null>(
    null,
  );
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    courseId: "",
    studentId: "",
    newCa: "",
    newExam: "",
    reason: "",
  });

  const publishedResults = useMemo(() => {
    return results.filter((r) => {
      if (r.status !== "published" && r.status !== "approved") return false;
      if (userRole === "Lecturer") {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        return course?.lecturerPrincipal === currentUser?.principal;
      }
      return true;
    });
  }, [results, courses, currentUser, userRole]);

  const myAmendments = useMemo(() => {
    if (userRole === "Lecturer") {
      // Show student-initiated requests for courses assigned to this lecturer
      // + any lecturer-initiated requests
      const myCoursePrincipals = courses
        .filter((c) => c.lecturerPrincipal === currentUser?.principal)
        .map((c) => String(c.id));
      return amendmentRequests.filter(
        (a) =>
          (a.studentInitiated &&
            myCoursePrincipals.includes(String(a.courseId)) &&
            a.status === "pending_lecturer") ||
          (!a.studentInitiated && a.lecturerName === currentUser?.name),
      );
    }
    if (userRole === "HOD") {
      return amendmentRequests.filter((a) => a.status === "pending_hod");
    }
    if (userRole === "Dean") {
      return amendmentRequests.filter((a) => a.status === "pending_dean");
    }
    if (userRole === "Registrar") {
      return amendmentRequests.filter(
        (a) =>
          a.status === "pending_registrar" ||
          a.status === "approved" ||
          a.status === "rejected",
      );
    }
    return amendmentRequests;
  }, [amendmentRequests, userRole, currentUser, courses]);

  function getCourse(id: bigint) {
    return courses.find((c) => String(c.id) === String(id));
  }

  function getStudent(id: bigint) {
    return students.find((s) => String(s.id) === String(id));
  }

  function handleSubmitRequest() {
    if (!form.courseId || !form.studentId || !form.reason) {
      toast.error("Please fill all required fields");
      return;
    }
    const origResult = results.find(
      (r) =>
        String(r.courseId) === form.courseId &&
        String(r.studentId) === form.studentId,
    );
    if (!origResult) {
      toast.error("No existing result found for this student/course");
      return;
    }
    const newCa = Number(form.newCa) || origResult.caScore;
    const newExam = Number(form.newExam) || origResult.examScore;
    if (newCa > 40 || newExam > 60) {
      toast.error("CA max is 40, Exam max is 60");
      return;
    }
    const course = getCourse(origResult.courseId);
    const student = getStudent(origResult.studentId);
    const req: AmendmentRequest = {
      id: BigInt(Date.now()),
      resultId: origResult.id,
      studentId: origResult.studentId,
      courseId: origResult.courseId,
      originalCa: origResult.caScore ?? 0,
      originalExam: origResult.examScore ?? 0,
      newCa,
      newExam,
      reason: form.reason,
      lecturerName: currentUser?.name ?? "",
      status: "pending_hod",
      createdAt: new Date().toISOString(),
      courseCode: course?.code,
      courseTitle: course?.name,
      studentName: student?.name,
      recordedScore: origResult.totalScore,
    };
    addAmendmentRequest(req);
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "Amendment Request",
      `Amendment requested for ${course?.code} — ${student?.name}`,
    );
    toast.success("Amendment request submitted to HOD");
    setRequestOpen(false);
    setForm({
      courseId: "",
      studentId: "",
      newCa: "",
      newExam: "",
      reason: "",
    });
  }

  function openReview(a: AmendmentRequest, action: "approve" | "reject") {
    setReviewTarget(a);
    setReviewAction(action);
    setReviewComment("");
    setReviewOpen(true);
  }

  function handleConfirmReview() {
    if (!reviewTarget) return;
    if (reviewAction === "reject") {
      if (!reviewComment.trim()) {
        toast.error("Please provide a rejection reason");
        return;
      }
      rejectAmendment(
        reviewTarget.id,
        reviewComment.trim(),
        userRole as AmendmentRequest["rejectedBy"],
      );
      toast.success("Amendment rejected");
    } else {
      if (userRole === "Lecturer") {
        updateAmendmentWithComment(
          reviewTarget.id,
          "pending_hod",
          "lecturerComment",
          reviewComment.trim() || "Verified by lecturer",
        );
        toast.success("Amendment forwarded to HOD");
      } else if (userRole === "HOD") {
        updateAmendmentWithComment(
          reviewTarget.id,
          "pending_dean",
          "hodComment",
          reviewComment.trim() || "Approved by HOD",
        );
        toast.success("Amendment forwarded to Dean");
      } else if (userRole === "Dean") {
        updateAmendmentWithComment(
          reviewTarget.id,
          "pending_registrar",
          "deanComment",
          reviewComment.trim() || "Approved by Dean",
        );
        toast.success("Amendment forwarded to Registrar");
      } else if (userRole === "Registrar") {
        approveAmendmentFinal(
          reviewTarget.id,
          reviewComment.trim() || undefined,
        );
        toast.success("Amendment approved and score updated");
      }
    }
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      reviewAction === "approve"
        ? "Amendment Forwarded/Approved"
        : "Amendment Rejected",
      `Amendment ${String(reviewTarget.id)} — ${reviewAction}`,
    );
    setReviewOpen(false);
    setReviewTarget(null);
    setReviewComment("");
  }

  const uniqueStudentIds = [
    ...new Set(publishedResults.map((r) => String(r.studentId))),
  ];
  const filteredStudents = uniqueStudentIds
    .filter(
      (sid) =>
        !form.courseId ||
        publishedResults.some(
          (r) =>
            String(r.courseId) === form.courseId && String(r.studentId) === sid,
        ),
    )
    .map((sid) => students.find((s) => String(s.id) === sid))
    .filter(Boolean);

  const canReview =
    userRole === "HOD" ||
    userRole === "Dean" ||
    userRole === "Registrar" ||
    userRole === "Lecturer";

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-primary" />
            Result Amendments
          </h2>
          <p className="text-sm text-muted-foreground">
            {userRole === "Lecturer"
              ? "Review student-initiated amendment requests for your courses"
              : userRole === "HOD"
                ? "Review amendments forwarded from lecturers"
                : userRole === "Dean"
                  ? "Review amendments approved by HOD"
                  : "Final approval — score will be updated on approval"}
          </p>
        </div>
        {userRole === "Lecturer" && (
          <Button
            size="sm"
            variant="outline"
            data-ocid="amendment.open_modal_button"
            onClick={() => setRequestOpen(true)}
          >
            <Edit2 className="w-4 h-4 mr-1" /> New Amendment Request
          </Button>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        {userRole === "Lecturer" && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/30">
            <AlertCircle className="w-3 h-3" />
            {myAmendments.filter((a) => a.status === "pending_lecturer").length}{" "}
            awaiting your review
          </span>
        )}
        {userRole === "HOD" && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30">
            <FileText className="w-3 h-3" />
            {myAmendments.length} pending HOD review
          </span>
        )}
        {userRole === "Dean" && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30">
            <FileText className="w-3 h-3" />
            {myAmendments.length} pending Dean review
          </span>
        )}
        {userRole === "Registrar" && (
          <>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/30">
              {
                myAmendments.filter((a) => a.status === "pending_registrar")
                  .length
              }{" "}
              pending final approval
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/30">
              {myAmendments.filter((a) => a.status === "approved").length}{" "}
              approved
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/30">
              {myAmendments.filter((a) => a.status === "rejected").length}{" "}
              rejected
            </span>
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Scores (Original → Claimed)</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              {canReview && <TableHead>Actions</TableHead>}
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {myAmendments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canReview ? 8 : 7}
                  className="text-center text-muted-foreground py-10"
                  data-ocid="amendment.empty_state"
                >
                  <FileText className="w-7 h-7 mx-auto mb-2 opacity-25" />
                  <p className="text-sm">No amendment requests to review.</p>
                </TableCell>
              </TableRow>
            ) : (
              myAmendments.map((a, i) => {
                const course = getCourse(a.courseId);
                const student = getStudent(a.studentId);
                const isExpanded = expandedId === String(a.id);
                const origTotal = a.originalCa + a.originalExam;
                const newTotal = a.newCa + a.newExam;
                const showActions =
                  canReview &&
                  ((userRole === "Lecturer" &&
                    a.status === "pending_lecturer") ||
                    (userRole === "HOD" && a.status === "pending_hod") ||
                    (userRole === "Dean" && a.status === "pending_dean") ||
                    (userRole === "Registrar" &&
                      a.status === "pending_registrar"));

                return (
                  <>
                    <TableRow
                      key={String(a.id)}
                      data-ocid={`amendment.item.${i + 1}`}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : String(a.id))
                      }
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        {a.courseCode ?? course?.code ?? "?"}
                        <div className="text-muted-foreground font-normal truncate max-w-[120px]">
                          {a.courseTitle ?? course?.name ?? ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {a.studentName ?? student?.name ?? "?"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student?.matricNumber ?? ""}
                        </div>
                        {a.studentInitiated && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 mt-0.5"
                          >
                            Student Request
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono">
                          {a.originalCa}/{a.originalExam} = {origTotal}
                        </span>
                        {origTotal !== newTotal && (
                          <span className="ml-1 text-primary font-semibold">
                            → {a.newCa}/{a.newExam} = {newTotal}{" "}
                            <span className="text-muted-foreground">
                              ({calcGradePoint(newTotal).grade})
                            </span>
                          </span>
                        )}
                        {a.claimedScore !== undefined &&
                          a.claimedScore !== origTotal && (
                            <div className="text-[10px] text-amber-600">
                              Student claims: {a.claimedScore}
                            </div>
                          )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px]">
                        <span className="line-clamp-2">{a.reason}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(a.status)}`}
                        >
                          {STATUS_LABELS[a.status]}
                        </span>
                        {a.status === "rejected" && a.rejectedBy && (
                          <div className="text-[10px] text-destructive mt-0.5">
                            Rejected by {a.rejectedBy}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString("en-NG")}
                        {a.updatedAt && (
                          <div className="text-[10px]">
                            Updated:{" "}
                            {new Date(a.updatedAt).toLocaleDateString("en-NG")}
                          </div>
                        )}
                      </TableCell>
                      {canReview && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {showActions && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                data-ocid={`amendment.confirm_button.${i + 1}`}
                                onClick={() => openReview(a, "approve")}
                                title={
                                  userRole === "Registrar"
                                    ? "Approve & Update Score"
                                    : "Forward to next stage"
                                }
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-success" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                data-ocid={`amendment.delete_button.${i + 1}`}
                                onClick={() => openReview(a, "reject")}
                                title="Reject with reason"
                              >
                                <XCircle className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${String(a.id)}-detail`}>
                        <TableCell
                          colSpan={canReview ? 8 : 7}
                          className="bg-muted/20 p-4"
                        >
                          <div className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Student's Reason
                                </p>
                                <p className="text-sm">{a.reason}</p>
                              </div>
                              {a.attachmentUrl && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                    Supporting Evidence
                                  </p>
                                  <a
                                    href={a.attachmentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline text-xs flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    {a.attachmentUrl}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Approval Trail
                              </p>
                              <StageTrail amendment={a} />
                            </div>
                            {a.status === "rejected" && a.rejectionReason && (
                              <div className="bg-destructive/5 border border-destructive/20 rounded p-2">
                                <p className="text-xs font-semibold text-destructive">
                                  Rejection Reason ({a.rejectedBy}):
                                </p>
                                <p className="text-xs text-destructive/80 mt-0.5">
                                  {a.rejectionReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent
          className="sm:max-w-md"
          data-ocid="amendment.review_modal"
        >
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve"
                ? userRole === "Registrar"
                  ? "Approve & Update Score"
                  : `Forward to ${
                      userRole === "Lecturer"
                        ? "HOD"
                        : userRole === "HOD"
                          ? "Dean"
                          : "Registrar"
                    }`
                : "Reject Amendment Request"}
            </DialogTitle>
          </DialogHeader>
          {reviewTarget && (
            <div className="space-y-3 py-2">
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <strong>Course:</strong>{" "}
                  {reviewTarget.courseCode ??
                    getCourse(reviewTarget.courseId)?.code}{" "}
                  —{" "}
                  {reviewTarget.courseTitle ??
                    getCourse(reviewTarget.courseId)?.name}
                </p>
                <p>
                  <strong>Student:</strong>{" "}
                  {reviewTarget.studentName ??
                    getStudent(reviewTarget.studentId)?.name}
                </p>
                <p>
                  <strong>Original:</strong> {reviewTarget.originalCa}/
                  {reviewTarget.originalExam} ={" "}
                  {reviewTarget.originalCa + reviewTarget.originalExam} (
                  {
                    calcGradePoint(
                      reviewTarget.originalCa + reviewTarget.originalExam,
                    ).grade
                  }
                  )
                </p>
                {(reviewTarget.newCa !== reviewTarget.originalCa ||
                  reviewTarget.newExam !== reviewTarget.originalExam) && (
                  <p>
                    <strong>Proposed:</strong> {reviewTarget.newCa}/
                    {reviewTarget.newExam} ={" "}
                    {reviewTarget.newCa + reviewTarget.newExam} (
                    {
                      calcGradePoint(reviewTarget.newCa + reviewTarget.newExam)
                        .grade
                    }
                    )
                  </p>
                )}
                <p>
                  <strong>Reason:</strong> {reviewTarget.reason}
                </p>
              </div>
              {reviewAction === "approve" && userRole === "Registrar" && (
                <div className="bg-success/5 border border-success/20 rounded p-2 text-xs text-success">
                  ✓ Approving this will update the student's recorded score
                  immediately.
                </div>
              )}
              <div className="grid gap-2">
                <Label>
                  {reviewAction === "approve"
                    ? "Comment / Verification Note (optional)"
                    : "Rejection Reason (required)"}
                </Label>
                <Textarea
                  data-ocid="amendment.review_comment.textarea"
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewAction === "approve"
                      ? "Add a note about your review..."
                      : "Explain why this amendment is being rejected..."
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="amendment.review_cancel_button"
              onClick={() => setReviewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === "reject" ? "destructive" : "default"}
              data-ocid="amendment.review_confirm_button"
              onClick={handleConfirmReview}
            >
              {reviewAction === "approve"
                ? userRole === "Registrar"
                  ? "Approve & Update Score"
                  : "Forward"
                : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Request Dialog (Lecturer only) */}
      {userRole === "Lecturer" && (
        <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
          <DialogContent className="sm:max-w-md" data-ocid="amendment.modal">
            <DialogHeader>
              <DialogTitle>Request Score Amendment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid gap-2">
                <Label>Course</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, courseId: v, studentId: "" }))
                  }
                >
                  <SelectTrigger data-ocid="amendment.course.select">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ...new Set(
                        publishedResults.map((r) => String(r.courseId)),
                      ),
                    ].map((cid) => {
                      const c = courses.find((cc) => String(cc.id) === cid);
                      return c ? (
                        <SelectItem key={cid} value={cid}>
                          {c.code} — {c.name}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Student</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, studentId: v }))
                  }
                  disabled={!form.courseId}
                >
                  <SelectTrigger data-ocid="amendment.student.select">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((s) =>
                      s ? (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          {s.name} — {s.matricNumber}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>New CA (max 40)</Label>
                  <Input
                    type="number"
                    max={40}
                    data-ocid="amendment.new_ca.input"
                    value={form.newCa}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, newCa: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>New Exam (max 60)</Label>
                  <Input
                    type="number"
                    max={60}
                    data-ocid="amendment.new_exam.input"
                    value={form.newExam}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, newExam: e.target.value }))
                    }
                  />
                </div>
              </div>
              {form.newCa && form.newExam && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                  New total: {Number(form.newCa) + Number(form.newExam)} —{" "}
                  {
                    calcGradePoint(Number(form.newCa) + Number(form.newExam))
                      .grade
                  }{" "}
                  (
                  {
                    calcGradePoint(Number(form.newCa) + Number(form.newExam))
                      .remarks
                  }
                  )
                </div>
              )}
              <div className="grid gap-2">
                <Label>Reason for Amendment</Label>
                <Textarea
                  data-ocid="amendment.reason.textarea"
                  rows={3}
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Explain why the score needs to be amended..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="amendment.cancel_button"
                onClick={() => setRequestOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="amendment.submit_button"
                onClick={handleSubmitRequest}
              >
                Submit to HOD
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
