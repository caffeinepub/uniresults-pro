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
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, GraduationCap, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export type ThesisStage =
  | "Proposal Submitted"
  | "Proposal Approved"
  | "Draft Submitted"
  | "Defense Scheduled"
  | "Defense Passed"
  | "Final Submission"
  | "Completed";

export interface ThesisRecord {
  id: string;
  studentId: string;
  studentName: string;
  matric: string;
  department: string;
  supervisorId: string;
  supervisorName: string;
  stage: ThesisStage;
  title: string;
  notes: { stage: string; text: string; date: string }[];
  updatedAt: string;
  createdAt: string;
}

const STAGES: ThesisStage[] = [
  "Proposal Submitted",
  "Proposal Approved",
  "Draft Submitted",
  "Defense Scheduled",
  "Defense Passed",
  "Final Submission",
  "Completed",
];

const STAGE_COLORS: Record<ThesisStage, string> = {
  "Proposal Submitted": "bg-yellow-100 text-yellow-800",
  "Proposal Approved": "bg-blue-100 text-blue-800",
  "Draft Submitted": "bg-indigo-100 text-indigo-800",
  "Defense Scheduled": "bg-orange-100 text-orange-800",
  "Defense Passed": "bg-teal-100 text-teal-800",
  "Final Submission": "bg-purple-100 text-purple-800",
  Completed: "bg-green-100 text-green-800",
};

const DEMO_RECORDS: ThesisRecord[] = [
  {
    id: "th-1",
    studentId: "pg-001",
    studentName: "Adaeze Obi",
    matric: "CSC/PG/2023/001",
    department: "Computer Science",
    supervisorId: "CSC/STF/001",
    supervisorName: "Dr. Emeka Okonkwo",
    stage: "Draft Submitted",
    title: "Machine Learning Approaches to Crop Disease Detection in Nigeria",
    notes: [
      {
        stage: "Proposal Submitted",
        text: "Proposal received and filed.",
        date: "2024-02-10",
      },
      {
        stage: "Proposal Approved",
        text: "Proposal approved by departmental committee.",
        date: "2024-03-15",
      },
    ],
    updatedAt: new Date().toISOString(),
    createdAt: new Date("2024-02-01").toISOString(),
  },
  {
    id: "th-2",
    studentId: "pg-002",
    studentName: "Musa Tanko",
    matric: "CSC/PG/2023/002",
    department: "Computer Science",
    supervisorId: "CSC/STF/002",
    supervisorName: "Dr. Chioma Adeyemi",
    stage: "Proposal Approved",
    title:
      "Blockchain for Academic Credential Verification in Nigerian Universities",
    notes: [
      {
        stage: "Proposal Submitted",
        text: "Proposal submitted and reviewed.",
        date: "2024-03-01",
      },
    ],
    updatedAt: new Date().toISOString(),
    createdAt: new Date("2024-03-01").toISOString(),
  },
];

function getRecords(): ThesisRecord[] {
  try {
    const saved = JSON.parse(localStorage.getItem("thesisRecords") || "[]");
    if (saved.length === 0) {
      localStorage.setItem("thesisRecords", JSON.stringify(DEMO_RECORDS));
      return DEMO_RECORDS;
    }
    return saved;
  } catch {
    return DEMO_RECORDS;
  }
}

function saveRecords(list: ThesisRecord[]) {
  localStorage.setItem("thesisRecords", JSON.stringify(list));
}

interface Props {
  mode?: "admin" | "hod" | "supervisor" | "student";
}

