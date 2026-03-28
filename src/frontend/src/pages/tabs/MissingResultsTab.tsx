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
import { Bell, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function MissingResultsTab() {
  const {
    courses,
    results,
    departments,
    courseRegistrations,
    staffMembers,
    currentUser,
    addNotification,
  } = useApp();

  const [filterDept, setFilterDept] = useState("all");
  const hodDeptId = (currentUser as any)?.departmentId;

  const missingCourses = useMemo(() => {
    // Courses that have registrations but zero result entries
    const coursesWithRegistrations = new Set(
      courseRegistrations.map((cr) => String(cr.courseId)),
    );
    const coursesWithResults = new Set(results.map((r) => String(r.courseId)));

    return courses
      .filter((c) => {
        const hasCourseReg = coursesWithRegistrations.has(String(c.id));
        const hasResult = coursesWithResults.has(String(c.id));
        return hasCourseReg && !hasResult;
      })
      .map((c) => {
        const dept = departments.find(
          (d) => String(d.id) === String((c as any).departmentId),
        );
        // Find assigned lecturer
        const lecturer = staffMembers.find(
          (s) =>
            s.role === "Lecturer" &&
            (s as any).assignedCourseIds?.includes(String(c.id)),
        );
        return { course: c, dept, lecturer };
      })
      .filter(({ dept }) => {
        if (currentUser?.role === "HOD" && hodDeptId) {
          return dept && String(dept.id) === String(hodDeptId);
        }
        if (filterDept !== "all") {
          return dept && String(dept.id) === filterDept;
        }
        return true;
      });
  }, [
    courses,
    results,
    courseRegistrations,
    departments,
    staffMembers,
    currentUser,
    hodDeptId,
    filterDept,
  ]);

  function notifyLecturer(courseName: string, lecturerId?: string) {
    if (!lecturerId) {
      toast.warning("No lecturer assigned to this course.");
      return;
    }
    addNotification(
      "Lecturer",
      `Reminder: Results for ${courseName} have not been entered. Please submit scores.`,
      "score_sheet",
    );
    toast.success("Notification sent to lecturer.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SearchX className="w-5 h-5 text-destructive" />
        <h2 className="text-lg font-semibold">Missing Results</h2>
        {missingCourses.length > 0 && (
          <Badge variant="destructive">{missingCourses.length}</Badge>
        )}
      </div>

      {currentUser?.role !== "HOD" && (
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-48" data-ocid="missing.dept.select">
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
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Courses Without Score Entries ({missingCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {missingCourses.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-ocid="missing.empty_state"
            >
              ✅ All registered courses have score entries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Assigned Lecturer</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingCourses.map(({ course, dept, lecturer }, idx) => (
                    <TableRow
                      key={String(course.id)}
                      data-ocid={`missing.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs font-semibold">
                        {course.code}
                      </TableCell>
                      <TableCell>{course.name}</TableCell>
                      <TableCell className="text-xs">
                        {dept?.name ?? "—"}
                      </TableCell>
                      <TableCell>{(course as any).level}</TableCell>
                      <TableCell className="text-xs">
                        {lecturer?.name ?? (
                          <span className="text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          data-ocid={`missing.notify_button.${idx + 1}`}
                          onClick={() =>
                            notifyLecturer(
                              `${course.code} — ${course.name}`,
                              lecturer ? String(lecturer.id) : undefined,
                            )
                          }
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          Notify Lecturer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
