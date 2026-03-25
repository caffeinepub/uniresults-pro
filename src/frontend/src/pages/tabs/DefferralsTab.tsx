import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, UserX, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { DeferralApplication } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

export default function DeferralsTab() {
  const { deferralApplications, updateDeferralStatus } = useApp();
  const [selected, setSelected] = useState<DeferralApplication | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [note, setNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(app: DeferralApplication, type: "approve" | "reject") {
    setSelected(app);
    setActionType(type);
    setNote("");
    setDialogOpen(true);
  }

  function confirmAction() {
    if (!selected) return;
    updateDeferralStatus(
      selected.id,
      actionType === "approve" ? "approved" : "rejected",
      note || undefined,
    );
    setDialogOpen(false);
    toast.success(
      actionType === "approve"
        ? "Deferral application approved"
        : "Deferral application rejected",
    );
  }

  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  const pending = deferralApplications.filter((a) => a.status === "pending");
  const decided = deferralApplications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Student Deferrals</h1>
        <p className="text-sm text-muted-foreground">
          Review and action student deferral / leave of absence applications
        </p>
      </div>

      {/* Pending Applications */}
      <div className="bg-card rounded-xl border border-border shadow-xs">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-warning" />
          <h2 className="font-semibold text-sm">
            Pending Applications ({pending.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Matric</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="deferrals.pending.empty_state"
                  >
                    No pending deferral applications
                  </TableCell>
                </TableRow>
              )}
              {pending.map((app, i) => (
                <TableRow
                  key={String(app.id)}
                  data-ocid={`deferrals.pending.item.${i + 1}`}
                >
                  <TableCell className="font-medium">
                    {app.studentName}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {app.matric}
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {app.reason}
                  </TableCell>
                  <TableCell className="text-sm">
                    {fmtDate(app.returnDate)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDate(app.submittedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        data-ocid={`deferrals.confirm_button.${i + 1}`}
                        size="sm"
                        onClick={() => openDialog(app, "approve")}
                        className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button
                        data-ocid={`deferrals.delete_button.${i + 1}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog(app, "reject")}
                        className="h-7 text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Decided Applications */}
      {decided.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-xs">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm">
              Previous Decisions ({decided.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registrar Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decided.map((app, i) => (
                  <TableRow
                    key={String(app.id)}
                    data-ocid={`deferrals.decided.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {app.studentName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {app.matric}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fmtDate(app.returnDate)}
                    </TableCell>
                    <TableCell>
                      {app.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.registrarNote ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {deferralApplications.length === 0 && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="deferrals.empty_state"
        >
          <UserX className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No deferral applications received</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="deferrals.dialog">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? "Approve Deferral"
                : "Reject Deferral"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Student: <strong>{selected?.studentName}</strong> (
              {selected?.matric})
            </p>
            <p className="text-sm text-muted-foreground">
              Reason: {selected?.reason}
            </p>
            <p className="text-sm text-muted-foreground">
              Expected Return: {selected ? fmtDate(selected.returnDate) : ""}
            </p>
            <div>
              <label className="text-sm font-medium" htmlFor="deferral-note">
                Registrar Note (optional)
              </label>
              <Textarea
                id="deferral-note"
                data-ocid="deferrals.textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the student..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="deferrals.cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="deferrals.confirm_button"
              onClick={confirmAction}
              className={
                actionType === "approve"
                  ? "bg-success text-success-foreground"
                  : "bg-destructive text-destructive-foreground"
              }
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
