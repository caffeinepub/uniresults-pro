import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { BookOpen, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface LibraryClearanceRecord {
  studentId: string;
  studentName: string;
  matricNumber: string;
  department: string;
  status: "Cleared" | "Not Cleared";
  clearedDate?: string;
  notes?: string;
}

export function getLibraryClearance(): LibraryClearanceRecord[] {
  try {
    return JSON.parse(localStorage.getItem("libraryClearance") || "[]");
  } catch {
    return [];
  }
}
export function saveLibraryClearance(r: LibraryClearanceRecord[]) {
  localStorage.setItem("libraryClearance", JSON.stringify(r));
}

export function isLibraryCleared(studentId: string): boolean {
  const rec = getLibraryClearance().find((r) => r.studentId === studentId);
  return rec?.status === "Cleared";
}

export default function LibraryClearanceTab() {
  const { students, departments } = useApp();
  const [records, setRecords] =
    useState<LibraryClearanceRecord[]>(getLibraryClearance);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  function upsertRecord(
    studentId: string,
    status: "Cleared" | "Not Cleared",
    notes?: string,
  ) {
    const student = students.find((s) => String(s.id) === studentId);
    if (!student) return;
    const dept = departments.find(
      (d) => String(d.id) === String(student.departmentId),
    );
    const existing = records.find((r) => r.studentId === studentId);
    const rec: LibraryClearanceRecord = {
      studentId,
      studentName: student.name,
      matricNumber: student.matricNumber,
      department: dept?.name ?? "N/A",
      status,
      clearedDate:
        status === "Cleared"
          ? new Date().toISOString().slice(0, 10)
          : undefined,
      notes: notes ?? existing?.notes,
    };
    const updated = existing
      ? records.map((r) => (r.studentId === studentId ? rec : r))
      : [...records, rec];
    setRecords(updated);
    saveLibraryClearance(updated);
    toast.success(`${student.name} marked as ${status}`);
  }

  function bulkClearDept(deptName: string) {
    const deptStudents = students.filter((s) => {
      const d = departments.find(
        (d) => String(d.id) === String(s.departmentId),
      );
      return d?.name === deptName;
    });
    let updated = [...records];
    for (const student of deptStudents) {
      const sid = String(student.id);
      const dept = departments.find(
        (d) => String(d.id) === String(student.departmentId),
      );
      const rec: LibraryClearanceRecord = {
        studentId: sid,
        studentName: student.name,
        matricNumber: student.matricNumber,
        department: dept?.name ?? "N/A",
        status: "Cleared",
        clearedDate: new Date().toISOString().slice(0, 10),
      };
      const idx = updated.findIndex((r) => r.studentId === sid);
      if (idx >= 0) updated[idx] = rec;
      else updated.push(rec);
    }
    setRecords(updated);
    saveLibraryClearance(updated);
    toast.success(`${deptStudents.length} students cleared for ${deptName}`);
  }

  // Ensure all students appear
  const allStudents = students.map((s) => {
    const existing = records.find((r) => r.studentId === String(s.id));
    const dept = departments.find(
      (d) => String(d.id) === String(s.departmentId),
    );
    if (existing) return existing;
    return {
      studentId: String(s.id),
      studentName: s.name,
      matricNumber: s.matricNumber,
      department: dept?.name ?? "N/A",
      status: "Not Cleared" as const,
      clearedDate: undefined,
      notes: undefined,
    };
  });

  const filtered = allStudents.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterDept !== "all" && r.department !== filterDept) return false;
    if (
      search &&
      !r.studentName.toLowerCase().includes(search.toLowerCase()) &&
      !r.matricNumber.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Library Clearance
          </h1>
          <p className="text-sm text-muted-foreground">
            {records.filter((r) => r.status === "Cleared").length} /{" "}
            {students.length} cleared
          </p>
        </div>
        <div className="flex gap-2">
          {filterDept !== "all" && (
            <Button
              size="sm"
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={() => bulkClearDept(filterDept)}
              data-ocid="library.primary_button"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" /> Clear All in Department
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search name or matric..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Cleared">Cleared</SelectItem>
            <SelectItem value="Not Cleared">Not Cleared</SelectItem>
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
              <TableHead>Matric No</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Cleared</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="library.empty_state"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r, i) => (
              <TableRow key={r.studentId} data-ocid={`library.item.${i + 1}`}>
                <TableCell className="text-muted-foreground text-sm">
                  {i + 1}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {r.studentName}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {r.matricNumber}
                </TableCell>
                <TableCell className="text-sm">{r.department}</TableCell>
                <TableCell>
                  {r.status === "Cleared" ? (
                    <Badge className="bg-success/15 text-success border-success/30 text-xs">
                      Cleared
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                      Not Cleared
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.clearedDate ?? "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {editId === r.studentId ? (
                    <div className="flex gap-1">
                      <Textarea
                        data-ocid="library.textarea"
                        rows={1}
                        className="text-xs h-7 min-h-0 py-1"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-primary text-primary-foreground"
                        onClick={() => {
                          upsertRecord(r.studentId, r.status, editNotes);
                          setEditId(null);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="cursor-pointer hover:underline text-left"
                      onClick={() => {
                        setEditId(r.studentId);
                        setEditNotes(r.notes ?? "");
                      }}
                    >
                      {r.notes || (
                        <span className="text-muted-foreground italic">
                          Add note
                        </span>
                      )}
                    </button>
                  )}
                </TableCell>
                <TableCell>
                  {r.status === "Not Cleared" ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => upsertRecord(r.studentId, "Cleared")}
                      data-ocid={`library.confirm_button.${i + 1}`}
                    >
                      Clear
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive"
                      onClick={() => upsertRecord(r.studentId, "Not Cleared")}
                      data-ocid={`library.delete_button.${i + 1}`}
                    >
                      Revoke
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
