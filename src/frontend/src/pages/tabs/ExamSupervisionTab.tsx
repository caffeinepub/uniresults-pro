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
import { AlertTriangle, Plus, Printer, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface ExamSupervisionEntry {
  id: string;
  courseCode: string;
  courseName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  leadInvigilator: string;
  assistantInvigilator: string;
  createdAt: string;
}

function getEntries(): ExamSupervisionEntry[] {
  try {
    return JSON.parse(localStorage.getItem("examSupervision") || "[]");
  } catch {
    return [];
  }
}

function saveEntries(list: ExamSupervisionEntry[]) {
  localStorage.setItem("examSupervision", JSON.stringify(list));
}

const DEMO_ENTRIES: ExamSupervisionEntry[] = [
  {
    id: "es-1",
    courseCode: "CSC301",
    courseName: "Data Structures & Algorithms",
    date: "2025-05-12",
    startTime: "09:00",
    endTime: "12:00",
    venue: "Hall A",
    leadInvigilator: "Dr. Emeka Okonkwo",
    assistantInvigilator: "Mr. Yusuf Aliyu",
    createdAt: new Date().toISOString(),
  },
  {
    id: "es-2",
    courseCode: "CSC201",
    courseName: "Computer Architecture",
    date: "2025-05-13",
    startTime: "13:00",
    endTime: "16:00",
    venue: "Hall B",
    leadInvigilator: "Mrs. Chioma Adeyemi",
    assistantInvigilator: "Dr. Adewale Ogundimu",
    createdAt: new Date().toISOString(),
  },
];

export default function ExamSupervisionTab() {
  const { staffMembers, logAudit, currentUser } = useApp();
  const [entries, setEntries] = useState<ExamSupervisionEntry[]>(() => {
    const saved = getEntries();
    if (saved.length === 0) {
      saveEntries(DEMO_ENTRIES);
      return DEMO_ENTRIES;
    }
    return saved;
  });
  const [open, setOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    leadInvigilator: "",
    assistantInvigilator: "",
  });

  const staffNames = staffMembers.map((s) => s.name);

  function detectClash(e: ExamSupervisionEntry): boolean {
    return entries.some((other) => {
      if (other.id === e.id) return false;
      if (other.date !== e.date) return false;
      const overlapLead =
        e.leadInvigilator &&
        (other.leadInvigilator === e.leadInvigilator ||
          other.assistantInvigilator === e.leadInvigilator);
      const overlapAsst =
        e.assistantInvigilator &&
        (other.leadInvigilator === e.assistantInvigilator ||
          other.assistantInvigilator === e.assistantInvigilator);
      // simple time overlap check
      const aStart = Number(other.startTime.replace(":", ""));
      const aEnd = Number(other.endTime.replace(":", ""));
      const bStart = Number(e.startTime.replace(":", ""));
      const bEnd = Number(e.endTime.replace(":", ""));
      const timeOverlap = bStart < aEnd && bEnd > aStart;
      return timeOverlap && (overlapLead || overlapAsst);
    });
  }

  function handleAdd() {
    if (
      !form.courseCode ||
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !form.venue ||
      !form.leadInvigilator
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    const entry: ExamSupervisionEntry = {
      ...form,
      id: `es-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (detectClash(entry)) {
      toast.warning(
        "Clash detected: an invigilator has another exam at the same time!",
      );
    }
    const updated = [entry, ...entries];
    saveEntries(updated);
    setEntries(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "Registrar",
      "Exam Supervision Assigned",
      `${form.courseCode} on ${form.date}`,
    );
    toast.success("Exam supervision entry added");
    setOpen(false);
    setForm({
      courseCode: "",
      courseName: "",
      date: "",
      startTime: "",
      endTime: "",
      venue: "",
      leadInvigilator: "",
      assistantInvigilator: "",
    });
  }

  function handleDelete(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    saveEntries(updated);
    setEntries(updated);
    toast.success("Entry removed");
  }

  const sorted = [...entries].sort((a, b) => {
    const diff = a.date.localeCompare(b.date);
    return sortAsc ? diff : -diff;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Exam Supervision</h2>
        <div className="ml-auto flex gap-2">
          <Button
            data-ocid="exam_supervision.print.button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-3 h-3 mr-1" />
            Print Schedule
          </Button>
          <Button
            data-ocid="exam_supervision.add.button"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Entry
          </Button>
        </div>
      </div>

      {entries.some(detectClash) && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-warning/10 border border-warning text-warning-foreground text-sm">
          <AlertTriangle className="w-4 h-4" />
          Some entries have scheduling clashes. Please review.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Invigilation Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div
              data-ocid="exam_supervision.empty_state"
              className="text-center py-8 text-muted-foreground"
            >
              No invigilation entries yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => setSortAsc(!sortAsc)}
                    className="cursor-pointer"
                  >
                    Date {sortAsc ? "↑" : "↓"}
                  </TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Lead Invigilator</TableHead>
                  <TableHead>Assistant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((e, i) => (
                  <TableRow
                    key={e.id}
                    data-ocid={`exam_supervision.item.${i + 1}`}
                  >
                    <TableCell>
                      {new Date(e.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {e.courseCode}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {e.courseName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.startTime}–{e.endTime}
                    </TableCell>
                    <TableCell>{e.venue}</TableCell>
                    <TableCell>{e.leadInvigilator}</TableCell>
                    <TableCell>{e.assistantInvigilator || "—"}</TableCell>
                    <TableCell>
                      {detectClash(e) ? (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Clash
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        data-ocid={"exam_supervision.delete.button"}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(e.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Invigilation Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Course Code *</Label>
                <Input
                  data-ocid="exam_supervision.course.input"
                  value={form.courseCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, courseCode: e.target.value }))
                  }
                  placeholder="CSC301"
                />
              </div>
              <div className="space-y-1">
                <Label>Course Name</Label>
                <Input
                  value={form.courseName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, courseName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input
                  data-ocid="exam_supervision.date.input"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Venue *</Label>
                <Input
                  value={form.venue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, venue: e.target.value }))
                  }
                  placeholder="Hall A"
                />
              </div>
              <div className="space-y-1">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Lead Invigilator *</Label>
              <Input
                data-ocid="exam_supervision.lead.input"
                value={form.leadInvigilator}
                onChange={(e) =>
                  setForm((p) => ({ ...p, leadInvigilator: e.target.value }))
                }
                placeholder="Staff name or ID"
                list="staff-list"
              />
              <datalist id="staff-list">
                {staffNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label>Assistant Invigilator</Label>
              <Input
                value={form.assistantInvigilator}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    assistantInvigilator: e.target.value,
                  }))
                }
                list="staff-list"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                data-ocid="exam_supervision.cancel.button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="exam_supervision.save.button"
                onClick={handleAdd}
              >
                Add Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
