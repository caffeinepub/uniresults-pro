import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import type { ExtendedStudent } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

interface Props {
  student: ExtendedStudent;
  semester: string;
  session: string;
  onClose: () => void;
}

function classifyDegree(cgpa: number): string {
  if (cgpa >= 4.5) return "First Class Honours";
  if (cgpa >= 3.5) return "Second Class Honours (Upper Division)";
  if (cgpa >= 2.4) return "Second Class Honours (Lower Division)";
  if (cgpa >= 1.5) return "Third Class Honours";
  if (cgpa >= 1.0) return "Pass";
  return "Refer";
}

function getRemarks(cgpa: number, level: string | undefined): string {
  const lvl = Number(level ?? 100);
  if (lvl < 400) {
    if (cgpa >= 3.0) return "Promoted";
    if (cgpa >= 1.5) return "Probation";
    return "Refer";
  }
  return classifyDegree(cgpa);
}

export default function ResultSlipModal({
  student,
  semester,
  session,
  onClose,
}: Props) {
  const { courses, results, departments, institutionSettings } = useApp();

  const dept = departments.find(
    (d) => String(d.id) === String(student.departmentId),
  );

  const semResults = results.filter(
    (r) =>
      String(r.studentId) === String(student.id) &&
      r.status === "published" &&
      (r as any).semester === semester,
  );

  let semWP = 0;
  let semCU = 0;
  for (const r of semResults) {
    const c = courses.find((c) => String(c.id) === String(r.courseId));
    const cu = c ? Number(c.creditUnits) : 0;
    semWP += r.gradePoint * cu;
    semCU += cu;
  }
  const semGPA = semCU > 0 ? (semWP / semCU).toFixed(2) : "0.00";

  const allResults = results.filter(
    (r) =>
      String(r.studentId) === String(student.id) && r.status === "published",
  );
  let totalWP = 0;
  let totalCU = 0;
  for (const r of allResults) {
    const c = courses.find((c) => String(c.id) === String(r.courseId));
    const cu = c ? Number(c.creditUnits) : 0;
    totalWP += r.gradePoint * cu;
    totalCU += cu;
  }
  const cgpa = totalCU > 0 ? totalWP / totalCU : 0;
  const remarks = getRemarks(cgpa, (student as any).level);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Result Slip — {semester} Semester</DialogTitle>
        </DialogHeader>

        <div id="result-slip-print" className="space-y-4 text-sm">
          {/* Header */}
          <div className="text-center border-b pb-3">
            <h1 className="text-xl font-bold">{institutionSettings.name}</h1>
            <p className="font-semibold">Student Result Slip</p>
            <p className="text-muted-foreground">
              {session} Academic Session · {semester} Semester
            </p>
          </div>

          {/* Student info */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <b>Name:</b> {student.name}
            </div>
            <div>
              <b>Matric No:</b> {student.matricNumber}
            </div>
            <div>
              <b>Department:</b> {dept?.name ?? "N/A"}
            </div>
            <div>
              <b>Level:</b> {(student as any).level ?? "N/A"}
            </div>
            <div>
              <b>Programme:</b>{" "}
              {student.programmeType ?? "Undergraduate Full Time"}
            </div>
            <div>
              <b>Session:</b> {session}
            </div>
          </div>

          {/* Results table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course Title</TableHead>
                <TableHead className="text-center">CU</TableHead>
                <TableHead className="text-center">CA</TableHead>
                <TableHead className="text-center">Exam</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semResults.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No published results for this semester.
                  </TableCell>
                </TableRow>
              ) : (
                semResults.map((r) => {
                  const c = courses.find(
                    (c) => String(c.id) === String(r.courseId),
                  );
                  return (
                    <TableRow key={String(r.id)}>
                      <TableCell>{c?.code ?? ""}</TableCell>
                      <TableCell>{c?.name ?? ""}</TableCell>
                      <TableCell className="text-center">
                        {c ? Number(c.creditUnits) : ""}
                      </TableCell>
                      <TableCell className="text-center">{r.caScore}</TableCell>
                      <TableCell className="text-center">
                        {r.examScore}
                      </TableCell>
                      <TableCell className="text-center">
                        {r.totalScore}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {r.grade}
                      </TableCell>
                      <TableCell>
                        {r.grade === "F" ? "Failed" : "Passed"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <b>Semester GPA:</b> {semGPA}
            </div>
            <div>
              <b>Cumulative CGPA:</b> {cgpa.toFixed(2)}
            </div>
            <div>
              <b>Remarks:</b> {remarks}
            </div>
          </div>

          {/* Signature blocks */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="border-t pt-2">
              <b>HOD Signature</b>
              <br />
              <span className="text-xs text-muted-foreground">
                Name: ________________ Date: __________
              </span>
            </div>
            <div className="border-t pt-2">
              <b>Registrar Signature</b>
              <br />
              <span className="text-xs text-muted-foreground">
                Name: ________________ Date: __________
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            data-ocid="result_slip.print.button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Result Slip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
