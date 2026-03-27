import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  Calendar,
  Download,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ClassroomTimetableEntry } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const LEVELS = ["100", "200", "300", "400", "500", "600", "700", "800"];

function downloadCsv(rows: ClassroomTimetableEntry[]) {
  const header =
    "Day,StartTime,EndTime,CourseCode,CourseName,Room,Level,Session,Semester";
  const lines = rows.map((r) =>
    [
      r.day,
      r.startTime,
      r.endTime,
      r.courseCode,
      r.courseName,
      r.room,
      r.level,
      r.session,
      r.semester,
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "classroom_timetable.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

interface Props {
  isAdmin?: boolean;
  filterForStaffId?: string;
  filterForStudent?: { departmentId: bigint; level: string };
}

export default function ClassroomTimetableTab({
  isAdmin = false,
  filterForStaffId,
  filterForStudent,
}: Props) {
  const {
    classroomTimetable,
    addClassroomTimetableEntry,
    updateClassroomTimetableEntry,
    removeClassroomTimetableEntry,
    courses,
    staffMembers,
    departments,
    academicCalendars,
  } = useApp();

  const activeCalendar = academicCalendars.find((c) => c.isActive);

  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterSession, setFilterSession] = useState<string>(
    activeCalendar?.session ?? "2024/2025",
  );
  const [filterSemester, setFilterSemester] = useState<string>(
    activeCalendar?.semester ?? "First",
  );

  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ClassroomTimetableEntry | null>(
    null,
  );
  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    lecturerId: "",
    room: "",
    day: "Monday",
    startTime: "08:00",
    endTime: "10:00",
    level: "100",
    departmentId: "",
    session: activeCalendar?.session ?? "2024/2025",
    semester: activeCalendar?.semester ?? "First",
  });

  // Determine which entries to show
  let displayed = classroomTimetable;

  if (filterForStaffId) {
    displayed = displayed.filter((e) => e.lecturerId === filterForStaffId);
  }
  if (filterForStudent) {
    displayed = displayed.filter(
      (e) =>
        String(e.departmentId) === String(filterForStudent.departmentId) &&
        e.level === filterForStudent.level,
    );
  }
  if (filterDept !== "all") {
    displayed = displayed.filter((e) => String(e.departmentId) === filterDept);
  }
  if (filterLevel !== "all") {
    displayed = displayed.filter((e) => e.level === filterLevel);
  }
  displayed = displayed.filter(
    (e) => e.session === filterSession && e.semester === filterSemester,
  );

  function openAdd() {
    setEditEntry(null);
    setForm({
      courseCode: "",
      courseName: "",
      lecturerId: "",
      room: "",
      day: "Monday",
      startTime: "08:00",
      endTime: "10:00",
      level: "100",
      departmentId: "",
      session: activeCalendar?.session ?? "2024/2025",
      semester: activeCalendar?.semester ?? "First",
    });
    setOpen(true);
  }

  function openEdit(e: ClassroomTimetableEntry) {
    setEditEntry(e);
    setForm({
      courseCode: e.courseCode,
      courseName: e.courseName,
      lecturerId: e.lecturerId ?? "",
      room: e.room,
      day: e.day,
      startTime: e.startTime,
      endTime: e.endTime,
      level: e.level,
      departmentId: String(e.departmentId),
      session: e.session,
      semester: e.semester as "First" | "Second",
    });
    setOpen(true);
  }

  function handleCourseSelect(courseId: string) {
    const course = courses.find((c) => String(c.id) === courseId);
    if (course) {
      setForm((f) => ({
        ...f,
        courseCode: course.code,
        courseName: course.name,
        departmentId: String(course.departmentId),
      }));
    }
  }

  function handleSave() {
    if (!form.courseCode || !form.room || !form.day) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editEntry) {
      updateClassroomTimetableEntry({
        ...editEntry,
        ...form,
        departmentId: BigInt(form.departmentId || 1),
      });
      toast.success("Timetable entry updated");
    } else {
      addClassroomTimetableEntry({
        id: BigInt(Date.now()),
        ...form,
        departmentId: BigInt(form.departmentId || 1),
      });
      toast.success("Timetable entry added");
    }
    setOpen(false);
  }

  function getLecturerName(staffId: string) {
    return staffMembers.find((s) => s.staffId === staffId)?.name ?? staffId;
  }

  // Build visual grid
  const gridMap: Record<string, Record<string, ClassroomTimetableEntry[]>> = {};
  for (const day of DAYS) {
    gridMap[day] = {};
    for (const slot of TIME_SLOTS) {
      gridMap[day][slot] = displayed.filter(
        (e) => e.day === day && e.startTime === slot,
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Classroom Timetable
          </h1>
          <p className="text-sm text-muted-foreground">
            {displayed.length} class(es) scheduled
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            data-ocid="classroom_timetable.download_button"
            onClick={() => downloadCsv(displayed)}
          >
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-ocid="classroom_timetable.print_button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              data-ocid="classroom_timetable.open_modal_button"
              onClick={openAdd}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Class
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {!filterForStudent && !filterForStaffId && (
        <div className="flex flex-wrap gap-2">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger
              className="w-44 h-8 text-xs"
              data-ocid="classroom_timetable.dept.select"
            >
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
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger
              className="w-28 h-8 text-xs"
              data-ocid="classroom_timetable.level.select"
            >
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l}>
                  Level {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="w-28 h-8 text-xs"
            placeholder="Session"
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            data-ocid="classroom_timetable.session.input"
          />
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger
              className="w-28 h-8 text-xs"
              data-ocid="classroom_timetable.semester.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="First">First</SelectItem>
              <SelectItem value="Second">Second</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Visual Grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2 text-left font-semibold text-muted-foreground w-16">
                Time
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="p-2 text-center font-semibold min-w-[100px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => (
              <tr
                key={slot}
                className="border-b border-border/40 hover:bg-muted/20"
              >
                <td className="p-2 text-muted-foreground font-mono">{slot}</td>
                {DAYS.map((day) => {
                  const entries = gridMap[day][slot] ?? [];
                  return (
                    <td key={day} className="p-1 align-top min-h-[40px]">
                      {entries.map((e) => (
                        <button
                          key={String(e.id)}
                          type="button"
                          className="w-full text-left bg-primary/10 border border-primary/20 rounded p-1 mb-0.5 hover:bg-primary/20"
                          onClick={() => isAdmin && openEdit(e)}
                        >
                          <p className="font-semibold text-primary">
                            {e.courseCode}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {e.room}
                          </p>
                        </button>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table listing */}
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-3 border-b border-border font-semibold text-sm">
          All Scheduled Classes
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S/N</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Level</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="classroom_timetable.empty_state"
                >
                  No timetable entries found.
                </TableCell>
              </TableRow>
            )}
            {displayed.map((e, i) => (
              <TableRow
                key={String(e.id)}
                data-ocid={`classroom_timetable.item.${i + 1}`}
              >
                <TableCell>{i + 1}</TableCell>
                <TableCell>{e.day}</TableCell>
                <TableCell className="font-mono text-xs">
                  {e.startTime} – {e.endTime}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{e.courseCode}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.courseName}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {getLecturerName(e.lecturerId ?? "")}
                </TableCell>
                <TableCell className="text-sm">{e.room}</TableCell>
                <TableCell>
                  <Badge variant="outline">Level {e.level}</Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(e)}
                        data-ocid={`classroom_timetable.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        data-ocid={`classroom_timetable.delete_button.${i + 1}`}
                        onClick={() => {
                          removeClassroomTimetableEntry(e.id);
                          toast.success("Entry removed");
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="classroom_timetable.dialog">
          <DialogHeader>
            <DialogTitle>
              {editEntry ? "Edit Timetable Entry" : "Add Timetable Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Course</Label>
              <Select onValueChange={handleCourseSelect}>
                <SelectTrigger data-ocid="classroom_timetable.course.select">
                  <SelectValue placeholder="Pick a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.code} – {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Day</Label>
                <Select
                  value={form.day}
                  onValueChange={(v) => setForm((f) => ({ ...f, day: v }))}
                >
                  <SelectTrigger data-ocid="classroom_timetable.day.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select
                  value={form.level}
                  onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
                >
                  <SelectTrigger data-ocid="classroom_timetable.level_form.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l} value={l}>
                        Level {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                  data-ocid="classroom_timetable.start.input"
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                  data-ocid="classroom_timetable.end.input"
                />
              </div>
            </div>
            <div>
              <Label>Room / Venue</Label>
              <Input
                value={form.room}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room: e.target.value }))
                }
                placeholder="e.g. LT1, Room 204"
                data-ocid="classroom_timetable.room.input"
              />
            </div>
            <div>
              <Label>Lecturer</Label>
              <Select
                value={form.lecturerId}
                onValueChange={(v) => setForm((f) => ({ ...f, lecturerId: v }))}
              >
                <SelectTrigger data-ocid="classroom_timetable.lecturer.select">
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((s) => (
                    <SelectItem key={s.staffId} value={s.staffId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Session</Label>
                <Input
                  value={form.session}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, session: e.target.value }))
                  }
                  data-ocid="classroom_timetable.session_form.input"
                />
              </div>
              <div>
                <Label>Semester</Label>
                <Select
                  value={form.semester}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      semester: v as "First" | "Second",
                    }))
                  }
                >
                  <SelectTrigger data-ocid="classroom_timetable.semester_form.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First</SelectItem>
                    <SelectItem value="Second">Second</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="classroom_timetable.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary text-primary-foreground"
              data-ocid="classroom_timetable.submit_button"
            >
              {editEntry ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
