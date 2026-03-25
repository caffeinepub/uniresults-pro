import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { CalendarDays, Camera, CameraOff, Plus, Users } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../../camera/useCamera";
import type { AttendanceSession } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

export default function AttendanceTab() {
  const {
    currentUser,
    courses,
    students,
    courseRegistrations,
    attendanceSessions,
    addAttendanceSession,
    updateAttendanceSession,
  } = useApp();

  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    myCourses[0] ? String(myCourses[0].id) : "",
  );
  const [markOpen, setMarkOpen] = useState(false);
  const [editSession, setEditSession] = useState<AttendanceSession | null>(
    null,
  );
  const [attendDate, setAttendDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});

  const camera = useCamera({ facingMode: "user", width: 640, height: 480 });
  const [activeCaptureId, setActiveCaptureId] = useState<string | null>(null);
  const [biometricPhotos, setBiometricPhotos] = useState<
    Record<string, string>
  >({});

  const courseId = selectedCourseId ? BigInt(selectedCourseId) : null;
  const course = myCourses.find((c) => c.id === courseId);
  const registeredStudents = courseId
    ? students.filter((s) =>
        courseRegistrations.some(
          (r) => r.studentId === s.id && r.courseId === courseId,
        ),
      )
    : [];
  const courseSessions = attendanceSessions.filter(
    (s) => s.courseId === courseId,
  );

  function openMark(session?: AttendanceSession) {
    if (session) {
      setEditSession(session);
      setAttendDate(session.date);
      const map: Record<string, boolean> = {};
      for (const r of session.records) map[String(r.studentId)] = r.present;
      setPresentMap(map);
    } else {
      setEditSession(null);
      setAttendDate(new Date().toISOString().split("T")[0]);
      const map: Record<string, boolean> = {};
      for (const s of registeredStudents) map[String(s.id)] = true;
      setPresentMap(map);
    }
    setMarkOpen(true);
  }

  async function handleCapture(studentId: string) {
    if (activeCaptureId === studentId) {
      // Stop camera
      await camera.stopCamera();
      setActiveCaptureId(null);
    } else {
      setActiveCaptureId(studentId);
      await camera.startCamera();
    }
  }

  async function capturePhoto(studentId: string) {
    const file = await camera.capturePhoto();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setBiometricPhotos((prev) => ({ ...prev, [studentId]: dataUrl }));
      const sessionId = editSession
        ? String(editSession.id)
        : `pending_${Date.now()}`;
      const student = registeredStudents.find(
        (s) => String(s.id) === studentId,
      );
      const courseObj = course;
      localStorage.setItem(
        `biometric_${sessionId}_${studentId}`,
        JSON.stringify({
          studentName: student?.name ?? "Unknown",
          matricNumber: student?.matricNumber ?? "-",
          courseName: courseObj ? `${courseObj.code} - ${courseObj.name}` : "-",
          date: attendDate,
          timestamp: new Date().toISOString(),
          photoDataUrl: dataUrl,
          present: presentMap[studentId] ?? true,
        }),
      );
      toast.success(`Photo captured for ${student?.name ?? "student"}`);
    };
    reader.readAsDataURL(file);
    await camera.stopCamera();
    setActiveCaptureId(null);
  }

  function saveSession() {
    if (!courseId || !course) return;
    const records = registeredStudents.map((s) => ({
      studentId: s.id,
      present: presentMap[String(s.id)] ?? false,
    }));
    if (editSession) {
      updateAttendanceSession({
        ...editSession,
        date: attendDate,
        records,
      });
      toast.success("Attendance session updated");
    } else {
      addAttendanceSession({
        id: BigInt(Date.now()),
        courseId,
        date: attendDate,
        lecturerName: currentUser?.name ?? "Lecturer",
        records,
      });
      toast.success("Attendance marked successfully");
    }
    setMarkOpen(false);
  }

  function getAttendancePct(session: AttendanceSession) {
    if (session.records.length === 0) return 0;
    const present = session.records.filter((r) => r.present).length;
    return Math.round((present / session.records.length) * 100);
  }

  function getCourseAvgAttendance() {
    if (courseSessions.length === 0) return null;
    const avg =
      courseSessions.reduce((sum, s) => sum + getAttendancePct(s), 0) /
      courseSessions.length;
    return Math.round(avg);
  }

  const avgAttendance = getCourseAvgAttendance();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Attendance Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Mark and manage attendance for your courses
          </p>
        </div>
        <Button
          data-ocid="attendance.open_modal_button"
          size="sm"
          onClick={() => openMark()}
          disabled={!courseId || registeredStudents.length === 0}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Mark Attendance
        </Button>
      </div>

      {/* Course selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <Label className="text-sm font-medium">Select Course</Label>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger data-ocid="attendance.select" className="w-64 text-sm">
            <SelectValue placeholder="Choose a course..." />
          </SelectTrigger>
          <SelectContent>
            {myCourses.map((c) => (
              <SelectItem key={String(c.id)} value={String(c.id)}>
                {c.code} – {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {avgAttendance !== null && (
          <Badge
            variant="outline"
            className={
              avgAttendance >= 75
                ? "border-success text-success"
                : "border-destructive text-destructive"
            }
          >
            Avg Attendance: {avgAttendance}%
          </Badge>
        )}
      </div>

      {/* Student count */}
      {courseId && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>
            {registeredStudents.length} registered student
            {registeredStudents.length !== 1 ? "s" : ""}
          </span>
          <span className="mx-1">·</span>
          <CalendarDays className="w-3.5 h-3.5" />
          <span>
            {courseSessions.length} session
            {courseSessions.length !== 1 ? "s" : ""} recorded
          </span>
        </div>
      )}

      {/* Sessions table */}
      {courseId && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold">
              Attendance Sessions – {course?.code} {course?.name}
            </h2>
          </div>
          {courseSessions.length === 0 ? (
            <div
              className="p-10 text-center text-muted-foreground text-sm"
              data-ocid="attendance.empty_state"
            >
              No attendance sessions yet. Click "Mark Attendance" to start.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>% Attendance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...courseSessions]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((session, i) => {
                    const pct = getAttendancePct(session);
                    const present = session.records.filter(
                      (r) => r.present,
                    ).length;
                    const absent = session.records.length - present;
                    return (
                      <TableRow
                        key={String(session.id)}
                        data-ocid={`attendance.item.${i + 1}`}
                        className="hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          {new Date(session.date).toLocaleDateString("en-NG", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="text-success font-semibold">
                            {present}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-destructive font-semibold">
                            {absent}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct >= 75
                                    ? "bg-success"
                                    : pct >= 50
                                      ? "bg-warning"
                                      : "bg-destructive"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span
                              className={`text-sm font-semibold ${
                                pct >= 75
                                  ? "text-success"
                                  : pct >= 50
                                    ? "text-warning"
                                    : "text-destructive"
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            data-ocid={`attendance.edit_button.${i + 1}`}
                            size="sm"
                            variant="ghost"
                            onClick={() => openMark(session)}
                            className="h-7 text-xs"
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Mark Attendance Dialog */}
      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent
          data-ocid="attendance.dialog"
          className="max-w-lg max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editSession ? "Edit Attendance" : "Mark Attendance"} –{" "}
              {course?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="attend-date" className="text-sm font-medium">
                Date
              </Label>
              <input
                id="attend-date"
                type="date"
                value={attendDate}
                onChange={(e) => setAttendDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Students</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      for (const s of registeredStudents)
                        all[String(s.id)] = true;
                      setPresentMap(all);
                    }}
                  >
                    Mark All Present
                  </button>
                  <span className="text-muted-foreground">|</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      const all: Record<string, boolean> = {};
                      for (const s of registeredStudents)
                        all[String(s.id)] = false;
                      setPresentMap(all);
                    }}
                  >
                    Mark All Absent
                  </button>
                </div>
              </div>
              {registeredStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No registered students for this course.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-3">
                  {registeredStudents.map((s) => (
                    <div key={String(s.id)} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`attend-${String(s.id)}`}
                          checked={presentMap[String(s.id)] ?? false}
                          onCheckedChange={(checked) =>
                            setPresentMap((prev) => ({
                              ...prev,
                              [String(s.id)]: !!checked,
                            }))
                          }
                        />
                        <label
                          htmlFor={`attend-${String(s.id)}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {s.name}
                          <span className="text-xs text-muted-foreground ml-1.5">
                            {s.matricNumber}
                          </span>
                        </label>
                        {biometricPhotos[String(s.id)] && (
                          <Badge
                            variant="outline"
                            className="border-green-500 text-green-600 text-[10px] px-1 gap-0.5"
                          >
                            <Camera className="w-2.5 h-2.5" /> Photo
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            presentMap[String(s.id)]
                              ? "border-success text-success text-xs"
                              : "border-destructive text-destructive text-xs"
                          }
                        >
                          {presentMap[String(s.id)] ? "Present" : "Absent"}
                        </Badge>
                        <button
                          type="button"
                          title={
                            activeCaptureId === String(s.id)
                              ? "Stop camera"
                              : "Capture biometric photo"
                          }
                          onClick={() => handleCapture(String(s.id))}
                          className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          {activeCaptureId === String(s.id) ? (
                            <CameraOff className="w-3.5 h-3.5" />
                          ) : (
                            <Camera className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {activeCaptureId === String(s.id) && (
                        <div className="ml-6 space-y-1">
                          <div
                            className="relative rounded overflow-hidden bg-muted border border-border"
                            style={{ width: 180, aspectRatio: "4/3" }}
                          >
                            <video
                              ref={camera.videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover"
                            />
                            <canvas ref={camera.canvasRef} className="hidden" />
                          </div>
                          {camera.error && (
                            <p className="text-xs text-destructive">
                              {camera.error.message}
                            </p>
                          )}
                          <Button
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => capturePhoto(String(s.id))}
                            disabled={!camera.isActive}
                          >
                            <Camera className="w-3 h-3 mr-1" /> Capture
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="attendance.cancel_button"
              variant="outline"
              onClick={() => setMarkOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="attendance.confirm_button"
              onClick={saveSession}
              disabled={registeredStudents.length === 0}
            >
              {editSession ? "Update Session" : "Save Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
