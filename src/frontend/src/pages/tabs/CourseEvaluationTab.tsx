import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CourseFeedback } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

function StarRating({
  value,
  onChange,
}: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={`transition-colors ${
            s <= value ? "text-yellow-400" : "text-muted-foreground/30"
          } ${onChange ? "cursor-pointer hover:text-yellow-400" : "cursor-default"}`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );
}

export default function CourseEvaluationTab() {
  const {
    currentUser,
    students,
    courses,
    courseRegistrations,
    academicCalendars,
    courseFeedback,
    addCourseFeedback,
  } = useApp();

  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const activeSemester = activeCalendar?.semester ?? "First";
  const activeSession = activeCalendar?.session ?? "2024/2025";

  const student = students.find(
    (s) => s.userPrincipal === currentUser?.principal,
  );

  const myRegistrations = courseRegistrations.filter(
    (r) =>
      student && r.studentId === student.id && r.semester === activeSemester,
  );
  const myCourses = myRegistrations
    .map((r) => courses.find((c) => String(c.id) === String(r.courseId)))
    .filter(Boolean);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  function alreadySubmitted(courseCode: string) {
    return courseFeedback.some(
      (f) =>
        f.studentId === student?.id &&
        f.courseCode === courseCode &&
        f.session === activeSession &&
        f.semester === activeSemester,
    );
  }

  function handleSubmit(courseCode: string, courseName: string) {
    if (!student) return;
    const rating = ratings[courseCode] ?? 0;
    if (rating === 0) {
      toast.error("Please select a star rating before submitting");
      return;
    }
    const feedback: CourseFeedback = {
      id: BigInt(Date.now()),
      studentId: student.id,
      studentName: student.name,
      courseCode,
      courseName,
      rating,
      comment: comments[courseCode] ?? "",
      session: activeSession,
      semester: activeSemester,
      submittedAt: new Date().toISOString(),
    };
    addCourseFeedback(feedback);
    toast.success(`Feedback submitted for ${courseCode}`);
  }

  if (!student) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="course_eval.empty_state"
      >
        No student profile found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Course Evaluation</h1>
        <p className="text-sm text-muted-foreground">
          Rate your courses for {activeSemester} Semester, {activeSession}
        </p>
      </div>

      {myCourses.length === 0 && (
        <div
          className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border"
          data-ocid="course_eval.empty_state"
        >
          No registered courses found for the active semester.
        </div>
      )}

      <div className="space-y-4">
        {myCourses.map((course) => {
          if (!course) return null;
          const submitted = alreadySubmitted(course.code);
          return (
            <div
              key={course.code}
              className="bg-card rounded-xl border border-border p-5 space-y-3"
              data-ocid={`course_eval.${course.code}.panel`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{course.code}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {course.name}
                  </span>
                </div>
                {submitted && (
                  <Badge
                    className="bg-success/10 text-success border border-success/20"
                    data-ocid={`course_eval.${course.code}.success_state`}
                  >
                    ✓ Submitted
                  </Badge>
                )}
              </div>

              {!submitted ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Rating</p>
                    <StarRating
                      value={ratings[course.code] ?? 0}
                      onChange={(v) =>
                        setRatings((prev) => ({ ...prev, [course.code]: v }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Comment (optional)</p>
                    <Textarea
                      data-ocid={`course_eval.${course.code}.textarea`}
                      rows={2}
                      placeholder="Share your experience..."
                      value={comments[course.code] ?? ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [course.code]: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    data-ocid={`course_eval.${course.code}.submit_button`}
                    size="sm"
                    className="bg-primary text-primary-foreground"
                    onClick={() => handleSubmit(course.code, course.name)}
                  >
                    Submit Feedback
                  </Button>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Your feedback has been recorded. Thank you!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===================== HOD / DEAN FEEDBACK VIEW =====================

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 fill-current ${
            s <= value ? "text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

interface CourseFeedbackViewProps {
  /** Filter feedback to courses in these department IDs */
  departmentIds?: bigint[];
  courses: ReturnType<typeof useApp>["courses"];
}

export function CourseFeedbackView({
  departmentIds,
  courses: allCourses,
}: CourseFeedbackViewProps) {
  const { courseFeedback } = useApp();
  const [filterCourse, setFilterCourse] = useState("");

  const deptCourses = departmentIds
    ? allCourses.filter((c) => departmentIds.includes(c.departmentId))
    : allCourses;

  const relevantFeedback = departmentIds
    ? courseFeedback.filter((f) =>
        deptCourses.some((c) => c.code === f.courseCode),
      )
    : courseFeedback;

  const filtered = filterCourse
    ? relevantFeedback.filter((f) => f.courseCode === filterCourse)
    : relevantFeedback;

  const courseStats = deptCourses
    .map((c) => {
      const fb = relevantFeedback.filter((f) => f.courseCode === c.code);
      const avg =
        fb.length > 0
          ? fb.reduce((sum, f) => sum + f.rating, 0) / fb.length
          : 0;
      return { code: c.code, name: c.name, count: fb.length, avg };
    })
    .filter((s) => s.count > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Course Feedback</h1>
        <p className="text-sm text-muted-foreground">
          {relevantFeedback.length} feedback entries
        </p>
      </div>

      {/* Average ratings per course */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold mb-3">
          Average Ratings by Course
        </h2>
        {courseStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseStats.map((s) => (
              <div key={s.code} className="bg-muted/30 rounded-lg p-3">
                <div className="font-medium text-sm">{s.code}</div>
                <div className="text-xs text-muted-foreground mb-1">
                  {s.name}
                </div>
                <StarDisplay value={Math.round(s.avg)} />
                <div className="text-xs text-muted-foreground mt-1">
                  {s.avg.toFixed(1)} / 5 ({s.count} rating
                  {s.count !== 1 ? "s" : ""})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter + detailed table */}
      <div className="flex items-center gap-2">
        <select
          data-ocid="course_feedback.filter.select"
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
        >
          <option value="">All Courses</option>
          {deptCourses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} – {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="course_feedback.empty_state"
                >
                  No feedback found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((f, i) => (
              <TableRow
                key={String(f.id)}
                data-ocid={`course_feedback.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell className="text-sm">{f.studentName}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{f.courseCode}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.courseName}
                  </div>
                </TableCell>
                <TableCell>
                  <StarDisplay value={f.rating} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {f.comment || "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(f.submittedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
