import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useMemo } from "react";
import { useApp } from "../../context/AppContext";

export default function CourseHistoryTab() {
  const {
    currentUser,
    students,
    courseRegistrations,
    courses,
    results,
    academicCalendars,
    institutionSettings,
    departments,
    faculties,
  } = useApp();

  const me = students.find((s) => s.userPrincipal === currentUser?.principal);

  const dept = departments.find(
    (d) => String(d.id) === String(me?.departmentId),
  );
  const faculty = faculties.find(
    (f) => String(f.id) === String(dept?.facultyId),
  );
  const myRegs = courseRegistrations.filter(
    (r) => me && String(r.studentId) === String(me.id),
  );

  const grouped = useMemo(() => {
    if (!me) return [];
    const map: Record<
      string,
      {
        session: string;
        semester: string;
        courses: { course: any; result: any }[];
      }
    > = {};
    for (const reg of myRegs) {
      const course = courses.find((c) => String(c.id) === String(reg.courseId));
      if (!course) continue;
      const key = reg.semester;
      if (!map[key]) {
        const cal = academicCalendars.find(
          (c) =>
            c.semester === reg.semester || reg.semester.includes(c.session),
        );
        const session = cal?.session ?? "Unknown Session";
        const sem = cal?.semester ?? reg.semester;
        map[key] = { session, semester: sem, courses: [] };
      }
      const result = results.find(
        (r) =>
          String(r.studentId) === String(me.id) &&
          String(r.courseId) === String(course.id),
      );
      map[key].courses.push({ course, result });
    }
    return Object.values(map).sort((a, b) =>
      a.session.localeCompare(b.session),
    );
  }, [me, myRegs, courses, results, academicCalendars]);

  const totalCredits = useMemo(() => {
    return myRegs.reduce((sum, r) => {
      const c = courses.find((c) => String(c.id) === String(r.courseId));
      return sum + (c ? Number(c.creditUnits) : 0);
    }, 0);
  }, [myRegs, courses]);

  if (!me)
    return (
      <div className="p-6 text-muted-foreground">Student record not found.</div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Course Registration History</h1>
          <p className="text-sm text-muted-foreground">
            All courses registered across all sessions and levels
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.print()}
          data-ocid="course_history.print_button"
        >
          <Printer className="w-4 h-4 mr-1" /> Print Course History
        </Button>
      </div>

      {/* Print Header */}
      <div className="hidden print:block space-y-1 text-center border-b pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">
          {institutionSettings.name}
        </h1>
        <p className="text-sm">{institutionSettings.address}</p>
        <h2 className="text-lg font-semibold mt-2">
          Course Registration History
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm mt-2 text-left max-w-md mx-auto">
          <p>
            <span className="font-medium">Name:</span> {me.name}
          </p>
          <p>
            <span className="font-medium">Matric No:</span> {me.matricNumber}
          </p>
          <p>
            <span className="font-medium">Department:</span> {dept?.name}
          </p>
          <p>
            <span className="font-medium">Faculty:</span> {faculty?.name}
          </p>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div
          className="py-12 text-center text-muted-foreground"
          data-ocid="course_history.empty_state"
        >
          No course registration history found.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group, gi) => {
            const semesterCredits = group.courses.reduce(
              (sum, { course }) => sum + Number(course.creditUnits),
              0,
            );
            return (
              <div
                key={`${group.session}-${group.semester}-${gi}`}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="bg-muted/30 border-b border-border px-4 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {group.session} Academic Session
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {group.semester} Semester
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {group.courses.length} courses
                    </p>
                    <p className="text-xs font-medium">
                      {semesterCredits} credit units
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10">
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          S/N
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Code
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          Title
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                          CU
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                          Grade
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.courses.map(({ course, result }, idx) => (
                        <tr
                          key={String(course.id)}
                          className="border-b border-border/50 hover:bg-muted/10"
                        >
                          <td className="px-4 py-2 text-xs">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono text-xs font-medium">
                            {course.code}
                          </td>
                          <td className="px-4 py-2 text-xs">{course.name}</td>
                          <td className="px-4 py-2 text-center text-xs">
                            {Number(course.creditUnits)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {result?.grade ? (
                              <span
                                className={`text-xs font-bold ${
                                  result.grade === "A"
                                    ? "text-green-600"
                                    : result.grade === "B"
                                      ? "text-blue-600"
                                      : result.grade === "C"
                                        ? "text-yellow-600"
                                        : result.grade === "F"
                                          ? "text-red-600"
                                          : "text-foreground"
                                }`}
                              >
                                {result.grade}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="text-xs">
                              {result?.remarks ?? "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/20 border-t border-border">
                        <td
                          colSpan={3}
                          className="px-4 py-2 text-xs text-right font-medium"
                        >
                          Semester Total:
                        </td>
                        <td className="px-4 py-2 text-center text-xs font-bold">
                          {semesterCredits}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-muted/20 rounded-xl p-4 border border-border text-sm flex justify-between items-center">
        <span className="font-medium">Total Credit Units Registered:</span>
        <span className="text-lg font-bold text-primary">{totalCredits}</span>
      </div>

      <div className="hidden print:block border-t pt-4 mt-4 text-xs text-center text-muted-foreground">
        Printed on: {new Date().toLocaleDateString()} |{" "}
        {institutionSettings.name}
      </div>
    </div>
  );
}
