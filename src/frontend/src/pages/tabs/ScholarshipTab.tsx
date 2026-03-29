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
  Award,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface ScholarshipRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricNo: string;
  type:
    | "Government Loan"
    | "Bursary Award"
    | "External Scholarship"
    | "Internal Award";
  amount: number;
  session: string;
  status: "Active" | "Completed" | "Pending";
  awardDate: string;
}

const LS_KEY = "unirp_scholarships";

function getRecords(): ScholarshipRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecords(list: ScholarshipRecord[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

const DEMO: ScholarshipRecord[] = [
  {
    id: "s1",
    studentId: "1",
    studentName: "Amaka Okonkwo",
    matricNo: "BIO/2023/001",
    type: "Government Loan",
    amount: 150000,
    session: "2024/2025",
    status: "Active",
    awardDate: "2024-10-01",
  },
  {
    id: "s2",
    studentId: "2",
    studentName: "Tunde Adeyemi",
    matricNo: "CSE/2023/002",
    type: "Bursary Award",
    amount: 80000,
    session: "2024/2025",
    status: "Completed",
    awardDate: "2024-09-15",
  },
  {
    id: "s3",
    studentId: "3",
    studentName: "Fatima Bello",
    matricNo: "CHE/2022/005",
    type: "External Scholarship",
    amount: 500000,
    session: "2024/2025",
    status: "Active",
    awardDate: "2024-08-20",
  },
  {
    id: "s4",
    studentId: "4",
    studentName: "Emeka Nwosu",
    matricNo: "CSE/2022/010",
    type: "Internal Award",
    amount: 50000,
    session: "2023/2024",
    status: "Completed",
    awardDate: "2023-10-05",
  },
];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800 border-green-200",
  Completed: "bg-blue-100 text-blue-800 border-blue-200",
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const TYPE_COLORS: Record<string, string> = {
  "Government Loan": "bg-purple-100 text-purple-800",
  "Bursary Award": "bg-orange-100 text-orange-800",
  "External Scholarship": "bg-teal-100 text-teal-800",
  "Internal Award": "bg-pink-100 text-pink-800",
};

const BLANK: Omit<ScholarshipRecord, "id"> = {
  studentId: "",
  studentName: "",
  matricNo: "",
  type: "Government Loan",
  amount: 0,
  session: "2024/2025",
  status: "Pending",
  awardDate: new Date().toISOString().split("T")[0],
};

export default function ScholarshipTab() {
  const { logAudit, currentUser } = useApp();
  const [records, setRecords] = useState<ScholarshipRecord[]>(() => {
    const saved = getRecords();
    if (saved.length === 0) {
      saveRecords(DEMO);
      return DEMO;
    }
    return saved;
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScholarshipRecord | null>(null);
  const [form, setForm] = useState<Omit<ScholarshipRecord, "id">>(BLANK);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] =
    useState<keyof ScholarshipRecord>("studentName");
  const [sortAsc, setSortAsc] = useState(true);

  function openAdd() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }

  function openEdit(rec: ScholarshipRecord) {
    setEditing(rec);
    setForm({
      studentId: rec.studentId,
      studentName: rec.studentName,
      matricNo: rec.matricNo,
      type: rec.type,
      amount: rec.amount,
      session: rec.session,
      status: rec.status,
      awardDate: rec.awardDate,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.studentName || !form.matricNo) {
      toast.error("Student name and matric number are required");
      return;
    }
    let updated: ScholarshipRecord[];
    if (editing) {
      updated = records.map((r) =>
        r.id === editing.id ? { ...editing, ...form } : r,
      );
      toast.success("Scholarship record updated");
    } else {
      const newRec: ScholarshipRecord = { id: `s${Date.now()}`, ...form };
      updated = [newRec, ...records];
      toast.success("Scholarship record added");
    }
    setRecords(updated);
    saveRecords(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      currentUser?.role ?? "Admin",
      editing ? "Update Scholarship" : "Add Scholarship",
      `Student: ${form.studentName}`,
    );
    setOpen(false);
  }

  function handleDelete(id: string) {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
    toast.success("Record deleted");
  }

  function handleSort(key: keyof ScholarshipRecord) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filtered = records
    .filter((r) => {
      const q = search.toLowerCase();
      if (
        q &&
        !r.studentName.toLowerCase().includes(q) &&
        !r.matricNo.toLowerCase().includes(q)
      )
        return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);
  const SortIcon = ({ k }: { k: keyof ScholarshipRecord }) =>
    sortKey === k ? (
      sortAsc ? (
        <ChevronUp className="inline w-3 h-3" />
      ) : (
        <ChevronDown className="inline w-3 h-3" />
      )
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Scholarships & Loans</h2>
        </div>
        <Button
          data-ocid="scholarship.primary_button"
          onClick={openAdd}
          className="h-10"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Award
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">{records.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Awards</p>
            <p className="text-2xl font-bold text-green-600">
              {records.filter((r) => r.status === "Active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Filtered (₦)</p>
            <p className="text-2xl font-bold text-primary">
              {totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          data-ocid="scholarship.search_input"
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-10"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-10" data-ocid="scholarship.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table data-ocid="scholarship.table">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("studentName")}
              >
                Student <SortIcon k="studentName" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("matricNo")}
              >
                Matric No <SortIcon k="matricNo" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("type")}
              >
                Type <SortIcon k="type" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                Amount (₦) <SortIcon k="amount" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("session")}
              >
                Session <SortIcon k="session" />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status <SortIcon k="status" />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="scholarship.empty_state"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r, i) => (
              <TableRow key={r.id} data-ocid={`scholarship.item.${i + 1}`}>
                <TableCell className="font-medium">{r.studentName}</TableCell>
                <TableCell className="font-mono text-xs">
                  {r.matricNo}
                </TableCell>
                <TableCell>
                  <Badge className={`${TYPE_COLORS[r.type]} border-0 text-xs`}>
                    {r.type}
                  </Badge>
                </TableCell>
                <TableCell>₦{r.amount.toLocaleString()}</TableCell>
                <TableCell>{r.session}</TableCell>
                <TableCell>
                  <Badge className={`${STATUS_COLORS[r.status]} text-xs`}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell>{r.awardDate}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      data-ocid={`scholarship.edit_button.${i + 1}`}
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      data-ocid={`scholarship.delete_button.${i + 1}`}
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="scholarship.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Award" : "Add Scholarship / Loan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Student Name</Label>
                <Input
                  data-ocid="scholarship.input"
                  value={form.studentName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, studentName: e.target.value }))
                  }
                  placeholder="Full name"
                  className="h-10"
                />
              </div>
              <div>
                <Label>Matric No</Label>
                <Input
                  value={form.matricNo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, matricNo: e.target.value }))
                  }
                  placeholder="XXX/YYYY/001"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Award Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as ScholarshipRecord["type"],
                    }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Government Loan">
                      Government Loan
                    </SelectItem>
                    <SelectItem value="Bursary Award">Bursary Award</SelectItem>
                    <SelectItem value="External Scholarship">
                      External Scholarship
                    </SelectItem>
                    <SelectItem value="Internal Award">
                      Internal Award
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      status: v as ScholarshipRecord["status"],
                    }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                  }
                  className="h-10"
                />
              </div>
              <div>
                <Label>Session</Label>
                <Input
                  value={form.session}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, session: e.target.value }))
                  }
                  placeholder="2024/2025"
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label>Award Date</Label>
              <Input
                type="date"
                value={form.awardDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, awardDate: e.target.value }))
                }
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="scholarship.cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="scholarship.save_button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Student view — shows only their own awards */
export function StudentScholarshipCard({ matricNo }: { matricNo: string }) {
  const records = getRecords().filter((r) => r.matricNo === matricNo);
  if (records.length === 0) return null;
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> My Awards & Scholarships
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-md border p-2"
            >
              <div>
                <p className="font-medium text-sm">{r.type}</p>
                <p className="text-xs text-muted-foreground">{r.session}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">
                  ₦{r.amount.toLocaleString()}
                </p>
                <Badge className={`${STATUS_COLORS[r.status]} text-xs`}>
                  {r.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
