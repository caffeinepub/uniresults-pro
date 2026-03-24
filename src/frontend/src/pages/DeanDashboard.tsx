import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Building2,
  CheckCircle,
  ClipboardList,
  Users,
  XCircle,
} from "lucide-react";
import { useContext } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { TabContext } from "../components/Layout";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export default function DeanDashboard() {
  const { activeTab } = useContext(TabContext);
  if (activeTab === "overview") return <OverviewTab />;
  if (activeTab === "approvals") return <ApprovalsTab />;
  if (activeTab === "departments") return <DepartmentsTab />;
  if (activeTab === "results") return <AllResultsTab />;
  return <OverviewTab />;
}

function OverviewTab() {
  const { departments, courses, students, results } = useApp();
  const hodApproved = results.filter((r) => r.status === "hod_approved").length;
  const published = results.filter((r) => r.status === "published").length;

  const gradeData = ["A", "B", "C", "D", "E", "F"].map((g) => ({
    grade: g,
    count: results.filter((r) => r.grade === g).length,
  }));

  const deptData = departments.map((dept) => {
    const deptStudents = students.filter(
      (s) => s.departmentId === dept.id,
    ).length;
    const deptResults = results.filter((r) => {
      const course = courses.find((c) => c.id === r.courseId);
      return course?.departmentId === dept.id;
    });
    const avgScore =
      deptResults.length > 0
        ? deptResults.reduce((sum, r) => sum + r.totalScore, 0) /
          deptResults.length
        : 0;
    return {
      name: dept.name.split(" ")[0],
      students: deptStudents,
      avgScore: Math.round(avgScore),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dean's Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Faculty of Engineering &amp; Sciences
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Approval Workflow
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {["Lecturer", "HOD", "Dean", "Registrar"].map((step, i, arr) => (
            <span key={step} className="inline-flex items-center gap-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  step === "Dean"
                    ? "bg-violet-500/20 text-violet-700"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {step}
              </span>
              {i < arr.length - 1 && (
                <span className="text-muted-foreground text-sm">→</span>
              )}
            </span>
          ))}
        </div>
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
          label="Pending Dean Approval"
          value={hodApproved}
          icon={ClipboardList}
          color="text-warning"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-4">
            Faculty Grade Distribution
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
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <h2 className="text-sm font-semibold mb-4">Department Comparison</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deptData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.93 0.01 250)"
              />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="students"
                name="Students"
                fill="oklch(0.61 0.15 250)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="avgScore"
                name="Avg Score"
                fill="oklch(0.70 0.15 150)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <p className="text-xs text-muted-foreground mb-1">
            Awaiting Dean Approval (HOD Approved)
          </p>
          <p className="text-3xl font-bold text-warning">{hodApproved}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <p className="text-xs text-muted-foreground mb-1">
            Published Results
          </p>
          <p className="text-3xl font-bold text-success">{published}</p>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab() {
  const {
    results,
    courses,
    students,
    updateResultStatus,
    amendmentRequests,
    updateAmendmentStatus,
    rejectAmendment,
  } = useApp();
  const pending = results.filter((r) => r.status === "hod_approved");
  const pendingAmendments = amendmentRequests.filter(
    (a) => a.status === "pending_dean",
  );

  function handleApprove(id: bigint) {
    updateResultStatus(id, "dean_approved");
    toast.success("Result approved by Dean — forwarded to Registrar");
  }

  function handleReject(id: bigint) {
    updateResultStatus(id, "submitted");
    toast.error("Result returned to HOD for review");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Faculty Approvals</h1>
        <p className="text-sm text-muted-foreground">
          {pending.length} result{pending.length !== 1 ? "s" : ""} awaiting Dean
          approval — will forward to Registrar
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Matric No.</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="approvals.empty_state"
                >
                  No results pending Dean approval
                </TableCell>
              </TableRow>
            )}
            {pending.map((r, i) => {
              const student = students.find((s) => s.id === r.studentId);
              const course = courses.find((c) => c.id === r.courseId);
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`approvals.item.${i + 1}`}
                >
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {student?.matricNumber ?? "-"}
                  </TableCell>
                  <TableCell>{course?.code ?? "-"}</TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell className="font-bold">{r.grade}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.remarks}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`approvals.confirm_button.${i + 1}`}
                        size="sm"
                        onClick={() => handleApprove(r.id)}
                        className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve → Registrar
                      </Button>
                      <Button
                        data-ocid={`approvals.delete_button.${i + 1}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(r.id)}
                        className="h-7 text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Return to HOD
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Amendment Requests */}
      {pendingAmendments.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Amendment Requests</h2>
            <p className="text-sm text-muted-foreground">
              {pendingAmendments.length} amendment
              {pendingAmendments.length !== 1 ? "s" : ""} forwarded by HOD
            </p>
          </div>
          <div className="bg-card rounded-xl border border-amber-200 shadow-xs">
            <div className="p-3 bg-amber-50 border-b border-amber-200 rounded-t-xl">
              <p className="text-xs font-semibold text-amber-700">
                ⚠️ Score Amendment Requests (HOD Approved)
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Proposed</TableHead>
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
                      data-ocid={`dean_amendments.item.${i + 1}`}
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
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {a.reason}
                      </TableCell>
                      <TableCell className="text-xs">
                        {a.lecturerName}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            data-ocid={`dean_amendments.confirm_button.${i + 1}`}
                            size="sm"
                            onClick={() =>
                              updateAmendmentStatus(a.id, "pending_registrar")
                            }
                            className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            data-ocid={`dean_amendments.delete_button.${i + 1}`}
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
        </div>
      )}
    </div>
  );
}

function DepartmentsTab() {
  const { departments, students, courses, results } = useApp();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Departments Overview</h1>
        <p className="text-sm text-muted-foreground">
          Faculty-wide department statistics
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {departments.map((dept, i) => {
          const deptStudents = students.filter(
            (s) => s.departmentId === dept.id,
          );
          const deptCourses = courses.filter((c) => c.departmentId === dept.id);
          const deptResults = results.filter((r) => {
            const course = courses.find((c) => c.id === r.courseId);
            return course?.departmentId === dept.id;
          });
          const passed = deptResults.filter((r) => r.grade !== "F").length;
          const passRate =
            deptResults.length > 0
              ? Math.round((passed / deptResults.length) * 100)
              : 0;
          return (
            <div
              key={String(dept.id)}
              data-ocid={`dept.item.${i + 1}`}
              className="bg-card rounded-xl border border-border p-5 shadow-xs"
            >
              <h2 className="font-semibold mb-3">{dept.name}</h2>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{deptStudents.length}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Courses</p>
                  <p className="text-2xl font-bold">{deptCourses.length}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Results</p>
                  <p className="text-2xl font-bold">{deptResults.length}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                  <p
                    className={`text-2xl font-bold ${
                      passRate >= 70 ? "text-success" : "text-warning"
                    }`}
                  >
                    {passRate}%
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AllResultsTab() {
  const { results, courses, students } = useApp();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">All Faculty Results</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} total results
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border shadow-xs">
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
            {results.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="dean_results.empty_state"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
            {results.map((r, i) => {
              const student = students.find((s) => s.id === r.studentId);
              const course = courses.find((c) => c.id === r.courseId);
              return (
                <TableRow
                  key={String(r.id)}
                  data-ocid={`dean_results.item.${i + 1}`}
                >
                  <TableCell className="font-medium">
                    {student?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course?.code ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium">{r.totalScore}</TableCell>
                  <TableCell className="font-bold">{r.grade}</TableCell>
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
      </div>
    </div>
  );
}
