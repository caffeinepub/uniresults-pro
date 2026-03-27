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
import { DollarSign, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StudentFeeRecord } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

function feeStatusBadge(status: StudentFeeRecord["status"]) {
  if (status === "paid")
    return (
      <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
        Paid
      </Badge>
    );
  if (status === "partial")
    return (
      <Badge className="bg-warning/15 text-warning border-warning/30 hover:bg-warning/20">
        Partial
      </Badge>
    );
  return (
    <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20">
      Outstanding
    </Badge>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

export default function FeeManagementTab() {
  const { students, feeRecords, upsertFeeRecord, academicCalendars } = useApp();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<StudentFeeRecord | null>(null);

  const activeSession =
    academicCalendars.find((c) => c.isActive)?.session ?? "2024/2025";

  const [form, setForm] = useState({
    studentId: "",
    session: activeSession,
    tuitionAmount: "",
    amountPaid: "",
    paymentDate: "",
    notes: "",
  });

  // Build rows: one per student (latest fee record or none)
  const rows = useMemo(() => {
    return students.map((s) => {
      const rec = feeRecords
        .filter((f) => f.studentId === s.id)
        .sort((a, b) => a.session.localeCompare(b.session))
        .pop();
      return { student: s, rec };
    });
  }, [students, feeRecords]);

  const filtered = useMemo(() => {
    return rows.filter(({ student, rec }) => {
      const matchSearch =
        !search ||
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.matricNumber.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      const status = rec?.status ?? "outstanding";
      return status === statusFilter;
    });
  }, [rows, statusFilter, search]);

  function openAdd() {
    setEditRecord(null);
    setForm({
      studentId: "",
      session: activeSession,
      tuitionAmount: "150000",
      amountPaid: "",
      paymentDate: "",
      notes: "",
    });
    setOpen(true);
  }

  function openEdit(rec: StudentFeeRecord) {
    setEditRecord(rec);
    setForm({
      studentId: String(rec.studentId),
      session: rec.session,
      tuitionAmount: String(rec.tuitionAmount),
      amountPaid: String(rec.amountPaid),
      paymentDate: rec.paymentDate ?? "",
      notes: rec.notes ?? "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.studentId || !form.session || !form.tuitionAmount) {
      toast.error("Student, session, and tuition amount are required");
      return;
    }
    const tuition = Number(form.tuitionAmount);
    const paid = Number(form.amountPaid) || 0;
    let status: StudentFeeRecord["status"] = "outstanding";
    if (paid >= tuition) status = "paid";
    else if (paid > 0) status = "partial";
    const record: StudentFeeRecord = {
      id: editRecord?.id ?? BigInt(Date.now()),
      studentId: BigInt(form.studentId),
      session: form.session,
      tuitionAmount: tuition,
      amountPaid: paid,
      paymentDate: form.paymentDate || undefined,
      status,
      notes: form.notes || undefined,
    };
    upsertFeeRecord(record);
    setOpen(false);
    toast.success(editRecord ? "Fee record updated" : "Fee record added");
  }

  const summaryPaid = rows.filter((r) => r.rec?.status === "paid").length;
  const summaryPartial = rows.filter((r) => r.rec?.status === "partial").length;
  const summaryOutstanding = rows.filter(
    (r) => !r.rec || r.rec.status === "outstanding",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fee Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and manage student tuition fees for {activeSession}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Fully Paid</p>
          <p className="text-2xl font-bold text-success mt-1">{summaryPaid}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Partial</p>
          <p className="text-2xl font-bold text-warning mt-1">
            {summaryPartial}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            {summaryOutstanding}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            data-ocid="fee.search_input"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-ocid="fee.status.select" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="outstanding">Outstanding</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button data-ocid="fee.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Fee Record
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Student</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Tuition</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="fee.empty_state"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ student, rec }, i) => {
                const tuition = rec?.tuitionAmount ?? 0;
                const paid = rec?.amountPaid ?? 0;
                const balance = tuition - paid;
                const status = rec?.status ?? "outstanding";
                return (
                  <TableRow
                    key={String(student.id)}
                    data-ocid={`fee.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.matricNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {rec?.session ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tuition > 0 ? fmt(tuition) : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {paid > 0 ? fmt(paid) : "-"}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {balance > 0 ? (
                        <span className="text-destructive">{fmt(balance)}</span>
                      ) : tuition > 0 ? (
                        <span className="text-success">Cleared</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{feeStatusBadge(status)}</TableCell>
                    <TableCell className="text-sm">
                      {rec?.paymentDate ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        data-ocid={`fee.edit_button.${i + 1}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() =>
                          rec
                            ? openEdit(rec)
                            : (() => {
                                setEditRecord(null);
                                setForm({
                                  studentId: String(student.id),
                                  session: activeSession,
                                  tuitionAmount: "150000",
                                  amountPaid: "",
                                  paymentDate: "",
                                  notes: "",
                                });
                                setOpen(true);
                              })()
                        }
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        {rec ? "Edit" : "Add"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="fee.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              {editRecord ? "Edit Fee Record" : "Add Fee Record"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Student</Label>
              <Select
                value={form.studentId}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
                disabled={!!editRecord}
              >
                <SelectTrigger data-ocid="fee.student.select">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name} – {s.matricNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Session</Label>
                <Input
                  data-ocid="fee.session.input"
                  value={form.session}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, session: e.target.value }))
                  }
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <Label>Tuition Amount (₦)</Label>
                <Input
                  data-ocid="fee.tuition.input"
                  type="number"
                  value={form.tuitionAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tuitionAmount: e.target.value }))
                  }
                  placeholder="150000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount Paid (₦)</Label>
                <Input
                  data-ocid="fee.amount_paid.input"
                  type="number"
                  value={form.amountPaid}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amountPaid: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <Input
                  data-ocid="fee.payment_date.input"
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                data-ocid="fee.notes.textarea"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="fee.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="fee.save_button" onClick={handleSave}>
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
