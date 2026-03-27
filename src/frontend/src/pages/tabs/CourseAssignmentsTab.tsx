import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertTriangle, BookOpen, UserCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function CourseAssignmentsTab() {
  const {
    courses,
    staffMembers,
    departments,
    currentUser,
    updateStaffMember,
    practicalAssignments,
    setPracticalAssignment,
  } = useApp();

  const deptId = currentUser?.departmentId ?? BigInt(1);
  const deptCourses = courses.filter((c) => c.departmentId === deptId);
  const deptStaff = staffMembers.filter((s) => s.departmentId === deptId);

  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const course of deptCourses) {
      const assigned = deptStaff.find((s) =>
        s.courseIds.some((cid) => cid === course.id),
      );
      if (assigned) map[String(course.id)] = String(assigned.id);
    }
    return map;
  });

  const [practicals, setPracticals] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const course of deptCourses) {
      map[String(course.id)] = !!practicalAssignments[String(course.id)];
    }
    return map;
  });

  const [practicalStaff, setPracticalStaff] = useState<Record<string, string>>(
    () => {
      const map: Record<string, string> = {};
      for (const course of deptCourses) {
        if (practicalAssignments[String(course.id)]) {
          map[String(course.id)] = practicalAssignments[String(course.id)];
        }
      }
      return map;
    },
  );

  function getStaffLoad(staffId: string) {
    return deptCourses.filter((c) => assignments[String(c.id)] === staffId)
      .length;
  }

  function handleSave() {
    for (const staff of deptStaff) {
      const assignedCourseIds = deptCourses
        .filter((c) => assignments[String(c.id)] === String(staff.id))
        .map((c) => c.id);
      const otherCourseIds = staff.courseIds.filter(
        (cid) => !deptCourses.some((c) => c.id === cid),
      );
      updateStaffMember({
        ...staff,
        courseIds: [...otherCourseIds, ...assignedCourseIds],
      });
    }
    for (const course of deptCourses) {
      if (practicals[String(course.id)] && practicalStaff[String(course.id)]) {
        setPracticalAssignment(
          String(course.id),
          practicalStaff[String(course.id)],
        );
      }
    }
    toast.success("Course assignments saved");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Course Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Assign lecturers to courses for your department. Mark practical
            courses and assign technical staff.
          </p>
        </div>
        <Button
          data-ocid="course_assignments.save_button"
          onClick={handleSave}
          className="gap-1.5"
        >
          <UserCheck className="w-4 h-4" /> Save Assignments
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">
            {departments.find((d) => String(d.id) === String(deptId))?.name ??
              "Department"}{" "}
            Courses
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Assigned Lecturer</TableHead>
                <TableHead>Practical</TableHead>
                <TableHead>Tech Staff</TableHead>
                <TableHead>Load Warning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deptCourses.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="course_assignments.empty_state"
                  >
                    No courses in this department
                  </TableCell>
                </TableRow>
              )}
              {deptCourses.map((course, i) => {
                const selectedStaffId = assignments[String(course.id)] ?? "";
                const selectedStaff = deptStaff.find(
                  (s) => String(s.id) === selectedStaffId,
                );
                const load = selectedStaffId
                  ? getStaffLoad(selectedStaffId)
                  : 0;
                const overloaded = load >= 4;
                const isPractical = practicals[String(course.id)] ?? false;

                return (
                  <TableRow
                    key={String(course.id)}
                    data-ocid={`course_assignments.item.${i + 1}`}
                    className={overloaded ? "bg-warning/5" : ""}
                  >
                    <TableCell className="font-medium text-sm">
                      {course.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {course.code}
                    </TableCell>
                    <TableCell className="text-sm">
                      {String(course.creditUnits)}
                    </TableCell>
                    <TableCell className="text-sm">{course.semester}</TableCell>
                    <TableCell>
                      <Select
                        value={selectedStaffId}
                        onValueChange={(val) =>
                          setAssignments((prev) => ({
                            ...prev,
                            [String(course.id)]: val,
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid={`course_assignments.select.${i + 1}`}
                          className="w-48 h-8 text-xs"
                        >
                          <SelectValue placeholder="Select lecturer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {deptStaff.map((staff) => (
                            <SelectItem
                              key={String(staff.id)}
                              value={String(staff.id)}
                            >
                              {staff.name} ({staff.designation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          data-ocid={`course_assignments.checkbox.${i + 1}`}
                          checked={isPractical}
                          onCheckedChange={(checked) =>
                            setPracticals((prev) => ({
                              ...prev,
                              [String(course.id)]: !!checked,
                            }))
                          }
                        />
                        {isPractical && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            PRACTICAL
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isPractical && (
                        <Select
                          value={practicalStaff[String(course.id)] ?? ""}
                          onValueChange={(val) =>
                            setPracticalStaff((prev) => ({
                              ...prev,
                              [String(course.id)]: val,
                            }))
                          }
                        >
                          <SelectTrigger
                            className="w-44 h-8 text-xs"
                            data-ocid={`course_assignments.tech.select.${i + 1}`}
                          >
                            <SelectValue placeholder="Tech staff..." />
                          </SelectTrigger>
                          <SelectContent>
                            {staffMembers.map((staff) => (
                              <SelectItem
                                key={String(staff.id)}
                                value={String(staff.id)}
                              >
                                {staff.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {overloaded && (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-warning font-medium"
                          title={`${selectedStaff?.name} has ${load} courses assigned`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Overloaded ({load} courses)
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Staff Load Summary */}
      {deptStaff.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-xs p-4">
          <h3 className="text-sm font-semibold mb-3">Staff Course Load</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deptStaff.map((staff) => {
              const load = getStaffLoad(String(staff.id));
              const techLoad = deptCourses.filter(
                (c) =>
                  practicals[String(c.id)] &&
                  practicalStaff[String(c.id)] === String(staff.id),
              ).length;
              return (
                <div
                  key={String(staff.id)}
                  className={`p-3 rounded-lg border ${
                    load >= 4
                      ? "border-warning/40 bg-warning/5"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <p className="text-sm font-medium">{staff.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {staff.designation}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          load >= 4 ? "bg-warning" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(load * 25, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        load >= 4 ? "text-warning" : "text-primary"
                      }`}
                    >
                      {load}/4
                    </span>
                  </div>
                  {techLoad > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      {techLoad} practical course{techLoad !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
