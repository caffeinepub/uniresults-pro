import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, StarHalf, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

interface Props {
  studentView: boolean;
}

function StarRating({
  value,
  onChange,
  readonly,
}: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          className={`text-yellow-400 transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          onClick={() => onChange?.(s)}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          <Star
            className="w-5 h-5"
            fill={(hovered || value) >= s ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function LecturerRatingTab({ studentView }: Props) {
  const {
    currentUser,
    students,
    staffMembers,
    courseRegistrations,
    courses,
    academicCalendars,
    lecturerRatings,
    addLecturerRating,
  } = useApp();

  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const session = activeCalendar?.session ?? "2024/2025";
  const semester = activeCalendar?.semester ?? "First";

  // --- STUDENT VIEW ---
  if (studentView) {
    const me = students.find((s) => s.userPrincipal === currentUser?.principal);
    if (!me)
      return (
        <div className="p-6 text-muted-foreground">
          Student record not found.
        </div>
      );

    // Courses the student is registered for in active session
    const myRegCourseIds = new Set(
      courseRegistrations
        .filter(
          (r) =>
            String(r.studentId) === String(me.id) && r.semester === semester,
        )
        .map((r) => String(r.courseId)),
    );
    const myCourses = courses.filter((c) => myRegCourseIds.has(String(c.id)));

    // For each course, find the assigned lecturer (staff member)
    const items = myCourses.map((course) => {
      const staff = staffMembers.find((s) =>
        s.courseIds.some((cid) => String(cid) === String(course.id)),
      );
      const existingRating = lecturerRatings.find(
        (r) =>
          r.staffId === (staff?.staffId ?? "") &&
          String(r.studentId) === String(me.id) &&
          r.courseCode === course.code &&
          r.session === session,
      );
      return { course, staff, existingRating };
    });

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Rate Your Lecturers</h1>
          <p className="text-sm text-muted-foreground">
            Provide feedback for lecturers teaching your courses this semester.
          </p>
        </div>
        {items.length === 0 && (
          <div
            className="py-10 text-center text-muted-foreground"
            data-ocid="lecturer_rating.empty_state"
          >
            No courses registered for this semester.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ course, staff, existingRating }, i) => (
            <RatingCard
              key={String(course.id)}
              idx={i + 1}
              course={course}
              staff={staff}
              existingRating={existingRating}
              studentId={me.id}
              session={session}
              semester={semester}
              onSubmit={addLecturerRating}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- HOD / LECTURER VIEW ---
  const isLecturer = currentUser?.role === "Lecturer";
  const myStaff = isLecturer
    ? staffMembers.find(
        (s) =>
          s.staffId === currentUser?.principal || s.name === currentUser?.name,
      )
    : null;

  const deptId = currentUser?.departmentId;
  const relevantStaff = isLecturer
    ? myStaff
      ? [myStaff]
      : []
    : staffMembers.filter(
        (s) => !deptId || String(s.departmentId) === String(deptId),
      );

  const totalRatings = relevantStaff.reduce((acc, s) => {
    return acc + lecturerRatings.filter((r) => r.staffId === s.staffId).length;
  }, 0);
  const avgRating =
    totalRatings > 0
      ? relevantStaff.reduce((acc, s) => {
          const ratings = lecturerRatings.filter(
            (r) => r.staffId === s.staffId,
          );
          return acc + ratings.reduce((sum, r) => sum + r.rating, 0);
        }, 0) / totalRatings
      : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Lecturer Ratings</h1>
        <p className="text-sm text-muted-foreground">
          Student feedback on lecturer performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Average Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <StarRating value={Math.round(avgRating)} readonly />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">
            Total Ratings Received
          </p>
          <p className="text-2xl font-bold">{totalRatings}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Staff Rated</p>
          <p className="text-2xl font-bold">
            {
              relevantStaff.filter((s) =>
                lecturerRatings.some((r) => r.staffId === s.staffId),
              ).length
            }
          </p>
        </div>
      </div>

      {/* Per Lecturer Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-3 border-b border-border font-semibold text-sm">
          Ratings by Lecturer
        </div>
        <div className="divide-y divide-border">
          {relevantStaff.length === 0 && (
            <div
              className="py-8 text-center text-muted-foreground"
              data-ocid="lecturer_rating.empty_state"
            >
              No staff found.
            </div>
          )}
          {relevantStaff.map((staff, i) => {
            const myRatings = lecturerRatings.filter(
              (r) => r.staffId === staff.staffId,
            );
            const avg =
              myRatings.length > 0
                ? myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length
                : 0;
            const byCourse: Record<string, { total: number; count: number }> =
              {};
            for (const r of myRatings) {
              if (!byCourse[r.courseCode])
                byCourse[r.courseCode] = { total: 0, count: 0 };
              byCourse[r.courseCode].total += r.rating;
              byCourse[r.courseCode].count += 1;
            }
            const bestCourse = Object.entries(byCourse).sort(
              (a, b) => b[1].total / b[1].count - a[1].total / a[1].count,
            )[0];
            const latestComments = [...myRatings]
              .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
              .slice(0, 3);

            return (
              <div
                key={staff.staffId}
                className="p-4 space-y-3"
                data-ocid={`lecturer_rating.item.${i + 1}`}
              >
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{staff.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {staff.designation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(avg)} readonly />
                    <span className="text-sm font-semibold">
                      {avg > 0 ? avg.toFixed(1) : "—"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {myRatings.length} rating
                      {myRatings.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
                {bestCourse && (
                  <p className="text-xs text-muted-foreground">
                    Best-rated course:{" "}
                    <span className="font-medium text-foreground">
                      {bestCourse[0]}
                    </span>{" "}
                    ({(bestCourse[1].total / bestCourse[1].count).toFixed(1)}★)
                  </p>
                )}
                {latestComments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recent Comments:
                    </p>
                    {latestComments.map(
                      (r) =>
                        r.comment && (
                          <p
                            key={r.submittedAt + r.courseCode}
                            className="text-xs bg-muted/30 rounded p-2 italic"
                          >
                            "{r.comment}"
                          </p>
                        ),
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RatingCard({
  idx,
  course,
  staff,
  existingRating,
  studentId,
  session,
  semester,
  onSubmit,
}: {
  idx: number;
  course: any;
  staff: any;
  existingRating: any;
  studentId: bigint;
  session: string;
  semester: string;
  onSubmit: (r: any) => void;
}) {
  const [rating, setRating] = useState(existingRating?.rating ?? 0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const submitted = !!existingRating;

  function handleSubmit() {
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }
    if (!staff) {
      toast.error("No lecturer assigned to this course");
      return;
    }
    onSubmit({
      id: BigInt(Date.now()),
      staffId: staff.staffId,
      studentId,
      courseCode: course.code,
      session,
      semester,
      rating,
      comment,
      submittedAt: new Date().toISOString(),
    });
    toast.success("Rating submitted!");
  }

  return (
    <Card data-ocid={`lecturer_rating.item.${idx}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          {course.code} — {course.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Lecturer: {staff?.name ?? "Not Assigned"}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium mb-1">Rating</p>
          <StarRating
            value={rating}
            onChange={submitted ? undefined : setRating}
            readonly={submitted}
          />
        </div>
        <div>
          <p className="text-xs font-medium mb-1">Comment (optional)</p>
          <Textarea
            data-ocid={`lecturer_rating.textarea.${idx}`}
            value={comment}
            onChange={(e) => !submitted && setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={2}
            disabled={submitted}
            className="text-xs resize-none"
          />
        </div>
        {submitted ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            ✓ Submitted
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            data-ocid={`lecturer_rating.submit_button.${idx}`}
            className="w-full"
          >
            Submit Rating
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
