import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Eye, FileText, Trash2, Upload, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

const DOC_TYPES = [
  "CV/Vita",
  "Course Outline",
  "Lecture Notes",
  "Past Questions",
  "Other",
];

export default function LecturerPortalTab() {
  const {
    currentUser,
    staffMembers,
    courses,
    departments,
    faculties,
    results,
    lecturerDocuments,
    addLecturerDocument,
    removeLecturerDocument,
    courseRegistrations,
    notifications,
  } = useApp();

  const me = staffMembers.find(
    (s) => s.staffId === currentUser?.principal || s.name === currentUser?.name,
  );

  const myCourses = me
    ? courses.filter((c) =>
        me.courseIds.some((cid) => String(cid) === String(c.id)),
      )
    : [];

  const myDocs = me
    ? lecturerDocuments.filter((d) => d.staffId === me.staffId)
    : [];
  const hasVita = myDocs.some((d) => d.type === "CV/Vita");

  const dept = me
    ? departments.find((d) => String(d.id) === String(me.departmentId))
    : null;
  const faculty = dept
    ? faculties.find((f) => String(f.id) === String(dept.facultyId))
    : null;

  const [docType, setDocType] = useState("CV/Vita");
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function getStudentCount(courseId: bigint) {
    return courseRegistrations.filter(
      (cr) => String(cr.courseId) === String(courseId),
    ).length;
  }

  function getResultStatus(courseId: bigint) {
    const courseResults = results.filter(
      (r) => String(r.courseId) === String(courseId),
    );
    if (courseResults.length === 0) return "No Results";
    const statuses = courseResults.map((r) => r.status);
    if (statuses.every((s) => s === "published")) return "Published";
    if (statuses.some((s) => s === "submitted" || s === "approved"))
      return "In Review";
    return "Draft";
  }

  function statusBadgeClass(status: string) {
    if (status === "Published")
      return "bg-green-100 text-green-800 border-green-200";
    if (status === "In Review")
      return "bg-blue-100 text-blue-800 border-blue-200";
    if (status === "Draft")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-muted text-muted-foreground";
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !me) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      addLecturerDocument({
        id: BigInt(Date.now()),
        staffId: me.staffId,
        name: docName || file.name,
        type: docType,
        url,
        uploadedAt: new Date().toLocaleDateString(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
      toast.success("Document uploaded");
      setDocName("");
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  const recentNotices = notifications
    .filter((n) => n.recipientRole === "Lecturer" || n.recipientRole === "HOD")
    .slice(-5)
    .reverse();

  if (!me) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Staff profile not found. Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="lecturer_portal.page">
      <div>
        <h1 className="text-xl font-bold">My Lecturer Portal</h1>
        <p className="text-sm text-muted-foreground">
          All your academic resources in one place.
        </p>
      </div>

      {/* Profile Summary */}
      <Card data-ocid="lecturer_portal.card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-lg">{me.name}</p>
              <p className="text-sm text-muted-foreground">{me.designation}</p>
              <p className="text-xs text-muted-foreground">
                Staff ID: <span className="font-mono">{me.staffId}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {dept?.name ?? "—"} · {faculty?.name ?? "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV/Vita Status */}
      <div
        className={`rounded-xl border p-4 flex items-center gap-3 ${
          hasVita
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
        data-ocid="lecturer_portal.panel"
      >
        <FileText
          className={`w-5 h-5 ${hasVita ? "text-green-600" : "text-amber-600"}`}
        />
        <div>
          <p
            className={`text-sm font-semibold ${hasVita ? "text-green-800" : "text-amber-800"}`}
          >
            CV / Vita: {hasVita ? "Uploaded ✓" : "Not Yet Uploaded"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasVita
              ? "Your Curriculum Vitae is on file."
              : "Please upload your CV/Vita below."}
          </p>
        </div>
      </div>

      {/* Assigned Courses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Assigned Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myCourses.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-ocid="lecturer_portal.empty_state"
            >
              No courses assigned yet.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {myCourses.map((course, i) => {
                const status = getResultStatus(course.id);
                const studentCount = getStudentCount(course.id);
                return (
                  <div
                    key={String(course.id)}
                    className="border border-border rounded-lg p-3 space-y-1"
                    data-ocid={`lecturer_portal.item.${i + 1}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs font-semibold text-primary">
                        {course.code}
                      </p>
                      <Badge className={`text-xs ${statusBadgeClass(status)}`}>
                        {status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(course.creditUnits)} credits · {course.semester}{" "}
                      Sem · {studentCount} student
                      {studentCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger
                  className="h-9 text-xs"
                  data-ocid="lecturer_portal.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Document Name (optional)</Label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Leave blank to use filename"
                className="w-full h-9 px-3 text-xs rounded-md border border-input bg-background"
                data-ocid="lecturer_portal.input"
              />
            </div>
          </div>
          <button
            type="button"
            className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors"
            onClick={() => fileRef.current?.click()}
            data-ocid="lecturer_portal.dropzone"
          >
            <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload PDF, DOC, or image (max 10MB)
            </p>
            {uploading && (
              <p className="text-xs text-primary mt-1">Uploading...</p>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileUpload}
            data-ocid="lecturer_portal.upload_button"
          />
        </CardContent>
      </Card>

      {/* Document List */}
      {myDocs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              My Documents ({myDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {myDocs.map((doc, i) => (
                <div
                  key={String(doc.id)}
                  className="flex items-center justify-between py-2 gap-3"
                  data-ocid={`lecturer_portal.item.${i + 1}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type} · {doc.size} · {doc.uploadedAt}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => window.open(doc.url, "_blank")}
                      data-ocid={`lecturer_portal.button.${i + 1}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => {
                        removeLecturerDocument(doc.id);
                        toast.success("Document removed");
                      }}
                      data-ocid={`lecturer_portal.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Notices */}
      {recentNotices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Department Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentNotices.map((n, i) => (
                <div
                  key={String(n.id)}
                  className="text-xs bg-muted/30 rounded p-2"
                  data-ocid={`lecturer_portal.panel.${i + 1}`}
                >
                  <p className="text-foreground">{n.message}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
