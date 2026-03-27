import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, QrCode, RotateCcw, ScanLine, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { useQRScanner } from "../../qr-code/useQRScanner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const isMobile =
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

function parseQRData(data: string) {
  if (data.startsWith("UNIPRO:STUDENT:")) {
    return {
      type: "student" as const,
      id: data.replace("UNIPRO:STUDENT:", ""),
    };
  }
  if (data.startsWith("UNIPRO:STAFF:")) {
    return { type: "staff" as const, id: data.replace("UNIPRO:STAFF:", "") };
  }
  return null;
}

export default function QRScannerModal({ open, onClose }: Props) {
  const { students, staffMembers } = useApp();
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 5,
  });

  const latestResult = qrResults[0];
  const parsedQR = latestResult ? parseQRData(latestResult.data) : null;

  const matchedStudent =
    parsedQR?.type === "student"
      ? students.find((s) => s.matricNumber === parsedQR.id)
      : null;

  const matchedStaff =
    parsedQR?.type === "staff"
      ? staffMembers.find((s) => s.staffId === parsedQR.id)
      : null;

  // Auto-start scanning when modal opens
  const hasStarted = useRef(false);
  useEffect(() => {
    if (open && canStartScanning && !hasStarted.current) {
      hasStarted.current = true;
      startScanning();
    }
    if (!open) {
      hasStarted.current = false;
      stopScanning();
      clearResults();
    }
  }, [open, canStartScanning, startScanning, stopScanning, clearResults]);

  function handleClose() {
    stopScanning();
    clearResults();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md" data-ocid="qr_scanner.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Scan ID Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isSupported === false ? (
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
              data-ocid="qr_scanner.error_state"
            >
              <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">
                Camera is not supported in this browser.
              </p>
            </div>
          ) : (
            <>
              {/* Camera preview */}
              <div
                className="relative rounded-xl overflow-hidden bg-black"
                style={{ minHeight: 260 }}
              >
                <video
                  ref={videoRef}
                  style={{
                    width: "100%",
                    height: 260,
                    objectFit: "cover",
                    display: isActive ? "block" : "none",
                  }}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {!isActive && !isLoading && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70"
                    style={{ minHeight: 260 }}
                  >
                    <ScanLine className="w-12 h-12 opacity-30" />
                    <p className="text-sm">Camera not active</p>
                  </div>
                )}

                {isLoading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/60"
                    data-ocid="qr_scanner.loading_state"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  </div>
                )}

                {/* Scan overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="border-2 border-primary/80 rounded-lg"
                      style={{
                        width: 200,
                        height: 200,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                      }}
                    />
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded-full">
                        Point camera at ID card QR code
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  data-ocid="qr_scanner.error_state"
                >
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error.message}</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                {!isActive ? (
                  <Button
                    className="flex-1"
                    onClick={startScanning}
                    disabled={!canStartScanning}
                    data-ocid="qr_scanner.primary_button"
                  >
                    <ScanLine className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={stopScanning}
                    disabled={isLoading}
                    data-ocid="qr_scanner.secondary_button"
                  >
                    Stop Scanning
                  </Button>
                )}

                {isMobile && isActive && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={switchCamera}
                    disabled={isLoading}
                    data-ocid="qr_scanner.toggle"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}

                {qrResults.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={clearResults}
                    data-ocid="qr_scanner.delete_button"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Scan result */}
          {latestResult && (
            <div
              className="p-4 rounded-xl border border-border bg-muted/30"
              data-ocid="qr_scanner.panel"
            >
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                SCAN RESULT
              </p>

              {matchedStudent && (
                <div className="space-y-1" data-ocid="qr_scanner.success_state">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Student
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {matchedStudent.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Matric: {matchedStudent.matricNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Level {matchedStudent.level} · Dept ID{" "}
                    {String(matchedStudent.departmentId)}
                  </p>
                </div>
              )}

              {matchedStaff && (
                <div className="space-y-1" data-ocid="qr_scanner.success_state">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      Staff
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {matchedStaff.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ID: {matchedStaff.staffId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {matchedStaff.designation}
                  </p>
                </div>
              )}

              {!matchedStudent && !matchedStaff && (
                <div data-ocid="qr_scanner.error_state">
                  <p className="text-sm text-muted-foreground">
                    No record found for: {latestResult.data}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            data-ocid="qr_scanner.close_button"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
