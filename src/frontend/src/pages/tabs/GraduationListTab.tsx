import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getDegreeClassification,
  getStudentDepartment,
  useApp,
} from "../../context/AppContext";

export default function GraduationListTab() {
  const { students, results, courses, departments, institutionSettings } =
    useApp();

  const [filterDept, setFilterDept] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterClass, setFilterClass] = useState("all");

  const graduated = useMemo(() => {
    function calcCGPA(studentId: string) {
      const sr = results.filter(
        (r) =>
          String(r.studentId) === studentId &&
          ["approved", "published"].includes(r.status),
      );
      let totalGP = 0;
      let totalCU = 0;
      for (const r of sr) {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        const cu = course ? Number(course.creditUnits) : 1;
        totalGP += (r.gradePoint ?? 0) * cu;
        totalCU += cu;
      }
      return totalCU > 0 ? Math.round((totalGP / totalCU) * 100) / 100 : 0;
    }
    return students
      .filter((s) => s.status === "Graduated")
      .map((s) => {
        const cgpa = calcCGPA(String(s.id));
        const degreeClass = getDegreeClassification(cgpa);
        const dept = getStudentDepartment(s, departments);
        return { student: s, cgpa, degreeClass, dept };
      })
      .filter((g) => {
        if (
          filterDept !== "all" &&
          String(g.student.departmentId) !== filterDept
        )
          return false;
        if (filterLevel !== "all" && String(g.student.level) !== filterLevel)
          return false;
        if (filterClass !== "all" && g.degreeClass !== filterClass)
          return false;
        return true;
      })
      .sort((a, b) => {
        const dA = a.dept?.name ?? "";
        const dB = b.dept?.name ?? "";
        if (dA !== dB) return dA.localeCompare(dB);
        return b.cgpa - a.cgpa;
      });
  }, [
    students,
    results,
    courses,
    departments,
    filterDept,
    filterLevel,
    filterClass,
  ]);

  const degreeClasses = [
    "First Class",
    "Second Class Upper",
    "Second Class Lower",
    "Third Class",
    "Pass",
    "Fail",
  ];

  function exportCSV() {
    const rows = [
      [
        "S/No",
        "Matric No",
        "Name",
        "Department",
        "Level",
        "CGPA",
        "Degree Class",
      ],
      ...graduated.map((g, i) => [
        i + 1,
        g.student.matricNumber,
        g.student.name,
        g.dept?.name ?? "",
        g.student.level,
        g.cgpa.toFixed(2),
        g.degreeClass,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graduation-list-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const classColor: Record<string, string> = {
    "First Class": "bg-success/10 text-success border-success/20",
    "Second Class Upper": "bg-primary/10 text-primary border-primary/20",
    "Second Class Lower": "bg-accent/10 text-accent border-accent/20",
    "Third Class": "bg-warning/10 text-warning border-warning/20",
    Pass: "bg-muted text-muted-foreground border-border",
    Fail: "bg-destructive/10 text-destructive border-destructive/20",
  };

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map<string, typeof graduated>();
    for (const g of graduated) {
      const key = g.dept?.name ?? "Unknown Department";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return map;
  }, [graduated]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Graduation List</h2>
          <p className="text-sm text-muted-foreground">
            Official list of graduating students
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            data-ocid="grad_list.export_button"
            onClick={exportCSV}
          >
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-ocid="grad_list.print_button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 no-print">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48" data-ocid="grad_list.dept.select">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={String(d.id)} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-32" data-ocid="grad_list.level.select">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {[400, 500, 600].map((l) => (
              <SelectItem key={l} value={String(l)}>
                Level {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-44" data-ocid="grad_list.class.select">
            <SelectValue placeholder="All Degree Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Degree Classes</SelectItem>
            {degreeClasses.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Report Print Header */}
      <div className="print-show hidden print:block text-center mb-6">
        <h1 className="text-lg font-bold">{institutionSettings.name}</h1>
        <p className="text-sm">List of Graduating Students</p>
        <p className="text-xs">Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {graduated.length === 0 ? (
        <div
          className="text-center text-muted-foreground py-12 border border-border rounded-xl"
          data-ocid="grad_list.empty_state"
        >
          No graduated students found with current filters.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([deptName, deptGrads]) => (
          <div key={deptName} className="space-y-3">
            <h3 className="font-semibold text-base border-b border-border pb-2">
              {deptName}
            </h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S/No</TableHead>
                    <TableHead>Matric No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>CGPA</TableHead>
                    <TableHead>Degree Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptGrads.map((g, i) => (
                    <TableRow
                      key={String(g.student.id)}
                      data-ocid={`grad_list.item.${i + 1}`}
                    >
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {g.student.matricNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {g.student.name}
                      </TableCell>
                      <TableCell>{String(g.student.level)}</TableCell>
                      <TableCell className="font-semibold">
                        {g.cgpa.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${classColor[g.degreeClass] ?? ""}`}
                        >
                          {g.degreeClass}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
