import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Camera,
  CreditCard,
  GraduationCap,
  Printer,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../../camera/useCamera";
import { getStudentDepartment, useApp } from "../../context/AppContext";

const STUDENT_PHOTO_PREFIX = "student_photo_url_";
const STAFF_PHOTO_PREFIX = "staff_photo_url_";

function getPhotoUrl(prefix: string, id: string): string | null {
  return localStorage.getItem(prefix + id);
}
function savePhotoUrl(prefix: string, id: string, url: string) {
  localStorage.setItem(prefix + id, url);
}

function QRCodePlaceholder({
  value,
  size = 56,
}: { value: string; size?: number }) {
  // Simple deterministic SVG QR-like grid based on value hash
  const cells = 7;
  const cellSize = size / cells;
  const bits = Array.from({ length: cells * cells }, (_, i) => {
    const c = value.charCodeAt(i % value.length) ^ (i * 37);
    return (c & 1) === 1;
  });
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="QR Code"
    >
      <title>QR Code</title>
      {/* border */}
      <rect x={0} y={0} width={size} height={size} fill="white" />
      <rect x={0} y={0} width={size} height={2} fill="#1e1e2e" />
      <rect x={0} y={size - 2} width={size} height={2} fill="#1e1e2e" />
      <rect x={0} y={0} width={2} height={size} fill="#1e1e2e" />
      <rect x={size - 2} y={0} width={2} height={size} fill="#1e1e2e" />
      {bits.map((on, i) => {
        const row = Math.floor(i / cells);
        const col = i % cells;
        if (!on) return null;
        return (
          <rect
            key={`${row}-${col}`}
            x={col * cellSize + 1}
            y={row * cellSize + 1}
            width={cellSize - 1}
            height={cellSize - 1}
            fill="#1e1e2e"
          />
        );
      })}
    </svg>
  );
}

interface IDCardData {
  name: string;
  id: string;
  idLabel: string; // "Matric No" or "Staff ID"
  department: string;
  role: string; // "Student" or designation
  level?: string;
  session: string;
  photoUrl: string | null;
  photoPrefix: string;
  qrValue: string;
}

function IDCardPreview({ data }: { data: IDCardData }) {
  const institutionName = (() => {
    try {
      const s = localStorage.getItem("institutionSettings");
      if (s) return JSON.parse(s).name;
    } catch {}
    return "Federal University of Education Kontagora";
  })();

  return (
    <div
      className="id-card-print"
      style={{
        width: 340,
        height: 220,
        borderRadius: 12,
        overflow: "hidden",
        border: "2px solid #e5e7eb",
        boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GraduationCap size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: 10,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {institutionName.toUpperCase()}
          </p>
          <p
            style={{ color: "rgba(255,255,255,0.75)", fontSize: 8, margin: 0 }}
          >
            {data.role === "Student"
              ? "STUDENT IDENTITY CARD"
              : "STAFF IDENTITY CARD"}
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
          alignItems: "stretch",
        }}
      >
        {/* Photo */}
        <div
          style={{
            width: 68,
            height: 80,
            borderRadius: 8,
            border: "1.5px solid #e5e7eb",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
            alignSelf: "center",
          }}
        >
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt="portrait"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <User size={30} color="#9ca3af" />
          )}
        </div>

        {/* Details */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <p
            style={{
              fontWeight: 700,
              fontSize: 13,
              margin: 0,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.name}
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#6b7280",
              margin: 0,
              fontFamily: "monospace",
            }}
          >
            {data.id}
          </p>
          <div style={{ marginTop: 4, display: "grid", gap: 2 }}>
            <IDField label={data.idLabel.toUpperCase()} value={data.id} />
            <IDField label="DEPT" value={data.department} />
            {data.level && <IDField label="LEVEL" value={data.level} />}
            {!data.level && <IDField label="ROLE" value={data.role} />}
            <IDField label="SESSION" value={data.session} />
          </div>
        </div>

        {/* QR */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            flexShrink: 0,
            paddingBottom: 4,
          }}
        >
          <QRCodePlaceholder value={data.qrValue} size={52} />
          <p style={{ fontSize: 7, color: "#9ca3af", marginTop: 2 }}>
            Scan to verify
          </p>
        </div>
      </div>

      {/* Footer strip */}
      <div
        style={{ background: "oklch(0.29 0.09 258)", height: 7, flexShrink: 0 }}
      />
    </div>
  );
}

