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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowUpDown,
  Pencil,
  Plus,
  Printer,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface InvigilationEntry {
  id: string;
  courseCode: string;
  courseName: string;
  examDate: string;
  examTime: string;
  venue: string;
  chiefInvigilator: string;
  assistants: string;
  department: string;
  createdAt: string;
}

const STORAGE_KEY = "unipro_invigilation";

const DEMO_ENTRIES: InvigilationEntry[] = [
  {
    id: "inv-1",
    courseCode: "BIO 301",
    courseName: "Genetics II",
    examDate: "2025-03-15",
    examTime: "09:00",
    venue: "Exam Hall A",
    chiefInvigilator: "Dr. Amaka Okonkwo",
    assistants: "Mr. Suleiman Idris, Miss Fatima Bello",
    department: "Biology Education",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv-2",
    courseCode: "CSE 301",
    courseName: "Data Structures",
    examDate: "2025-03-16",
    examTime: "11:00",
    venue: "Exam Hall B",
    chiefInvigilator: "Prof. Emeka Chukwu",
    assistants: "Mr. Ade Balogun",
    department: "Computer Science Education",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv-3",
    courseCode: "MTH 201",
    courseName: "Linear Algebra",
    examDate: "2025-03-17",
    examTime: "14:00",
    venue: "Lecture Hall 3",
    chiefInvigilator: "Dr. Ngozi Eze",
    assistants: "Miss Chioma Agu, Mr. Ibrahim Musa",
    department: "Mathematics Education",
    createdAt: new Date().toISOString(),
  },
];

function getEntries(): InvigilationEntry[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    ) as InvigilationEntry[];
    return saved.length ? saved : DEMO_ENTRIES;
  } catch {
    return DEMO_ENTRIES;
  }
}

