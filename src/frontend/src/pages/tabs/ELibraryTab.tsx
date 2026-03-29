import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BookOpen,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface ELibraryResource {
  id: string;
  title: string;
  courseCode: string;
  department: string;
  type:
    | "Lecture Notes"
    | "Past Questions"
    | "Course Outline"
    | "Reference Material"
    | "Lab Manual";
  fileName: string;
  fileType: string;
  fileData: string; // base64
  uploadedBy: string;
  session: string;
  uploadedAt: string;
}

const LS_KEY = "unirp_elibrary";

function getResources(): ELibraryResource[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveResources(list: ELibraryResource[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

const DEMO_RESOURCES: ELibraryResource[] = [
  {
    id: "el1",
    title: "Introduction to Genetics",
    courseCode: "BIO201",
    department: "Biology Education",
    type: "Lecture Notes",
    fileName: "genetics_notes.pdf",
    fileType: "pdf",
    fileData: "",
    uploadedBy: "Dr. Emeka Okonkwo",
    session: "2024/2025",
    uploadedAt: "2025-01-15",
  },
  {
    id: "el2",
    title: "BIO301 Past Questions 2023",
    courseCode: "BIO301",
    department: "Biology Education",
    type: "Past Questions",
    fileName: "bio301_pq.pdf",
    fileType: "pdf",
    fileData: "",
    uploadedBy: "Mrs. Chioma Adeyemi",
    session: "2024/2025",
    uploadedAt: "2025-01-20",
  },
  {
    id: "el3",
    title: "CSE Course Outline 2024/2025",
    courseCode: "CSE301",
    department: "Computer Science Education",
    type: "Course Outline",
    fileName: "cse_outline.docx",
    fileType: "docx",
    fileData: "",
    uploadedBy: "Mr. Yusuf Aliyu",
    session: "2024/2025",
    uploadedAt: "2025-01-25",
  },
  {
    id: "el4",
    title: "General Biology Lab Manual",
    courseCode: "BIO107",
    department: "Biology Education",
    type: "Lab Manual",
    fileName: "bio_lab_manual.pdf",
    fileType: "pdf",
    fileData: "",
    uploadedBy: "Dr. Emeka Okonkwo",
    session: "2024/2025",
    uploadedAt: "2025-02-01",
  },
];

const TYPE_COLORS: Record<string, string> = {
  "Lecture Notes": "bg-blue-100 text-blue-800",
  "Past Questions": "bg-orange-100 text-orange-800",
  "Course Outline": "bg-green-100 text-green-800",
  "Reference Material": "bg-purple-100 text-purple-800",
  "Lab Manual": "bg-teal-100 text-teal-800",
};

const FILE_ICON_COLORS: Record<string, string> = {
  pdf: "text-red-500",
  docx: "text-blue-500",
  doc: "text-blue-500",
  xlsx: "text-green-500",
  xls: "text-green-500",
  pptx: "text-orange-500",
  jpg: "text-pink-500",
  jpeg: "text-pink-500",
  png: "text-pink-500",
};

const BLANK_FORM = {
  title: "",
  courseCode: "",
  department: "",
  type: "Lecture Notes" as ELibraryResource["type"],
  session: "2024/2025",
};

/** Upload view for Lecturers */
export default function ELibraryUploadTab() {
  const { currentUser, departments } = useApp();
  const [resources, setResources] = useState<ELibraryResource[]>(() => {
    const saved = getResources();
    if (saved.length === 0) {
      saveResources(DEMO_RESOURCES);
      return DEMO_RESOURCES;
    }
    return saved;
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const myResources = resources.filter(
    (r) => r.uploadedBy === currentUser?.name,
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileInfo({
        name: file.name,
        type: ext,
        data: (ev.target?.result as string) ?? "",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleUpload() {
    if (!form.title || !form.courseCode || !fileInfo) {
      toast.error("Title, course code, and file are required");
      return;
    }
    const newRes: ELibraryResource = {
      id: `el${Date.now()}`,
      title: form.title,
      courseCode: form.courseCode,
      department: form.department,
      type: form.type,
      fileName: fileInfo.name,
      fileType: fileInfo.type,
      fileData: fileInfo.data,
      uploadedBy: currentUser?.name ?? "Lecturer",
      session: form.session,
      uploadedAt: new Date().toISOString().split("T")[0],
    };
    const updated = [newRes, ...resources];
    setResources(updated);
    saveResources(updated);
    setOpen(false);
    setForm(BLANK_FORM);
    setFileInfo(null);
    toast.success("Resource uploaded successfully");
  }

  function handleDelete(id: string) {
    const updated = resources.filter((r) => r.id !== id);
    setResources(updated);
    saveResources(updated);
    toast.success("Resource deleted");
  }

  function handleDownload(r: ELibraryResource) {
    if (!r.fileData) {
      toast.info("No file data available for demo resource");
      return;
    }
    const a = document.createElement("a");
    a.href = r.fileData;
    a.download = r.fileName;
    a.click();
  }

  const filtered = myResources.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.courseCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">E-Library — My Resources</h2>
        </div>
        <Button
          data-ocid="elibrary.upload_button"
          onClick={() => setOpen(true)}
          className="h-10"
        >
          <Upload className="w-4 h-4 mr-1" /> Upload Resource
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="elibrary.search_input"
            placeholder="Search title or course code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-64 h-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table data-ocid="elibrary.table">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="elibrary.empty_state"
                >
                  No resources uploaded yet
                </TableCell>
              </TableRow>
            )}
            {filtered.map((r, i) => (
              <TableRow key={r.id} data-ocid={`elibrary.item.${i + 1}`}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="font-mono text-xs">
                  {r.courseCode}
                </TableCell>
                <TableCell>
                  <Badge className={`${TYPE_COLORS[r.type]} border-0 text-xs`}>
                    {r.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={`flex items-center gap-1 text-xs font-mono ${FILE_ICON_COLORS[r.fileType] ?? "text-muted-foreground"}`}
                  >
                    <FileText className="w-3 h-3" />
                    {r.fileName}
                  </span>
                </TableCell>
                <TableCell>{r.session}</TableCell>
                <TableCell>{r.uploadedAt}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      data-ocid={`elibrary.secondary_button.${i + 1}`}
                      onClick={() => handleDownload(r)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      data-ocid={`elibrary.delete_button.${i + 1}`}
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="elibrary.dialog">
          <DialogHeader>
            <DialogTitle>Upload Learning Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                data-ocid="elibrary.input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Genetics Lecture Notes Week 3"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Course Code</Label>
                <Input
                  value={form.courseCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, courseCode: e.target.value }))
                  }
                  placeholder="BIO201"
                  className="h-10"
                />
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, department: v }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={String(d.id)} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Resource Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      type: v as ELibraryResource["type"],
                    }))
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
                    <SelectItem value="Past Questions">
                      Past Questions
                    </SelectItem>
                    <SelectItem value="Course Outline">
                      Course Outline
                    </SelectItem>
                    <SelectItem value="Reference Material">
                      Reference Material
                    </SelectItem>
                    <SelectItem value="Lab Manual">Lab Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Session</Label>
                <Input
                  value={form.session}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, session: e.target.value }))
                  }
                  placeholder="2024/2025"
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label>File (PDF, DOC, Images, etc.)</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 mt-1"
                data-ocid="elibrary.dropzone"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {fileInfo ? fileInfo.name : "Choose File"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="elibrary.cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="elibrary.submit_button" onClick={handleUpload}>
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Student view — browse resources for their department */
export function StudentELibraryTab({ department }: { department: string }) {
  const [resources] = useState<ELibraryResource[]>(() => {
    const saved = getResources();
    if (saved.length === 0) {
      saveResources(DEMO_RESOURCES);
      return DEMO_RESOURCES;
    }
    return saved;
  });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = resources.filter((r) => {
    const q = search.toLowerCase();
    if (
      q &&
      !r.title.toLowerCase().includes(q) &&
      !r.courseCode.toLowerCase().includes(q)
    )
      return false;
    if (filterType !== "all" && r.type !== filterType) return false;
    // show resources matching student's dept or with matching course codes
    const deptMatch =
      r.department.toLowerCase().includes(department.toLowerCase()) ||
      department === "";
    return deptMatch;
  });

  function handleDownload(r: ELibraryResource) {
    if (!r.fileData) {
      toast.info("No file data available for demo resource");
      return;
    }
    const a = document.createElement("a");
    a.href = r.fileData;
    a.download = r.fileName;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">E-Library Resources</h2>
        <Badge variant="secondary">{filtered.length} resources</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="student_elibrary.search_input"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-64 h-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44 h-10">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
            <SelectItem value="Past Questions">Past Questions</SelectItem>
            <SelectItem value="Course Outline">Course Outline</SelectItem>
            <SelectItem value="Reference Material">
              Reference Material
            </SelectItem>
            <SelectItem value="Lab Manual">Lab Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="student_elibrary.empty_state"
        >
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No resources available for your department yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((r, i) => (
            <Card
              key={r.id}
              className="border"
              data-ocid={`student_elibrary.item.${i + 1}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.courseCode} · {r.uploadedBy}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.session} · {r.uploadedAt}
                    </p>
                    <Badge
                      className={`${TYPE_COLORS[r.type]} border-0 text-xs mt-1`}
                    >
                      {r.type}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    data-ocid={`student_elibrary.secondary_button.${i + 1}`}
                    onClick={() => handleDownload(r)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
