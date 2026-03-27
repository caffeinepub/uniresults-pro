import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, Printer } from "lucide-react";
import {
  getDegreeClassification,
  getStudentDepartment,
  getStudentFaculty,
  useApp,
} from "../../context/AppContext";
import type { ExtendedStudent } from "../../context/AppContext";

interface Props {
  student: ExtendedStudent;
  open: boolean;
  onClose: () => void;
}

export default function GraduationCertificateModal({
  student,
  open,
  onClose,
}: Props) {
  const {
    institutionSettings,
    departments,
    faculties,
    results,
    courses,
    currentUser,
    staffMembers,
  } = useApp();

  const deptObj = getStudentDepartment(student, departments);
  const facultyObj = getStudentFaculty(student, departments, faculties);

  const studentResults = results.filter(
    (r) =>
      String(r.studentId) === String(student.id) &&
      ["published", "approved"].includes(r.status),
  );
  let totalGP = 0;
  let totalCU = 0;
  for (const r of studentResults) {
    const c = courses.find((c) => String(c.id) === String(r.courseId));
    const cu = c ? Number(c.creditUnits) : 0;
    totalGP += (r.gradePoint ?? 0) * cu;
    totalCU += cu;
  }
  const cgpa = totalCU > 0 ? Math.round((totalGP / totalCU) * 100) / 100 : 0;
  const classification = getDegreeClassification(cgpa);

  const deptName = deptObj?.name ?? "";
  let degreeTitle = "Bachelor of Science";
  if (deptName.toLowerCase().includes("education"))
    degreeTitle = "Bachelor of Education";
  else if (deptName.toLowerCase().includes("engineering"))
    degreeTitle = "Bachelor of Engineering";
  else if (deptName.toLowerCase().includes("law"))
    degreeTitle = "Bachelor of Laws";
  else if (deptName.toLowerCase().includes("arts"))
    degreeTitle = "Bachelor of Arts";

  const gradDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const vc = staffMembers.find(
    (s) =>
      s.designation.toLowerCase().includes("vice") ||
      s.designation.toLowerCase().includes("provost"),
  );
  const registrar = staffMembers.find((s) =>
    s.designation.toLowerCase().includes("registrar"),
  );
  const deanStaff = staffMembers.find((s) =>
    s.designation.toLowerCase().includes("dean"),
  );

  const signatories = [
    { title: "Vice-Chancellor", name: vc?.name ?? "Prof. [Vice-Chancellor]" },
    {
      title: "Registrar",
      name: registrar?.name ?? currentUser?.name ?? "[Registrar]",
    },
    { title: "Dean", name: deanStaff?.name ?? "[Dean of Faculty]" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Graduation Certificate
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-end mb-2 no-print">
          <Button
            size="sm"
            onClick={() => window.print()}
            data-ocid="cert.print_button"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Certificate
          </Button>
        </div>
        <div
          id="graduation-certificate"
          className="border-4 border-primary/30 rounded-xl p-8 bg-gradient-to-b from-card to-muted/10 space-y-6"
        >
          <div className="text-center space-y-1">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                <Award className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-lg font-bold uppercase tracking-widest">
              {institutionSettings.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {institutionSettings.address}
            </p>
          </div>
          <div className="border-t border-b border-primary/20 py-3 text-center">
            <h2 className="text-2xl font-bold uppercase tracking-[0.3em] text-primary">
              Certificate of Graduation
            </h2>
          </div>
          <div className="text-center space-y-3 text-sm leading-relaxed">
            <p className="text-muted-foreground">This is to certify that</p>
            <p className="text-2xl font-bold">{student.name}</p>
            <p className="text-muted-foreground">
              with Matriculation Number{" "}
              <span className="font-semibold font-mono">
                {student.matricNumber}
              </span>
            </p>
            <p className="text-muted-foreground">
              having successfully completed all requirements for the award of
            </p>
            <p className="text-lg font-bold">
              {degreeTitle} in {deptName}
            </p>
            <p className="text-muted-foreground">
              in the Department of{" "}
              <span className="font-semibold">{deptName}</span>
              {facultyObj ? (
                <>
                  , Faculty of{" "}
                  <span className="font-semibold">{facultyObj.name}</span>
                </>
              ) : null}
              , is hereby awarded this certificate with
            </p>
            <p className="text-xl font-bold text-primary">{classification}</p>
            <p className="text-muted-foreground">
              with a CGPA of{" "}
              <span className="font-bold">{cgpa.toFixed(2)}</span>
            </p>
            <p className="text-muted-foreground">
              Given under the seal of the University on{" "}
              <span className="font-semibold">{gradDate}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-8 mt-4 border-t border-primary/10">
            {signatories.map((sig) => (
              <div key={sig.title} className="text-center space-y-2">
                <div className="h-10 border-b border-foreground/40 mx-4" />
                <p className="text-xs font-semibold">{sig.name}</p>
                <p className="text-xs text-muted-foreground">{sig.title}</p>
                <p className="text-xs text-muted-foreground">
                  Date: ___________
                </p>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
