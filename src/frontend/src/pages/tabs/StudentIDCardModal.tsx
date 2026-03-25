import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap, Printer, User } from "lucide-react";
import type {
  ExtendedStudent,
  InstitutionSettings,
} from "../../context/AppContext";

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
    name: "Federal University",
    address: "University Road, Nigeria",
    phone: "+234 800 000 0000",
    email: "info@university.edu.ng",
    website: "www.university.edu.ng",
    logoText: "FU",
  };
}

export default function StudentIDCardModal({ student, open, onClose }: Props) {
  const settings = getSettings();

  function handlePrint() {
    window.print();
  }

  const year = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm" data-ocid="student_id_card.dialog">
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
            {/* Photo placeholder */}
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
              }}
            >
              <User size={28} color="#9ca3af" />
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
            onClick={handlePrint}
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
