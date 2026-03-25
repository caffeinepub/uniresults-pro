import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function LecturerPerformanceTab() {
  const { currentUser, staffMembers, courses, results, courseFeedback } =
    useApp();

  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptStaff = staffMembers.filter((s) => s.departmentId === deptId);

  const rows = useMemo(() => {
    return deptStaff.map((staff) => {
      const assignedCourses = courses.filter((c) =>
        staff.courseIds.includes(c.id),
      );
      const courseIds = new Set(assignedCourses.map((c) => c.id));

      const staffResults = results.filter(
        (r) =>
          courseIds.has(r.courseId) &&
          (r.status === "published" || r.status === "approved"),
      );

      const totalStudents = new Set(
        staffResults.map((r) => String(r.studentId)),
      ).size;
      const avgScore =
        staffResults.length > 0
          ? staffResults.reduce((sum, r) => sum + r.totalScore, 0) /
            staffResults.length
          : 0;
      const passed = staffResults.filter((r) => r.grade !== "F").length;
      const passRate =
        staffResults.length > 0 ? (passed / staffResults.length) * 100 : 0;

      const staffFeedback = courseFeedback.filter((f) =>
        assignedCourses.some((c) => c.code === f.courseCode),
      );
      const avgFeedback =
        staffFeedback.length > 0
          ? staffFeedback.reduce((sum, f) => sum + f.rating, 0) /
            staffFeedback.length
          : null;

      return {
        staff,
        assignedCourses,
        totalStudents,
        avgScore,
        passRate,
        avgFeedback,
      };
    });
  }, [deptStaff, courses, results, courseFeedback]);

  function handleDownload() {
    const header =
      "Name,StaffID,Courses,TotalStudents,AvgScore,PassRate,AvgFeedbackRating";
    const lines = rows.map((r) =>
      [
        r.staff.name,
        r.staff.staffId,
        r.assignedCourses.map((c) => c.code).join(" | "),
        r.totalStudents,
        r.avgScore.toFixed(1),
        `${r.passRate.toFixed(1)}%`,
        r.avgFeedback !== null ? r.avgFeedback.toFixed(1) : "N/A",
      ].join(","),
    );
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lecturer_performance.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Report downloaded");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Lecturer Performance</h1>
          <p className="text-sm text-muted-foreground">
            {deptStaff.length} lecturer{deptStaff.length !== 1 ? "s" : ""} in
            department
          </p>
        </div>
        <Button
          data-ocid="lecturer_perf.download_button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4 mr-1" /> Download CSV
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Pass Rate</TableHead>
              <TableHead>Feedback Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="lecturer_perf.empty_state"
                >
                  No staff found in your department.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, i) => (
              <TableRow
                key={String(row.staff.id)}
                data-ocid={`lecturer_perf.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell>
                  <div className="font-medium text-sm">{row.staff.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {row.staff.staffId}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {row.staff.designation}
                </TableCell>
                <TableCell className="text-sm">
                  {row.assignedCourses.length === 0 ? (
                    <span className="text-muted-foreground">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {row.assignedCourses.map((c) => (
                        <span
                          key={c.code}
                          className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono"
                        >
                          {c.code}
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">{row.totalStudents}</TableCell>
                <TableCell className="text-sm">
                  <span
                    className={
                      row.avgScore >= 50 ? "text-success" : "text-destructive"
                    }
                  >
                    {row.avgScore > 0 ? row.avgScore.toFixed(1) : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <span
                    className={
                      row.passRate >= 50 ? "text-success" : "text-destructive"
                    }
                  >
                    {row.totalStudents > 0
                      ? `${row.passRate.toFixed(1)}%`
                      : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {row.avgFeedback !== null ? (
                    <span className="text-yellow-600">
                      {row.avgFeedback.toFixed(1)} ⭐
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No feedback</span>
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
