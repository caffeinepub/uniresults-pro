import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Camera,
  GraduationCap,
  Printer,
  Upload,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExternalBlob } from "../../blob-storage/ExternalBlob";
import { useCamera } from "../../camera/useCamera";
import type {
  ExtendedStudent,
  InstitutionSettings,
} from "../../context/AppContext";

const PHOTO_STORAGE_PREFIX = "student_photo_url_";

function getStudentPhotoUrl(studentId: string): string | null {
  return localStorage.getItem(PHOTO_STORAGE_PREFIX + studentId);
}

function setStudentPhotoUrl(studentId: string, url: string) {
  localStorage.setItem(PHOTO_STORAGE_PREFIX + studentId, url);
}

interface Props {
  student: ExtendedStudent;
  open: boolean;
  onClose: () => void;
}

function getSettings(): InstitutionSettings {
  try {
    const s = localStorage.getItem("institutionSettings");
    if (s) return JSON.parse(s);
  } catch {}
  return {
    name: "Federal University of Education Kontagora, Niger State",
    address: "University Road, Nigeria",
    phone: "+234 800 000 0000",
    email: "info@university.edu.ng",
    website: "www.university.edu.ng",
    logoText: "FU",
  };
}

export default function StudentIDCardModal({ student, open, onClose }: Props) {
  const settings = getSettings();
  const studentKey = String(student.id);
  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    getStudentPhotoUrl(studentKey),
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [photoTab, setPhotoTab] = useState<"upload" | "camera">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isActive,
    isSupported,
    error: camError,
    isLoading: camLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "user", width: 400, height: 300 });

  // Stop camera on close or tab switch
  useEffect(() => {
    if (!open) stopCamera();
  }, [open, stopCamera]);

  useEffect(() => {
    if (photoTab !== "camera") stopCamera();
  }, [photoTab, stopCamera]);

  async function uploadFileBytes(file: File) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    setUploadProgress(0);
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
      setUploadProgress(pct),
    );
    const url = blob.getDirectURL();
    setStudentPhotoUrl(studentKey, url);
    setPhotoUrl(url);
    setUploadProgress(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFileBytes(file);
  }

  async function handleCapture() {
    const file = await capturePhoto();
    if (!file) return;
    await uploadFileBytes(file);
    setPhotoTab("upload");
  }

  const year = new Date().getFullYear();
  const qrCode = `UNIPRO:STUDENT:${student.matricNumber}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="student_id_card.dialog">
        <DialogHeader>
          <DialogTitle>Student ID Card</DialogTitle>
        </DialogHeader>

        {/* Print styles */}
        <style>{`
          @media print {
            body > *:not(.id-card-print-root) { display: none !important; }
            .id-card-print-root { display: block !important; }
            .no-print-id { display: none !important; }
          }
        `}</style>

        {/* ID Card */}
        <div
          className="id-card mx-auto"
          style={{
            width: 340,
            height: 215,
            borderRadius: 12,
            overflow: "hidden",
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
          }}
        >
          {/* Header bar */}
          <div
            style={{
              background: "oklch(0.29 0.09 258)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={16} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 11,
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {settings.name.toUpperCase()}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 9,
                  margin: 0,
                }}
              >
                STUDENT IDENTITY CARD
              </p>
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: 12,
              padding: "10px 14px",
              alignItems: "center",
            }}
          >
            {/* Photo */}
            <div
              style={{
                width: 64,
                height: 76,
                borderRadius: 8,
                border: "1.5px solid #e5e7eb",
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Student portrait"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={28} color="#9ca3af" />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  margin: "0 0 2px",
                  color: "#111827",
                }}
              >
                {student.name}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "#4b5563",
                  margin: "0 0 6px",
                  fontFamily: "monospace",
                }}
              >
                {student.matricNumber}
              </p>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}
              >
                <Field
                  label="DEPT"
                  value={String(student.departmentId)}
                  short
                />
                <Field label="LEVEL" value={`${student.level} Level`} short />
                <Field label="SESSION" value={`${year}/${year + 1}`} short />
              </div>
            </div>

            {/* QR code text */}
            <div
              style={{
                fontSize: 6,
                color: "#9ca3af",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                letterSpacing: "0.03em",
                flexShrink: 0,
                alignSelf: "flex-end",
                paddingBottom: 4,
              }}
            >
              {qrCode}
            </div>
          </div>

          {/* Footer strip */}
          <div
            style={{
              background: "oklch(0.29 0.09 258)",
              height: 6,
              flexShrink: 0,
            }}
          />
        </div>

        {/* Photo upload / camera */}
        <div className="no-print-id">
          <Tabs
            value={photoTab}
            onValueChange={(v) => setPhotoTab(v as "upload" | "camera")}
          >
            <TabsList className="w-full">
              <TabsTrigger
                value="upload"
                className="flex-1"
                data-ocid="student_id_card.upload_button"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload Photo
              </TabsTrigger>
              <TabsTrigger
                value="camera"
                className="flex-1"
                data-ocid="student_id_card.toggle"
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Take Photo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-2 mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                data-ocid="student_id_card.dropzone"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                data-ocid="student_id_card.secondary_button"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                {photoUrl ? "Replace Photo" : "Choose Photo"}
              </Button>
              {uploadProgress !== null && (
                <div data-ocid="student_id_card.loading_state">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="camera" className="space-y-2 mt-2">
              {isSupported === false ? (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10"
                  data-ocid="student_id_card.error_state"
                >
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">
                    Camera not supported in this browser.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="rounded-xl overflow-hidden bg-black"
                    style={{ minHeight: 180 }}
                  >
                    <video
                      ref={videoRef}
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        display: isActive ? "block" : "none",
                      }}
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    {!isActive && !camLoading && (
                      <div
                        className="flex items-center justify-center text-white/40"
                        style={{ height: 180 }}
                      >
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                    {camLoading && (
                      <div
                        className="flex items-center justify-center"
                        style={{ height: 180 }}
                        data-ocid="student_id_card.loading_state"
                      >
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>

                  {camError && (
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10"
                      data-ocid="student_id_card.error_state"
                    >
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive">
                        {camError.message}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={startCamera}
                        disabled={camLoading}
                      >
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        Start Camera
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={handleCapture}
                          disabled={camLoading || uploadProgress !== null}
                          data-ocid="student_id_card.primary_button"
                        >
                          <Camera className="w-3.5 h-3.5 mr-1.5" />
                          Capture
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={stopCamera}
                          disabled={camLoading}
                        >
                          Stop
                        </Button>
                      </>
                    )}
                  </div>

                  {uploadProgress !== null && (
                    <div data-ocid="student_id_card.loading_state">
                      <Progress value={uploadProgress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 no-print-id">
          <Button
            variant="outline"
            size="sm"
            data-ocid="student_id_card.cancel_button"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            size="sm"
            data-ocid="student_id_card.print_button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1" /> Print ID Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  short,
}: { label: string; value: string; short?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: "#9ca3af",
          letterSpacing: "0.05em",
          minWidth: short ? 44 : 60,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "#374151",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}
