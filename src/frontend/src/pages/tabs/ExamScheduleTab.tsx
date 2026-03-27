import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useInstitutionConfig } from "@/hooks/useInstitutionConfig";
import {
  Calendar,
  Download,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ExamScheduleEntry } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

function downloadCsv(rows: ExamScheduleEntry[]) {
  const header =
    "courseCode,courseName,date,time,venue,invigilator,session,semester";
  const lines = rows.map((r) =>
    [
      r.courseCode,
      r.courseName,
      r.date,
      r.time,
      r.venue,
      r.invigilator,
      r.session,
      r.semester,
    ].join(","),
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "exam_schedule.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

interface ExamScheduleTabProps {
  /** Filter to only show entries matching these course codes */
  filterCourseCodes?: string[];
  /** Whether to show admin CRUD controls */
  isAdmin?: boolean;
}

export default function ExamScheduleTab({
  filterCourseCodes,
  isAdmin = false,
}: ExamScheduleTabProps) {
  const {
    examSchedule,
    addExamScheduleEntry,
    updateExamScheduleEntry,
    removeExamScheduleEntry,
    courses,
    academicCalendars,
  } = useApp();
  const _instConfig = useInstitutionConfig();
  const semLabel = _instConfig.semesterLabel;
  const [open, setOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ExamScheduleEntry | null>(null);
  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    date: "",
    time: "",
    venue: "",
    invigilator: "",
    session: "2024/2025",
    semester: "First",
  });

  const activeCalendar = academicCalendars.find((c) => c.isActive);

  const displayed = filterCourseCodes
    ? examSchedule.filter((e) => filterCourseCodes.includes(e.courseCode))
    : examSchedule;

  function openAdd() {
    setEditEntry(null);
    setForm({
      courseCode: "",
      courseName: "",
      date: "",
      time: "",
      venue: "",
      invigilator: "",
      session: activeCalendar?.session ?? "2024/2025",
      semester: activeCalendar?.semester ?? "First",
    });
    setOpen(true);
  }

  function openEdit(entry: ExamScheduleEntry) {
    setEditEntry(entry);
    setForm({
      courseCode: entry.courseCode,
      courseName: entry.courseName,
      date: entry.date,
      time: entry.time,
      venue: entry.venue,
      invigilator: entry.invigilator,
      session: entry.session,
      semester: entry.semester,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.courseCode || !form.date || !form.time || !form.venue) {
      toast.error("Please fill all required fields");
      return;
    }
    if (editEntry) {
      updateExamScheduleEntry({ ...editEntry, ...form });
      toast.success("Exam entry updated");
    } else {
      addExamScheduleEntry({
        id: BigInt(Date.now()),
        ...form,
      });
      toast.success("Exam entry added");
    }
    setOpen(false);
  }

  function handleCourseSelect(courseId: string) {
    const course = courses.find((c) => String(c.id) === courseId);
    if (course) {
      setForm((f) => ({
        ...f,
        courseCode: course.code,
        courseName: course.name,
      }));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Exam Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {displayed.length} exam{displayed.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="exam_schedule.download_button"
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(displayed)}
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button
            data-ocid="exam_schedule.print_button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="exam_schedule.open_modal_button"
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={openAdd}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Exam
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="exam_schedule.dialog">
                <DialogHeader>
                  <DialogTitle>
                    {editEntry ? "Edit Exam Entry" : "New Exam Entry"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Course</Label>
                    <Select onValueChange={handleCourseSelect}>
                      <SelectTrigger data-ocid="exam_schedule.select">
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
                      <Label>Date</Label>
                      <Input
                        data-ocid="exam_schedule.date.input"
                        type="date"
                        value={form.date}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, date: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        data-ocid="exam_schedule.time.input"
                        type="time"
                        value={form.time}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, time: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Input
                      data-ocid="exam_schedule.venue.input"
                      value={form.venue}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, venue: e.target.value }))
                      }
                      placeholder="e.g. Hall A, Room 201"
                    />
                  </div>
                  <div>
                    <Label>Invigilator</Label>
                    <Input
                      data-ocid="exam_schedule.invigilator.input"
                      value={form.invigilator}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, invigilator: e.target.value }))
                      }
                      placeholder="e.g. Dr. Obi"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Session</Label>
                      <Input
                        data-ocid="exam_schedule.session.input"
                        value={form.session}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, session: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>{semLabel}</Label>
                      <Select
                        value={form.semester}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, semester: v }))
                        }
                      >
                        <SelectTrigger data-ocid="exam_schedule.semester.select">
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
                    data-ocid="exam_schedule.cancel_button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="exam_schedule.submit_button"
                    onClick={handleSave}
                    className="bg-primary text-primary-foreground"
                  >
                    {editEntry ? "Save Changes" : "Add Exam"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Invigilator</TableHead>
              <TableHead>{semLabel}</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="exam_schedule.empty_state"
                >
                  No exam entries found.
                </TableCell>
              </TableRow>
            )}
            {displayed.map((e, i) => (
              <TableRow
                key={String(e.id)}
                data-ocid={`exam_schedule.item.${i + 1}`}
                className="hover:bg-muted/30"
              >
                <TableCell>
                  <div className="font-medium">{e.courseCode}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.courseName}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{e.date}</TableCell>
                <TableCell className="text-sm">{e.time}</TableCell>
                <TableCell className="text-sm">{e.venue}</TableCell>
                <TableCell className="text-sm">
                  {e.invigilator || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {e.semester}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`exam_schedule.edit_button.${i + 1}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(e)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-ocid={`exam_schedule.delete_button.${i + 1}`}
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          removeExamScheduleEntry(e.id);
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
    </div>
  );
}
