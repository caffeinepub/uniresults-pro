import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import type { Course } from "../../backend.d";
import type {
  ExtendedStudent,
  InstitutionSettings,
} from "../../context/AppContext";

interface Props {
  student: ExtendedStudent;
  registeredCourses: Course[];
  session: string;
  semester: string;
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

export default function CourseRegSlipModal({
  student,
  registeredCourses,
  session,
  semester,
  open,
  onClose,
}: Props) {
  const settings = getSettings();
  const totalCredits = registeredCourses.reduce(
    (sum, c) => sum + Number(c.creditUnits),
    0,
  );
  const date = new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl" data-ocid="reg_slip.dialog">
        <DialogHeader>
          <DialogTitle>Course Registration Slip</DialogTitle>
        </DialogHeader>

        <div className="reg-slip-print bg-white p-6 rounded-lg border border-border print:border-0 print:shadow-none text-gray-900">
          {/* Institution header */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold uppercase tracking-wide">
              {settings.name}
            </h1>
            <p className="text-xs text-gray-500">{settings.address}</p>
            <p className="text-xs text-gray-500">
              {settings.phone} · {settings.email}
            </p>
            <div className="mt-3 border-t-2 border-b border-gray-800 py-1">
              <p className="font-semibold text-sm uppercase tracking-widest">
                Course Registration Form
              </p>
            </div>
          </div>

          {/* Student info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5 text-sm">
            <InfoRow label="Student Name" value={student.name} />
            <InfoRow label="Matric Number" value={student.matricNumber} />
            <InfoRow label="Session" value={session || "—"} />
            <InfoRow label="Semester" value={semester || "—"} />
            <InfoRow label="Level" value={`${student.level} Level`} />
            <InfoRow label="Date" value={date} />
          </div>

          {/* Courses table grouped by semester */}
          {["First", "Second"].map((sem) => {
            const semCourses = registeredCourses.filter(
              (c) => c.semester === sem,
            );
            if (semCourses.length === 0) return null;
            const semCredits = semCourses.reduce(
              (s, c) => s + Number(c.creditUnits),
              0,
            );
            return (
              <div key={sem} className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide border-b border-gray-200 pb-1">
                  {sem} Semester
                </p>
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="text-xs">S/N</TableHead>
                      <TableHead className="text-xs">Course Code</TableHead>
                      <TableHead className="text-xs">Course Title</TableHead>
                      <TableHead className="text-xs text-right">
                        Units
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semCourses.map((c, i) => (
                      <TableRow key={String(c.id)}>
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell className="text-xs font-mono font-medium">
                          {c.code}
                        </TableCell>
                        <TableCell className="text-xs">{c.name}</TableCell>
                        <TableCell className="text-xs text-right">
                          {Number(c.creditUnits)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell colSpan={3} className="text-xs text-right">
                        Subtotal
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {semCredits}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          })}
          <div className="flex justify-end border-t border-gray-300 pt-2 mt-2">
            <span className="text-xs font-bold text-gray-800">
              Total Credit Units: {totalCredits}
            </span>
          </div>

          {/* Signature block */}
          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="border-t border-gray-400 pt-1">
                <p className="text-xs text-gray-500">
                  Student Signature / Date
                </p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-1">
                <p className="text-xs text-gray-500">
                  Registrar Signature / Date
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            This slip is only valid for the current semester with official stamp
          </p>
        </div>

        <div className="flex justify-end gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            data-ocid="reg_slip.cancel_button"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            size="sm"
            data-ocid="reg_slip.print_button"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4 mr-1" /> Print Slip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 text-xs w-32 shrink-0">{label}:</span>
      <span className="font-medium text-xs">{value}</span>
    </div>
  );
}