function saveEntries(entries: InvigilationEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const EMPTY_FORM: Omit<InvigilationEntry, "id" | "createdAt"> = {
  courseCode: "",
  courseName: "",
  examDate: "",
  examTime: "",
  venue: "",
  chiefInvigilator: "",
  assistants: "",
  department: "",
};

type SortField = keyof InvigilationEntry;

export default function InvigilationAssignmentTab() {
  const { currentUser, departments } = useApp();
  const isReadOnly =
    currentUser?.role === "Lecturer" || currentUser?.role === "Student";

  const [entries, setEntries] = useState<InvigilationEntry[]>(getEntries);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InvigilationEntry | null>(null);
  const [form, setForm] =
    useState<Omit<InvigilationEntry, "id" | "createdAt">>(EMPTY_FORM);
  const [clashWarning, setClashWarning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("examDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const hodDeptId = (currentUser as any)?.departmentId;

  function detectClash(
    form: Omit<InvigilationEntry, "id" | "createdAt">,
    excludeId?: string,
  ): string | null {
    const chief = form.chiefInvigilator.toLowerCase().trim();
    if (!chief || !form.examDate || !form.examTime) return null;
    const conflict = entries.find((e) => {
      if (excludeId && e.id === excludeId) return false;
      if (e.examDate !== form.examDate || e.examTime !== form.examTime)
        return false;
      const eChief = e.chiefInvigilator.toLowerCase().trim();
      const eAss = e.assistants.toLowerCase();
      if (eChief === chief) return true;
      const formAss = form.assistants.toLowerCase();
      const formNames = formAss
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const name of formNames) {
        if (eChief.includes(name) || eAss.includes(name)) return true;
      }
      return false;
    });
    if (conflict) {
      return `Clash detected: An invigilator is already assigned to ${conflict.courseCode} at ${conflict.examTime} on ${conflict.examDate}.`;
    }
    return null;
  }

  function handleFormChange(field: string, value: string) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    setClashWarning(detectClash(updated, editing?.id));
  }

  function handleOpen(entry?: InvigilationEntry) {
    if (entry) {
      setEditing(entry);
      setForm({
        courseCode: entry.courseCode,
        courseName: entry.courseName,
        examDate: entry.examDate,
        examTime: entry.examTime,
        venue: entry.venue,
        chiefInvigilator: entry.chiefInvigilator,
        assistants: entry.assistants,
        department: entry.department,
      });
    } else {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
    setClashWarning(null);
    setOpen(true);
  }

  function handleSave() {
    if (
      !form.courseCode ||
      !form.examDate ||
      !form.examTime ||
      !form.venue ||
      !form.chiefInvigilator
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    let updated: InvigilationEntry[];
    if (editing) {
      updated = entries.map((e) =>
        e.id === editing.id ? { ...e, ...form } : e,
      );
      toast.success("Invigilation entry updated.");
    } else {
      const newEntry: InvigilationEntry = {
        id: `inv-${Date.now()}`,
        ...form,
        createdAt: new Date().toISOString(),
      };
      updated = [newEntry, ...entries];
      toast.success("Invigilation entry added.");
    }
    setEntries(updated);
    saveEntries(updated);
    setOpen(false);
  }

  function handleDelete(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
    setDeleteId(null);
    toast.success("Entry removed.");
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  const filtered = useMemo(() => {
    let list = [...entries];
    if (hodDeptId && currentUser?.role === "HOD") {
      const deptName =
        departments.find((d) => String(d.id) === String(hodDeptId))?.name ?? "";
      if (deptName)
        list = list.filter((e) =>
          e.department.toLowerCase().includes(deptName.toLowerCase()),
        );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.courseCode.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.chiefInvigilator.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [
    entries,
    search,
    sortField,
    sortAsc,
    hodDeptId,
    currentUser,
    departments,
  ]);

  function handlePrint() {
    window.print();
  }

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="w-4 h-4 text-primary" />
            Exam Invigilation Assignment
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-3 h-3 mr-1" /> Print Schedule
            </Button>
            {!isReadOnly && (
              <Button
                size="sm"
                onClick={() => handleOpen()}
                data-ocid="invigilation.open_modal_button"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Entry
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search by course, venue, invigilator, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-ocid="invigilation.search_input"
          />
          <div className="overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortBtn field="courseCode" label="Course" />
                  </TableHead>
                  <TableHead>
                    <SortBtn field="examDate" label="Date" />
                  </TableHead>
                  <TableHead>
                    <SortBtn field="examTime" label="Time" />
                  </TableHead>
                  <TableHead>
                    <SortBtn field="venue" label="Venue" />
                  </TableHead>
                  <TableHead>
                    <SortBtn
                      field="chiefInvigilator"
                      label="Chief Invigilator"
                    />
                  </TableHead>
                  <TableHead>Assistants</TableHead>
                  <TableHead>
                    <SortBtn field="department" label="Department" />
                  </TableHead>
                  {!isReadOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                      data-ocid="invigilation.empty_state"
                    >
                      No invigilation entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry, i) => (
                    <TableRow
                      key={entry.id}
                      data-ocid={`invigilation.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        <div>{entry.courseCode}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.courseName}
                        </div>
                      </TableCell>
                      <TableCell>{entry.examDate}</TableCell>
                      <TableCell>{entry.examTime}</TableCell>
                      <TableCell>{entry.venue}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.chiefInvigilator}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {entry.assistants || (
                          <span className="italic">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{entry.department}</span>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleOpen(entry)}
                              data-ocid={`invigilation.edit_button.${i + 1}`}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(entry.id)}
                              data-ocid={`invigilation.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-ocid="invigilation.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} Invigilation Entry
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Course Code *</Label>
              <Input
                value={form.courseCode}
                onChange={(e) => handleFormChange("courseCode", e.target.value)}
                placeholder="e.g. BIO 301"
                data-ocid="invigilation.input"
              />
            </div>
            <div className="space-y-1">
              <Label>Course Name</Label>
              <Input
                value={form.courseName}
                onChange={(e) => handleFormChange("courseName", e.target.value)}
                placeholder="e.g. Genetics II"
              />
            </div>
            <div className="space-y-1">
              <Label>Exam Date *</Label>
              <Input
                type="date"
                value={form.examDate}
                onChange={(e) => handleFormChange("examDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Exam Time *</Label>
              <Input
                type="time"
                value={form.examTime}
                onChange={(e) => handleFormChange("examTime", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Venue *</Label>
              <Input
                value={form.venue}
                onChange={(e) => handleFormChange("venue", e.target.value)}
                placeholder="e.g. Exam Hall A"
              />
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => handleFormChange("department", e.target.value)}
                placeholder="e.g. Biology Education"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Chief Invigilator *</Label>
              <Input
                value={form.chiefInvigilator}
                onChange={(e) =>
                  handleFormChange("chiefInvigilator", e.target.value)
                }
                placeholder="Full name"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Assistant Invigilators</Label>
              <Input
                value={form.assistants}
                onChange={(e) => handleFormChange("assistants", e.target.value)}
                placeholder="Comma-separated names"
              />
            </div>
          </div>
          {clashWarning && (
            <div
              className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800"
              data-ocid="invigilation.error_state"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              {clashWarning}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="invigilation.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="invigilation.save_button">
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent data-ocid="invigilation.dialog">
          <DialogHeader>
            <DialogTitle>Delete Entry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently remove the invigilation assignment.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              data-ocid="invigilation.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="invigilation.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
