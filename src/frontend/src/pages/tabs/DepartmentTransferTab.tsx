import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

export interface DepartmentTransfer {
  id: string;
  studentMatric: string;
  studentName: string;
  fromDept: string;
  toDept: string;
  reason: string;
  status:
    | "pending"
    | "origin_approved"
    | "dest_accepted"
    | "finalized"
    | "rejected";
  originHODNote?: string;
  destHODNote?: string;
  registrarNote?: string;
  appliedAt: string;
  updatedAt: string;
}

function getTransfers(): DepartmentTransfer[] {
  try {
    return JSON.parse(localStorage.getItem("departmentTransfers") || "[]");
  } catch {
    return [];
  }
}

function saveTransfers(list: DepartmentTransfer[]) {
  localStorage.setItem("departmentTransfers", JSON.stringify(list));
}

const STATUS_LABEL: Record<DepartmentTransfer["status"], string> = {
  pending: "Pending HOD Review",
  origin_approved: "Origin HOD Approved",
  dest_accepted: "Destination HOD Accepted",
  finalized: "Finalized",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<DepartmentTransfer["status"], string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  origin_approved: "bg-accent/10 text-accent border-accent/20",
  dest_accepted: "bg-primary/10 text-primary border-primary/20",
  finalized: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

// Student view
export function StudentTransferTab() {
  const { currentUser, students, departments } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const [transfers, setTransfers] =
    useState<DepartmentTransfer[]>(getTransfers);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ toDept: "", reason: "" });

  const myTransfers = me
    ? transfers.filter((t) => t.studentMatric === me.matricNumber)
    : [];
  const myDept = departments.find((d) => d.id === me?.departmentId);
  const activePending = myTransfers.find(
    (t) => t.status !== "finalized" && t.status !== "rejected",
  );

  function handleSubmit() {
    if (!form.toDept || !form.reason.trim()) {
      toast.error(
        "Please select a destination department and provide a reason",
      );
      return;
    }
    if (!me) return;
    const transfer: DepartmentTransfer = {
      id: String(Date.now()),
      studentMatric: me.matricNumber,
      studentName: me.name,
      fromDept: String(me.departmentId),
      toDept: form.toDept,
      reason: form.reason.trim(),
      status: "pending",
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [transfer, ...transfers];
    saveTransfers(updated);
    setTransfers(updated);
    setOpen(false);
    setForm({ toDept: "", reason: "" });
    toast.success("Transfer application submitted");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department Transfer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Apply for an inter-departmental transfer
        </p>
      </div>

      {myDept && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            CURRENT DEPARTMENT
          </p>
          <p className="text-sm font-medium">{myDept.name}</p>
        </div>
      )}

      {!activePending && (
        <Button
          data-ocid="transfer.apply_button"
          onClick={() => setOpen(true)}
          size="sm"
        >
          Apply for Transfer
        </Button>
      )}

      {myTransfers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">My Transfer Applications</h2>
          {myTransfers.map((t, i) => {
            const toDept = departments.find((d) => String(d.id) === t.toDept);
            return (
              <div
                key={t.id}
                data-ocid={`transfer.item.${i + 1}`}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {myDept?.name ?? t.fromDept}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">
                      {toDept?.name ?? t.toDept}
                    </span>
                  </div>
                  <Badge className={`text-xs border ${STATUS_COLOR[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t.reason}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Applied: {new Date(t.appliedAt).toLocaleDateString("en-NG")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent data-ocid="transfer.dialog">
          <DialogHeader>
            <DialogTitle>Apply for Department Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Destination Department</Label>
              <Select
                value={form.toDept}
                onValueChange={(v) => setForm((f) => ({ ...f, toDept: v }))}
              >
                <SelectTrigger data-ocid="transfer.dept.select">
                  <SelectValue placeholder="Select target department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments
                    .filter((d) => d.id !== me?.departmentId)
                    .map((d) => (
                      <SelectItem key={String(d.id)} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason for Transfer</Label>
              <Textarea
                data-ocid="transfer.reason.textarea"
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="Explain your reason for transfer..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="transfer.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="transfer.submit_button" onClick={handleSubmit}>
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// HOD view
export function HODTransferTab() {
  const { currentUser, departments } = useApp();
  const myDeptId = String(currentUser?.departmentId ?? "");
  const [transfers, setTransfers] =
    useState<DepartmentTransfer[]>(getTransfers);
  const [noteDialog, setNoteDialog] = useState<{
    transfer: DepartmentTransfer;
    action: "approve" | "reject" | "accept";
  } | null>(null);
  const [note, setNote] = useState("");

  const myTransfers = useMemo(
    () =>
      transfers.filter(
        (t) =>
          (t.fromDept === myDeptId && t.status === "pending") ||
          (t.toDept === myDeptId && t.status === "origin_approved"),
      ),
    [transfers, myDeptId],
  );

  function handleAction() {
    if (!noteDialog) return;
    const { transfer, action } = noteDialog;
    let updated: DepartmentTransfer;
    if (action === "approve") {
      updated = {
        ...transfer,
        status: "origin_approved",
        originHODNote: note,
        updatedAt: new Date().toISOString(),
      };
    } else if (action === "accept") {
      updated = {
        ...transfer,
        status: "dest_accepted",
        destHODNote: note,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = {
        ...transfer,
        status: "rejected",
        originHODNote: note,
        updatedAt: new Date().toISOString(),
      };
    }
    const list = transfers.map((t) => (t.id === transfer.id ? updated : t));
    saveTransfers(list);
    setTransfers(list);
    setNoteDialog(null);
    setNote("");
    toast.success(`Transfer ${action === "reject" ? "rejected" : "approved"}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department Transfers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Transfer applications requiring your action
        </p>
      </div>

      {myTransfers.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground text-sm"
          data-ocid="hod_transfer.empty_state"
        >
          No transfer applications pending your action
        </div>
      ) : (
        <div className="space-y-3">
          {myTransfers.map((t, i) => {
            const fromDept = departments.find(
              (d) => String(d.id) === t.fromDept,
            );
            const toDept = departments.find((d) => String(d.id) === t.toDept);
            const isOrigin = t.fromDept === myDeptId;
            return (
              <div
                key={t.id}
                data-ocid={`hod_transfer.item.${i + 1}`}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-sm">{t.studentName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{fromDept?.name ?? t.fromDept}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{toDept?.name ?? t.toDept}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs border ${STATUS_COLOR[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{t.reason}</p>
                <div className="flex gap-2 mt-3">
                  {isOrigin && t.status === "pending" && (
                    <>
                      <Button
                        data-ocid={`hod_transfer.approve_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="text-success border-success/30"
                        onClick={() => {
                          setNoteDialog({ transfer: t, action: "approve" });
                          setNote("");
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        data-ocid={`hod_transfer.reject_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30"
                        onClick={() => {
                          setNoteDialog({ transfer: t, action: "reject" });
                          setNote("");
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {!isOrigin && t.status === "origin_approved" && (
                    <>
                      <Button
                        data-ocid={`hod_transfer.accept_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="text-success border-success/30"
                        onClick={() => {
                          setNoteDialog({ transfer: t, action: "accept" });
                          setNote("");
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Accept
                      </Button>
                      <Button
                        data-ocid={`hod_transfer.reject_button.${i + 1}`}
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30"
                        onClick={() => {
                          setNoteDialog({ transfer: t, action: "reject" });
                          setNote("");
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!noteDialog}
        onOpenChange={(v) => !v && setNoteDialog(null)}
      >
        <DialogContent data-ocid="hod_transfer.dialog">
          <DialogHeader>
            <DialogTitle>
              {noteDialog?.action === "reject"
                ? "Reject Transfer"
                : noteDialog?.action === "accept"
                  ? "Accept Transfer"
                  : "Approve Transfer"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Note (optional)</Label>
            <Textarea
              data-ocid="hod_transfer.note.textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="hod_transfer.cancel_button"
              variant="outline"
              onClick={() => setNoteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="hod_transfer.confirm_button"
              variant={
                noteDialog?.action === "reject" ? "destructive" : "default"
              }
              onClick={handleAction}
            >
              {noteDialog?.action === "reject"
                ? "Reject"
                : noteDialog?.action === "accept"
                  ? "Accept"
                  : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin/Registrar view
export function AdminTransferTab() {
  const { departments } = useApp();
  const [transfers, setTransfers] =
    useState<DepartmentTransfer[]>(getTransfers);
  const [noteDialog, setNoteDialog] = useState<DepartmentTransfer | null>(null);
  const [action, setAction] = useState<"finalize" | "reject">("finalize");
  const [note, setNote] = useState("");

  const pending = transfers.filter((t) => t.status === "dest_accepted");
  const all = [...transfers].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  );

  function handleAction() {
    if (!noteDialog) return;
    const updated: DepartmentTransfer = {
      ...noteDialog,
      status: action === "finalize" ? "finalized" : "rejected",
      registrarNote: note,
      updatedAt: new Date().toISOString(),
    };
    const list = transfers.map((t) => (t.id === noteDialog.id ? updated : t));
    saveTransfers(list);
    setTransfers(list);
    setNoteDialog(null);
    setNote("");
    toast.success(
      `Transfer ${action === "finalize" ? "finalized" : "rejected"}`,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Department Transfers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All transfer applications · Finalize approved transfers
        </p>
      </div>

      {pending.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-warning mb-2">
            {pending.length} transfer(s) awaiting final approval
          </p>
          <div className="space-y-2">
            {pending.map((t, i) => {
              const fromDept = departments.find(
                (d) => String(d.id) === t.fromDept,
              );
              const toDept = departments.find((d) => String(d.id) === t.toDept);
              return (
                <div
                  key={t.id}
                  data-ocid={`admin_transfer.item.${i + 1}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm">
                    <strong>{t.studentName}</strong>: {fromDept?.name} →{" "}
                    {toDept?.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      data-ocid={`admin_transfer.finalize_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      className="text-success border-success/30 h-7 text-xs"
                      onClick={() => {
                        setNoteDialog(t);
                        setAction("finalize");
                        setNote("");
                      }}
                    >
                      Finalize
                    </Button>
                    <Button
                      data-ocid={`admin_transfer.reject_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 h-7 text-xs"
                      onClick={() => {
                        setNoteDialog(t);
                        setAction("reject");
                        setNote("");
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {all.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground text-sm"
            data-ocid="admin_transfer.empty_state"
          >
            No transfer applications
          </div>
        ) : (
          all.map((t, i) => {
            const fromDept = departments.find(
              (d) => String(d.id) === t.fromDept,
            );
            const toDept = departments.find((d) => String(d.id) === t.toDept);
            return (
              <div
                key={t.id}
                data-ocid={`admin_transfer.list.item.${i + 1}`}
                className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {t.studentName}{" "}
                    <span className="text-muted-foreground font-mono text-xs">
                      ({t.studentMatric})
                    </span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{fromDept?.name ?? t.fromDept}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{toDept?.name ?? t.toDept}</span>
                  </div>
                </div>
                <Badge className={`text-xs border ${STATUS_COLOR[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        open={!!noteDialog}
        onOpenChange={(v) => !v && setNoteDialog(null)}
      >
        <DialogContent data-ocid="admin_transfer.dialog">
          <DialogHeader>
            <DialogTitle>
              {action === "finalize" ? "Finalize Transfer" : "Reject Transfer"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Registrar Note (optional)</Label>
            <Textarea
              data-ocid="admin_transfer.note.textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="admin_transfer.cancel_button"
              variant="outline"
              onClick={() => setNoteDialog(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="admin_transfer.confirm_button"
              variant={action === "reject" ? "destructive" : "default"}
              onClick={handleAction}
            >
              {action === "finalize" ? "Finalize" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
