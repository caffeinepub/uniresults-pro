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
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Image,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

const DOC_TYPES = [
  "CV/Vita",
  "Course Outline",
  "Lecture Notes",
  "Past Questions",
  "Memo",
  "Research Paper",
  "Assignment",
  "Exam Paper",
  "Report",
  "Handbook",
  "Policy Document",
  "Other",
];

function getFileExtBadge(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { label: string; className: string }> = {
    pdf: { label: "PDF", className: "bg-red-100 text-red-700" },
    doc: { label: "DOC", className: "bg-blue-100 text-blue-700" },
    docx: { label: "DOCX", className: "bg-blue-100 text-blue-700" },
    docm: { label: "DOCM", className: "bg-blue-100 text-blue-700" },
    xls: { label: "XLS", className: "bg-green-100 text-green-700" },
    xlsx: { label: "XLSX", className: "bg-green-100 text-green-700" },
    xlsm: { label: "XLSM", className: "bg-green-100 text-green-700" },
    ppt: { label: "PPT", className: "bg-orange-100 text-orange-700" },
    pptx: { label: "PPTX", className: "bg-orange-100 text-orange-700" },
    ppsx: { label: "PPSX", className: "bg-orange-100 text-orange-700" },
    jpg: { label: "IMG", className: "bg-purple-100 text-purple-700" },
    jpeg: { label: "IMG", className: "bg-purple-100 text-purple-700" },
    png: { label: "IMG", className: "bg-purple-100 text-purple-700" },
    gif: { label: "IMG", className: "bg-purple-100 text-purple-700" },
    webp: { label: "IMG", className: "bg-purple-100 text-purple-700" },
    bmp: { label: "IMG", className: "bg-purple-100 text-purple-700" },
    txt: { label: "TXT", className: "bg-gray-100 text-gray-700" },
    rtf: { label: "RTF", className: "bg-gray-100 text-gray-700" },
    csv: { label: "CSV", className: "bg-teal-100 text-teal-700" },
    zip: { label: "ZIP", className: "bg-yellow-100 text-yellow-700" },
    rar: { label: "RAR", className: "bg-yellow-100 text-yellow-700" },
    "7z": { label: "7Z", className: "bg-yellow-100 text-yellow-700" },
    odt: { label: "ODT", className: "bg-blue-100 text-blue-700" },
    ods: { label: "ODS", className: "bg-green-100 text-green-700" },
    odp: { label: "ODP", className: "bg-orange-100 text-orange-700" },
  };
  return (
    map[ext] ?? {
      label: ext.toUpperCase() || "FILE",
      className: "bg-muted text-muted-foreground",
    }
  );
}

function isImageFile(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext);
}

function isPDFFile(filename: string) {
  return filename.split(".").pop()?.toLowerCase() === "pdf";
}

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
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);
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
      toast.success("Document uploaded successfully");
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
              Click to upload any document — PDF, Word, Excel, PowerPoint,
              images, and more (max 10MB)
            </p>
            {uploading && (
              <p className="text-xs text-primary mt-1">Uploading...</p>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.docm,.xls,.xlsx,.xlsm,.ppt,.pptx,.pps,.ppsx,.txt,.rtf,.csv,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.bmp,.webp,.zip,.rar,.7z,*"
            className="hidden"
            onChange={handleFileUpload}
            data-ocid="lecturer_portal.upload_button"
          />
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View All Documents
            {myDocs.length > 0 && (
              <span className="ml-auto text-xs bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5">
                {myDocs.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myDocs.length === 0 ? (
            <p
              className="text-sm text-muted-foreground text-center py-4"
              data-ocid="lecturer_portal.empty_state"
            >
              No documents uploaded yet. Use the form above to add your first
              document.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {myDocs.map((doc, i) => {
                const badge = getFileExtBadge(doc.name);
                const isImg = isImageFile(doc.name);
                return (
                  <div
                    key={String(doc.id)}
                    className="flex items-center justify-between py-3 gap-3"
                    data-ocid={`lecturer_portal.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {isImg ? (
                          <Image className="w-4 h-4 text-purple-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {doc.name}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} · {doc.size} · {doc.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => {
                          if (isImg) {
                            setPreviewDoc({ url: doc.url, name: doc.name });
                          } else if (isPDFFile(doc.name)) {
                            setPreviewDoc({ url: doc.url, name: doc.name });
                          } else {
                            // Office/binary files: trigger download instead of trying to view
                            const a = document.createElement("a");
                            a.href = doc.url;
                            a.download = doc.name;
                            a.click();
                          }
                        }}
                        title="View"
                        data-ocid={`lecturer_portal.button.${i + 1}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                        title="Download"
                        data-ocid={`lecturer_portal.secondary_button.${i + 1}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewDoc(null);
          }}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-background rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{previewDoc.name}</p>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground ml-4"
                onClick={() => setPreviewDoc(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPreviewDoc(null);
                }}
              >
                ✕
              </button>
            </div>
            {isImageFile(previewDoc.name) ? (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-h-[80vh] object-contain w-full"
              />
            ) : (
              <iframe
                src={previewDoc.url}
                title={previewDoc.name}
                className="w-full"
                style={{ height: "80vh", border: "none" }}
              />
            )}
          </div>
        </div>
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