export default function ThesisTrackerTab({ mode = "admin" }: Props) {
  const { currentUser, students, staffMembers, departments, logAudit } =
    useApp();
  const [records, setRecords] = useState<ThesisRecord[]>(getRecords);
  const [open, setOpen] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState<ThesisRecord | null>(null);
  const [advanceNote, setAdvanceNote] = useState("");
  const [sortAsc, _setSortAsc] = useState(true);
  const [filterStage, setFilterStage] = useState<"all" | ThesisStage>("all");
  const [form, setForm] = useState({
    studentId: "",
    supervisorId: "",
    title: "",
  });

  const myStaff = staffMembers.find((s) => s.name === currentUser?.name);
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  // Filter based on role
  let visible = records;
  if (mode === "supervisor") {
    const myId = myStaff?.staffId ?? currentUser?.principal ?? "";
    visible = records.filter((r) => r.supervisorId === myId);
  } else if (mode === "student" && me) {
    visible = records.filter(
      (r) => r.studentId === String(me.id) || r.matric === me.matricNumber,
    );
  }
  if (filterStage !== "all") {
    visible = visible.filter((r) => r.stage === filterStage);
  }
  visible = [...visible].sort((a, b) => {
    const diff = a.studentName.localeCompare(b.studentName);
    return sortAsc ? diff : -diff;
  });

  function handleAdd() {
    if (!form.studentId || !form.supervisorId || !form.title) {
      toast.error("All fields are required");
      return;
    }
    const student = students.find((s) => String(s.id) === form.studentId);
    const supervisor = staffMembers.find(
      (s) => s.staffId === form.supervisorId,
    );
    const dept = student
      ? departments.find((d) => String(d.id) === String(student.departmentId))
      : null;
    const rec: ThesisRecord = {
      id: `th-${Date.now()}`,
      studentId: form.studentId,
      studentName: student?.name ?? "",
      matric: student?.matricNumber ?? "",
      department: dept?.name ?? "",
      supervisorId: form.supervisorId,
      supervisorName: supervisor?.name ?? "",
      stage: "Proposal Submitted",
      title: form.title,
      notes: [],
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [rec, ...records];
    saveRecords(updated);
    setRecords(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "HOD",
      "Thesis Record Created",
      `${student?.name} — ${form.title}`,
    );
    toast.success("Thesis record created");
    setOpen(false);
    setForm({ studentId: "", supervisorId: "", title: "" });
  }

  function handleAdvance(rec: ThesisRecord) {
    const idx = STAGES.indexOf(rec.stage);
    if (idx >= STAGES.length - 1) {
      toast.error("Already completed");
      return;
    }
    const nextStage = STAGES[idx + 1];
    const updated = records.map((r) =>
      r.id === rec.id
        ? {
            ...r,
            stage: nextStage,
            notes: [
              ...r.notes,
              {
                stage: nextStage,
                text: advanceNote,
                date: new Date().toISOString().slice(0, 10),
              },
            ],
            updatedAt: new Date().toISOString(),
          }
        : r,
    );
    saveRecords(updated);
    setRecords(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "Supervisor",
      "Thesis Stage Advanced",
      `${rec.studentName} → ${nextStage}`,
    );
    toast.success(`Advanced to: ${nextStage}`);
    setAdvanceTarget(null);
    setAdvanceNote("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <GraduationCap className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Thesis / Project Tracker</h2>
        <Select
          value={filterStage}
          onValueChange={(v) => setFilterStage(v as any)}
        >
          <SelectTrigger
            data-ocid="thesis.stage.select"
            className="w-44 text-xs"
          >
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(mode === "admin" || mode === "hod") && (
          <Button
            data-ocid="thesis.add.button"
            size="sm"
            className="ml-auto"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            New Record
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <div
          data-ocid="thesis.empty_state"
          className="text-center py-8 text-muted-foreground"
        >
          No thesis records found.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((rec, i) => (
            <Card key={rec.id} data-ocid={`thesis.item.${i + 1}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {rec.studentName}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({rec.matric})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {rec.title}
                    </div>
                    <div className="text-xs mt-1">
                      Supervisor: {rec.supervisorName} · Dept: {rec.department}
                    </div>
                    {rec.notes.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        {rec.notes.slice(-2).map((n) => (
                          <div key={n.date + n.stage}>
                            <b>{n.stage}:</b> {n.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={STAGE_COLORS[rec.stage]}>
                      {rec.stage}
                    </Badge>
                    {(mode === "supervisor" ||
                      mode === "admin" ||
                      mode === "hod") &&
                      rec.stage !== "Completed" && (
                        <Button
                          data-ocid={"thesis.advance.button"}
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAdvanceTarget(rec);
                            setAdvanceNote("");
                          }}
                        >
                          <ChevronRight className="w-3 h-3 mr-1" />
                          Advance
                        </Button>
                      )}
                  </div>
                </div>

                {/* Stage progress bar */}
                <div className="flex items-center gap-0.5 mt-3">
                  {STAGES.map((s, idx) => {
                    const current = STAGES.indexOf(rec.stage);
                    const done = idx <= current;
                    return (
                      <div
                        key={s}
                        className={`h-1.5 flex-1 rounded ${done ? "bg-primary" : "bg-muted"}`}
                        title={s}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Thesis Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Student *</Label>
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((p) => ({ ...p, studentId: v }))}
              >
                <SelectTrigger data-ocid="thesis.student.select">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {students
                    .filter(
                      (s) =>
                        s.programmeType === "Postgraduate" || (s as any).isPG,
                    )
                    .map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name} ({s.matricNumber})
                      </SelectItem>
                    ))}
                  {students.slice(0, 20).map((s) => (
                    <SelectItem
                      key={`all-${String(s.id)}`}
                      value={String(s.id)}
                    >
                      {s.name} ({s.matricNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Supervisor *</Label>
              <Select
                value={form.supervisorId}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, supervisorId: v }))
                }
              >
                <SelectTrigger data-ocid="thesis.supervisor.select">
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((s) => (
                    <SelectItem key={s.staffId} value={s.staffId}>
                      {s.name} ({s.staffId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Thesis / Project Title *</Label>
              <Input
                data-ocid="thesis.title.input"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                data-ocid="thesis.cancel.button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button data-ocid="thesis.save.button" onClick={handleAdd}>
                Create Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advance dialog */}
      <Dialog
        open={!!advanceTarget}
        onOpenChange={(o) => !o && setAdvanceTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance to Next Stage</DialogTitle>
          </DialogHeader>
          {advanceTarget && (
            <div className="space-y-3">
              <p className="text-sm">
                Current:{" "}
                <Badge className={STAGE_COLORS[advanceTarget.stage]}>
                  {advanceTarget.stage}
                </Badge>
              </p>
              <p className="text-sm">
                Next:{" "}
                <Badge
                  className={
                    STAGE_COLORS[
                      STAGES[STAGES.indexOf(advanceTarget.stage) + 1]
                    ]
                  }
                >
                  {STAGES[STAGES.indexOf(advanceTarget.stage) + 1]}
                </Badge>
              </p>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea
                  data-ocid="thesis.note.textarea"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  rows={3}
                  placeholder="Add any notes for this stage..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  data-ocid="thesis.advance_cancel.button"
                  variant="outline"
                  onClick={() => setAdvanceTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="thesis.advance_confirm.button"
                  onClick={() => handleAdvance(advanceTarget)}
                >
                  Advance Stage
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
