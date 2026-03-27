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
import { Switch } from "@/components/ui/switch";
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
  Building2,
  CheckCircle2,
  ClipboardList,
  Edit,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type SIWESRecord, useApp } from "../../context/AppContext";

const STATUS_COLORS: Record<SIWESRecord["status"], string> = {
  "Pending Placement": "bg-muted text-muted-foreground",
  Placed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Active: "bg-success/20 text-success",
  Completed: "bg-primary/20 text-primary",
  Failed: "bg-destructive/20 text-destructive",
};

const EMPTY_RECORD: Omit<SIWESRecord, "id"> = {
  studentId: BigInt(0),
  session: "2024/2025",
  companyName: "",
  supervisorName: "",
  supervisorPhone: "",
  location: "",
  startDate: "",
  endDate: "",
  status: "Pending Placement",
  logBookSubmitted: false,
  supervisorScore: null,
  coordinatorComment: "",
};

function StatCard({
  label,
  value,
  color,
}: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border border-border p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function SIWESManagementTab({
  readOnly = false,
}: { readOnly?: boolean }) {
  const {
    siwesRecords,
    addSIWESRecord,
    updateSIWESRecord,
    students,
    departments,
    currentUser,
  } = useApp();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SIWESRecord | null>(null);
  const [form, setForm] = useState<Omit<SIWESRecord, "id">>(EMPTY_RECORD);

  const scienceDepts = departments.filter((d) =>
    [25, 26, 27, 28, 29].includes(Number((d as any).id)),
  );

  const sessions = [...new Set(siwesRecords.map((r) => r.session))];

  const filtered = siwesRecords.filter((r) => {
    const student = students.find((s) => String(s.id) === String(r.studentId));
    if (!student) return false;
    if (
      search &&
      !student.name.toLowerCase().includes(search.toLowerCase()) &&
      !student.matricNumber.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterDept !== "all" && String(student.departmentId) !== filterDept)
      return false;
    if (filterSession !== "all" && r.session !== filterSession) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: siwesRecords.length,
    placed: siwesRecords.filter((r) => r.status === "Placed").length,
    active: siwesRecords.filter((r) => r.status === "Active").length,
    completed: siwesRecords.filter((r) => r.status === "Completed").length,
    failed: siwesRecords.filter((r) => r.status === "Failed").length,
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_RECORD);
    setModalOpen(true);
  };

  const openEdit = (rec: SIWESRecord) => {
    setEditing(rec);
    setForm({ ...rec });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.companyName || form.studentId === BigInt(0)) {
      toast.error("Student and Company are required.");
      return;
    }
    if (editing) {
      updateSIWESRecord({ ...editing, ...form });
      toast.success("SIWES record updated.");
    } else {
      addSIWESRecord({ ...form, id: BigInt(Date.now()) });
      toast.success("SIWES placement added.");
    }
    setModalOpen(false);
  };

  // For student-only view: filter to their records
  const studentRecords =
    readOnly && currentUser
      ? siwesRecords.filter((r) => {
          const me = students.find(
            (s) => s.userPrincipal === currentUser.principal,
          );
          return me && String(r.studentId) === String(me.id);
        })
      : filtered;

  const displayRecords = readOnly ? studentRecords : filtered;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            SIWES Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Students Industrial Work Experience Scheme
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openAdd} data-ocid="siwes.primary_button">
            <Plus className="w-4 h-4 mr-2" />
            Add Placement
          </Button>
        )}
      </div>

      {/* Stats */}
      {!readOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            label="Total Registered"
            value={stats.total}
            color="bg-card"
          />
          <StatCard
            label="Placed"
            value={stats.placed}
            color="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard label="Active" value={stats.active} color="bg-success/10" />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="bg-primary/10"
          />
          <StatCard
            label="Failed"
            value={stats.failed}
            color="bg-destructive/10"
          />
        </div>
      )}

      {/* Filters */}
      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="siwes.search_input"
              className="pl-8 w-52"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48" data-ocid="siwes.select">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {scienceDepts.map((d) => (
                <SelectItem key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSession} onValueChange={setFilterSession}>
            <SelectTrigger className="w-40" data-ocid="siwes.select">
              <SelectValue placeholder="All Sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44" data-ocid="siwes.select">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {[
                "Pending Placement",
                "Placed",
                "Active",
                "Completed",
                "Failed",
              ].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      {displayRecords.length > 0 ? (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="siwes.table"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Student Name</TableHead>
                  {!readOnly && <TableHead>Department</TableHead>}
                  <TableHead>Company</TableHead>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Log Book</TableHead>
                  <TableHead>Score</TableHead>
                  {!readOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRecords.map((rec, idx) => {
                  const student = students.find(
                    (s) => String(s.id) === String(rec.studentId),
                  );
                  const dept = departments.find(
                    (d) => String(d.id) === String(student?.departmentId),
                  );
                  return (
                    <TableRow
                      key={String(rec.id)}
                      data-ocid={`siwes.item.${idx + 1}`}
                    >
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {student?.matricNumber ?? "—"}
                      </TableCell>
                      <TableCell>{student?.name ?? "Unknown"}</TableCell>
                      {!readOnly && (
                        <TableCell className="text-xs">
                          {dept?.name ?? "—"}
                        </TableCell>
                      )}
                      <TableCell className="text-xs">
                        {rec.companyName || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {rec.supervisorName || "—"}
                      </TableCell>
                      <TableCell className="text-xs">{rec.session}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rec.status]}`}
                        >
                          {rec.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rec.logBookSubmitted ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rec.supervisorScore !== null ? (
                          <span className="font-mono text-sm">
                            {rec.supervisorScore}/100
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`siwes.edit_button.${idx + 1}`}
                            onClick={() => openEdit(rec)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="siwes.empty_state"
        >
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {readOnly
              ? "No SIWES placement record found for you."
              : 'No SIWES records yet. Click "Add Placement" to begin.'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg" data-ocid="siwes.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit SIWES Placement" : "Add SIWES Placement"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Student</Label>
                <Select
                  value={String(form.studentId)}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, studentId: BigInt(v) }))
                  }
                >
                  <SelectTrigger data-ocid="siwes.select">
                    <SelectValue placeholder="Select student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students
                      .filter((s) =>
                        [25, 26, 27, 28, 29].includes(Number(s.departmentId)),
                      )
                      .map((s) => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          {s.matricNumber} — {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Session</Label>
                <Input
                  data-ocid="siwes.input"
                  value={form.session}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, session: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      status: v as SIWESRecord["status"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="siwes.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Pending Placement",
                      "Placed",
                      "Active",
                      "Completed",
                      "Failed",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Company Name</Label>
                <Input
                  data-ocid="siwes.input"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Supervisor Name</Label>
                <Input
                  data-ocid="siwes.input"
                  value={form.supervisorName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supervisorName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Supervisor Phone</Label>
                <Input
                  data-ocid="siwes.input"
                  value={form.supervisorPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supervisorPhone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Location / Address</Label>
                <Input
                  data-ocid="siwes.input"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  data-ocid="siwes.input"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  type="date"
                  data-ocid="siwes.input"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Supervisor Score (/100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  data-ocid="siwes.input"
                  value={form.supervisorScore ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      supervisorScore: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Switch
                  data-ocid="siwes.switch"
                  checked={form.logBookSubmitted}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, logBookSubmitted: v }))
                  }
                />
                <Label>Log Book Submitted</Label>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Coordinator Comment</Label>
                <Textarea
                  data-ocid="siwes.textarea"
                  value={form.coordinatorComment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      coordinatorComment: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="siwes.cancel_button"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} data-ocid="siwes.save_button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StudentSIWESTab() {
  return <SIWESManagementTab readOnly />;
}
