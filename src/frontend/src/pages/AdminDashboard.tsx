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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Download,
  Filter,
  Globe,
  Pencil,
  Plus,
  RefreshCw,
  ScrollText,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useContext, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { Course } from "../backend.d";
import { TabContext } from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  type AcademicCalendar,
  type ExtendedStudent,
  useApp,
} from "../context/AppContext";

export default function AdminDashboard() {
  const { activeTab } = useContext(TabContext);
  if (activeTab === "overview") return <OverviewTab />;
  if (activeTab === "departments") return <DepartmentsTab />;
  if (activeTab === "students") return <StudentsTab />;
  if (activeTab === "courses") return <CoursesTab />;
  if (activeTab === "course_mgmt") return <CourseManagementTab />;
  if (activeTab === "results") return <ResultsTab />;
  if (activeTab === "summaries") return <SummariesTab />;
  if (activeTab === "carryovers") return <CarryoversTab />;
  if (activeTab === "statistics") return <StatisticsTab />;
  if (activeTab === "roles") return <RolesTab />;
  if (activeTab === "calendar") return <AcademicCalendarTab />;
  if (activeTab === "audit") return <AuditLogTab />;
  return <OverviewTab />;
}

function OverviewTab() {
  const { departments, courses, students, results } = useApp();
  const pending = results.filter((r) => r.status === "dean_approved").length;
  const gradeData = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          University Results Processing System
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={students.length} icon={Users} />
        <StatCard
          label="Total Courses"
          value={courses.length}
          icon={BookOpen}
        />
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building2}
        />
        <StatCard
          label="Pending Approvals"
          value={pending}
          icon={ClipboardList}
          color="text-warning"
        />
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Grade Distribution
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={gradeData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.93 0.01 250)"
            />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="oklch(0.29 0.09 258)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Results</h2>
        </div>
        <RecentResultsTable />
      </div>
    </div>
  );
}

