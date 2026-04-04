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
import { Progress } from "@/components/ui/progress";
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
  CheckCircle,
  DollarSign,
  Edit,
  FileText,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface BudgetAllocation {
  id: string;
  departmentId: string;
  session: string;
  category: string;
  allocated: number;
  spent: number;
  status: "draft" | "proposed" | "approved" | "finalized";
  proposedBy?: string;
  approvedBy?: string;
}

const BUDGET_CATEGORIES = [
  "Personnel",
  "Equipment",
  "Library",
  "Research",
  "Admin",
  "Miscellaneous",
];

const SESSIONS = ["2024/2025", "2023/2024", "2022/2023"];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  proposed: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  finalized: "bg-green-100 text-green-800",
};

const LS_KEY = "unipro_budgets";

function loadBudgets(): BudgetAllocation[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveBudgets(data: BudgetAllocation[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export default function DepartmentBudgetTab() {
  const { currentUser, departments, logAudit } = useApp();
  const [budgets, setBudgetsState] = useState<BudgetAllocation[]>(loadBudgets);
  const [deptId, setDeptId] = useState("");
  const [session, setSession] = useState(SESSIONS[0]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BudgetAllocation | null>(null);
  const [form, setForm] = useState({ category: "", allocated: "", spent: "" });

  const role = currentUser?.role;
  const isAdmin = role === "SuperAdmin" || role === "Registrar";
  const isHOD = role === "HOD";
  const isDean = role === "Dean";

  function persist(data: BudgetAllocation[]) {
    setBudgetsState(data);
    saveBudgets(data);
  }

  const filtered = useMemo(
    () =>
      budgets.filter(
        (b) => (!deptId || b.departmentId === deptId) && b.session === session,
      ),
    [budgets, deptId, session],
  );

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, b) => ({
          allocated: acc.allocated + b.allocated,
          spent: acc.spent + b.spent,
        }),
        { allocated: 0, spent: 0 },
      ),
    [filtered],
  );

  function openAdd() {
    setEditItem(null);
    setForm({ category: BUDGET_CATEGORIES[0], allocated: "", spent: "0" });
    setShowForm(true);
  }

  function openEdit(item: BudgetAllocation) {
    setEditItem(item);
    setForm({
      category: item.category,
      allocated: String(item.allocated),
      spent: String(item.spent),
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.category || !form.allocated) {
      toast.error("Please fill in all fields");
      return;
    }
    const allocated = Number.parseFloat(form.allocated);
    const spent = Number.parseFloat(form.spent) || 0;
    if (Number.isNaN(allocated) || allocated < 0) {
      toast.error("Enter a valid allocation amount");
      return;
    }
    const targetDept = deptId || String(departments[0]?.id ?? "");
    if (editItem) {
      const updated = budgets.map((b) =>
        b.id === editItem.id
          ? { ...b, category: form.category, allocated, spent }
          : b,
      );
      persist(updated);
      logAudit(
        currentUser?.name ?? "",
        role ?? "",
        "Budget Updated",
        `Updated ${form.category} budget`,
      );
      toast.success("Budget updated");
    } else {
      const newItem: BudgetAllocation = {
        id: Date.now().toString(),
        departmentId: targetDept,
        session,
        category: form.category,
        allocated,
        spent,
        status: isHOD ? "proposed" : "draft",
        proposedBy: currentUser?.name,
      };
      persist([...budgets, newItem]);
      logAudit(
        currentUser?.name ?? "",
        role ?? "",
        "Budget Added",
        `Added ${form.category} budget ₦${allocated}`,
      );
      toast.success("Budget allocation added");
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persist(budgets.filter((b) => b.id !== id));
    toast.success("Allocation removed");
  }

  function handleApprove(id: string) {
    const updated = budgets.map((b) => {
      if (b.id !== id) return b;
      const newStatus =
        isDean && b.status === "proposed"
          ? "approved"
          : isAdmin && b.status === "approved"
            ? "finalized"
            : b.status;
      return {
        ...b,
        status: newStatus as BudgetAllocation["status"],
        approvedBy: currentUser?.name,
      };
    });
    persist(updated);
    toast.success("Status updated");
  }

  function handlePrint() {
    window.print();
  }

  const deptName = (id: string) =>
    departments.find((d) => String(d.id) === id)?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Departmental Budget Management
          </h2>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          {(isHOD || isAdmin) && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> Add Allocation
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 no-print">
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            {SESSIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={deptId} onValueChange={setDeptId}>
          <SelectTrigger className="w-56">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Allocated</p>
            <p className="text-2xl font-bold text-primary">
              ₦{totals.allocated.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-destructive">
              ₦{totals.spent.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold text-green-600">
              ₦{(totals.allocated - totals.spent).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Budget Allocations — {session}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Allocated (₦)</TableHead>
                  <TableHead>Spent (₦)</TableHead>
                  <TableHead>Balance (₦)</TableHead>
                  <TableHead>Usage</TableHead>
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
                      No budget allocations yet. Click "Add Allocation" to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => {
                    const balance = b.allocated - b.spent;
                    const pct =
                      b.allocated > 0
                        ? Math.min(100, (b.spent / b.allocated) * 100)
                        : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs">
                          {deptName(b.departmentId)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {b.category}
                        </TableCell>
                        <TableCell>{b.allocated.toLocaleString()}</TableCell>
                        <TableCell>{b.spent.toLocaleString()}</TableCell>
                        <TableCell
                          className={
                            balance < 0
                              ? "text-destructive font-bold"
                              : "text-green-600"
                          }
                        >
                          {balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs">{pct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status]}`}
                          >
                            {b.status.charAt(0).toUpperCase() +
                              b.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="no-print">
                          <div className="flex gap-1">
                            {(isAdmin || isHOD) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(b)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {((isDean && b.status === "proposed") ||
                              (isAdmin && b.status === "approved")) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleApprove(b.id)}
                              >
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(b.id)}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {filtered.length > 0 && (
                  <TableRow className="font-bold bg-muted/30">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell>₦{totals.allocated.toLocaleString()}</TableCell>
                    <TableCell>₦{totals.spent.toLocaleString()}</TableCell>
                    <TableCell
                      className={
                        totals.allocated - totals.spent < 0
                          ? "text-destructive"
                          : "text-green-600"
                      }
                    >
                      ₦{(totals.allocated - totals.spent).toLocaleString()}
                    </TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Budget Allocation" : "Add Budget Allocation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editItem && (
              <div>
                <Label>Department</Label>
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={String(d.id)} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Allocated Amount (₦)</Label>
              <Input
                type="number"
                value={form.allocated}
                onChange={(e) =>
                  setForm({ ...form, allocated: e.target.value })
                }
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <Label>Amount Spent (₦)</Label>
              <Input
                type="number"
                value={form.spent}
                onChange={(e) => setForm({ ...form, spent: e.target.value })}
                placeholder="e.g. 120000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
