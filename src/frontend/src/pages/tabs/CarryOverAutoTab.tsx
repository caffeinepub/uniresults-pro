import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export function CarryOverBanner() {
  const {
    currentUser,
    students,
    results,
    courses,
    courseRegistrations,
    academicCalendars,
    addCourseRegistration,
  } = useApp();

  const [open, setOpen] = useState(false);

  const student = students.find(
    (s) => s.userPrincipal === currentUser?.principal,
  );
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSemester = activeCalendar?.semester ?? "First";

  const carryOverCourses = useMemo(() => {
    if (!student) return [];
    const failedResults = results.filter(
      (r) =>
        r.studentId === student.id &&
        r.grade === "F" &&
        (r.status === "published" || r.status === "approved"),
    );
    return failedResults
      .map((r) => {
        const course = courses.find((c) => String(c.id) === String(r.courseId));
        return course ? { result: r, course } : null;
      })
      .filter(Boolean)
      .filter((item) => {
        // Not already registered in current semester
        if (!item) return false;
        return !courseRegistrations.some(
          (cr) =>
            cr.studentId === student.id &&
            cr.courseId === item.course.id &&
            cr.semester === activeSemester,
        );
      }) as { result: (typeof results)[0]; course: (typeof courses)[0] }[];
  }, [student, results, courses, courseRegistrations, activeSemester]);

  if (carryOverCourses.length === 0 || !student) return null;

  function handleRegisterAll() {
    for (const item of carryOverCourses) {
      addCourseRegistration(student!.id, item.course.id, activeSemester);
    }
    toast.success(`${carryOverCourses.length} carry-over course(s) registered`);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 cursor-pointer w-full text-left"
        data-ocid="carryover.banner"
        onClick={() => setOpen(true)}
      >
        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
        <div>
          <p className="font-semibold text-warning text-sm">
            You have {carryOverCourses.length} carry-over course
            {carryOverCourses.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-warning/80">
            Click here to register them for the current semester
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="carryover.dialog">
          <DialogHeader>
            <DialogTitle>Carry-Over Courses</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The following courses were failed in a previous semester. You can
            register them all for the current semester ({activeSemester}).
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carryOverCourses.map((item, i) => (
                <TableRow
                  key={String(item.course.id)}
                  data-ocid={`carryover.item.${i + 1}`}
                >
                  <TableCell className="font-mono text-sm">
                    {item.course.code}
                  </TableCell>
                  <TableCell className="text-sm">{item.course.name}</TableCell>
                  <TableCell className="text-sm">
                    {String(item.course.creditUnits)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="text-xs">
                      F – Fail
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button
              data-ocid="carryover.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="carryover.confirm_button"
              className="bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={handleRegisterAll}
            >
              Register All ({carryOverCourses.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
