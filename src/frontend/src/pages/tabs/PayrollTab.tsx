import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Download, Plus, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  gradeLevel: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  medicalAllowance: number;
  netPay: number;
  month: string;
  year: string;
  status: "paid" | "pending" | "processing";
}

function getPayroll(): PayrollRecord[] {
  try {
    return JSON.parse(localStorage.getItem("payrollRecords") || "[]");
  } catch {
    return [];
  }
}
function savePayroll(r: PayrollRecord[]) {
  localStorage.setItem("payrollRecords", JSON.stringify(r));
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fmt(n: number) {
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

export default function PayrollTab() {
  const { staffMembers, departments } = useApp();
  const [records, setRecords] = useState<PayrollRecord[]>(getPayroll);
  const [open, setOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [filterDept, setFilterDept] = useState("all");
  const [form, setForm] = useState({
    staffId: "",
    gradeLevel: "GL-10",
    basicSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    medicalAllowance: "",
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
  });

  const years = useMemo(() => {
    const s = new Set(records.map((r) => r.year));
    s.add(new Date().getFullYear().toString());
    return Array.from(s).sort().reverse();
  }, [records]);

  function handleAdd() {
    if (!form.staffId || !form.basicSalary) {
      toast.error("Staff and basic salary are required");
      return;
    }
    const staff = staffMembers.find((s) => s.staffId === form.staffId);
    if (!staff) return;
    const dept = departments.find(
      (d) => String(d.id) === String(staff.departmentId),
    );
    const basic = Number.parseFloat(form.basicSalary) || 0;
    const housing = Number.parseFloat(form.housingAllowance) || 0;
    const transport = Number.parseFloat(form.transportAllowance) || 0;
    const medical = Number.parseFloat(form.medicalAllowance) || 0;
    const rec: PayrollRecord = {
      id: `pay-${Date.now()}`,
      staffId: form.staffId,
      staffName: staff.name,
      department: dept?.name ?? "N/A",
      gradeLevel: form.gradeLevel,
      basicSalary: basic,
      housingAllowance: housing,
      transportAllowance: transport,
      medicalAllowance: medical,
      netPay: basic + housing + transport + medical,
      month: form.month,
      year: form.year,
      status: "pending",
    };
    const updated = [rec, ...records];
    savePayroll(updated);
    setRecords(updated);
    setOpen(false);
    toast.success("Payroll record added");
  }

  const filtered = records.filter((r) => {
    if (filterMonth !== "all" && r.month !== filterMonth) return false;
    if (filterYear && r.year !== filterYear) return false;
    if (filterDept !== "all" && r.department !== filterDept) return false;
    return true;
  });

  const totalNet = filtered.reduce((s, r) => s + r.netPay, 0);

  function exportCSV() {
    const header =
      "S/N,Name,Department,Grade Level,Basic,Housing,Transport,Medical,Net Pay,Month,Year,Status";
    const rows = filtered.map(
      (r, i) =>
        `${i + 1},"${r.staffName}","${r.department}",${r.gradeLevel},${r.basicSalary},${r.housingAllowance},${r.transportAllowance},${r.medicalAllowance},${r.netPay},${r.month},${r.year},${r.status}`,
    );
    const blob = new Blob([`${header}\n${rows.join("\n")}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payroll_${filterMonth}_${filterYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function markPaid(id: string) {
    const updated = records.map((r) =>
      r.id === id ? { ...r, status: "paid" as const } : r,
    );
    savePayroll(updated);
    setRecords(updated);
    toast.success("Marked as paid");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Staff Payroll</h1>
          <p className="text-sm text-muted-foreground">
            Total Net Pay ({filterMonth === "all" ? "All months" : filterMonth}{" "}
            {filterYear}): <strong>{fmt(totalNet)}</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            data-ocid="payroll.upload_button"
          >
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="payroll.secondary_button"
          >
            <Printer className="w-3 h-3 mr-1" /> Print
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                data-ocid="payroll.open_modal_button"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Record
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="payroll.dialog">
              <DialogHeader>
                <DialogTitle>Add Payroll Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Staff Member</Label>
                  <Select
                    value={form.staffId}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, staffId: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select staff..." />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((s) => (
                        <SelectItem key={s.staffId} value={s.staffId}>
                          {s.name} — {s.staffId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Grade Level</Label>
                    <Select
                      value={form.gradeLevel}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, gradeLevel: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "GL-07",
                          "GL-08",
                          "GL-09",
                          "GL-10",
                          "GL-12",
                          "GL-13",
                          "GL-14",
                          "GL-15",
                        ].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Month</Label>
                    <Select
                      value={form.month}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, month: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Basic Salary (₦)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={form.basicSalary}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, basicSalary: e.target.value }))
                      }
                      placeholder="e.g. 150000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Housing Allowance (₦)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={form.housingAllowance}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          housingAllowance: e.target.value,
                        }))
                      }
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Transport Allowance (₦)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={form.transportAllowance}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          transportAllowance: e.target.value,
                        }))
                      }
                      placeholder="e.g. 20000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Medical Allowance (₦)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={form.medicalAllowance}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          medicalAllowance: e.target.value,
                        }))
                      }
                      placeholder="e.g. 15000"
                    />
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <strong>
                    Net Pay:{" "}
                    {fmt(
                      (Number.parseFloat(form.basicSalary) || 0) +
                        (Number.parseFloat(form.housingAllowance) || 0) +
                        (Number.parseFloat(form.transportAllowance) || 0) +
                        (Number.parseFloat(form.medicalAllowance) || 0),
                    )}
                  </strong>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="payroll.cancel_button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="payroll.confirm_button"
                  className="bg-primary text-primary-foreground"
                  onClick={handleAdd}
                >
                  Add Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S/N</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Basic</TableHead>
              <TableHead>Allowances</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="payroll.empty_state"
                >
                  No payroll records found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r, i) => (
              <TableRow key={r.id} data-ocid={`payroll.item.${i + 1}`}>
                <TableCell className="text-muted-foreground text-sm">
                  {i + 1}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {r.staffName}
                </TableCell>
                <TableCell className="text-sm">{r.department}</TableCell>
                <TableCell className="text-xs">{r.gradeLevel}</TableCell>
                <TableCell className="text-sm">{fmt(r.basicSalary)}</TableCell>
                <TableCell className="text-sm">
                  {fmt(
                    r.housingAllowance +
                      r.transportAllowance +
                      r.medicalAllowance,
                  )}
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {fmt(r.netPay)}
                </TableCell>
                <TableCell className="text-xs">
                  {r.month} {r.year}
                </TableCell>
                <TableCell>
                  {r.status === "paid" ? (
                    <Badge className="bg-success/15 text-success border-success/30 text-xs">
                      Paid
                    </Badge>
                  ) : r.status === "processing" ? (
                    <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">
                      Processing
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground text-xs">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => markPaid(r.id)}
                      data-ocid={`payroll.confirm_button.${i + 1}`}
                    >
                      Mark Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
