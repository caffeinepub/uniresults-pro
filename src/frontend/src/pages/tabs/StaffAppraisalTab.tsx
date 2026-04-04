import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CheckCircle, ClipboardCheck, Plus, Printer, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface StaffAppraisal {
  id: string;
  staffId: string;
  staffName: string;
  departmentId: string;
  session: string;
  year: string;
  selfTeaching: number;
  selfResearch: number;
  selfCommunity: number;
  selfPunctuality: number;
  selfCooperation: number;
  selfComment: string;
  hodTeaching: number;
  hodResearch: number;
  hodCommunity: number;
  hodPunctuality: number;
  hodCooperation: number;
  hodComment: string;
  studentFeedbackScore: number;
  status: "draft" | "self_submitted" | "hod_reviewed" | "dean_endorsed";
  hodReviewedBy?: string;
  deanEndorsedBy?: string;
}

const LS_KEY = "unipro_appraisals";

function load(): StaffAppraisal[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(data: StaffAppraisal[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

const SESSIONS = ["2024/2025", "2023/2024"];

const CRITERIA = [
  { key: "Teaching", label: "Teaching / Work Effectiveness" },
  { key: "Research", label: "Research Output" },
  { key: "Community", label: "Community Service" },
  { key: "Punctuality", label: "Punctuality & Attendance" },
  { key: "Cooperation", label: "Cooperation & Teamwork" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  self_submitted: "outline",
  hod_reviewed: "outline",
  dean_endorsed: "default",
} as const;

function StarRating({
  value,
  onChange,
  readOnly,
}: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          className={`text-lg transition-colors ${
            s <= value ? "text-yellow-500" : "text-gray-300"
          } ${!readOnly ? "hover:text-yellow-400 cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function StaffAppraisalTab() {
  const {
    currentUser,
    departments,
    staffMembers,
    lecturerEvaluations,
    logAudit,
  } = useApp();
  const [appraisals, setAppraisalsState] = useState<StaffAppraisal[]>(load);
  const [session, setSession] = useState(SESSIONS[0]);
  const [selectedDept, setSelectedDept] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewItem, setViewItem] = useState<StaffAppraisal | null>(null);
  const [form, setForm] = useState<Partial<StaffAppraisal>>({
    selfTeaching: 3,
    selfResearch: 3,
    selfCommunity: 3,
    selfPunctuality: 3,
    selfCooperation: 3,
    selfComment: "",
    hodTeaching: 3,
    hodResearch: 3,
    hodCommunity: 3,
    hodPunctuality: 3,
    hodCooperation: 3,
    hodComment: "",
    studentFeedbackScore: 3,
  });

  const role = currentUser?.role;
  const isAdmin = role === "SuperAdmin" || role === "Registrar";
  const isHOD = role === "HOD";
  const isDean = role === "Dean";

  function persist(data: StaffAppraisal[]) {
    setAppraisalsState(data);
    save(data);
  }

  const filtered = appraisals.filter(
    (a) =>
      a.session === session &&
      (!selectedDept || a.departmentId === selectedDept),
  );

  const avgFeedback = (sid: string) => {
    const evals = lecturerEvaluations.filter((e) => e.lecturerId === sid);
    if (!evals.length) return 3;
    const total = evals.reduce(
      (s, e) => s + (Number(e.scores?.overall) || 3),
      0,
    );
    return Math.round(total / evals.length);
  };

  function openAdd() {
    const sId = staffMembers[0] ? String(staffMembers[0].id) : "";
    const staff = staffMembers.find((s) => String(s.id) === sId);
    setForm({
      staffId: sId,
      staffName: staff?.name ?? "",
      departmentId: selectedDept || String(departments[0]?.id ?? ""),
      session,
      year: session.split("/")[0],
      selfTeaching: 3,
      selfResearch: 3,
      selfCommunity: 3,
      selfPunctuality: 3,
      selfCooperation: 3,
      selfComment: "",
      hodTeaching: 3,
      hodResearch: 3,
      hodCommunity: 3,
      hodPunctuality: 3,
      hodCooperation: 3,
      hodComment: "",
      studentFeedbackScore: avgFeedback(sId),
      status: "draft",
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.staffName) {
      toast.error("Please select a staff member");
      return;
    }
    const newItem: StaffAppraisal = {
      id: Date.now().toString(),
      staffId: form.staffId ?? "",
      staffName: form.staffName ?? "",
      departmentId: form.departmentId ?? "",
      session: form.session ?? session,
      year: form.year ?? "",
      selfTeaching: form.selfTeaching ?? 3,
      selfResearch: form.selfResearch ?? 3,
      selfCommunity: form.selfCommunity ?? 3,
      selfPunctuality: form.selfPunctuality ?? 3,
      selfCooperation: form.selfCooperation ?? 3,
      selfComment: form.selfComment ?? "",
      hodTeaching: form.hodTeaching ?? 3,
      hodResearch: form.hodResearch ?? 3,
      hodCommunity: form.hodCommunity ?? 3,
      hodPunctuality: form.hodPunctuality ?? 3,
      hodCooperation: form.hodCooperation ?? 3,
      hodComment: form.hodComment ?? "",
      studentFeedbackScore: form.studentFeedbackScore ?? 3,
      status: isHOD ? "hod_reviewed" : "draft",
      hodReviewedBy: isHOD ? currentUser?.name : undefined,
      deanEndorsedBy: isDean ? currentUser?.name : undefined,
    };
    persist([...appraisals, newItem]);
    logAudit(
      currentUser?.name ?? "",
      role ?? "",
      "Appraisal Added",
      `Appraisal for ${newItem.staffName}`,
    );
    toast.success("Appraisal saved");
    setShowForm(false);
  }

  function handleEndorse(id: string) {
    const updated = appraisals.map((a) =>
      a.id === id
        ? {
            ...a,
            status: isDean
              ? ("dean_endorsed" as const)
              : ("hod_reviewed" as const),
            deanEndorsedBy: isDean ? currentUser?.name : a.deanEndorsedBy,
            hodReviewedBy: isHOD ? currentUser?.name : a.hodReviewedBy,
          }
        : a,
    );
    persist(updated);
    toast.success("Appraisal status updated");
  }

  function calcOverall(a: StaffAppraisal, source: "self" | "hod") {
    if (source === "self") {
      return (
        (a.selfTeaching +
          a.selfResearch +
          a.selfCommunity +
          a.selfPunctuality +
          a.selfCooperation) /
        5
      ).toFixed(1);
    }
    return (
      (a.hodTeaching +
        a.hodResearch +
        a.hodCommunity +
        a.hodPunctuality +
        a.hodCooperation) /
      5
    ).toFixed(1);
  }

  const statusLabel = (s: string) =>
    s === "draft"
      ? "Draft"
      : s === "self_submitted"
        ? "Self Submitted"
        : s === "hod_reviewed"
          ? "HOD Reviewed"
          : "Dean Endorsed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Staff Appraisal System</h2>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" /> New Appraisal
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 no-print">
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SESSIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Self Score</TableHead>
                  <TableHead>HOD Score</TableHead>
                  <TableHead>Student Feedback</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="no-print">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No appraisals recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        {a.staffName}
                      </TableCell>
                      <TableCell className="text-xs">
                        {departments.find(
                          (d) => String(d.id) === a.departmentId,
                        )?.name ?? a.departmentId}
                      </TableCell>
                      <TableCell>{a.session}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {calcOverall(a, "self")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                          {calcOverall(a, "hod")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-green-500 fill-green-500" />
                          {a.studentFeedbackScore}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_COLORS[a.status] as
                              | "default"
                              | "secondary"
                              | "outline"
                          }
                          className="text-xs"
                        >
                          {statusLabel(a.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="no-print">
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewItem(a)}
                          >
                            View
                          </Button>
                          {(isHOD || isDean || isAdmin) &&
                            a.status !== "dean_endorsed" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEndorse(a.id)}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Appraisal Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Staff Appraisal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Staff Member</Label>
                <Select
                  value={form.staffId ?? ""}
                  onValueChange={(v) => {
                    const staff = staffMembers.find((s) => String(s.id) === v);
                    setForm({
                      ...form,
                      staffId: v,
                      staffName: staff?.name ?? "",
                      studentFeedbackScore: avgFeedback(v),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Session</Label>
                <Select
                  value={form.session ?? session}
                  onValueChange={(v) =>
                    setForm({ ...form, session: v, year: v.split("/")[0] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Self Assessment</h3>
              <div className="space-y-2">
                {CRITERIA.map((c) => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{c.label}</span>
                    <StarRating
                      value={
                        (form[`self${c.key}` as keyof typeof form] as number) ??
                        3
                      }
                      onChange={(v) =>
                        setForm({ ...form, [`self${c.key}`]: v })
                      }
                    />
                  </div>
                ))}
                <div>
                  <Label>Self Comment</Label>
                  <Textarea
                    value={form.selfComment ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, selfComment: e.target.value })
                    }
                    rows={2}
                    placeholder="Self-assessment comments..."
                  />
                </div>
              </div>
            </div>

            {(isHOD || isDean || isAdmin) && (
              <div>
                <h3 className="font-semibold text-sm mb-2">HOD Assessment</h3>
                <div className="space-y-2">
                  {CRITERIA.map((c) => (
                    <div
                      key={c.key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{c.label}</span>
                      <StarRating
                        value={
                          (form[
                            `hod${c.key}` as keyof typeof form
                          ] as number) ?? 3
                        }
                        onChange={(v) =>
                          setForm({ ...form, [`hod${c.key}`]: v })
                        }
                      />
                    </div>
                  ))}
                  <div>
                    <Label>HOD Comment</Label>
                    <Textarea
                      value={form.hodComment ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, hodComment: e.target.value })
                      }
                      rows={2}
                      placeholder="HOD assessment comments..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Appraisal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Appraisal */}
      {viewItem && (
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Appraisal Report — {viewItem.staffName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Session:</span>{" "}
                  {viewItem.session}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  {statusLabel(viewItem.status)}
                </div>
                {viewItem.hodReviewedBy && (
                  <div>
                    <span className="font-semibold">HOD Review By:</span>{" "}
                    {viewItem.hodReviewedBy}
                  </div>
                )}
                {viewItem.deanEndorsedBy && (
                  <div>
                    <span className="font-semibold">Dean Endorsed By:</span>{" "}
                    {viewItem.deanEndorsedBy}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Self Assessment</h4>
                <table className="w-full text-xs border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Criterion</th>
                      <th className="p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERIA.map((c) => (
                      <tr key={c.key} className="border-t">
                        <td className="p-2">{c.label}</td>
                        <td className="p-2 text-center">
                          <StarRating
                            value={
                              (viewItem[
                                `self${c.key}` as keyof StaffAppraisal
                              ] as number) ?? 3
                            }
                            readOnly
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {viewItem.selfComment && (
                  <p className="mt-2 text-muted-foreground italic">
                    {viewItem.selfComment}
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">HOD Assessment</h4>
                <table className="w-full text-xs border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Criterion</th>
                      <th className="p-2">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CRITERIA.map((c) => (
                      <tr key={c.key} className="border-t">
                        <td className="p-2">{c.label}</td>
                        <td className="p-2 text-center">
                          <StarRating
                            value={
                              (viewItem[
                                `hod${c.key}` as keyof StaffAppraisal
                              ] as number) ?? 3
                            }
                            readOnly
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {viewItem.hodComment && (
                  <p className="mt-2 text-muted-foreground italic">
                    {viewItem.hodComment}
                  </p>
                )}
              </div>
              <div>
                <span className="font-semibold">Student Feedback Score:</span>
                <StarRating value={viewItem.studentFeedbackScore} readOnly />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}>
                Print
              </Button>
              <Button onClick={() => setViewItem(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
