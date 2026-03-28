import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { CheckCircle, FileText, Printer, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface TranscriptRequest {
  id: string;
  studentId: string;
  studentName: string;
  matric: string;
  department: string;
  purpose: "Employment" | "Further Studies" | "Personal";
  copies: number;
  note: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

function getRequests(): TranscriptRequest[] {
  try {
    return JSON.parse(localStorage.getItem("transcriptRequests") || "[]");
  } catch {
    return [];
  }
}

function saveRequests(list: TranscriptRequest[]) {
  localStorage.setItem("transcriptRequests", JSON.stringify(list));
}

// Student-facing submission form
export function StudentTranscriptRequestTab() {
  const { currentUser, students, logAudit } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const [purpose, setPurpose] =
    useState<TranscriptRequest["purpose"]>("Employment");
  const [copies, setCopies] = useState("1");
  const [note, setNote] = useState("");
  const [_submitted, setSubmitted] = useState(false);
  const myRequests = getRequests().filter(
    (r) => r.studentId === String(me?.id),
  );

  function handleSubmit() {
    if (!me) {
      toast.error("Student record not found");
      return;
    }
    const req: TranscriptRequest = {
      id: `tr-${Date.now()}`,
      studentId: String(me.id),
      studentName: me.name ?? "",
      matric: me.matricNumber ?? "",
      department: String(me.departmentId ?? ""),
      purpose,
      copies: Math.max(1, Number(copies)),
      note,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    const all = getRequests();
    all.unshift(req);
    saveRequests(all);
    logAudit(
      me.name ?? "",
      "Student",
      "Transcript Requested",
      `Purpose: ${purpose}`,
    );
    toast.success("Transcript request submitted!");
    setSubmitted(true);
    setNote("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Request Official Transcript</h2>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as any)}>
              <SelectTrigger data-ocid="transcript.purpose.select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Employment">Employment</SelectItem>
                <SelectItem value="Further Studies">Further Studies</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Number of Copies</Label>
            <Input
              data-ocid="transcript.copies.input"
              type="number"
              min={1}
              max={10}
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              className="w-32"
            />
          </div>
          <div className="space-y-1">
            <Label>Additional Note (optional)</Label>
            <Textarea
              data-ocid="transcript.note.textarea"
              placeholder="Any special instructions..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
          <Button data-ocid="transcript.submit.button" onClick={handleSubmit}>
            Submit Request
          </Button>
        </CardContent>
      </Card>

      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">My Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((r) => (
                  <TableRow
                    key={r.id}
                    data-ocid={`transcript.item.${myRequests.indexOf(r) + 1}`}
                  >
                    <TableCell>{r.purpose}</TableCell>
                    <TableCell>{r.copies}</TableCell>
                    <TableCell>
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "default"
                            : r.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Admin/Registrar view
export default function TranscriptRequestTab() {
  const { logAudit, currentUser } = useApp();
  const [requests, setRequests] = useState<TranscriptRequest[]>(getRequests);
  const [printStudent, setPrintStudent] = useState<TranscriptRequest | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<TranscriptRequest | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  function reload() {
    setRequests(getRequests());
  }

  function approve(req: TranscriptRequest) {
    const updated = requests.map((r) =>
      r.id === req.id ? { ...r, status: "approved" as const } : r,
    );
    saveRequests(updated);
    setRequests(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "Registrar",
      "Transcript Approved",
      `${req.studentName} - ${req.matric}`,
    );
    toast.success("Request approved");
    setPrintStudent(req);
  }

  function reject() {
    if (!rejectTarget) return;
    const updated = requests.map((r) =>
      r.id === rejectTarget.id
        ? { ...r, status: "rejected" as const, rejectionReason: rejectReason }
        : r,
    );
    saveRequests(updated);
    setRequests(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "Registrar",
      "Transcript Rejected",
      `${rejectTarget.studentName}`,
    );
    toast.success("Request rejected");
    setRejectTarget(null);
    setRejectReason("");
  }

  const sorted = [...requests].sort((a, b) => {
    const diff =
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    return sortAsc ? diff : -diff;
  });

  const pending = sorted.filter((r) => r.status === "pending");
  const _processed = sorted.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Transcript Requests</h2>
        <Badge>{pending.length} Pending</Badge>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={reload}
        >
          Refresh
        </Button>
      </div>

      {pending.length === 0 && (
        <div
          data-ocid="transcript.empty_state"
          className="text-center py-8 text-muted-foreground"
        >
          No pending transcript requests.
        </div>
      )}

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead
                    onClick={() => setSortAsc(!sortAsc)}
                    className="cursor-pointer"
                  >
                    Date {sortAsc ? "↑" : "↓"}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r, i) => (
                  <TableRow key={r.id} data-ocid={`transcript.item.${i + 1}`}>
                    <TableCell className="font-medium">
                      {r.studentName}
                    </TableCell>
                    <TableCell>{r.matric}</TableCell>
                    <TableCell>{r.purpose}</TableCell>
                    <TableCell>{r.copies}</TableCell>
                    <TableCell>
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        data-ocid={"transcript.approve.button"}
                        size="sm"
                        onClick={() => approve(r)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve & Print
                      </Button>
                      <Button
                        data-ocid={"transcript.reject.button"}
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectTarget(r);
                          setRejectReason("");
                        }}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Transcript Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason for rejection</Label>
            <Textarea
              data-ocid="transcript.reject_reason.textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                data-ocid="transcript.reject_cancel.button"
                variant="outline"
                onClick={() => setRejectTarget(null)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="transcript.reject_confirm.button"
                variant="destructive"
                onClick={reject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print transcript dialog */}
      {printStudent && (
        <PrintTranscriptModal
          req={printStudent}
          onClose={() => setPrintStudent(null)}
        />
      )}
    </div>
  );
}

function PrintTranscriptModal({
  req,
  onClose,
}: { req: TranscriptRequest; onClose: () => void }) {
  const { students, courses, results, departments, institutionSettings } =
    useApp();
  const student = students.find((s) => String(s.id) === req.studentId);
  const dept = departments.find(
    (d) => String(d.id) === (student ? String(student.departmentId) : ""),
  );
  const myResults = results.filter(
    (r) => String(r.studentId) === req.studentId && r.status === "published",
  );

  let totalWP = 0;
  let totalCU = 0;
  for (const r of myResults) {
    const c = courses.find((c) => String(c.id) === String(r.courseId));
    const cu = c ? Number(c.creditUnits) : 0;
    totalWP += r.gradePoint * cu;
    totalCU += cu;
  }
  const cgpa = totalCU > 0 ? (totalWP / totalCU).toFixed(2) : "0.00";

  function classifyDegree(c: number) {
    if (c >= 4.5) return "First Class Honours";
    if (c >= 3.5) return "Second Class Honours (Upper Division)";
    if (c >= 2.4) return "Second Class Honours (Lower Division)";
    if (c >= 1.5) return "Third Class Honours";
    if (c >= 1.0) return "Pass";
    return "Fail";
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Official Transcript — {req.studentName}</DialogTitle>
        </DialogHeader>
        <div id="transcript-print-area" className="space-y-4 text-sm">
          <div className="text-center border-b pb-3">
            <h1 className="text-xl font-bold">{institutionSettings.name}</h1>
            <p className="text-muted-foreground">
              Official Academic Transcript
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <b>Student:</b> {req.studentName}
            </div>
            <div>
              <b>Matric No:</b> {req.matric}
            </div>
            <div>
              <b>Department:</b> {dept?.name ?? req.department}
            </div>
            <div>
              <b>Purpose:</b> {req.purpose}
            </div>
            <div>
              <b>Copies:</b> {req.copies}
            </div>
            <div>
              <b>Issue Date:</b> {new Date().toLocaleDateString()}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Title</TableHead>
                <TableHead>CU</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myResults.map((r) => {
                const c = courses.find(
                  (c) => String(c.id) === String(r.courseId),
                );
                return (
                  <TableRow key={String(r.id)}>
                    <TableCell>{c?.code ?? ""}</TableCell>
                    <TableCell>{c?.name ?? ""}</TableCell>
                    <TableCell>{c ? Number(c.creditUnits) : ""}</TableCell>
                    <TableCell>{r.caScore}</TableCell>
                    <TableCell>{r.examScore}</TableCell>
                    <TableCell>{r.totalScore}</TableCell>
                    <TableCell>{r.grade}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <b>CGPA:</b> {cgpa}
            </div>
            <div>
              <b>Classification:</b> {classifyDegree(Number(cgpa))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-8 pt-6">
            <div className="border-t pt-2">
              <b>HOD Signature</b>
              <br />
              <span className="text-muted-foreground text-xs">
                Date: __________
              </span>
            </div>
            <div className="border-t pt-2">
              <b>Registrar Signature</b>
              <br />
              <span className="text-muted-foreground text-xs">
                Date: __________
              </span>
            </div>
            <div className="border-t pt-2">
              <b>Official Stamp</b>
              <br />
              <span className="text-muted-foreground text-xs">
                [Stamp Here]
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            data-ocid="transcript.print.button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Transcript
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
