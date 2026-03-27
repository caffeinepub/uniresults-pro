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
import { CheckCircle, Edit2, XCircle } from "lucide-react";
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
  pending_hod: "Pending HOD",
  pending_dean: "Pending Dean",
  pending_registrar: "Pending Registrar",
  approved: "Approved",
  rejected: "Rejected",
};

function statusColor(status: AmendmentRequest["status"]) {
  switch (status) {
    case "approved":
      return "bg-success/10 text-success border-success/30";
    case "rejected":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-warning/10 text-warning border-warning/30";
  }
}

export default function ResultAmendmentTab({ userRole }: Props) {
  const {
    amendmentRequests,
    addAmendmentRequest,
    updateAmendmentStatus,
    approveAmendmentFinal,
    rejectAmendment,
    results,
    courses,
    students,
    currentUser,
    logAudit,
  } = useApp();

  const [requestOpen, setRequestOpen] = useState(false);

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
      return amendmentRequests.filter(
        (a) => a.lecturerName === currentUser?.name,
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
  }, [amendmentRequests, userRole, currentUser]);

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
    const newCa = Number(form.newCa);
    const newExam = Number(form.newExam);
    if (newCa > 40 || newExam > 60) {
      toast.error("CA max is 40, Exam max is 60");
      return;
    }
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
    };
    addAmendmentRequest(req);
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "Amendment Request",
      `Amendment requested for ${getCourse(origResult.courseId)?.code} — ${getStudent(origResult.studentId)?.name}`,
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

  function handleApprove(a: AmendmentRequest) {
    if (userRole === "HOD") {
      updateAmendmentStatus(a.id, "pending_registrar");
      toast.success("Amendment forwarded to Registrar");
    } else if (userRole === "Registrar") {
      approveAmendmentFinal(a.id);
      toast.success("Amendment applied");
    }
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "Amendment Approved",
      `Amendment ${String(a.id)} approved`,
    );
  }

  function handleReject(a: AmendmentRequest) {
    rejectAmendment(a.id);
    toast.success("Amendment rejected");
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "Amendment Rejected",
      `Amendment ${String(a.id)} rejected`,
    );
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Result Amendment</h2>
          <p className="text-sm text-muted-foreground">
            Request and track score corrections for published results
          </p>
        </div>
        {userRole === "Lecturer" && (
          <Button
            size="sm"
            data-ocid="amendment.open_modal_button"
            onClick={() => setRequestOpen(true)}
          >
            <Edit2 className="w-4 h-4 mr-1" /> Request Amendment
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Original CA/Exam</TableHead>
              <TableHead>New CA/Exam</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              {(userRole === "HOD" || userRole === "Registrar") && (
                <TableHead />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {myAmendments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="amendment.empty_state"
                >
                  No amendment requests.
                </TableCell>
              </TableRow>
            ) : (
              myAmendments.map((a, i) => {
                const course = getCourse(a.courseId);
                const student = getStudent(a.studentId);
                return (
                  <TableRow
                    key={String(a.id)}
                    data-ocid={`amendment.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {course?.code ?? "?"}
                    </TableCell>
                    <TableCell>{student?.name ?? "?"}</TableCell>
                    <TableCell className="text-xs">
                      {a.originalCa}/{a.originalExam}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {a.newCa}/{a.newExam}
                    </TableCell>
                    <TableCell className="text-xs max-w-32 truncate">
                      {a.reason}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(a.status)}`}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </TableCell>
                    {(userRole === "HOD" || userRole === "Registrar") &&
                      (a.status === "pending_hod" ||
                        a.status === "pending_registrar") && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              data-ocid={`amendment.confirm_button.${i + 1}`}
                              onClick={() => handleApprove(a)}
                              title="Approve"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-success" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              data-ocid={`amendment.delete_button.${i + 1}`}
                              onClick={() => handleReject(a)}
                              title="Reject"
                            >
                              <XCircle className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Request Dialog (Lecturer only) */}
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
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
