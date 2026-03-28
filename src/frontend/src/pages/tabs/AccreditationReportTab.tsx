import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { BarChart3, BookOpen, Building2, Printer, Users } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";

const FACILITIES = [
  "Library",
  "Computer Laboratory",
  "Science Laboratory",
  "Internet Access",
  "Lecture Hall",
  "Staff Offices",
  "Research Facilities",
  "Student Common Room",
  "E-Library",
  "Audio-Visual Room",
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

  // enrolment by level
  const levels = ["100", "200", "300", "400", "500", "600"];
  const enrolmentByLevel = levels
    .map((lvl) => ({
      level: lvl,
      count: deptStudents.filter((s) => {
        const l = (s as any).level ?? "100";
        return String(l) === lvl;
      }).length,
    }))
    .filter((e) => e.count > 0);

  // pass rate summary
  const deptResults = results.filter((r) => {
    const c = deptCourses.find((c) => String(c.id) === String(r.courseId));
    return !!c && r.status === "published";
  });
  const total = deptResults.length;
  const passed = deptResults.filter((r) => r.grade !== "F").length;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Accreditation Report</h2>
        <Badge variant="outline">NUC/NCCE Format</Badge>
      </div>

      {!generated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Generate Report</CardTitle>
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
              Generate Report
            </Button>
          </CardContent>
        </Card>
      )}

      {generated && dept && (
        <div id="accreditation-report" className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <Button variant="outline" onClick={() => setGenerated(false)}>
              ← Back
            </Button>
            <Button
              data-ocid="accreditation.print.button"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>

          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">{institutionSettings.name}</h1>
            <p className="text-lg font-semibold mt-1">
              Departmental Accreditation Report
            </p>
            <p className="text-muted-foreground">
              {selSession} Academic Session
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department Overview
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Academic Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deptStaff.length === 0 ? (
                <p className="text-muted-foreground">No staff records.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Staff ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deptStaff.map((s, i) => (
                      <TableRow
                        key={s.staffId}
                        data-ocid={`accreditation.staff.item.${i + 1}`}
                      >
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.role}</TableCell>
                        <TableCell>{s.staffId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Student Enrolment by Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Level</TableHead>
                    <TableHead>Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolmentByLevel.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        No enrolment data
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrolmentByLevel.map((e) => (
                      <TableRow key={e.level}>
                        <TableCell>{e.level} Level</TableCell>
                        <TableCell>{e.count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Course Load Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>CU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptCourses.slice(0, 20).map((c) => (
                    <TableRow key={String(c.id)}>
                      <TableCell>{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.semester}</TableCell>
                      <TableCell>{Number(c.creditUnits)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Result Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                <b>Total Results Published:</b> {total}
              </div>
              <div>
                <b>Pass Count:</b> {passed}
              </div>
              <div>
                <b>Pass Rate:</b> {passRate}%
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
                        <Badge
                          variant={facilities[f] ? "default" : "destructive"}
                        >
                          {facilities[f] ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
