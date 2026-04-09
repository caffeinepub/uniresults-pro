import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Award, FileText, Plus, Printer, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import type { PGApplication } from "./PGAdmissionTab";
import { loadApps } from "./PGAdmissionTab";

// ── Types ──────────────────────────────────────────────────────────────────
export interface PGCertificate {
  id: string;
  certNo: string;
  pgStudentId: string;
  fullName: string;
  programme: string;
  degreeName: string;
  departmentId: string;
  facultyName: string;
  session: string;
  graduationYear: string;
  cgpa: number;
  classification: string;
  deanName: string;
  registrarName: string;
  vcName: string;
  issuedAt: string;
  referenceNo: string;
}

// ── Storage ────────────────────────────────────────────────────────────────
const CERT_KEY = "unipro_pg_certificates";

export function loadPGCertificates(): PGCertificate[] {
  try {
    return JSON.parse(localStorage.getItem(CERT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function savePGCertificates(d: PGCertificate[]) {
  localStorage.setItem(CERT_KEY, JSON.stringify(d));
}

function generateCertNo(year: string, seq: number): string {
  return `CERT/PG/${year}/${String(seq).padStart(3, "0")}`;
}

function pgDegreeName(programme: string, deptName: string): string {
  const base: Record<string, string> = {
    MSc: "Master of Science",
    PGDE: "Postgraduate Diploma in Education",
    PhD: "Doctor of Philosophy",
    MBA: "Master of Business Administration",
    PGD: "Postgraduate Diploma",
  };
  const label = base[programme] ?? programme;
  if (programme === "PGDE" || programme === "PGD") return `${label}`;
  return `${label} in ${deptName}`;
}

function pgClassification(cgpa: number): string {
  if (cgpa >= 4.5) return "Distinction";
  if (cgpa >= 3.5) return "Merit";
  if (cgpa >= 2.5) return "Pass";
  return "Unclassified";
}

// ── Component ──────────────────────────────────────────────────────────────
export default function PGCertificateTab() {
  const { departments, currentUser, logAudit, institutionSettings } = useApp();
  const [certs, setCertsState] = useState<PGCertificate[]>(loadPGCertificates);
  const [showForm, setShowForm] = useState(false);
  const [previewCert, setPreviewCert] = useState<PGCertificate | null>(null);

  // Get matriculated PG applicants that don't have certificates yet
  const matriculatedApps = loadApps().filter(
    (a: PGApplication) =>
      a.status === "matriculated" || a.status === "active_pg_student",
  );
  const issuedIds = new Set(certs.map((c) => c.pgStudentId));
  const eligible = matriculatedApps.filter(
    (a: PGApplication) => !issuedIds.has(a.matriculationNo ?? a.referenceNo),
  );

  const [form, setForm] = useState({
    appId: "",
    cgpa: "",
    deanName: "",
    registrarName: "",
    vcName: "",
    facultyName: "",
    graduationYear: String(new Date().getFullYear()),
  });

  function handleGenerate() {
    if (!form.appId) {
      toast.error("Select a student");
      return;
    }
    if (!form.cgpa || Number(form.cgpa) <= 0) {
      toast.error("Enter CGPA");
      return;
    }
    if (!form.deanName || !form.registrarName || !form.vcName) {
      toast.error("All signatory names are required");
      return;
    }

    const app = matriculatedApps.find(
      (a: PGApplication) => a.id === form.appId,
    );
    if (!app) {
      toast.error("Applicant not found");
      return;
    }
    const dept = departments.find((d) => String(d.id) === app.departmentId);
    const cgpa = Number(form.cgpa);
    const cert: PGCertificate = {
      id: Date.now().toString(),
      certNo: generateCertNo(form.graduationYear, certs.length + 1),
      pgStudentId: app.matriculationNo ?? app.referenceNo,
      fullName: app.fullName,
      programme: app.programme,
      degreeName: pgDegreeName(app.programme, dept?.name ?? app.departmentId),
      departmentId: app.departmentId,
      facultyName: form.facultyName || "Postgraduate School",
      session: app.session,
      graduationYear: form.graduationYear,
      cgpa,
      classification: pgClassification(cgpa),
      deanName: form.deanName,
      registrarName: form.registrarName,
      vcName: form.vcName,
      issuedAt: new Date().toISOString(),
      referenceNo: app.referenceNo,
    };
    const updated = [...certs, cert];
    setCertsState(updated);
    savePGCertificates(updated);
    setShowForm(false);
    setPreviewCert(cert);
    toast.success("PG Certificate generated successfully");
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "PG Certificate Generated",
      `${cert.certNo} — ${cert.fullName}`,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">PG Certificate Generation</h2>
      </div>

      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Issued Certificates</p>
            <p className="text-2xl font-bold">{certs.length}</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Eligible Students</p>
            <p className="text-2xl font-bold text-amber-600">
              {eligible.length}
            </p>
          </CardContent>
        </Card>
        <Button
          onClick={() => setShowForm(true)}
          data-ocid="pg_cert.generate_btn"
        >
          <Plus className="w-4 h-4 mr-1" /> Generate Certificate
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Generate PG Certificate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">
                  Select Student (Matriculated PG)
                </Label>
                <Select
                  value={form.appId}
                  onValueChange={(v) => setForm({ ...form, appId: v })}
                >
                  <SelectTrigger
                    className="h-8 text-sm"
                    data-ocid="pg_cert.student_select"
                  >
                    <SelectValue placeholder="Choose student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligible.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No eligible students found
                      </SelectItem>
                    ) : (
                      eligible.map((a: PGApplication) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.fullName} — {a.programme} (
                          {a.matriculationNo ?? a.referenceNo})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Final CGPA (5-point scale)</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  min="0"
                  max="5"
                  step="0.01"
                  value={form.cgpa}
                  onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                  placeholder="e.g. 4.25"
                  data-ocid="pg_cert.cgpa_input"
                />
              </div>
              <div>
                <Label className="text-xs">Graduation Year</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.graduationYear}
                  onChange={(e) =>
                    setForm({ ...form, graduationYear: e.target.value })
                  }
                  data-ocid="pg_cert.year_input"
                />
              </div>
              <div>
                <Label className="text-xs">Faculty / School Name</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.facultyName}
                  onChange={(e) =>
                    setForm({ ...form, facultyName: e.target.value })
                  }
                  placeholder="School of Postgraduate Studies"
                  data-ocid="pg_cert.faculty_input"
                />
              </div>
              <div>
                <Label className="text-xs">Dean's Name</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.deanName}
                  onChange={(e) =>
                    setForm({ ...form, deanName: e.target.value })
                  }
                  placeholder="Prof. A. Musa"
                  data-ocid="pg_cert.dean_input"
                />
              </div>
              <div>
                <Label className="text-xs">Registrar's Name</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.registrarName}
                  onChange={(e) =>
                    setForm({ ...form, registrarName: e.target.value })
                  }
                  placeholder="Dr. B. Adamu"
                  data-ocid="pg_cert.registrar_input"
                />
              </div>
              <div>
                <Label className="text-xs">Vice-Chancellor / Provost</Label>
                <Input
                  className="h-8 text-sm"
                  value={form.vcName}
                  onChange={(e) => setForm({ ...form, vcName: e.target.value })}
                  placeholder="Prof. C. Usman"
                  data-ocid="pg_cert.vc_input"
                />
              </div>
            </div>
            {form.cgpa && (
              <p className="text-xs text-muted-foreground">
                Classification:{" "}
                <strong className="text-foreground">
                  {pgClassification(Number(form.cgpa))}
                </strong>
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleGenerate}
                data-ocid="pg_cert.submit_btn"
              >
                Generate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Preview */}
      {previewCert && (
        <CertificatePreview
          cert={previewCert}
          institutionName={
            institutionSettings.name ||
            "Federal University of Education, Kontagora"
          }
          onClose={() => setPreviewCert(null)}
        />
      )}

      {/* Registry Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" /> Certificate Registry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table data-ocid="pg_cert.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Cert No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="no-print">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                      data-ocid="pg_cert.empty_state"
                    >
                      No PG certificates issued yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  certs.map((c) => (
                    <TableRow key={c.id} data-ocid={`pg_cert.row.${c.certNo}`}>
                      <TableCell className="font-mono text-xs">
                        {c.certNo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {c.pgStudentId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.programme}</Badge>
                      </TableCell>
                      <TableCell
                        className="text-xs max-w-40 truncate"
                        title={c.degreeName}
                      >
                        {c.degreeName}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {c.cgpa.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.classification === "Distinction"
                              ? "default"
                              : c.classification === "Merit"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {c.classification}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.graduationYear}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(c.issuedAt).toLocaleDateString("en-NG")}
                      </TableCell>
                      <TableCell className="no-print">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewCert(c)}
                          title="Preview Certificate"
                          data-ocid={`pg_cert.preview_btn.${c.certNo}`}
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Certificate Preview Component ──────────────────────────────────────────
function CertificatePreview({
  cert,
  institutionName,
  onClose,
}: {
  cert: PGCertificate;
  institutionName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print"
      data-ocid="pg_cert.preview_dialog"
    >
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Certificate Preview — {cert.certNo}</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              data-ocid="pg_cert.print_btn"
            >
              <Printer className="w-3 h-3 mr-1" /> Print
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div id="pg-certificate" className="p-8 print:p-0 space-y-6">
          {/* Border decoration */}
          <div className="border-4 border-double border-primary/50 p-8 rounded-lg space-y-5">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <p className="text-xl font-bold uppercase tracking-wider">
                {institutionName}
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-widest">
                {cert.facultyName}
              </p>
              <div className="w-24 h-0.5 bg-primary/30 mx-auto mt-2" />
            </div>

            {/* Main text */}
            <div className="text-center space-y-3">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                This is to certify that
              </p>
              <p className="text-3xl font-bold font-display">{cert.fullName}</p>
              <p className="text-sm text-muted-foreground">
                Matriculation Number:{" "}
                <span className="font-mono font-semibold">
                  {cert.pgStudentId}
                </span>
              </p>
              <p className="text-sm">
                having fulfilled all requirements and satisfied the examiners
              </p>
              <p className="text-sm">was awarded the degree of</p>
              <p className="text-2xl font-bold text-primary leading-tight">
                {cert.degreeName}
              </p>
              <p className="text-sm">
                with{" "}
                <span className="font-semibold">{cert.classification}</span>{" "}
                &nbsp;(CGPA: {cert.cgpa.toFixed(2)} / 5.00)
              </p>
              <p className="text-sm">
                In the year <strong>{cert.graduationYear}</strong>
              </p>
            </div>

            {/* Seal placeholder */}
            <div className="flex justify-center my-4">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center">
                <p className="text-[9px] text-muted-foreground text-center leading-tight uppercase">
                  Official
                  <br />
                  Seal
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              {[
                { title: "Dean of Postgraduate Studies", name: cert.deanName },
                { title: "Registrar", name: cert.registrarName },
                { title: "Vice-Chancellor / Provost", name: cert.vcName },
              ].map((sig) => (
                <div key={sig.title} className="text-center">
                  <div className="h-8 border-b border-border mb-1" />
                  <p className="text-xs font-semibold">{sig.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sig.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-muted-foreground border-t border-border pt-3">
              Certificate No: <span className="font-mono">{cert.certNo}</span>{" "}
              &nbsp;|&nbsp; Session: {cert.session} &nbsp;|&nbsp; Issued:{" "}
              {new Date(cert.issuedAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