function RecentResultsTable() {
  const { results, courses, students } = useApp();
  const recent = results.slice(-5).reverse();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Remarks</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recent.map((r, i) => {
          const student = students.find((s) => s.id === r.studentId);
          const course = courses.find((c) => c.id === r.courseId);
          return (
            <TableRow key={String(r.id)} data-ocid={`results.item.${i + 1}`}>
              <TableCell className="text-sm">{student?.name ?? "-"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {course?.code ?? "-"}
              </TableCell>
              <TableCell className="text-sm font-medium">
                {r.totalScore}
              </TableCell>
              <TableCell className="text-sm font-bold">{r.grade}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {r.remarks}
              </TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DepartmentsTab() {
  const { departments, addDepartment } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    addDepartment({ id: BigInt(Date.now()), name: name.trim() });
    setName("");
    setOpen(false);
    toast.success("Department added");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Departments</h1>
          <p className="text-sm text-muted-foreground">
            {departments.length} departments
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="dept.open_modal_button"
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="dept.dialog">
            <DialogHeader>
              <DialogTitle>New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Name</Label>
              <Input
                data-ocid="dept.input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <DialogFooter>
              <Button
                data-ocid="dept.cancel_button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="dept.submit_button"
                onClick={handleAdd}
                className="bg-primary text-primary-foreground"
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((d, i) => (
              <TableRow key={String(d.id)} data-ocid={`dept.item.${i + 1}`}>
                <TableCell className="text-muted-foreground text-sm">
                  {String(d.id)}
                </TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

type CsvRow = {
  name: string;
  matric: string;
  dept: string;
  level: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
};

function StudentsTab() {
  const { students, departments, addStudent } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    matric: "",
    deptId: "",
    level: "300",
    gender: "",
    dob: "",
    email: "",
    phone: "",
  });

  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.matricNumber.toLowerCase().includes(search.toLowerCase()),
  );

  function resetManualForm() {
    setForm({
      name: "",
      matric: "",
      deptId: "",
      level: "300",
      gender: "",
      dob: "",
      email: "",
      phone: "",
    });
  }

  function handleManualAdd() {
    if (!form.name || !form.matric || !form.deptId) {
      toast.error("Name, Matric Number, and Department are required");
      return;
    }
    addStudent({
      id: BigInt(Date.now()),
      name: form.name,
      matricNumber: form.matric,
      departmentId: BigInt(form.deptId),
      level: BigInt(form.level),
      status: "active",
      userPrincipal: `student-${Date.now()}`,
      gender: form.gender || undefined,
      dob: form.dob || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
    });
    resetManualForm();
    setOpen(false);
    toast.success("Student registered successfully");
  }

  function handleDownloadTemplate() {
    const headers =
      "Full Name,Matric Number,Department Name,Level,Gender,Date of Birth,Email,Phone";
    const rows = [
      "Adaeze Okafor,CSC/2022/010,Computer Science,300,Female,2003-04-12,adaeze@university.edu,08011223344",
      "Babatunde Adewale,EEE/2022/005,Electrical Engineering,200,Male,2004-01-28,babatunde@university.edu,08099887766",
    ];
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_registration_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const dataLines = lines.slice(1);
      const parsed: CsvRow[] = dataLines.map((line) => {
        const cols = line.split(",");
        return {
          name: cols[0]?.trim() ?? "",
          matric: cols[1]?.trim() ?? "",
          dept: cols[2]?.trim() ?? "",
          level: cols[3]?.trim() ?? "100",
          gender: cols[4]?.trim() ?? "",
          dob: cols[5]?.trim() ?? "",
          email: cols[6]?.trim() ?? "",
          phone: cols[7]?.trim() ?? "",
        };
      });
      setCsvRows(parsed.filter((r) => r.name && r.matric));
    };
    reader.readAsText(file);
  }

  function handleImportAll() {
    if (csvRows.length === 0) return;
    let count = 0;
    for (const row of csvRows) {
      const matchedDept =
        departments.find(
          (d) => d.name.toLowerCase() === row.dept.toLowerCase(),
        ) ?? departments[0];
      if (!matchedDept) continue;
      addStudent({
        id: BigInt(Date.now() + count),
        name: row.name,
        matricNumber: row.matric,
        departmentId: matchedDept.id,
        level: BigInt(Number(row.level) || 100),
        status: "active",
        userPrincipal: `student-bulk-${Date.now()}-${count}`,
        gender: row.gender || undefined,
        dob: row.dob || undefined,
        email: row.email || undefined,
        phone: row.phone || undefined,
      });
      count++;
    }
    setCsvRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOpen(false);
    toast.success(
      `${count} student${count !== 1 ? "s" : ""} imported successfully`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Students</h1>
          <p className="text-sm text-muted-foreground">
            {students.length} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            data-ocid="students.search_input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) {
                resetManualForm();
                setCsvRows([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                data-ocid="students.open_modal_button"
                size="sm"
                className="bg-primary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent
              data-ocid="students.dialog"
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <DialogHeader>
                <DialogTitle>Student Registration</DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="manual">
                <TabsList className="w-full">
                  <TabsTrigger
                    value="manual"
                    className="flex-1"
                    data-ocid="students.tab"
                  >
                    Manual Registration
                  </TabsTrigger>
                  <TabsTrigger
                    value="bulk"
                    className="flex-1"
                    data-ocid="students.tab"
                  >
                    Bulk CSV Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Full Name *</Label>
                      <Input
                        data-ocid="students.name.input"
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="e.g. Amara Okonkwo"
                      />
                    </div>
                    <div>
                      <Label>Matric Number *</Label>
                      <Input
                        data-ocid="students.matric.input"
                        value={form.matric}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, matric: e.target.value }))
                        }
                        placeholder="e.g. CSC/2022/007"
                      />
                    </div>
                    <div>
                      <Label>Level *</Label>
                      <Select
                        value={form.level}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, level: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.level.select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["100", "200", "300", "400", "500"].map((l) => (
                            <SelectItem key={l} value={l}>
                              {l} Level
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Department *</Label>
                      <Select
                        value={form.deptId}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, deptId: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.dept.select">
                          <SelectValue placeholder="Select department" />
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
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, gender: v }))
                        }
                      >
                        <SelectTrigger data-ocid="students.gender.select">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input
                        data-ocid="students.dob.input"
                        type="date"
                        value={form.dob}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dob: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        data-ocid="students.email.input"
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, email: e.target.value }))
                        }
                        placeholder="student@university.edu"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        data-ocid="students.phone.input"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="080XXXXXXXX"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      data-ocid="students.cancel_button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      data-ocid="students.submit_button"
                      onClick={handleManualAdd}
                      className="bg-primary text-primary-foreground"
                    >
                      Register Student
                    </Button>
                  </DialogFooter>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4 pt-2">
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Step 1: Download Template
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Fill in the CSV template and upload it below.
                        </p>
                      </div>
                      <Button
                        data-ocid="students.upload_button"
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download Template
                      </Button>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-sm font-medium mb-2">
                        Step 2: Upload Filled CSV
                      </p>
                      <label
                        data-ocid="students.dropzone"
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-md border border-border bg-background p-6 text-center hover:bg-muted/40 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to select .csv file
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  {csvRows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {csvRows.length} student
                          {csvRows.length !== 1 ? "s" : ""} ready to import
                        </p>
                        <Button
                          data-ocid="students.primary_button"
                          size="sm"
                          onClick={handleImportAll}
                          className="bg-primary text-primary-foreground"
                        >
                          Import All
                        </Button>
                      </div>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">#</TableHead>
                              <TableHead className="text-xs">Name</TableHead>
                              <TableHead className="text-xs">Matric</TableHead>
                              <TableHead className="text-xs">Dept</TableHead>
                              <TableHead className="text-xs">Level</TableHead>
                              <TableHead className="text-xs">Gender</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {csvRows.map((row, i) => (
                              <TableRow
                                key={`${row.matric}-${i}`}
                                data-ocid={`students.item.${i + 1}`}
                              >
                                <TableCell className="text-xs text-muted-foreground">
                                  {i + 1}
                                </TableCell>
                                <TableCell className="text-xs font-medium">
                                  {row.name}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {row.matric}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.dept}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.level}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {row.gender}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="students.empty_state"
                >
                  No students found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((s, i) => {
              const dept = departments.find((d) => d.id === s.departmentId);
              return (
                <TableRow
                  key={String(s.id)}
                  data-ocid={`students.item.${i + 1}`}
                >
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.matricNumber}
                  </TableCell>
                  <TableCell className="text-sm">{dept?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm">
                    {String(s.level)} Level
                  </TableCell>
                  <TableCell className="text-sm">
                    {(s as ExtendedStudent).gender ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(s as ExtendedStudent).email ?? "-"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CoursesTab() {
  const { courses, departments, addCourse } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    credits: "3",
    deptId: "",
    lecturer: "",
    semester: "First",
  });

  function handleAdd() {
    if (!form.name || !form.code || !form.deptId) return;
    addCourse({
      id: BigInt(Date.now()),
      name: form.name,
      code: form.code,
      creditUnits: BigInt(form.credits),
      departmentId: BigInt(form.deptId),
      lecturerPrincipal: form.lecturer || "unassigned",
      semester: form.semester,
    });
    setForm({
      name: "",
      code: "",
      credits: "3",
      deptId: "",
      lecturer: "",
      semester: "First",
    });
    setOpen(false);
    toast.success("Course added");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Courses</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} courses
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="courses.open_modal_button"
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="courses.dialog">
            <DialogHeader>
              <DialogTitle>New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Course Name</Label>
                <Input
                  data-ocid="courses.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div>
                <Label>Course Code</Label>
                <Input
                  data-ocid="courses.code.input"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="e.g. CSC301"
                />
              </div>
              <div>
                <Label>Credit Units</Label>
                <Select
                  value={form.credits}
                  onValueChange={(v) => setForm((f) => ({ ...f, credits: v }))}
                >
                  <SelectTrigger data-ocid="courses.credits.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "2", "3", "4", "6"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c} unit{c !== "1" ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  value={form.deptId}
                  onValueChange={(v) => setForm((f) => ({ ...f, deptId: v }))}
                >
                  <SelectTrigger data-ocid="courses.dept.select">
                    <SelectValue placeholder="Select department" />
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
              <div>
                <Label>Semester</Label>
                <Select
                  value={form.semester}
                  onValueChange={(v) => setForm((f) => ({ ...f, semester: v }))}
                >
                  <SelectTrigger data-ocid="courses.semester.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First</SelectItem>
                    <SelectItem value="Second">Second</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="courses.cancel_button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="courses.submit_button"
                onClick={handleAdd}
                className="bg-primary text-primary-foreground"
              >
                Add Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Semester</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c, i) => {
              const dept = departments.find((d) => d.id === c.departmentId);
              return (
                <TableRow
                  key={String(c.id)}
                  data-ocid={`courses.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {c.code}
                  </TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dept?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {String(c.creditUnits)}
                  </TableCell>
                  <TableCell className="text-sm">{c.semester}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ResultsTab() {
  const {
    results,
    courses,
    students,
    updateResultStatus,
    amendmentRequests,
    approveAmendmentFinal,
    rejectAmendment,
  } = useApp();
  const [filter, setFilter] = useState("all");

  const pendingAmendments = amendmentRequests.filter(
    (a) => a.status === "pending_registrar",
  );

  // Group dean_approved results by semester for bulk publish
  const semesterGroups = useMemo(() => {
    const groups: Record<
      string,
      { total: number; deanApproved: number; published: number }
    > = {};
    for (const r of results) {
      const course = courses.find((c) => c.id === r.courseId);
      if (!course) continue;
      const key = course.semester;
      if (!groups[key])
        groups[key] = { total: 0, deanApproved: 0, published: 0 };
      groups[key].total++;
      if (r.status === "dean_approved") groups[key].deanApproved++;
      if (r.status === "published" || r.status === "approved")
        groups[key].published++;
    }
    return groups;
  }, [results, courses]);

  function publishSemester(semester: string) {
    let count = 0;
    for (const r of results) {
      const course = courses.find((c) => c.id === r.courseId);
      if (course?.semester === semester && r.status === "dean_approved") {
        updateResultStatus(r.id, "published");
        count++;
      }
    }
    toast.success(
      `${count} result${count !== 1 ? "s" : ""} published for ${semester} Semester`,
    );
  }

  const filtered = results.filter(
    (r) => filter === "all" || r.status === filter,
  );

  function handlePublish(id: bigint) {
    updateResultStatus(id, "published");
    toast.success("Result published");
  }

  return (
    <div className="space-y-6">
      {/* Publication Control */}
      <div className="bg-card rounded-xl border border-border shadow-xs p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Publication Control</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Publish all approved results for a semester at once. Students will
          only see published results.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(semesterGroups).map(([semester, stats]) => {
            const allPublished =
              stats.deanApproved === 0 && stats.published > 0;
            const hasApproved = stats.deanApproved > 0;
            return (
              <div
                key={semester}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
              >
                <div>
                  <p className="font-medium text-sm">{semester} Semester</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.published} published &middot; {stats.deanApproved}{" "}
                    awaiting publication &middot; {stats.total} total
                  </p>
                </div>
                {allPublished ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                    <CheckCircle className="w-3 h-3" /> Published
                  </span>
                ) : hasApproved ? (
                  <Button
                    data-ocid={`publication.${semester.toLowerCase()}.primary_button`}
                    size="sm"
                    onClick={() => publishSemester(semester)}
                    className="bg-primary text-primary-foreground text-xs h-7"
                  >
                    <Globe className="w-3 h-3 mr-1" /> Publish{" "}
                    {stats.deanApproved}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No results ready
                  </span>
                )}
              </div>
            );
          })}
          {Object.keys(semesterGroups).length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">
              No results in the system yet
            </p>
          )}
        </div>
      </div>

      {/* Amendment Requests */}
      {pendingAmendments.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-200 shadow-xs">
          <div className="p-4 bg-amber-50 border-b border-amber-200 rounded-t-xl flex items-center gap-2">
            <Pencil className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-sm text-amber-700">
              Pending Amendment Requests ({pendingAmendments.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Original CA/Exam</TableHead>
                <TableHead>New CA/Exam</TableHead>
                <TableHead>New Total</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Lecturer</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAmendments.map((a, i) => {
                const student = students.find((s) => s.id === a.studentId);
                const course = courses.find((c) => c.id === a.courseId);
                return (
                  <TableRow
                    key={String(a.id)}
                    data-ocid={`amendments.item.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm">
                      {student?.name ?? "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {course?.code ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="line-through text-muted-foreground">
                        {a.originalCa}/{a.originalExam} ={" "}
                        {a.originalCa + a.originalExam}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-amber-700">
                      {a.newCa}/{a.newExam} = {a.newCa + a.newExam}
                    </TableCell>
                    <TableCell className="font-bold">
                      {a.newCa + a.newExam}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {a.reason}
                    </TableCell>
                    <TableCell className="text-xs">{a.lecturerName}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`amendments.confirm_button.${i + 1}`}
                          size="sm"
                          onClick={() => approveAmendmentFinal(a.id)}
                          className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          data-ocid={`amendments.delete_button.${i + 1}`}
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectAmendment(a.id)}
                          className="h-7 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">All Results</h1>
            <p className="text-sm text-muted-foreground">
              {results.length} total
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger data-ocid="results.filter.select" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="hod_approved">HOD Approved</SelectItem>
              <SelectItem value="dean_approved">Dean Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="results.empty_state"
                  >
                    No results found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r, i) => {
                const student = students.find((s) => s.id === r.studentId);
                const course = courses.find((c) => c.id === r.courseId);
                return (
                  <TableRow
                    key={String(r.id)}
                    data-ocid={`results.item.${i + 1}`}
                  >
                    <TableCell className="font-medium text-sm">
                      {student?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {course?.code ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">{r.caScore}</TableCell>
                    <TableCell className="text-sm">{r.examScore}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.totalScore}
                    </TableCell>
                    <TableCell className="font-bold">{r.grade}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.remarks}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      {r.status === "dean_approved" && (
                        <Button
                          data-ocid={`results.publish_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublish(r.id)}
                          className="h-7 text-xs gap-1"
                        >
                          <Globe className="w-3 h-3" /> Publish
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function SummariesTab() {
  const { students, courses, results, departments } = useApp();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Build per-student per-semester summaries
  const summaries = useMemo(() => {
    const rows: {
      studentId: bigint;
      studentName: string;
      matric: string;
      dept: string;
      semester: string;
      courseCount: number;
      totalCredits: number;
      gpa: number;
      results: typeof results;
    }[] = [];

    for (const student of students) {
      const dept = departments.find((d) => d.id === student.departmentId);
      const studentResults = results.filter(
        (r) =>
          r.studentId === student.id &&
          (r.status === "published" || r.status === "approved"),
      );

      // Group by semester
      const semGroups: Record<string, typeof results> = {};
      for (const r of studentResults) {
        const course = courses.find((c) => c.id === r.courseId);
        if (!course) continue;
        const sem = course.semester;
        if (!semGroups[sem]) semGroups[sem] = [];
        semGroups[sem].push(r);
      }

      for (const [semester, semResults] of Object.entries(semGroups)) {
        let weightedPoints = 0;
        let creditSum = 0;
        for (const r of semResults) {
          const course = courses.find((c) => c.id === r.courseId);
          const credits = course ? Number(course.creditUnits) : 0;
          weightedPoints += r.gradePoint * credits;
          creditSum += credits;
        }
        const gpa = creditSum > 0 ? weightedPoints / creditSum : 0;
        rows.push({
          studentId: student.id,
          studentName: student.name,
          matric: student.matricNumber,
          dept: dept?.name ?? "-",
          semester,
          courseCount: semResults.length,
          totalCredits: creditSum,
          gpa,
          results: semResults,
        });
      }
    }

    return rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [students, courses, results, departments]);

  function handleDownloadAll() {
    const lines = [
      "Student Name,Matric,Department,Semester,Courses,Total Credits,GPA",
    ];
    for (const row of summaries) {
      lines.push(
        [
          `"${row.studentName}"`,
          row.matric,
          `"${row.dept}"`,
          row.semester,
          row.courseCount,
          row.totalCredits,
          row.gpa.toFixed(2),
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result_summaries.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Result summaries downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Result Summaries</h1>
          <p className="text-sm text-muted-foreground">
            Per-student semester GPA summaries
          </p>
        </div>
        {summaries.length > 0 && (
          <Button
            data-ocid="summaries.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadAll}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download All
          </Button>
        )}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Matric</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Total Credits</TableHead>
              <TableHead>GPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="summaries.empty_state"
                >
                  No published results available
                </TableCell>
              </TableRow>
            )}
            {summaries.map((row, i) => {
              const key = `${String(row.studentId)}-${row.semester}`;
              const isExpanded = expandedKey === key;
              return (
                <>
                  <TableRow
                    key={key}
                    data-ocid={`summaries.item.${i + 1}`}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => setExpandedKey(isExpanded ? null : key)}
                  >
                    <TableCell className="font-medium">
                      {row.studentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.matric}
                    </TableCell>
                    <TableCell className="text-sm">{row.dept}</TableCell>
                    <TableCell className="text-sm">
                      {row.semester} Semester
                    </TableCell>
                    <TableCell>{row.courseCount}</TableCell>
                    <TableCell>{row.totalCredits}</TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          row.gpa >= 3.5
                            ? "text-success"
                            : row.gpa >= 2.0
                              ? "text-warning"
                              : "text-destructive"
                        }`}
                      >
                        {row.gpa.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${key}-expanded`}>
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-muted/20 border-t border-b border-border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="pl-8">
                                  Course Code
                                </TableHead>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Credits</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Points</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {row.results.map((r) => {
                                const course = courses.find(
                                  (c) => c.id === r.courseId,
                                );
                                return (
                                  <TableRow key={String(r.id)}>
                                    <TableCell className="pl-8 font-mono text-xs">
                                      {course?.code ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {course?.name ?? "-"}
                                    </TableCell>
                                    <TableCell>
                                      {String(course?.creditUnits ?? 0)}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {r.totalScore}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                      {r.grade}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {r.gradePoint.toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CarryoversTab() {
  const { students, courses, results, departments } = useApp();

  const carryovers = results.filter(
    (r) =>
      r.grade === "F" && (r.status === "published" || r.status === "approved"),
  );

  function handleDownloadCSV() {
    const lines = [
      "Student Name,Matric,Department,Course Code,Course Name,Semester,Total Score,Grade",
    ];
    for (const r of carryovers) {
      const student = students.find((s) => s.id === r.studentId);
      const course = courses.find((c) => c.id === r.courseId);
      const dept = student
        ? departments.find((d) => d.id === student.departmentId)
        : null;
      lines.push(
        [
          `"${student?.name ?? "-"}"`,
          student?.matricNumber ?? "-",
          `"${dept?.name ?? "-"}"`,
          course?.code ?? "-",
          `"${course?.name ?? "-"}"`,
          course?.semester ?? "-",
          r.totalScore,
          r.grade,
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carryover_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Carry-over report downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Carry-over Students</h1>
          <p className="text-sm text-muted-foreground">
            {carryovers.length} carry-over result
            {carryovers.length !== 1 ? "s" : ""} institution-wide
          </p>
        </div>
        {carryovers.length > 0 && (
          <Button
            data-ocid="carryovers.download_button"
            size="sm"
            variant="outline"
            onClick={handleDownloadCSV}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" /> Download CSV
          </Button>
        )}
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Course Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carryovers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="carryovers.empty_state"
                >
                  <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
                  No carry-over students
                </TableCell>
              </TableRow>
            )}
            {carryovers.map((r, i) => {
              const student = students.find((s) => s.id === r.studentId);
              const course = courses.find((c) => c.id === r.courseId);
              const dept = student
                ? departments.find((d) => d.id === student.departmentId)
                : null;
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`carryovers.item.${i + 1}`}
                  className="bg-destructive/5"
                >
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {student?.matricNumber ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">{dept?.name ?? "-"}</TableCell>
                  <TableCell className="font-mono text-sm font-semibold">
                    {course?.code ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {course?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {course?.semester ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell>
                    <span className="font-bold text-destructive">
                      {r.grade}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const GRADE_COLORS: Record<string, string> = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#a855f7",
  F: "#ef4444",
};

function StatisticsTab() {
  const { students, courses, results, departments } = useApp();

  const totalResults = results.length;
  const passCount = results.filter((r) => r.grade !== "F").length;
  const passRate =
    totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

  const gradeDistribution = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
  }));

  // Top/Bottom 5 courses by avg score
  const coursePerf = useMemo(() => {
    return courses
      .map((c) => {
        const cResults = results.filter((r) => r.courseId === c.id);
        if (cResults.length === 0) return null;
        const avg =
          cResults.reduce((sum, r) => sum + r.totalScore, 0) / cResults.length;
        const pass = cResults.filter((r) => r.grade !== "F").length;
        const passRateC = Math.round((pass / cResults.length) * 100);
        return {
          code: c.code,
          name: c.name,
          avgScore: Math.round(avg * 10) / 10,
          passRate: passRateC,
          count: cResults.length,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [courses, results]);

  const top5 = coursePerf.slice(0, 5);
  const bottom5 = [...coursePerf].reverse().slice(0, 5);

  // Department summary
  const deptSummary = useMemo(() => {
    return departments.map((dept) => {
      const deptStudents = students.filter(
        (s) => s.departmentId === dept.id,
      ).length;
      const deptResults = results.filter((r) => {
        const course = courses.find((c) => c.id === r.courseId);
        return course?.departmentId === dept.id;
      });
      const avg =
        deptResults.length > 0
          ? Math.round(
              (deptResults.reduce((sum, r) => sum + r.totalScore, 0) /
                deptResults.length) *
                10,
            ) / 10
          : 0;
      const pass = deptResults.filter((r) => r.grade !== "F").length;
      const pr =
        deptResults.length > 0
          ? Math.round((pass / deptResults.length) * 100)
          : 0;
      return {
        name: dept.name,
        studentCount: deptStudents,
        avgScore: avg,
        passRate: pr,
      };
    });
  }, [departments, students, courses, results]);

  function handleDownloadStatistics() {
    const lines: string[] = [
      "=== INSTITUTION STATISTICS ===",
      `Total Students,${students.length}`,
      `Total Courses,${courses.length}`,
      `Total Results,${totalResults}`,
      `Institution Pass Rate,${passRate}%`,
      "",
      "=== GRADE DISTRIBUTION ===",
      "Grade,Count",
      ...gradeDistribution.map((g) => `${g.grade},${g.count}`),
      "",
      "=== TOP 5 PERFORMING COURSES ===",
      "Course Code,Course Name,Avg Score,Pass Rate,Results",
      ...top5.map(
        (c) => `${c.code},"${c.name}",${c.avgScore},${c.passRate}%,${c.count}`,
      ),
      "",
      "=== BOTTOM 5 PERFORMING COURSES ===",
      "Course Code,Course Name,Avg Score,Pass Rate,Results",
      ...bottom5.map(
        (c) => `${c.code},"${c.name}",${c.avgScore},${c.passRate}%,${c.count}`,
      ),
      "",
      "=== DEPARTMENT SUMMARY ===",
      "Department,Student Count,Avg Score,Pass Rate",
      ...deptSummary.map(
        (d) => `"${d.name}",${d.studentCount},${d.avgScore},${d.passRate}%`,
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "institution_statistics.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statistics report downloaded");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Institution Statistics</h1>
          <p className="text-sm text-muted-foreground">
            Overview of academic performance across the institution
          </p>
        </div>
        <Button
          data-ocid="statistics.download_button"
          size="sm"
          variant="outline"
          onClick={handleDownloadStatistics}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <Users className="w-3 h-3" /> Total Students
          </p>
          <p className="text-3xl font-bold">{students.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3" /> Total Courses
          </p>
          <p className="text-3xl font-bold">{courses.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <ClipboardList className="w-3 h-3" /> Results Processed
          </p>
          <p className="text-3xl font-bold">{totalResults}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3" /> Institution Pass Rate
          </p>
          <p
            className={`text-3xl font-bold ${
              passRate >= 70 ? "text-success" : "text-warning"
            }`}
          >
            {passRate}%
          </p>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold mb-4">Grade Distribution</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={gradeDistribution}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.93 0.01 250)"
            />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
              {gradeDistribution.map((entry) => (
                <Cell
                  key={entry.grade}
                  fill={GRADE_COLORS[entry.grade] ?? "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 */}
        <div className="bg-card border border-border rounded-xl shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-success">
              🏆 Top 5 Performing Courses
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                    data-ocid="statistics.top5.empty_state"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                top5.map((c, i) => (
                  <TableRow
                    key={c.code}
                    data-ocid={`statistics.top5.item.${i + 1}`}
                  >
                    <TableCell className="font-mono font-medium">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-sm">{c.name}</TableCell>
                    <TableCell className="font-bold text-success">
                      {c.avgScore}
                    </TableCell>
                    <TableCell className="text-success font-medium">
                      {c.passRate}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom 5 */}
        <div className="bg-card border border-border rounded-xl shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-destructive">
              ⚠️ Bottom 5 Performing Courses
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Pass Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bottom5.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                    data-ocid="statistics.bottom5.empty_state"
                  >
                    No data
                  </TableCell>
                </TableRow>
              ) : (
                bottom5.map((c, i) => (
                  <TableRow
                    key={c.code}
                    data-ocid={`statistics.bottom5.item.${i + 1}`}
                  >
                    <TableCell className="font-mono font-medium">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-sm">{c.name}</TableCell>
                    <TableCell className="font-bold text-destructive">
                      {c.avgScore}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {c.passRate}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Department Summary */}
      <div className="bg-card border border-border rounded-xl shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Department Summary</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Student Count</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Pass Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deptSummary.map((d, i) => (
              <TableRow
                key={d.name}
                data-ocid={`statistics.dept.item.${i + 1}`}
              >
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>{d.studentCount}</TableCell>
                <TableCell className="font-medium">{d.avgScore}</TableCell>
                <TableCell>
                  <span
                    className={`font-semibold ${
                      d.passRate >= 70
                        ? "text-success"
                        : d.passRate >= 50
                          ? "text-warning"
                          : "text-destructive"
                    }`}
                  >
                    {d.passRate}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RolesTab() {
  const [principal, setPrincipal] = useState("");
  const [role, setRole] = useState("");

  function handleAssign() {
    if (!principal || !role) return;
    toast.success(`Role "${role}" assigned to ${principal}`);
    setPrincipal("");
    setRole("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Assign User Roles</h1>
        <p className="text-sm text-muted-foreground">
          Set roles for users by their principal ID
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 shadow-xs max-w-md">
        <div className="space-y-4">
          <div>
            <Label>Principal ID</Label>
            <Input
              data-ocid="roles.principal.input"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="e.g. aaaaa-bbbbb-ccccc"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-ocid="roles.role.select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {["SuperAdmin", "Registrar", "HOD", "Lecturer", "Student"].map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            data-ocid="roles.submit_button"
            onClick={handleAssign}
            className="w-full bg-primary text-primary-foreground"
            disabled={!principal || !role}
          >
            Assign Role
          </Button>
        </div>
      </div>
    </div>
  );
}

function CourseManagementTab() {
  const { courses, departments, addCourse, updateCourse, removeCourse } =
    useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    credits: "3",
    deptId: "",
    lecturer: "",
    semester: "First",
  });

  function resetForm() {
    setForm({
      name: "",
      code: "",
      credits: "3",
      deptId: "",
      lecturer: "",
      semester: "First",
    });
    setEditing(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({
      name: course.name,
      code: course.code,
      credits: String(course.creditUnits),
      deptId: String(course.departmentId),
      lecturer: course.lecturerPrincipal,
      semester: course.semester,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.code || !form.deptId) {
      toast.error("Name, code, and department are required");
      return;
    }
    const courseData: Course = {
      id: editing?.id ?? BigInt(Date.now()),
      name: form.name,
      code: form.code,
      creditUnits: BigInt(form.credits),
      departmentId: BigInt(form.deptId),
      lecturerPrincipal: form.lecturer || "unassigned",
      semester: form.semester,
    };
    if (editing) {
      updateCourse(courseData);
      toast.success("Course updated");
    } else {
      addCourse(courseData);
      toast.success("Course added");
    }
    resetForm();
    setOpen(false);
  }

  function handleDelete(id: bigint) {
    removeCourse(id);
    toast.success("Course removed");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Course Management</h1>
          <p className="text-sm text-muted-foreground">
            {courses.length} courses
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            if (!v) resetForm();
            setOpen(v);
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="coursemgmt.open_modal_button"
              size="sm"
              onClick={openAdd}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="coursemgmt.dialog">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Course" : "New Course"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Course Name</Label>
                <Input
                  data-ocid="coursemgmt.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Data Structures"
                />
              </div>
              <div>
                <Label>Course Code</Label>
                <Input
                  data-ocid="coursemgmt.code.input"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="e.g. CSC301"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Credit Units</Label>
                  <Select
                    value={form.credits}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, credits: v }))
                    }
                  >
                    <SelectTrigger data-ocid="coursemgmt.credits.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4", "6"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c} unit{c !== "1" ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={form.semester}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, semester: v }))
                    }
                  >
                    <SelectTrigger data-ocid="coursemgmt.semester.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First">First</SelectItem>
                      <SelectItem value="Second">Second</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  value={form.deptId}
                  onValueChange={(v) => setForm((f) => ({ ...f, deptId: v }))}
                >
                  <SelectTrigger data-ocid="coursemgmt.dept.select">
                    <SelectValue placeholder="Select department" />
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
              <div>
                <Label>Lecturer Principal (optional)</Label>
                <Input
                  data-ocid="coursemgmt.lecturer.input"
                  value={form.lecturer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lecturer: e.target.value }))
                  }
                  placeholder="e.g. lecturer-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="coursemgmt.cancel_button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                data-ocid="coursemgmt.save_button"
                onClick={handleSave}
                className="bg-primary text-primary-foreground"
              >
                {editing ? "Save Changes" : "Add Course"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                  data-ocid="coursemgmt.empty_state"
                >
                  No courses yet
                </TableCell>
              </TableRow>
            )}
            {courses.map((c, i) => {
              const dept = departments.find((d) => d.id === c.departmentId);
              return (
                <TableRow
                  key={String(c.id)}
                  data-ocid={`coursemgmt.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {c.code}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {dept?.name ?? "-"}
                  </TableCell>
                  <TableCell>{String(c.creditUnits)}</TableCell>
                  <TableCell>{c.semester}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.lecturerPrincipal}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`coursemgmt.edit_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(c)}
                        className="h-7 text-xs"
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button
                        data-ocid={`coursemgmt.delete_button.${i + 1}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(c.id)}
                        className="h-7 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AcademicCalendarTab() {
  const { academicCalendars, addAcademicCalendar, setActiveCalendar } =
    useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    session: "",
    semester: "First" as "First" | "Second",
    startDate: "",
    endDate: "",
  });

  function handleAdd() {
    if (!form.session || !form.startDate || !form.endDate) {
      toast.error("All fields are required");
      return;
    }
    const cal: AcademicCalendar = {
      id: BigInt(Date.now()),
      session: form.session,
      semester: form.semester,
      isActive: false,
      startDate: form.startDate,
      endDate: form.endDate,
    };
    addAcademicCalendar(cal);
    setForm({ session: "", semester: "First", startDate: "", endDate: "" });
    setOpen(false);
    toast.success("Academic calendar added");
  }

  function handleSetActive(id: bigint) {
    setActiveCalendar(id);
    toast.success("Active calendar updated");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Academic Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage sessions and active semesters
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="calendar.open_modal_button"
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Session
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="calendar.dialog">
            <DialogHeader>
              <DialogTitle>New Academic Session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Session (e.g. 2024/2025)</Label>
                <Input
                  data-ocid="calendar.session.input"
                  value={form.session}
                  onChange={(e) =>
                    setForm({ ...form, session: e.target.value })
                  }
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <Label>Semester</Label>
                <Select
                  value={form.semester}
                  onValueChange={(v) =>
                    setForm({ ...form, semester: v as "First" | "Second" })
                  }
                >
                  <SelectTrigger data-ocid="calendar.semester.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First</SelectItem>
                    <SelectItem value="Second">Second</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    data-ocid="calendar.start_date.input"
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    data-ocid="calendar.end_date.input"
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                data-ocid="calendar.cancel_button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="calendar.submit_button"
                onClick={handleAdd}
                className="bg-primary text-primary-foreground"
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {academicCalendars.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="calendar.empty_state"
                >
                  No academic calendars yet
                </TableCell>
              </TableRow>
            )}
            {academicCalendars.map((cal, i) => (
              <TableRow
                key={String(cal.id)}
                data-ocid={`calendar.item.${i + 1}`}
                className={cal.isActive ? "bg-success/5" : ""}
              >
                <TableCell className="font-semibold">{cal.session}</TableCell>
                <TableCell>{cal.semester}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cal.startDate}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {cal.endDate}
                </TableCell>
                <TableCell>
                  {cal.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/20">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {!cal.isActive && (
                    <Button
                      data-ocid={`calendar.set_active_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetActive(cal.id)}
                      className="h-7 text-xs"
                    >
                      Set Active
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

function AuditLogTab() {
  const { auditLog } = useApp();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const roles = Array.from(new Set(auditLog.map((e) => e.actorRole))).filter(
    Boolean,
  );

  const filtered = auditLog.filter((entry) => {
    const matchSearch =
      !search ||
      entry.actorName.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.details.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || entry.actorRole === roleFilter;
    const matchDate = !dateFilter || entry.timestamp.startsWith(dateFilter);
    return matchSearch && matchRole && matchDate;
  });

  function handleDownload() {
    const header = "Timestamp,Actor,Role,Action,Details";
    const rows = filtered.map((e) =>
      [
        e.timestamp,
        `"${e.actorName}"`,
        e.actorRole,
        `"${e.action}"`,
        `"${e.details}"`,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit_log.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log downloaded");
  }

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} entries
          </p>
        </div>
        <Button
          data-ocid="audit.download_button"
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" /> Download CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          data-ocid="audit.search_input"
          placeholder="Search by actor, action, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-8 text-sm"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger
            data-ocid="audit.role.select"
            className="w-40 h-8 text-sm"
          >
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          data-ocid="audit.date.input"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-40 h-8 text-sm"
        />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                  data-ocid="audit.empty_state"
                >
                  No audit entries found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((entry, i) => (
              <TableRow
                key={String(entry.id)}
                data-ocid={`audit.item.${i + 1}`}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {fmt(entry.timestamp)}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {entry.actorName}
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {entry.actorRole}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {entry.action}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {entry.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
