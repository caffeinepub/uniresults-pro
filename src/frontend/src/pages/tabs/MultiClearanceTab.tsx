import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  CheckCircle2,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface MultiClearanceRecord {
  studentId: string;
  studentName: string;
  matricNo: string;
  department: string;
  library: boolean;
  bursary: boolean;
  hostel: boolean;
  department_office: boolean;
  faculty: boolean;
  exam_unit: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "unipro_multi_clearance";

export const CLEARANCE_ITEMS: {
  key: keyof Omit<
    MultiClearanceRecord,
    "studentId" | "studentName" | "matricNo" | "department" | "updatedAt"
  >;
  label: string;
}[] = [
  { key: "library", label: "Library" },
  { key: "bursary", label: "Bursary" },
  { key: "hostel", label: "Hostel" },
  { key: "department_office", label: "Department" },
  { key: "faculty", label: "Faculty" },
  { key: "exam_unit", label: "Exam Unit" },
];

const DEMO_RECORDS: MultiClearanceRecord[] = [
  {
    studentId: "s1",
    studentName: "Amaka Okonkwo",
    matricNo: "BIO/2021/001",
    department: "Biology Education",
    library: true,
    bursary: true,
    hostel: false,
    department_office: true,
    faculty: true,
    exam_unit: false,
    updatedAt: new Date().toISOString(),
  },
  {
    studentId: "s2",
    studentName: "Emeka Chukwu",
    matricNo: "CSE/2021/001",
    department: "Computer Science Education",
    library: true,
    bursary: true,
    hostel: true,
    department_office: true,
    faculty: true,
    exam_unit: true,
    updatedAt: new Date().toISOString(),
  },
  {
    studentId: "s3",
    studentName: "Fatima Bello",
    matricNo: "MTH/2021/002",
    department: "Mathematics Education",
    library: false,
    bursary: false,
    hostel: true,
    department_office: false,
    faculty: false,
    exam_unit: false,
    updatedAt: new Date().toISOString(),
  },
];

export function getClearanceRecords(): MultiClearanceRecord[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    ) as MultiClearanceRecord[];
    return saved.length ? saved : DEMO_RECORDS;
  } catch {
    return DEMO_RECORDS;
  }
}

function saveRecords(records: MultiClearanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function pendingCount(r: MultiClearanceRecord): number {
  return CLEARANCE_ITEMS.filter((item) => !r[item.key]).length;
}

type SortField = "studentName" | "matricNo" | "department" | "status";

// Student view of their own clearance
export function StudentClearanceStatusCard({
  studentId,
}: { studentId: string }) {
  const records = getClearanceRecords();
  const rec = records.find((r) => r.studentId === studentId);
  if (!rec)
    return (
      <p className="text-muted-foreground text-sm p-4">
        No clearance record found.
      </p>
    );
  const pending = pendingCount(rec);
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> My Clearance
            Status
          </span>
          {pending === 0 ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Fully Cleared
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              Pending {pending} item{pending > 1 ? "s" : ""}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CLEARANCE_ITEMS.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                rec[item.key]
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {rec[item.key] ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Last updated: {new Date(rec.updatedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

// Admin/Registrar view to manage clearance for all students
export default function MultiClearanceTab() {
  const { students, currentUser } = useApp();
  const isAdmin =
    currentUser?.role === "Registrar" ||
    currentUser?.role === "SuperAdmin" ||
    (currentUser as any)?.role === "Admin";

  const [records, setRecords] = useState<MultiClearanceRecord[]>(() => {
    const saved = getClearanceRecords();
    if (saved.length) return saved;
    const seeded = students.slice(0, 5).map(
      (s): MultiClearanceRecord => ({
        studentId: String(s.id),
        studentName: s.name,
        matricNo: s.regNo || String(s.id),
        department: s.department ?? "",
        library: false,
        bursary: false,
        hostel: false,
        department_office: false,
        faculty: false,
        exam_unit: false,
        updatedAt: new Date().toISOString(),
      }),
    );
    const merged = [...DEMO_RECORDS, ...seeded];
    saveRecords(merged);
    return merged;
  });

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("studentName");
  const [sortAsc, setSortAsc] = useState(true);

  function toggle(
    sid: string,
    key: keyof Omit<
      MultiClearanceRecord,
      "studentId" | "studentName" | "matricNo" | "department" | "updatedAt"
    >,
  ) {
    const updated = records.map((r) =>
      r.studentId === sid
        ? { ...r, [key]: !r[key], updatedAt: new Date().toISOString() }
        : r,
    );
    setRecords(updated);
    saveRecords(updated);
    toast.success("Clearance updated.");
  }

  function toggleSort(f: SortField) {
    if (sortField === f) setSortAsc(!sortAsc);
    else {
      setSortField(f);
      setSortAsc(true);
    }
  }

  function SortBtn({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label} <ArrowUpDown className="w-3 h-3" />
      </button>
    );
  }

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.matricNo.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      let av = "";
      let bv = "";
      if (sortField === "status") {
        av = String(pendingCount(a));
        bv = String(pendingCount(b));
      } else {
        av = a[sortField] ?? "";
        bv = b[sortField] ?? "";
      }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [records, search, sortField, sortAsc]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-4 h-4 text-primary" />
            Student Multi-Department Clearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search student name, matric, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-ocid="clearance.search_input"
          />
          <div className="overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortBtn field="studentName" label="Student" />
                  </TableHead>
                  <TableHead>
                    <SortBtn field="matricNo" label="Matric No" />
                  </TableHead>
                  <TableHead>
                    <SortBtn field="department" label="Department" />
                  </TableHead>
                  {CLEARANCE_ITEMS.map((item) => (
                    <TableHead key={item.key} className="text-center">
                      {item.label}
                    </TableHead>
                  ))}
                  <TableHead>
                    <SortBtn field="status" label="Status" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-8"
                      data-ocid="clearance.empty_state"
                    >
                      No clearance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((rec, i) => {
                    const pending = pendingCount(rec);
                    return (
                      <TableRow
                        key={rec.studentId}
                        data-ocid={`clearance.item.${i + 1}`}
                      >
                        <TableCell className="font-medium">
                          {rec.studentName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rec.matricNo}
                        </TableCell>
                        <TableCell className="text-sm">
                          {rec.department}
                        </TableCell>
                        {CLEARANCE_ITEMS.map((item) => (
                          <TableCell key={item.key} className="text-center">
                            {isAdmin ? (
                              <Switch
                                checked={rec[item.key]}
                                onCheckedChange={() =>
                                  toggle(rec.studentId, item.key)
                                }
                                data-ocid="clearance.switch"
                              />
                            ) : rec[item.key] ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          {pending === 0 ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Cleared
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              Pending {pending}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
