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
import { Download, GraduationCap, Plus, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface AlumniRecord {
  id: string;
  studentId: string;
  name: string;
  matricNumber: string;
  department: string;
  faculty: string;
  graduationYear: string;
  graduationMonth: string;
  cgpa: number;
  degree: string;
  status: "active" | "inactive";
}

function getAlumni(): AlumniRecord[] {
  try {
    return JSON.parse(localStorage.getItem("alumniRecords") || "[]");
  } catch {
    return [];
  }
}
function saveAlumni(a: AlumniRecord[]) {
  localStorage.setItem("alumniRecords", JSON.stringify(a));
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

export default function AlumniManagementTab() {
  const { students, departments, faculties, results, courses } = useApp();
  const [alumni, setAlumni] = useState<AlumniRecord[]>(getAlumni);
  const [open, setOpen] = useState(false);
  const [filterYear, setFilterYear] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    graduationYear: new Date().getFullYear().toString(),
    graduationMonth: "November",
    degree: "B.Sc.",
  });

  const years = useMemo(() => {
    const s = new Set(alumni.map((a) => a.graduationYear));
    return Array.from(s).sort().reverse();
  }, [alumni]);

  function calcCgpa(studentId: bigint) {
    const myResults = results.filter(
      (r) =>
        r.studentId === studentId &&
        (r.status === "published" || r.status === "approved"),
    );
    let tw = 0;
    let tc = 0;
    for (const r of myResults) {
      const c = courses.find((c) => String(c.id) === String(r.courseId));
      const cr = c ? Number(c.creditUnits) : 0;
      tw += r.gradePoint * cr;
      tc += cr;
    }
    return tc > 0 ? Number.parseFloat((tw / tc).toFixed(2)) : 0;
  }

  function handleAdd() {
    if (!form.studentId || !form.graduationYear || !form.degree) {
      toast.error("Please fill all required fields");
      return;
    }
    const student = students.find((s) => String(s.id) === form.studentId);
    if (!student) return;
    const dept = departments.find(
      (d) => String(d.id) === String(student.departmentId),
    );
    const fac = faculties.find(
      (f) => String(f.id) === String((dept as any)?.facultyId),
    );
    const cgpa = calcCgpa(student.id);
    const rec: AlumniRecord = {
      id: `alum-${Date.now()}`,
      studentId: String(student.id),
      name: student.name,
      matricNumber: student.matricNumber,
      department: dept?.name ?? "N/A",
      faculty: fac?.name ?? "N/A",
      graduationYear: form.graduationYear,
      graduationMonth: form.graduationMonth,
      cgpa,
      degree: form.degree,
      status: "active",
    };
    const updated = [rec, ...alumni];
    saveAlumni(updated);
    setAlumni(updated);
    setOpen(false);
    toast.success(`${student.name} added to alumni records`);
  }

  const filtered = alumni.filter((a) => {
    if (filterYear !== "all" && a.graduationYear !== filterYear) return false;
    if (filterDept !== "all" && a.department !== filterDept) return false;
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.matricNumber.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function exportCSV() {
    const header =
      "S/N,Name,Matric No,Department,Faculty,Degree,Graduation Year,CGPA";
    const rows = filtered.map(
      (a, i) =>
        `${i + 1},"${a.name}",${a.matricNumber},"${a.department}","${a.faculty}",${a.degree},${a.graduationYear},${a.cgpa}`,
    );
    const blob = new Blob([`${header}\n${rows.join("\n")}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "alumni_list.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function requestTranscript(a: AlumniRecord) {
    const reqs = JSON.parse(localStorage.getItem("transcriptRequests") || "[]");
    reqs.push({
      id: `tr-${Date.now()}`,
      alumniId: a.id,
      name: a.name,
      matricNumber: a.matricNumber,
      requestedAt: new Date().toISOString(),
      status: "pending",
    });
    localStorage.setItem("transcriptRequests", JSON.stringify(reqs));
    toast.success("Transcript request created");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Alumni Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {alumni.length} alumni records
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            data-ocid="alumni.upload_button"
          >
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="alumni.secondary_button"
          >
            <Printer className="w-3 h-3 mr-1" /> Print
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                data-ocid="alumni.open_modal_button"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Alumni
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="alumni.dialog">
              <DialogHeader>
                <DialogTitle>Add Alumni Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Student</Label>
                  <Select
                    value={form.studentId}
                    onValueChange={(v) =>
                      setForm((p) => ({ ...p, studentId: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          {s.name} — {s.matricNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Graduation Month</Label>
                    <Select
                      value={form.graduationMonth}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, graduationMonth: v }))
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
                  <div>
                    <Label className="text-xs">Graduation Year</Label>
                    <Input
                      className="mt-1"
                      value={form.graduationYear}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          graduationYear: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Degree Awarded</Label>
                  <Select
                    value={form.degree}
                    onValueChange={(v) => setForm((p) => ({ ...p, degree: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "B.Sc.",
                        "B.Ed.",
                        "B.Sc. Ed.",
                        "B.A.",
                        "B.Eng.",
                        "LL.B.",
                        "B.Bus. Admin.",
                      ].map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="alumni.cancel_button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="alumni.confirm_button"
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
        <Input
          placeholder="Search name or matric..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
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
              <TableHead>Matric No</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Degree</TableHead>
              <TableHead>Graduation</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="alumni.empty_state"
                >
                  No alumni records found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a, i) => (
              <TableRow key={a.id} data-ocid={`alumni.item.${i + 1}`}>
                <TableCell className="text-muted-foreground text-sm">
                  {i + 1}
                </TableCell>
                <TableCell className="font-medium text-sm">{a.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {a.matricNumber}
                </TableCell>
                <TableCell className="text-sm">{a.department}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {a.degree}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {a.graduationMonth} {a.graduationYear}
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {a.cgpa.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => requestTranscript(a)}
                    data-ocid={`alumni.secondary_button.${i + 1}`}
                  >
                    Request Transcript
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
