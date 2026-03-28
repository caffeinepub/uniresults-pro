import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Eye, FileText, Image } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

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

const DOC_TYPE_OPTIONS = [
  { value: "admission_letter", label: "Admission Letter" },
  { value: "id_card", label: "ID Card" },
  { value: "certificate", label: "Certificate" },
  { value: "transcript", label: "Transcript" },
  { value: "result_slip", label: "Result Slip" },
  { value: "medical_record", label: "Medical Record" },
  { value: "sponsor_letter", label: "Sponsor Letter" },
  { value: "recommendation_letter", label: "Recommendation Letter" },
  { value: "research_paper", label: "Research Paper" },
  { value: "project_report", label: "Project Report" },
  { value: "other", label: "Other" },
];

function docTypeLabel(t: string) {
  return DOC_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

export default function StudentDocumentsTab() {
  const { currentUser, students, studentDocuments } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const myDocs = me
    ? studentDocuments.filter((d) => d.studentId === me.id)
    : [];

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  return (
    <div className="space-y-5" data-ocid="documents.section">
      <div>
        <h1 className="text-xl font-bold">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          View and download your uploaded academic documents
        </p>
      </div>

      {myDocs.length === 0 ? (
        <div
          className="bg-card rounded-xl border border-border p-10 text-center"
          data-ocid="documents.empty_state"
        >
          <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet. Contact the Registrar to upload your
            documents.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {myDocs.map((doc, i) => {
            const badge = getFileExtBadge(doc.name);
            const isImg = isImageFile(doc.name);
            return (
              <div
                key={String(doc.id)}
                data-ocid={`documents.item.${i + 1}`}
                className="bg-card rounded-xl border border-border p-4 shadow-xs flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {isImg ? (
                    <Image className="w-5 h-5 text-purple-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                {isImg && (
                  <img
                    src={doc.dataUrl}
                    alt={doc.name}
                    className="h-12 w-12 rounded object-cover border border-border flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <p className="font-medium text-sm truncate max-w-[200px]">
                      {doc.name}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {docTypeLabel(doc.docType)} &middot;{" "}
                    {new Date(doc.uploadedAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isImg ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      onClick={() => {
                        setPreviewUrl(doc.dataUrl);
                        setPreviewName(doc.name);
                      }}
                      data-ocid={`documents.button.${i + 1}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  ) : isPDFFile(doc.name) ? (
                    <a
                      href={doc.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      data-ocid={`documents.link.${i + 1}`}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </a>
                  ) : (
                    <a
                      href={doc.dataUrl}
                      download={doc.name}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      data-ocid={`documents.link.${i + 1}`}
                      title="Download to view (browser cannot display this file type)"
                    >
                      <Eye className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                  <a
                    href={doc.dataUrl}
                    download={doc.name}
                    className="text-xs font-medium text-muted-foreground hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreviewUrl(null);
          }}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-background rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{previewName}</p>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground ml-4"
                onClick={() => setPreviewUrl(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPreviewUrl(null);
                }}
              >
                ✕
              </button>
            </div>
            <img
              src={previewUrl}
              alt={previewName}
              className="max-h-[80vh] object-contain w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentUploadDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
}: {
  studentId: bigint;
  studentName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { studentDocuments, addStudentDocument, removeStudentDocument } =
    useApp();
  const docs = studentDocuments.filter((d) => d.studentId === studentId);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("admission_letter");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  function handleUpload() {
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      addStudentDocument({
        id: BigInt(Date.now()),
        studentId,
        name: file.name,
        docType: docType as
          | "admission_letter"
          | "id_card"
          | "certificate"
          | "other",
        uploadedAt: new Date().toISOString(),
        dataUrl: reader.result as string,
      });
      setFile(null);
      setUploading(false);
      toast.success("Document uploaded");
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="documents.dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Documents &ndash; {studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Upload section */}
          <div className="bg-muted/40 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold">Upload New Document</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="doc-type-select"
                  className="text-xs font-medium text-muted-foreground mb-1 block"
                >
                  Document Type
                </label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger
                    data-ocid="documents.select"
                    className="text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label
                  htmlFor="doc-file-input"
                  className="text-xs font-medium text-muted-foreground mb-1 block"
                >
                  File
                </label>
                <input
                  id="doc-file-input"
                  data-ocid="documents.upload_button"
                  type="file"
                  accept=".pdf,.doc,.docx,.docm,.xls,.xlsx,.xlsm,.ppt,.pptx,.ppsx,.txt,.rtf,.csv,.odt,.ods,.odp,.jpg,.jpeg,.png,.gif,.bmp,.webp,.zip,.rar,*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs file:mr-2 file:text-xs file:rounded file:border-0 file:bg-primary/10 file:text-primary file:px-2 file:py-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  PDF, Word, Excel, PowerPoint, images, and more
                </p>
              </div>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background rounded px-2 py-1.5 border border-border">
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                <span
                  className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${getFileExtBadge(file.name).className}`}
                >
                  {getFileExtBadge(file.name).label}
                </span>
              </div>
            )}
            <Button
              data-ocid="documents.submit_button"
              size="sm"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>

          {/* Document list */}
          <div>
            <p className="text-sm font-semibold mb-2">
              Existing Documents ({docs.length})
            </p>
            {docs.length === 0 ? (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="documents.empty_state"
              >
                No documents uploaded yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {docs.map((doc, i) => {
                  const badge = getFileExtBadge(doc.name);
                  const isImg = isImageFile(doc.name);
                  return (
                    <div
                      key={String(doc.id)}
                      data-ocid={`documents.item.${i + 1}`}
                      className="flex items-center gap-3 bg-background rounded-lg border border-border p-2.5"
                    >
                      {isImg ? (
                        <img
                          src={doc.dataUrl}
                          alt={doc.name}
                          className="w-8 h-8 rounded object-cover border border-border flex-shrink-0"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-xs font-medium truncate max-w-[140px]">
                            {doc.name}
                          </p>
                          <span
                            className={`text-[9px] font-semibold px-1 py-0.5 rounded ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {docTypeLabel(doc.docType)}
                        </p>
                      </div>
                      {isImg ? (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline flex items-center gap-0.5"
                          onClick={() => {
                            setPreviewUrl(doc.dataUrl);
                            setPreviewName(doc.name);
                          }}
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      ) : isPDFFile(doc.name) ? (
                        <a
                          href={doc.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-0.5"
                        >
                          <Eye className="w-3 h-3" /> View
                        </a>
                      ) : (
                        <a
                          href={doc.dataUrl}
                          download={doc.name}
                          className="text-xs text-primary hover:underline flex items-center gap-0.5"
                          title="Download to view"
                        >
                          <Eye className="w-3 h-3" /> DL
                        </a>
                      )}
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        className="text-xs text-muted-foreground hover:underline flex items-center gap-0.5"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        data-ocid={`documents.delete_button.${i + 1}`}
                        onClick={() => removeStudentDocument(doc.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Image Preview within Dialog */}
        {previewUrl && (
          <div
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewUrl(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPreviewUrl(null);
            }}
          >
            <div
              className="relative max-w-2xl max-h-[85vh] bg-background rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{previewName}</p>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground ml-4"
                  onClick={() => setPreviewUrl(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setPreviewUrl(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <img
                src={previewUrl}
                alt={previewName}
                className="max-h-[75vh] object-contain w-full"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            data-ocid="documents.close_button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
