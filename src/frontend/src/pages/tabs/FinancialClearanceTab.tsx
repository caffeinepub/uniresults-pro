import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  DollarSign,
  Download,
  Pencil,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getStudentDepartment, useApp } from "../../context/AppContext";

const FEE_ITEMS = [
  { key: "tuition", label: "Tuition Fee", defaultAmount: 150000 },
  { key: "acceptance", label: "Acceptance Fee", defaultAmount: 20000 },
  { key: "accommodation", label: "Accommodation Fee", defaultAmount: 40000 },
  { key: "library", label: "Library Levy", defaultAmount: 5000 },
  { key: "studentUnion", label: "Student Union Due", defaultAmount: 3000 },
  { key: "medical", label: "Medical Fee", defaultAmount: 10000 },
] as const;

type FeeItemKey = (typeof FEE_ITEMS)[number]["key"];

interface StudentFeeDetail {
  studentId: string;
  session: string;
  items: Record<FeeItemKey, boolean>;
}

const LS_KEY = "unirp_financial_clearance";

function loadFeeDetails(): StudentFeeDetail[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveFeeDetails(data: StudentFeeDetail[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getOrCreateDetail(
  all: StudentFeeDetail[],
  studentId: string,
  session: string,
): StudentFeeDetail {
  return (
    all.find((d) => d.studentId === studentId && d.session === session) ?? {
      studentId,
      session,
      items: {
        tuition: false,
        acceptance: false,
        accommodation: false,
        library: false,
        studentUnion: false,
        medical: false,
      },
    }
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

function calcOutstanding(items: Record<FeeItemKey, boolean>) {
  return FEE_ITEMS.reduce(
    (sum, f) => (items[f.key] ? sum : sum + f.defaultAmount),
    0,
  );
}

function calcPaid(items: Record<FeeItemKey, boolean>) {
  return FEE_ITEMS.reduce(
    (sum, f) => (items[f.key] ? sum + f.defaultAmount : sum),
    0,
  );
}

type SortDir = "asc" | "desc";

export function useHasOutstandingFees(
  studentId: string | undefined,
  session: string | undefined,
): boolean {
  if (!studentId || !session) return false;
  const all = loadFeeDetails();
  const detail = getOrCreateDetail(all, studentId, session);
  return calcOutstanding(detail.items) > 0;
}

export default function FinancialClearanceTab() {
  const { students, departments, academicCalendars } = useApp();
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSession =
    activeCalendar?.session ??
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const [feeDetails, setFeeDetails] = useState<StudentFeeDetail[]>(() =>
    loadFeeDetails(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "outstanding"
  >("all");
  const [editStudent, setEditStudent] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function SortIcon({ c }: { c: string }) {
    if (sortCol !== c)
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    );
  }

  const rowData = useMemo(() => {
    return students.map((s) => {
      const dept = getStudentDepartment(s, departments);
      const detail = getOrCreateDetail(feeDetails, String(s.id), activeSession);
      const outstanding = calcOutstanding(detail.items);
      const paid = calcPaid(detail.items);
      return { student: s, dept, detail, outstanding, paid };
    });
  }, [students, departments, feeDetails, activeSession]);

  const filtered = useMemo(() => {
    let rows = rowData;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.student.name.toLowerCase().includes(q) ||
          r.student.matricNumber.toLowerCase().includes(q),
      );
    }
    if (deptFilter !== "all")
      rows = rows.filter((r) => String(r.student.departmentId) === deptFilter);
    if (statusFilter === "paid") rows = rows.filter((r) => r.outstanding === 0);
    if (statusFilter === "outstanding")
      rows = rows.filter((r) => r.outstanding > 0);
    return [...rows].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      if (sortCol === "name") {
        va = a.student.name;
        vb = b.student.name;
      } else if (sortCol === "dept") {
        va = a.dept?.name ?? "";
        vb = b.dept?.name ?? "";
      } else if (sortCol === "outstanding") {
        va = a.outstanding;
        vb = b.outstanding;
      } else {
        va = a.paid;
        vb = b.paid;
      }
      if (typeof va === "string" && typeof vb === "string")
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
  }, [rowData, searchTerm, deptFilter, statusFilter, sortCol, sortDir]);

  function updateItem(studentId: string, key: FeeItemKey, paid: boolean) {
    setFeeDetails((prev) => {
      const all = [...prev];
      const idx = all.findIndex(
        (d) => d.studentId === studentId && d.session === activeSession,
      );
      const detail = getOrCreateDetail(all, studentId, activeSession);
      const updated = { ...detail, items: { ...detail.items, [key]: paid } };
      if (idx >= 0) all[idx] = updated;
      else all.push(updated);
      saveFeeDetails(all);
      return all;
    });
  }

  function bulkMarkPaid() {
    if (selectedRows.size === 0) return;
    setFeeDetails((prev) => {
      const all = [...prev];
      for (const studentId of selectedRows) {
        const idx = all.findIndex(
          (d) => d.studentId === studentId && d.session === activeSession,
        );
        const allPaid: Record<FeeItemKey, boolean> = {
          tuition: true,
          acceptance: true,
          accommodation: true,
          library: true,
          studentUnion: true,
          medical: true,
        };
        const updated = { studentId, session: activeSession, items: allPaid };
        if (idx >= 0) all[idx] = updated;
        else all.push(updated);
      }
      saveFeeDetails(all);
      return all;
    });
    toast.success(`Marked ${selectedRows.size} student(s) as fully paid`);
    setSelectedRows(new Set());
  }

  function exportCSV() {
    const header =
      "S/N,Matric No,Name,Department,Session,Tuition,Acceptance,Accommodation,Library,Student Union,Medical,Outstanding";
    const rows = filtered.map((r, i) =>
      [
        i + 1,
        r.student.matricNumber,
        `"${r.student.name}"`,
        `"${r.dept?.name ?? ""}"`,
        r.detail.session,
        r.detail.items.tuition ? "Paid" : "Unpaid",
        r.detail.items.acceptance ? "Paid" : "Unpaid",
        r.detail.items.accommodation ? "Paid" : "Unpaid",
        r.detail.items.library ? "Paid" : "Unpaid",
        r.detail.items.studentUnion ? "Paid" : "Unpaid",
        r.detail.items.medical ? "Paid" : "Unpaid",
        fmt(r.outstanding),
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_clearance_${activeSession.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  const editRow = editStudent
    ? rowData.find((r) => String(r.student.id) === editStudent)
    : null;

  const totalOutstanding = filtered.reduce((s, r) => s + r.outstanding, 0);
  const clearedCount = filtered.filter((r) => r.outstanding === 0).length;

  return (
    <div className="space-y-5" data-ocid="financial_clearance.page">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Financial Clearance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track and manage student fee payments for {activeSession}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Students</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="bg-card border border-success/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Fully Cleared</p>
          <p className="text-2xl font-bold text-success">{clearedCount}</p>
        </div>
        <div className="bg-card border border-destructive/30 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-lg font-bold text-destructive">
            {fmt(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap gap-2 items-end p-4 bg-muted/20 rounded-xl border border-border/50">
        <div className="space-y-1">
          <Label className="text-xs">Search</Label>
          <Input
            className="h-8 text-xs w-48"
            placeholder="Name or matric..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-ocid="financial_clearance.search_input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger
              className="h-8 text-xs w-44"
              data-ocid="financial_clearance.dept.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "paid" | "outstanding")
            }
          >
            <SelectTrigger
              className="h-8 text-xs w-36"
              data-ocid="financial_clearance.status.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Fully Paid</SelectItem>
              <SelectItem value="outstanding">Outstanding</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          {selectedRows.size > 0 && (
            <Button
              size="sm"
              onClick={bulkMarkPaid}
              data-ocid="financial_clearance.primary_button"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark {selectedRows.size} as Paid
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            data-ocid="financial_clearance.download_button"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    selectedRows.size === filtered.length && filtered.length > 0
                  }
                  onCheckedChange={(v) => {
                    if (v)
                      setSelectedRows(
                        new Set(filtered.map((r) => String(r.student.id))),
                      );
                    else setSelectedRows(new Set());
                  }}
                  data-ocid="financial_clearance.checkbox"
                />
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("name")}
                >
                  Name <SortIcon c="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("dept")}
                >
                  Department <SortIcon c="dept" />
                </button>
              </TableHead>
              <TableHead>Tuition</TableHead>
              <TableHead>Acceptance</TableHead>
              <TableHead>Accomm.</TableHead>
              <TableHead>Library</TableHead>
              <TableHead>S.Union</TableHead>
              <TableHead>Medical</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("outstanding")}
                >
                  Outstanding <SortIcon c="outstanding" />
                </button>
              </TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-10 text-muted-foreground"
                  data-ocid="financial_clearance.empty_state"
                >
                  No students found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row, i) => (
              <TableRow
                key={String(row.student.id)}
                data-ocid={`financial_clearance.item.${i + 1}`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(String(row.student.id))}
                    onCheckedChange={(v) => {
                      setSelectedRows((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(String(row.student.id));
                        else next.delete(String(row.student.id));
                        return next;
                      });
                    }}
                    data-ocid={`financial_clearance.checkbox.${i + 1}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{row.student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.student.matricNumber}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {row.dept?.name ?? "—"}
                </TableCell>
                {FEE_ITEMS.map((f) => (
                  <TableCell key={f.key}>
                    {row.detail.items[f.key] ? (
                      <Badge className="bg-success/15 text-success border-success/30 text-xs">
                        Paid
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                        Unpaid
                      </Badge>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <span
                    className={`text-xs font-semibold ${row.outstanding > 0 ? "text-destructive" : "text-success"}`}
                  >
                    {row.outstanding > 0 ? fmt(row.outstanding) : "Cleared"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => setEditStudent(String(row.student.id))}
                    data-ocid={`financial_clearance.edit_button.${i + 1}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editStudent}
        onOpenChange={(v) => !v && setEditStudent(null)}
      >
        <DialogContent data-ocid="financial_clearance.dialog">
          <DialogHeader>
            <DialogTitle>
              Edit Fee Payment — {editRow?.student.name}
            </DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Session: {activeSession}
              </p>
              <div className="space-y-2">
                {FEE_ITEMS.map((f) => (
                  <div
                    key={f.key}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(f.defaultAmount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {editRow.detail.items[f.key] ? "Paid" : "Unpaid"}
                      </span>
                      <Checkbox
                        checked={editRow.detail.items[f.key]}
                        onCheckedChange={(v) =>
                          updateItem(String(editRow.student.id), f.key, !!v)
                        }
                        data-ocid={`financial_clearance.${f.key}.checkbox`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 font-semibold text-sm">
                <span>Total Outstanding</span>
                <span
                  className={
                    calcOutstanding(editRow.detail.items) > 0
                      ? "text-destructive"
                      : "text-success"
                  }
                >
                  {fmt(calcOutstanding(editRow.detail.items))}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setEditStudent(null)}
              data-ocid="financial_clearance.close_button"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FeesOutstandingBanner() {
  const { currentUser, students, academicCalendars } = useApp();
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSession = activeCalendar?.session;
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  if (!me || !activeSession) return null;

  const all = loadFeeDetails();
  const detail = getOrCreateDetail(all, String(me.id), activeSession);
  const outstanding = calcOutstanding(detail.items);

  if (outstanding <= 0) return null;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30"
      data-ocid="fees_banner.error_state"
    >
      <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-destructive">
          Outstanding Fees: {fmt(outstanding)}
        </p>
        <p className="text-xs text-destructive/80 mt-0.5">
          You have unpaid fees for {activeSession}. Please visit the Bursary to
          make payment.
        </p>
      </div>
    </div>
  );
}
