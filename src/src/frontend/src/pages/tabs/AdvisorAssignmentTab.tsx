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
import { Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface AdvisorAssignment {
  studentMatric: string;
  staffId: string;
}

function getAssignments(): AdvisorAssignment[] {
  try {
    return JSON.parse(localStorage.getItem("advisorAssignments") || "[]");
  } catch {
    return [];
  }
}

function saveAssignments(list: AdvisorAssignment[]) {
  localStorage.setItem("advisorAssignments", JSON.stringify(list));
}

export default function AdvisorAssignmentTab() {
  const { students, staffMembers } = useApp();
  const [assignments, setAssignments] =
    useState<AdvisorAssignment[]>(getAssignments);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editMatric, setEditMatric] = useState<string | null>(null);
  const [form, setForm] = useState({ studentMatric: "", staffId: "" });

  const filtered = assignments.filter(
    (a) =>
      !search ||
      a.studentMatric.toLowerCase().includes(search.toLowerCase()) ||
      a.staffId.toLowerCase().includes(search.toLowerCase()),
  );

  function openAdd() {
    setEditMatric(null);
    setForm({ studentMatric: "", staffId: "" });
    setOpen(true);
  }

  function openEdit(a: AdvisorAssignment) {
    setEditMatric(a.studentMatric);
    setForm({ studentMatric: a.studentMatric, staffId: a.staffId });
    setOpen(true);
  }

  function handleSave() {
    if (!form.studentMatric || !form.staffId) {
      toast.error("Please select both student and advisor");
      return;
    }
    const updated = editMatric
      ? assignments.map((a) => (a.studentMatric === editMatric ? form : a))
      : [
          ...assignments.filter((a) => a.studentMatric !== form.studentMatric),
          form,
        ];
    setAssignments(updated);
    saveAssignments(updated);
    setOpen(false);
    toast.success("Advisor assignment saved");
  }

  function handleRemove(matric: string) {
    const updated = assignments.filter((a) => a.studentMatric !== matric);
    setAssignments(updated);
    saveAssignments(updated);
    toast.success("Assignment removed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Academic Advisor Assignments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Assign staff members as academic advisors to students
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          data-ocid="advisor.search_input"
          placeholder="Search by matric or staff ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button data-ocid="advisor.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Assign Advisor
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Student</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Advisor</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="advisor.empty_state"
                >
                  No advisor assignments yet
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a, i) => {
                const student = students.find(
                  (s) => s.matricNumber === a.studentMatric,
                );
                const staff = staffMembers.find((m) => m.staffId === a.staffId);
                return (
                  <TableRow
                    key={a.studentMatric}
                    data-ocid={`advisor.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {student?.name ?? a.studentMatric}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {a.studentMatric}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        {staff?.name ?? a.staffId}
                      </div>
                    </TableCell>
                    <TableCell>
                      {staff && (
                        <Badge variant="outline" className="text-xs">
                          {staff.designation}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`advisor.edit_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(a)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          data-ocid={`advisor.delete_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(a.studentMatric)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent data-ocid="advisor.dialog">
          <DialogHeader>
            <DialogTitle>Assign Academic Advisor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student</Label>
              <Select
                value={form.studentMatric}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, studentMatric: v }))
                }
                disabled={!!editMatric}
              >
                <SelectTrigger data-ocid="advisor.student.select">
                  <SelectValue placeholder="Select student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.matricNumber} value={s.matricNumber}>
                      {s.name} — {s.matricNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Advisor (Staff)</Label>
              <Select
                value={form.staffId}
                onValueChange={(v) => setForm((f) => ({ ...f, staffId: v }))}
              >
                <SelectTrigger data-ocid="advisor.staff.select">
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((m) => (
                    <SelectItem key={m.staffId} value={m.staffId}>
                      {m.name} — {m.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="advisor.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="advisor.save_button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
