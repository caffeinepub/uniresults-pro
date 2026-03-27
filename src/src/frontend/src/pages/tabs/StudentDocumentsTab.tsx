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
import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export default function StudentDocumentsTab() {
  const { currentUser, students, studentDocuments } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const myDocs = me
    ? studentDocuments.filter((d) => d.studentId === me.id)
    : [];

  const docTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      admission_letter: "Admission Letter",
      id_card: "ID Card",
      certificate: "Certificate",
      other: "Other",
    };
    return map[t] ?? t;
  };

  return (
    <div className="space-y-5" data-ocid="documents.section">
      <div>
        <h1 className="text-xl font-bold">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          View your uploaded academic documents
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
          {myDocs.map((doc, i) => (
            <div
              key={String(doc.id)}
              data-ocid={`documents.item.${i + 1}`}
              className="bg-card rounded-xl border border-border p-4 shadow-xs flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {docTypeLabel(doc.docType)} &middot;{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <a
                href={doc.dataUrl}
                download={doc.name}
                data-ocid={`documents.link.${i + 1}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Download
              </a>
            </div>
          ))}
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

  const docTypeLabel = (t: string) => {
    const map: Record<string, string> = {
      admission_letter: "Admission Letter",
      id_card: "ID Card",
      certificate: "Certificate",
      other: "Other",
    };
    return map[t] ?? t;
  };

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
                    <SelectItem value="admission_letter">
                      Admission Letter
                    </SelectItem>
                    <SelectItem value="id_card">ID Card</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs file:mr-2 file:text-xs file:rounded file:border-0 file:bg-primary/10 file:text-primary file:px-2 file:py-1"
                />
              </div>
            </div>
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
                {docs.map((doc, i) => (
                  <div
                    key={String(doc.id)}
                    data-ocid={`documents.item.${i + 1}`}
                    className="flex items-center gap-3 bg-background rounded-lg border border-border p-2.5"
                  >
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {docTypeLabel(doc.docType)}
                      </p>
                    </div>
                    <a
                      href={doc.dataUrl}
                      download={doc.name}
                      className="text-xs text-primary hover:underline"
                    >
                      View
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
                ))}
              </div>
            )}
          </div>
        </div>
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
