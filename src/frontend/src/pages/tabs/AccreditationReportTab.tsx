import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Printer,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { useApp } from "../../context/AppContext";

const FACILITIES = [
  "Library / Digital Library",
  "Computer Laboratory",
  "Science Laboratory",
  "Internet Access / Wi-Fi",
  "Lecture Halls / Classrooms",
  "Staff Offices",
  "Research Facilities",
  "Student Common Room",
  "E-Library / Virtual Resources",
  "Audio-Visual Room",
  "Hostel / Accommodation",
  "Medical / Health Centre",
];

const NUC_COMPLIANCE = [
  { id: "c1", label: "Adequate teaching staff (minimum 40% PhD holders)" },
  { id: "c2", label: "Staff-student ratio within NUC benchmark (1:30 max)" },
  { id: "c3", label: "Minimum 70% pass rate across all courses" },
  { id: "c4", label: "Functional laboratory/studio facilities" },
  {
    id: "c5",
    label: "Adequate library resources (textbooks + digital resources)",
  },
  { id: "c6", label: "Approved programme curriculum in place" },
  { id: "c7", label: "Evidence of research output (publications/projects)" },
  { id: "c8", label: "Functional examination/assessment system" },
  {
    id: "c9",
    label: "Student industrial work experience scheme (SIWES) in place",
  },
  {
    id: "c10",
    label: "Adequate ICT infrastructure (internet, computers, LMS)",
  },
];

const PLO_DEFAULTS = [
  "Apply knowledge of computing and mathematics appropriate to the discipline.",
  "Analyze a problem and identify computing requirements for appropriate solution.",
  "Design, implement, and evaluate a computer-based system, process, or programme.",
  "Function effectively on teams to accomplish common goals.",
  "Understand professional, ethical, legal, security, and social issues in computing.",
  "Communicate effectively with a range of audiences.",
  "Analyze the local and global impact of computing on individuals, organizations, and society.",
  "Engage in continuing professional development and life-long learning.",
];

