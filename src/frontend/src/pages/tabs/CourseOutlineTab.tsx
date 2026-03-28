import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Eye, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface CourseOutline {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  staffId: string;
  staffName: string;
  title: string;
  semester: string;
  content: string; // base64 or text content
  filename: string;
  uploadedAt: string;
}

export function getCourseOutlines(): CourseOutline[] {
  try {
    return JSON.parse(localStorage.getItem("courseOutlines") || "[]");
  } catch {
    return [];
  }
}

function saveOutlines(list: CourseOutline[]) {
  localStorage.setItem("courseOutlines", JSON.stringify(list));
}

export function getOutlineForCourse(courseId: string): CourseOutline | null {
  return getCourseOutlines().find((o) => o.courseId === courseId) ?? null;
}

// Lecturer upload tab
export default function CourseOutlineTab() {
  const { currentUser, courses, staffMembers, logAudit } = useApp();
  const myStaff = staffMembers.find((s) => s.name === currentUser?.name);
  const myCourses = courses.filter(
    (c) => c.lecturerPrincipal === currentUser?.principal,
  );

  const [outlines, setOutlines] = useState<CourseOutline[]>(getCourseOutlines);
  const [open, setOpen] = useState(false);
  const [viewOutline, setViewOutline] = useState<CourseOutline | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    semester: "First",
    content: "",
    filename: "",
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((p) => ({
        ...p,
        content: ev.target?.result as string,
        filename: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }

  function handleAdd() {
    if (!form.courseId || !form.title) {
      toast.error("Course and title are required");
      return;
    }
    const course = myCourses.find((c) => String(c.id) === form.courseId);
    const outline: CourseOutline = {
      id: `co-${Date.now()}`,
      courseId: form.courseId,
      courseCode: course?.code ?? "",
      courseName: course?.name ?? "",
      staffId: myStaff?.staffId ?? currentUser?.principal ?? "",
      staffName: currentUser?.name ?? "",
      title: form.title,
      semester: form.semester,
      content: form.content,
      filename: form.filename,
      uploadedAt: new Date().toISOString(),
    };
    // Replace existing outline for same course
    const prev = outlines.filter((o) => o.courseId !== form.courseId);
    const updated = [outline, ...prev];
    saveOutlines(updated);
    setOutlines(updated);
    logAudit(
      currentUser?.name ?? "",
      "Lecturer",
      "Course Outline Uploaded",
      `${course?.code} — ${form.title}`,
    );
    toast.success("Course outline uploaded");
    setOpen(false);
    setForm({
      courseId: "",
      title: "",
      semester: "First",
      content: "",
      filename: "",
    });
  }

  function handleDelete(id: string) {
    const updated = outlines.filter((o) => o.id !== id);
    saveOutlines(updated);
    setOutlines(updated);
    toast.success("Outline removed");
  }

  const myOutlines = outlines.filter(
    (o) => o.staffId === (myStaff?.staffId ?? currentUser?.principal),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Course Outlines</h2>
        <Button
          data-ocid="course_outline.add.button"
          size="sm"
          className="ml-auto"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Upload Outline
        </Button>
      </div>

      <div className="grid gap-3">
        {myCourses.map((course) => {
          const outline = myOutlines.find(
            (o) => String(o.courseId) === String(course.id),
          );
          return (
            <Card key={String(course.id)}>
              <CardContent className="flex items-center justify-between pt-4">
                <div>
                  <div className="font-medium">
                    {course.code} — {course.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {course.semester} Semester
                  </div>
                  {outline && (
                    <div className="text-xs text-primary mt-1">
                      {outline.title} · {outline.filename}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {outline ? (
                    <>
                      <Button
                        data-ocid={"course_outline.view.button"}
                        variant="outline"
                        size="sm"
                        onClick={() => setViewOutline(outline)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        data-ocid={"course_outline.delete.button"}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(outline.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      No outline
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {myCourses.length === 0 && (
          <div
            data-ocid="course_outline.empty_state"
            className="text-center py-8 text-muted-foreground"
          >
            No courses assigned to you.
          </div>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Course Outline</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Course *</Label>
              <Select
                value={form.courseId}
                onValueChange={(v) => setForm((p) => ({ ...p, courseId: v }))}
              >
                <SelectTrigger data-ocid="course_outline.course.select">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {myCourses.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input
                data-ocid="course_outline.title.input"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Course Outline 2024/2025"
              />
            </div>
            <div className="space-y-1">
              <Label>Semester</Label>
              <Select
                value={form.semester}
                onValueChange={(v) => setForm((p) => ({ ...p, semester: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First Semester</SelectItem>
                  <SelectItem value="Second">Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Upload File (PDF/DOC)</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  data-ocid="course_outline.upload.button"
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {form.filename || "Choose File"}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                data-ocid="course_outline.cancel.button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                data-ocid="course_outline.save.button"
                onClick={handleAdd}
              >
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      {viewOutline && (
        <Dialog open onOpenChange={() => setViewOutline(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewOutline.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div>
                <b>Course:</b> {viewOutline.courseCode} —{" "}
                {viewOutline.courseName}
              </div>
              <div>
                <b>Uploaded by:</b> {viewOutline.staffName} on{" "}
                {new Date(viewOutline.uploadedAt).toLocaleDateString()}
              </div>
              <div>
                <b>File:</b> {viewOutline.filename}
              </div>
              {viewOutline.content &&
                (() => {
                  const filename = viewOutline.filename || "";
                  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
                  const isImage = [
                    "jpg",
                    "jpeg",
                    "png",
                    "gif",
                    "bmp",
                    "webp",
                  ].includes(ext);
                  const isPDF = ext === "pdf";
                  const isText = ["txt", "rtf", "csv"].includes(ext);
                  const isDataUrl = viewOutline.content.startsWith("data:");

                  if (isImage && isDataUrl) {
                    return (
                      <img
                        src={viewOutline.content}
                        alt={filename}
                        className="max-h-64 object-contain rounded border border-border"
                      />
                    );
                  }
                  if (isPDF && isDataUrl) {
                    return (
                      <div className="space-y-2">
                        <iframe
                          src={viewOutline.content}
                          title={filename}
                          className="w-full rounded border border-border"
                          style={{ height: "60vh", border: "none" }}
                        />
                        <a
                          href={viewOutline.content}
                          download={filename}
                          className="text-primary underline text-sm"
                        >
                          Download PDF
                        </a>
                      </div>
                    );
                  }
                  if (isText && !isDataUrl) {
                    return (
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                        {viewOutline.content}
                      </pre>
                    );
                  }
                  // For DOC, DOCX, XLS, XLSX, PPT, ZIP and other binary formats — download only
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                      <p className="font-medium mb-2">
                        This file type cannot be previewed in the browser.
                      </p>
                      <a
                        href={viewOutline.content}
                        download={filename}
                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-medium hover:opacity-90"
                      >
                        ⬇ Download {filename}
                      </a>
                    </div>
                  );
                })()}
            </div>
            <Button
              data-ocid="course_outline.close.button"
              variant="outline"
              onClick={() => setViewOutline(null)}
            >
              Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
