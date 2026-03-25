import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import type { GraduationApplication } from "../../context/AppContext";

interface Props {
  app: GraduationApplication;
  open: boolean;
  onClose: () => void;
}

export default function ClearanceCertificateModal({
  app,
  open,
  onClose,
}: Props) {
  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl print:!max-w-none print:shadow-none print:border-none"
        data-ocid="clearance_cert.modal"
      >
        <DialogHeader className="no-print">
          <DialogTitle>Graduation Clearance Certificate</DialogTitle>
        </DialogHeader>

        {/* Certificate */}
        <div
          id="clearance-certificate"
          className="print-only-show bg-white p-8 border-4 border-double border-gray-800 rounded-lg font-serif space-y-6 text-gray-900"
        >
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold tracking-wide">
              UNIRESULTS PRO UNIVERSITY
            </div>
            <div className="text-sm text-gray-600">Office of the Registrar</div>
            <div className="w-24 h-1 bg-primary mx-auto mt-2" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-semibold uppercase tracking-widest text-gray-700">
              Graduation Clearance Certificate
            </p>
            <p className="text-sm text-gray-600">This is to certify that</p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold">{app.studentName}</p>
            <p className="text-sm text-gray-600">
              Matric Number:{" "}
              <span className="font-mono font-semibold">{app.matric}</span>
            </p>
            <p className="text-sm text-gray-600">
              Department: {app.department}
            </p>
            <p className="text-sm text-gray-600">
              Academic Session: {app.session}
            </p>
          </div>

          <div className="text-center text-sm text-gray-700 leading-relaxed max-w-md mx-auto">
            has been duly cleared for graduation and has satisfied all academic,
            financial, and administrative requirements of the University. This
            certificate is issued subject to the final ratification by the
            Senate.
          </div>

          <div className="text-sm text-gray-600 text-center">
            Clearance Date:{" "}
            <span className="font-semibold">
              {new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6">
            {[
              { title: "Head of Department", note: app.hodNote },
              { title: "Dean of Faculty", note: app.deanNote },
              { title: "Registrar", note: app.registrarNote },
            ].map((sig) => (
              <div key={sig.title} className="text-center">
                <div className="border-b border-gray-700 h-10 mb-1" />
                <p className="text-xs font-semibold">{sig.title}</p>
                {sig.note && (
                  <p className="text-xs text-gray-500 mt-0.5">{sig.note}</p>
                )}
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
            UNOFFICIAL — For official use, obtain a certified copy from the
            Registrar's Office
          </div>
        </div>

        <div className="flex justify-end gap-2 no-print pt-2">
          <Button
            data-ocid="clearance_cert.close_button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            data-ocid="clearance_cert.print_button"
            className="bg-primary text-primary-foreground"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-1" /> Print Certificate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