function IDField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
      <span
        style={{
          fontSize: 8,
          fontWeight: 700,
          color: "#9ca3af",
          letterSpacing: "0.05em",
          minWidth: 48,
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
          maxWidth: 110,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PhotoCapture({
  photoUrl,
  onPhoto,
  photoPrefix,
  entityId,
}: {
  photoUrl: string | null;
  onPhoto: (url: string) => void;
  photoPrefix: string;
  entityId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoTab, setPhotoTab] = useState<"upload" | "camera">("upload");

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

  useEffect(() => {
    if (photoTab !== "camera") stopCamera();
  }, [photoTab, stopCamera]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      savePhotoUrl(photoPrefix, entityId, url);
      onPhoto(url);
      toast.success("Photo uploaded");
    };
    reader.readAsDataURL(file);
  }

  async function handleCapture() {
    const file = await capturePhoto();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      savePhotoUrl(photoPrefix, entityId, url);
      onPhoto(url);
      toast.success("Photo captured");
      stopCamera();
      setPhotoTab("upload");
    };
    reader.readAsDataURL(file);
  }

  return (
    <Tabs
      value={photoTab}
      onValueChange={(v) => setPhotoTab(v as "upload" | "camera")}
    >
      <TabsList className="w-full">
        <TabsTrigger
          value="upload"
          className="flex-1"
          data-ocid="id_card.upload_button"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
        </TabsTrigger>
        <TabsTrigger
          value="camera"
          className="flex-1"
          data-ocid="id_card.toggle"
        >
          <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          data-ocid="id_card.secondary_button"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {photoUrl ? "Replace Photo" : "Choose Photo"}
        </Button>
      </TabsContent>

      <TabsContent value="camera" className="mt-2 space-y-2">
        {isSupported === false ? (
          <div
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10"
            data-ocid="id_card.error_state"
          >
            <AlertCircle className="w-4 h-4 text-destructive" />
            <p className="text-xs text-destructive">Camera not supported.</p>
          </div>
        ) : (
          <>
            <div
              className="rounded-xl overflow-hidden bg-black"
              style={{ minHeight: 160 }}
            >
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: 160,
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
                  style={{ height: 160 }}
                >
                  <Camera className="w-8 h-8" />
                </div>
              )}
              {camLoading && (
                <div
                  className="flex items-center justify-center"
                  style={{ height: 160 }}
                >
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            {camError && (
              <div
                className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10"
                data-ocid="id_card.error_state"
              >
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{camError.message}</p>
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
                  <Camera className="w-3.5 h-3.5 mr-1.5" /> Start Camera
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleCapture}
                    disabled={camLoading}
                    data-ocid="id_card.primary_button"
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture
                  </Button>
                  <Button variant="outline" size="sm" onClick={stopCamera}>
                    Stop
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

function StudentIDCard({
  forSelf,
  studentId,
}: { forSelf?: boolean; studentId?: string }) {
  const { students, departments, academicCalendars, currentUser } = useApp();
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const session =
    activeCalendar?.session ??
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const [selectedId, setSelectedId] = useState<string>(studentId ?? "");

  const student = forSelf
    ? students.find((s) => s.userPrincipal === currentUser?.principal)
    : students.find((s) => String(s.id) === selectedId);

  const deptName = student
    ? (getStudentDepartment(student, departments)?.name ?? "N/A")
    : "N/A";

  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    student ? getPhotoUrl(STUDENT_PHOTO_PREFIX, String(student.id)) : null,
  );

  // Update photo when student changes
  useEffect(() => {
    if (student) {
      setPhotoUrl(getPhotoUrl(STUDENT_PHOTO_PREFIX, String(student.id)));
    }
  }, [student]);

  const cardData: IDCardData | null = student
    ? {
        name: student.name,
        id: student.matricNumber,
        idLabel: "Matric No",
        department: deptName,
        role: "Student",
        level: `${student.level ?? "100"} Level`,
        session,
        photoUrl,
        photoPrefix: STUDENT_PHOTO_PREFIX,
        qrValue: `STUDENT:${student.matricNumber}`,
      }
    : null;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-5">
      {!forSelf && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Select Student
          </p>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger
              className="w-full max-w-sm"
              data-ocid="id_card.select"
            >
              <SelectValue placeholder="Choose a student..." />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={String(s.id)} value={String(s.id)}>
                  {s.name} — {s.matricNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {cardData ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Card preview */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Card Preview
            </p>
            <IDCardPreview data={cardData} />
            <Button
              size="sm"
              onClick={handlePrint}
              className="w-full"
              data-ocid="id_card.print_button"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Print ID Card
            </Button>
          </div>

          {/* Photo upload */}
          <div className="flex-1 max-w-xs space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Student Photo
            </p>
            <PhotoCapture
              photoUrl={photoUrl}
              onPhoto={setPhotoUrl}
              photoPrefix={STUDENT_PHOTO_PREFIX}
              entityId={String(student!.id)}
            />
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="id_card.empty_state"
        >
          <CreditCard className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">
            {forSelf
              ? "Student profile not found."
              : "Select a student to generate their ID card."}
          </p>
        </div>
      )}
    </div>
  );
}

function StaffIDCard() {
  const { staffMembers, departments, academicCalendars } = useApp();
  const activeCalendar = academicCalendars.find((c) => c.isActive);
  const session =
    activeCalendar?.session ??
    `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const staff = staffMembers.find((s) => s.staffId === selectedStaffId);
  const deptName = staff
    ? (departments.find((d) => String(d.id) === String(staff.departmentId))
        ?.name ?? "N/A")
    : "N/A";

  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    staff ? getPhotoUrl(STAFF_PHOTO_PREFIX, staff.staffId) : null,
  );

  useEffect(() => {
    if (staff) setPhotoUrl(getPhotoUrl(STAFF_PHOTO_PREFIX, staff.staffId));
  }, [staff]);

  const cardData: IDCardData | null = staff
    ? {
        name: staff.name,
        id: staff.staffId,
        idLabel: "Staff ID",
        department: deptName,
        role: staff.designation,
        session,
        photoUrl,
        photoPrefix: STAFF_PHOTO_PREFIX,
        qrValue: `STAFF:${staff.staffId}`,
      }
    : null;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Select Staff Member
        </p>
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger
            className="w-full max-w-sm"
            data-ocid="staff_id_card.select"
          >
            <SelectValue placeholder="Choose a staff member..." />
          </SelectTrigger>
          <SelectContent>
            {staffMembers.map((s) => (
              <SelectItem key={s.staffId} value={s.staffId}>
                {s.name} — {s.staffId} ({s.designation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cardData ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Card Preview
            </p>
            <IDCardPreview data={cardData} />
            <Button
              size="sm"
              onClick={() => window.print()}
              className="w-full"
              data-ocid="staff_id_card.print_button"
            >
              <Printer className="w-4 h-4 mr-1.5" /> Print ID Card
            </Button>
          </div>
          <div className="flex-1 max-w-xs space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Staff Photo
            </p>
            <PhotoCapture
              photoUrl={photoUrl}
              onPhoto={setPhotoUrl}
              photoPrefix={STAFF_PHOTO_PREFIX}
              entityId={staff!.staffId}
            />
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="staff_id_card.empty_state"
        >
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">
            Select a staff member to generate their ID card.
          </p>
        </div>
      )}
    </div>
  );
}

interface IDCardTabProps {
  mode?: "student" | "admin";
}

export default function IDCardTab({ mode = "admin" }: IDCardTabProps) {
  const [cardType, setCardType] = useState<"student" | "staff">("student");

  return (
    <div className="space-y-6" data-ocid="id_card.page">
      <style>{`
        @media print {
          body > * { display: none !important; }
          .id-card-print { display: block !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          ID Card Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate and print identity cards for students and staff.
        </p>
      </div>

      {mode === "admin" && (
        <div className="flex gap-2 no-print">
          <Button
            size="sm"
            variant={cardType === "student" ? "default" : "outline"}
            onClick={() => setCardType("student")}
            data-ocid="id_card.student.tab"
          >
            <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Student ID
          </Button>
          <Button
            size="sm"
            variant={cardType === "staff" ? "default" : "outline"}
            onClick={() => setCardType("staff")}
            data-ocid="id_card.staff.tab"
          >
            <Users className="w-3.5 h-3.5 mr-1.5" /> Staff ID
          </Button>
        </div>
      )}

      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {cardType === "student" ? (
              <>
                <GraduationCap className="w-4 h-4 text-primary" /> Student ID
                Card
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-primary" /> Staff ID Card
              </>
            )}
            <Badge variant="outline" className="ml-auto text-xs">
              Printable
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "admin" && cardType === "staff" ? (
            <StaffIDCard />
          ) : (
            <StudentIDCard forSelf={mode === "student"} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { StudentIDCard };
