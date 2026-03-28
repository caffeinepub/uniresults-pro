import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, ClipboardList, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface StudentClearanceRecord {
  studentId: string;
  library: boolean;
  bursary: boolean;
  hostel: boolean;
  department: boolean;
  faculty: boolean;
  updatedAt: string;
}

export function getClearanceRecords(): StudentClearanceRecord[] {
  try {
    return JSON.parse(localStorage.getItem("studentClearance") || "[]");
  } catch {
    return [];
  }
}

function saveClearanceRecords(list: StudentClearanceRecord[]) {
  localStorage.setItem("studentClearance", JSON.stringify(list));
}

export function getClearanceForStudent(
  studentId: string,
): StudentClearanceRecord {
  const all = getClearanceRecords();
  return (
    all.find((r) => r.studentId === studentId) ?? {
      studentId,
      library: false,
      bursary: false,
      hostel: false,
      department: false,
      faculty: false,
      updatedAt: "",
    }
  );
}

const COLUMNS: { key: keyof StudentClearanceRecord; label: string }[] = [
  { key: "library", label: "Library" },
  { key: "bursary", label: "Bursary" },
  { key: "hostel", label: "Hostel" },
  { key: "department", label: "Department" },
  { key: "faculty", label: "Faculty" },
];

// Registrar admin view
export default function StudentClearanceTab() {
  const { students, logAudit, currentUser } = useApp();
  const [records, setRecords] =
    useState<StudentClearanceRecord[]>(getClearanceRecords);
  const [filter, setFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  function toggle(studentId: string, key: keyof StudentClearanceRecord) {
    const all = getClearanceRecords();
    const idx = all.findIndex((r) => r.studentId === studentId);
    let updated: StudentClearanceRecord[];
    if (idx >= 0) {
      updated = all.map((r) =>
        r.studentId === studentId
          ? {
              ...r,
              [key]: !r[key as keyof typeof r],
              updatedAt: new Date().toISOString(),
            }
          : r,
      );
    } else {
      const base: StudentClearanceRecord = {
        studentId,
        library: false,
        bursary: false,
        hostel: false,
        department: false,
        faculty: false,
        updatedAt: new Date().toISOString(),
      };
      (base as any)[key] = true;
      updated = [...all, base];
    }
    saveClearanceRecords(updated);
    setRecords(updated);
    logAudit(
      currentUser?.name ?? "Admin",
      "Registrar",
      "Clearance Updated",
      `Student ${studentId} — ${String(key)} toggled`,
    );
  }

  function getRecord(studentId: string) {
    return records.find((r) => r.studentId === studentId) ?? null;
  }

  function isCleared(rec: StudentClearanceRecord | null) {
    if (!rec) return false;
    return COLUMNS.every((c) => rec[c.key] as boolean);
  }

  const filtered = students
    .filter((s) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      return (
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.matricNumber ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff = (a.name ?? "").localeCompare(b.name ?? "");
      return sortAsc ? diff : -diff;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Student Clearance</h2>
        <Badge>{students.length} Students</Badge>
        <input
          data-ocid="clearance.search.input"
          className="ml-auto border border-border rounded px-2 py-1 text-sm"
          placeholder="Search by name or matric..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          {filtered.length === 0 ? (
            <div
              data-ocid="clearance.empty_state"
              className="text-center py-8 text-muted-foreground"
            >
              No students found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => setSortAsc(!sortAsc)}
                    className="cursor-pointer"
                  >
                    Name {sortAsc ? "↑" : "↓"}
                  </TableHead>
                  <TableHead>Matric</TableHead>
                  {COLUMNS.map((c) => (
                    <TableHead key={c.key}>{c.label}</TableHead>
                  ))}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => {
                  const rec = getRecord(String(s.id));
                  const cleared = isCleared(rec);
                  return (
                    <TableRow
                      key={String(s.id)}
                      data-ocid={`clearance.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.matricNumber}</TableCell>
                      {COLUMNS.map((c) => (
                        <TableCell key={c.key}>
                          <button
                            type="button"
                            data-ocid={`clearance.${c.key}.toggle`}
                            onClick={() => toggle(String(s.id), c.key)}
                            className="p-0"
                          >
                            {rec?.[c.key] ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                            ) : (
                              <XCircle className="w-5 h-5 text-destructive" />
                            )}
                          </button>
                        </TableCell>
                      ))}
                      <TableCell>
                        <Badge variant={cleared ? "default" : "secondary"}>
                          {cleared ? "Cleared" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Student-facing clearance progress card
export function StudentClearanceCard() {
  const { currentUser, students } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  if (!me) return null;
  const rec = getClearanceForStudent(String(me.id));
  const cleared = COLUMNS.filter((c) => rec[c.key] as boolean).length;
  const total = COLUMNS.length;
  const pct = Math.round((cleared / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="w-4 h-4" /> Graduation Clearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {cleared}/{total} steps cleared
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COLUMNS.map((c) => (
            <div key={c.key} className="flex items-center gap-2 text-sm">
              {rec[c.key] ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              <span>{c.label}</span>
            </div>
          ))}
        </div>
        {pct === 100 && <Badge variant="default">✅ Fully Cleared</Badge>}
      </CardContent>
    </Card>
  );
}
