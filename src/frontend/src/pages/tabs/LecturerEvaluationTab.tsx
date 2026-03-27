import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, Printer, Star, User } from "lucide-react";
import { useMemo, useState } from "react";
import type { LecturerEvaluation } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(value) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold">{value.toFixed(1)}</span>
    </span>
  );
}

const CRITERIA: { key: keyof LecturerEvaluation["scores"]; label: string }[] = [
  { key: "teaching", label: "Teaching" },
  { key: "punctuality", label: "Punctuality" },
  { key: "delivery", label: "Delivery" },
  { key: "accessibility", label: "Accessibility" },
  { key: "overall", label: "Overall" },
];

interface Props {
  userRole: "HOD" | "Dean" | "Registrar" | "SuperAdmin";
  departmentId?: bigint;
}

export default function LecturerEvaluationTab({
  userRole,
  departmentId,
}: Props) {
  const {
    lecturerEvaluations,
    staffMembers,
    academicCalendars,
    departments,
    faculties,
  } = useApp();
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterSession, setFilterSession] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");

  const relevantStaff = useMemo(() => {
    if (userRole === "HOD" && departmentId) {
      return staffMembers.filter(
        (s) => String(s.departmentId) === String(departmentId),
      );
    }
    if (userRole === "Dean" && departmentId) {
      const deptIds = new Set(
        departments
          .filter((d) =>
            faculties.find(
              (f) =>
                String(f.id) === String(d.facultyId) &&
                String(f.id) === String(departmentId),
            ),
          )
          .map((d) => String(d.id)),
      );
      return staffMembers.filter((s) => deptIds.has(String(s.departmentId)));
    }
    return staffMembers;
  }, [staffMembers, userRole, departmentId, departments, faculties]);

  const staffIds = useMemo(
    () => new Set(relevantStaff.map((s) => s.staffId)),
    [relevantStaff],
  );

  const filtered = useMemo(() => {
    return lecturerEvaluations.filter((e) => {
      if (!staffIds.has(e.lecturerId)) return false;
      if (filterStaff !== "all" && e.lecturerId !== filterStaff) return false;
      if (filterSession !== "all" && e.session !== filterSession) return false;
      if (filterSemester !== "all" && e.semester !== filterSemester)
        return false;
      return true;
    });
  }, [
    lecturerEvaluations,
    staffIds,
    filterStaff,
    filterSession,
    filterSemester,
  ]);

  const sessions = useMemo(
    () =>
      [...new Set(academicCalendars.map((c) => c.session))].sort().reverse(),
    [academicCalendars],
  );

  function getAvg(
    evals: LecturerEvaluation[],
    key: keyof LecturerEvaluation["scores"],
  ) {
    if (evals.length === 0) return 0;
    return evals.reduce((sum, e) => sum + e.scores[key], 0) / evals.length;
  }

  function handleExportCSV() {
    const rows = relevantStaff.map((staff) => {
      const evals = filtered.filter((e) => e.lecturerId === staff.staffId);
      return [
        staff.name,
        evals.length,
        ...CRITERIA.map((c) => getAvg(evals, c.key).toFixed(2)),
      ].join(",");
    });
    const csv = `Lecturer,Evaluations,${CRITERIA.map((c) => c.label).join(",")}\n${rows.join("\n")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "lecturer_evaluations.csv";
    a.click();
  }

  const showComments = ["HOD", "Dean", "Registrar", "SuperAdmin"].includes(
    userRole,
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Lecturer Evaluations
          </h1>
          <p className="text-sm text-muted-foreground">
            Confidential student evaluations of teaching staff
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            data-ocid="evaluations.export_button"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="evaluations.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger
            className="w-44 text-xs"
            data-ocid="evaluations.staff.select"
          >
            <SelectValue placeholder="All Lecturers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lecturers</SelectItem>
            {relevantStaff.map((s) => (
              <SelectItem key={s.staffId} value={s.staffId}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger
            className="w-36 text-xs"
            data-ocid="evaluations.session.select"
          >
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger
            className="w-36 text-xs"
            data-ocid="evaluations.semester.select"
          >
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value="First">First Semester</SelectItem>
            <SelectItem value="Second">Second Semester</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relevantStaff.length === 0 && (
          <div
            className="col-span-full py-10 text-center text-muted-foreground"
            data-ocid="evaluations.empty_state"
          >
            No staff found.
          </div>
        )}
        {relevantStaff.map((staff, i) => {
          const evals = filtered.filter((e) => e.lecturerId === staff.staffId);
          const dept = departments.find(
            (d) => String(d.id) === String(staff.departmentId),
          );
          return (
            <Card key={staff.staffId} data-ocid={`evaluations.item.${i + 1}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">
                      {staff.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {staff.designation} · {dept?.name ?? "—"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="mt-1 text-xs w-fit">
                  {evals.length} evaluation{evals.length !== 1 ? "s" : ""}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {evals.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No evaluations yet.
                  </p>
                ) : (
                  CRITERIA.map((c) => (
                    <div
                      key={String(c.key)}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">{c.label}</span>
                      <StarDisplay value={getAvg(evals, c.key)} />
                    </div>
                  ))
                )}
                {showComments && evals.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Comments:
                    </p>
                    {evals
                      .filter((e) => e.comment?.trim())
                      .slice(0, 3)
                      .map((e) => (
                        <p
                          key={e.timestamp}
                          className="text-xs bg-muted/40 rounded p-1.5 italic"
                        >
                          "{e.comment ?? ""}"
                        </p>
                      ))}
                    {evals.filter((e) => e.comment?.trim()).length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{evals.filter((e) => e.comment?.trim()).length - 3}{" "}
                        more…
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-3 bg-muted/30 border-b border-border font-semibold text-sm">
          Detailed Evaluation Table
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lecturer</TableHead>
                <TableHead>Responses</TableHead>
                {CRITERIA.map((c) => (
                  <TableHead key={String(c.key)} className="text-center">
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {relevantStaff.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                    data-ocid="evaluations.table.empty_state"
                  >
                    No data
                  </TableCell>
                </TableRow>
              )}
              {relevantStaff.map((staff) => {
                const evals = filtered.filter(
                  (e) => e.lecturerId === staff.staffId,
                );
                return (
                  <TableRow key={staff.staffId}>
                    <TableCell className="font-medium text-sm">
                      {staff.name}
                    </TableCell>
                    <TableCell>{evals.length}</TableCell>
                    {CRITERIA.map((c) => (
                      <TableCell key={String(c.key)} className="text-center">
                        {evals.length > 0 ? (
                          <StarDisplay value={getAvg(evals, c.key)} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
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