export default function AccreditationReportTab() {
  const {
    departments,
    faculties,
    courses,
    students,
    results,
    staffMembers,
    academicCalendars,
    institutionSettings,
  } = useApp();

  const [selDept, setSelDept] = useState("");
  const [selSession, setSelSession] = useState("");
  const [facilities, setFacilities] = useState<Record<string, boolean>>(
    Object.fromEntries(FACILITIES.map((f) => [f, true])),
  );
  const [compliance, setCompliance] = useState<Record<string, boolean>>(
    Object.fromEntries(NUC_COMPLIANCE.map((c) => [c.id, true])),
  );
  const [complianceComments, setComplianceComments] = useState<
    Record<string, string>
  >({});
  const [plos, setPlos] = useState<string[]>(PLO_DEFAULTS.slice());
  const [generated, setGenerated] = useState(false);

  const sessions = [...new Set(academicCalendars.map((c) => c.session))];
  const dept = departments.find((d) => String(d.id) === selDept);
  const faculty = dept
    ? faculties.find((f) => String(f.id) === String(dept.facultyId))
    : null;
  const deptCourses = courses.filter((c) => String(c.departmentId) === selDept);
  const deptStudents = students.filter(
    (s) => String(s.departmentId) === selDept,
  );
  const deptStaff = staffMembers.filter(
    (s) => String(s.departmentId) === selDept,
  );
  const hod = deptStaff.find((s) => s.role === "HOD");

  // Enrolment by level + gender
  const levels = ["100", "200", "300", "400", "500", "600"];
  const enrolmentData = useMemo(
    () =>
      levels
        .map((lvl) => {
          const lvlStudents = deptStudents.filter((s) => {
            const l = (s as any).level ?? "100";
            return String(l) === lvl;
          });
          const male = lvlStudents.filter((s) =>
            ["Male", "M"].includes((s as any).gender ?? ""),
          ).length;
          const female = lvlStudents.filter((s) =>
            ["Female", "F"].includes((s as any).gender ?? ""),
          ).length;
          return {
            level: `${lvl}L`,
            male,
            female,
            total: lvlStudents.length,
          };
        })
        .filter((e) => e.total > 0),
    [deptStudents],
  );

  // Graduation rates by session
  const graduationData = useMemo(() => {
    const sessionMap: Record<string, { graduates: number; total: number }> = {};
    for (const s of deptStudents) {
      const session = (s as any).admissionSession ?? "2024/2025";
      if (!sessionMap[session])
        sessionMap[session] = { graduates: 0, total: 0 };
      sessionMap[session].total++;
      if (s.status === "Graduated" || s.status === "graduated")
        sessionMap[session].graduates++;
    }
    return Object.entries(sessionMap).map(([session, d]) => ({
      session,
      graduates: d.graduates,
      total: d.total,
      rate: d.total > 0 ? ((d.graduates / d.total) * 100).toFixed(1) : "0",
    }));
  }, [deptStudents]);

  // Result statistics per course
  const deptResults = useMemo(
    () =>
      results.filter((r) => {
        const c = deptCourses.find((c) => String(c.id) === String(r.courseId));
        return !!c && r.status === "published";
      }),
    [results, deptCourses],
  );

  const courseStats = useMemo(() => {
    const map: Record<
      string,
      { code: string; name: string; total: number; passed: number; sum: number }
    > = {};
    for (const r of deptResults) {
      const c = deptCourses.find((c) => String(c.id) === String(r.courseId));
      if (!c) continue;
      const key = String(c.id);
      if (!map[key])
        map[key] = { code: c.code, name: c.name, total: 0, passed: 0, sum: 0 };
      map[key].total++;
      if (r.grade !== "F") map[key].passed++;
      map[key].sum += r.totalScore ?? 0;
    }
    return Object.values(map).map((s) => ({
      ...s,
      passRate: s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) : "0",
      mean: s.total > 0 ? (s.sum / s.total).toFixed(1) : "0",
    }));
  }, [deptResults, deptCourses]);

  const totalPassed = deptResults.filter((r) => r.grade !== "F").length;
  const overallPassRate =
    deptResults.length > 0
      ? ((totalPassed / deptResults.length) * 100).toFixed(1)
      : "0";

  // Grade distribution
  const gradeData = useMemo(() => {
    const grades: Record<string, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };
    for (const r of deptResults) {
      if (r.grade in grades) grades[r.grade]++;
    }
    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }, [deptResults]);

  const GRADE_COLORS: Record<string, string> = {
    A: "#22c55e",
    B: "#3b82f6",
    C: "#f59e0b",
    D: "#f97316",
    E: "#ef4444",
    F: "#dc2626",
  };

  const complianceMet = Object.values(compliance).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Accreditation Report</h2>
        <Badge variant="outline">NUC/NCCE Self-Study Format</Badge>
      </div>

      {!generated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Generate Accreditation Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Department</Label>
                <Select value={selDept} onValueChange={setSelDept}>
                  <SelectTrigger data-ocid="accreditation.dept.select">
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
              <div className="space-y-1">
                <Label>Academic Session</Label>
                <Select value={selSession} onValueChange={setSelSession}>
                  <SelectTrigger data-ocid="accreditation.session.select">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                    <SelectItem value="2024/2025">2024/2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Facilities Available
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {FACILITIES.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Checkbox
                      id={`fac-${f}`}
                      checked={facilities[f]}
                      onCheckedChange={(v) =>
                        setFacilities((prev) => ({ ...prev, [f]: !!v }))
                      }
                    />
                    <Label htmlFor={`fac-${f}`} className="font-normal text-sm">
                      {f}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              data-ocid="accreditation.generate.button"
              onClick={() => setGenerated(true)}
              disabled={!selDept || !selSession}
            >
              Generate Full Report
            </Button>
          </CardContent>
        </Card>
      )}

      {generated && dept && (
        <div id="accreditation-report" className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <Button variant="outline" onClick={() => setGenerated(false)}>
              ← Back to Setup
            </Button>
            <Button
              data-ocid="accreditation.print.button"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Entire Report
            </Button>
          </div>

          {/* Report Header */}
          <div className="text-center border-b pb-4 print:border-black">
            <h1 className="text-2xl font-bold uppercase">
              {institutionSettings.name ||
                "Federal University of Education, Kontagora"}
            </h1>
            <p className="text-lg font-semibold mt-1">
              DEPARTMENTAL SELF-STUDY ACCREDITATION REPORT
            </p>
            <p className="font-medium">
              {dept.name} — {faculty?.name ?? ""}
            </p>
            <p className="text-muted-foreground">
              {selSession} Academic Session
            </p>
            <p className="text-xs text-muted-foreground">
              Prepared in compliance with NUC/NCCE Accreditation Guidelines
            </p>
          </div>

          {/* Tabbed Sections */}
          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger
                value="overview"
                data-ocid="accreditation.overview.tab"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="enrolment"
                data-ocid="accreditation.enrolment.tab"
              >
                Enrolment
              </TabsTrigger>
              <TabsTrigger
                value="graduation"
                data-ocid="accreditation.graduation.tab"
              >
                Graduation Rates
              </TabsTrigger>
              <TabsTrigger value="staff" data-ocid="accreditation.staff.tab">
                Staff Qualifications
              </TabsTrigger>
              <TabsTrigger
                value="result_stats"
                data-ocid="accreditation.result_stats.tab"
              >
                Result Statistics
              </TabsTrigger>
              <TabsTrigger value="plo" data-ocid="accreditation.plo.tab">
                Learning Outcomes
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                data-ocid="accreditation.compliance.tab"
              >
                NUC Compliance
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Department Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <b>Department:</b> {dept.name}
                  </div>
                  <div>
                    <b>Faculty:</b> {faculty?.name ?? "N/A"}
                  </div>
                  <div>
                    <b>HOD:</b> {hod?.name ?? "N/A"}
                  </div>
                  <div>
                    <b>Session:</b> {selSession}
                  </div>
                  <div>
                    <b>Total Staff:</b> {deptStaff.length}
                  </div>
                  <div>
                    <b>Total Students:</b> {deptStudents.length}
                  </div>
                  <div>
                    <b>Total Courses:</b> {deptCourses.length}
                  </div>
                  <div>
                    <b>Overall Pass Rate:</b> {overallPassRate}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Course Load Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>CU</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deptCourses.slice(0, 30).map((c) => (
                          <TableRow key={String(c.id)}>
                            <TableCell className="font-mono text-xs">
                              {c.code}
                            </TableCell>
                            <TableCell className="text-xs">{c.name}</TableCell>
                            <TableCell className="text-xs">
                              {String((c as any).level ?? "")}L
                            </TableCell>
                            <TableCell className="text-xs">
                              {c.semester}
                            </TableCell>
                            <TableCell className="text-xs">
                              {Number(c.creditUnits)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  (c as any).isCore ? "default" : "secondary"
                                }
                                className="text-xs"
                              >
                                {(c as any).isCore ? "Core" : "Elective"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Facilities Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facility</TableHead>
                        <TableHead>Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {FACILITIES.map((f) => (
                        <TableRow key={f}>
                          <TableCell>{f}</TableCell>
                          <TableCell>
                            {facilities[f] ? (
                              <span className="flex items-center gap-1 text-success text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-destructive text-xs">
                                <XCircle className="w-3.5 h-3.5" /> No
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ENROLMENT STATISTICS */}
            <TabsContent value="enrolment" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Student Enrolment Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table data-ocid="accreditation.enrolment.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Level</TableHead>
                        <TableHead>Male</TableHead>
                        <TableHead>Female</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>% F</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrolmentData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground"
                            data-ocid="accreditation.enrolment.empty_state"
                          >
                            No enrolment data
                          </TableCell>
                        </TableRow>
                      ) : (
                        enrolmentData.map((e, i) => (
                          <TableRow
                            key={e.level}
                            data-ocid={`accreditation.enrolment.item.${i + 1}`}
                          >
                            <TableCell>{e.level}</TableCell>
                            <TableCell>{e.male}</TableCell>
                            <TableCell>{e.female}</TableCell>
                            <TableCell className="font-semibold">
                              {e.total}
                            </TableCell>
                            <TableCell>
                              {e.total > 0
                                ? ((e.female / e.total) * 100).toFixed(0)
                                : 0}
                              %
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {enrolmentData.length > 0 && (
                        <TableRow className="font-bold bg-muted/30">
                          <TableCell>TOTAL</TableCell>
                          <TableCell>
                            {enrolmentData.reduce((s, e) => s + e.male, 0)}
                          </TableCell>
                          <TableCell>
                            {enrolmentData.reduce((s, e) => s + e.female, 0)}
                          </TableCell>
                          <TableCell>
                            {enrolmentData.reduce((s, e) => s + e.total, 0)}
                          </TableCell>
                          <TableCell>
                            {enrolmentData.reduce((s, e) => s + e.total, 0) > 0
                              ? (
                                  (enrolmentData.reduce(
                                    (s, e) => s + e.female,
                                    0,
                                  ) /
                                    enrolmentData.reduce(
                                      (s, e) => s + e.total,
                                      0,
                                    )) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enrolment by Level Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={enrolmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="male" fill="#3b82f6" name="Male" />
                      <Bar dataKey="female" fill="#ec4899" name="Female" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GRADUATION RATES */}
            <TabsContent value="graduation" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Graduation Rates by
                    Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table data-ocid="accreditation.graduation.table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Total Students</TableHead>
                        <TableHead>Graduates</TableHead>
                        <TableHead>Graduation Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {graduationData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                            data-ocid="accreditation.graduation.empty_state"
                          >
                            No graduation data available
                          </TableCell>
                        </TableRow>
                      ) : (
                        graduationData.map((g, i) => (
                          <TableRow
                            key={g.session}
                            data-ocid={`accreditation.graduation.item.${i + 1}`}
                          >
                            <TableCell>{g.session}</TableCell>
                            <TableCell>{g.total}</TableCell>
                            <TableCell>{g.graduates}</TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
                                  Number(g.rate) >= 70
                                    ? "text-success"
                                    : "text-destructive"
                                }`}
                              >
                                {g.rate}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* STAFF QUALIFICATIONS */}
            <TabsContent value="staff" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Staff Qualifications Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {deptStaff.length === 0 ? (
                    <p
                      className="text-muted-foreground text-sm"
                      data-ocid="accreditation.staff.empty_state"
                    >
                      No staff records for this department.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table data-ocid="accreditation.staff.table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role / Rank</TableHead>
                            <TableHead>Staff ID</TableHead>
                            <TableHead>Qualification</TableHead>
                            <TableHead>Specialization</TableHead>
                            <TableHead>PhD</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deptStaff.map((s, i) => (
                            <TableRow
                              key={s.staffId}
                              data-ocid={`accreditation.staff.item.${i + 1}`}
                            >
                              <TableCell>{i + 1}</TableCell>
                              <TableCell className="font-medium">
                                {s.name}
                              </TableCell>
                              <TableCell>{s.role}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {s.staffId}
                              </TableCell>
                              <TableCell>
                                {(s as any).qualification ?? "N/A"}
                              </TableCell>
                              <TableCell>
                                {(s as any).specialization ??
                                  (s as any).department ??
                                  "General"}
                              </TableCell>
                              <TableCell>
                                {(s as any).qualification
                                  ?.toLowerCase()
                                  .includes("phd") ? (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* RESULT STATISTICS */}
            <TabsContent value="result_stats" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      Total Results
                    </p>
                    <p className="text-3xl font-bold">{deptResults.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Passed</p>
                    <p className="text-3xl font-bold text-success">
                      {totalPassed}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                    <p
                      className={`text-3xl font-bold ${
                        Number(overallPassRate) >= 70
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {overallPassRate}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Grade Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={gradeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Count">
                        {gradeData.map((entry) => (
                          <Cell
                            key={entry.grade}
                            fill={GRADE_COLORS[entry.grade] ?? "#94a3b8"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pass Rate by Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table data-ocid="accreditation.result_stats.table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Entries</TableHead>
                          <TableHead>Passed</TableHead>
                          <TableHead>Pass Rate</TableHead>
                          <TableHead>Mean Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseStats.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center text-muted-foreground"
                            >
                              No published results yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          courseStats.map((s, i) => (
                            <TableRow
                              key={s.code}
                              data-ocid={`accreditation.course_stats.item.${i + 1}`}
                            >
                              <TableCell className="font-mono text-xs">
                                {s.code}
                              </TableCell>
                              <TableCell className="text-xs">
                                {s.name}
                              </TableCell>
                              <TableCell>{s.total}</TableCell>
                              <TableCell>{s.passed}</TableCell>
                              <TableCell>
                                <span
                                  className={`font-semibold ${
                                    Number(s.passRate) >= 70
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {s.passRate}%
                                </span>
                              </TableCell>
                              <TableCell>{s.mean}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROGRAMME LEARNING OUTCOMES */}
            <TabsContent value="plo" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Programme Learning
                    Outcomes (PLOs)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Edit the learning outcomes for the{" "}
                    <strong>{dept.name}</strong> programme:
                  </p>
                  {plos.map((plo, idx) => (
                    <div
                      key={`plo-outcome-${String(idx)}`}
                      className="flex gap-3 items-start"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-10 shrink-0 mt-2.5">
                        PLO {idx + 1}
                      </span>
                      <Textarea
                        rows={2}
                        value={plo}
                        onChange={(e) => {
                          const updated = [...plos];
                          updated[idx] = e.target.value;
                          setPlos(updated);
                        }}
                        className="text-sm"
                        data-ocid={`accreditation.plo.${idx + 1}.textarea`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NUC COMPLIANCE CHECKLIST */}
            <TabsContent value="compliance" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> NUC Minimum Benchmark
                    Compliance Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center gap-2">
                    <Badge
                      variant={complianceMet >= 8 ? "default" : "destructive"}
                    >
                      {complianceMet}/{NUC_COMPLIANCE.length} Benchmarks Met
                    </Badge>
                    {complianceMet >= 8 && (
                      <span className="text-xs text-success">
                        Accreditation Ready
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {NUC_COMPLIANCE.map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            id={`comp-${item.id}`}
                            checked={compliance[item.id]}
                            onCheckedChange={(v) =>
                              setCompliance((prev) => ({
                                ...prev,
                                [item.id]: !!v,
                              }))
                            }
                            data-ocid={`accreditation.compliance.${item.id}.checkbox`}
                          />
                          <Label
                            htmlFor={`comp-${item.id}`}
                            className={`font-normal text-sm ${
                              compliance[item.id]
                                ? "text-foreground"
                                : "text-destructive"
                            }`}
                          >
                            {item.label}
                          </Label>
                        </div>
                        <Input
                          placeholder="Add comment or evidence..."
                          value={complianceComments[item.id] ?? ""}
                          onChange={(e) =>
                            setComplianceComments((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          className="ml-6 h-7 text-xs"
                          data-ocid={`accreditation.compliance.${item.id}.input`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
