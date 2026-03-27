import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type GraduationRequirements, useApp } from "../../context/AppContext";

export default function GraduationRequirementsTab() {
  const {
    graduationRequirements,
    departments,
    addGraduationRequirement,
    updateGraduationRequirement,
    deleteGraduationRequirement,
    logAudit,
    currentUser,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GraduationRequirements | null>(null);
  const [form, setForm] = useState<Omit<GraduationRequirements, "id">>(
    defaultForm(),
  );

  function defaultForm(): Omit<GraduationRequirements, "id"> {
    return {
      departmentId: "all",
      minCreditUnits: 120,
      maxCreditUnits: 180,
      minCGPA: 1.0,
      minDuration: 4,
      maxDuration: 7,
    };
  }

  function openNew() {
    setEditing(null);
    setForm(defaultForm());
    setOpen(true);
  }

  function openEdit(req: GraduationRequirements) {
    setEditing(req);
    setForm({
      departmentId: req.departmentId,
      minCreditUnits: req.minCreditUnits,
      maxCreditUnits: req.maxCreditUnits,
      minCGPA: req.minCGPA,
      minDuration: req.minDuration,
      maxDuration: req.maxDuration,
    });
    setOpen(true);
  }

  function handleSave() {
    if (form.minCreditUnits > form.maxCreditUnits) {
      toast.error("Min credits cannot exceed max credits");
      return;
    }
    if (form.minDuration > form.maxDuration) {
      toast.error("Min duration cannot exceed max duration");
      return;
    }
    if (editing) {
      updateGraduationRequirement({ ...editing, ...form });
      toast.success("Requirement updated");
      logAudit(
        currentUser?.name ?? "",
        currentUser?.role ?? "",
        "Update Graduation Requirement",
        `Updated requirement for ${getDeptName(form.departmentId)}`,
      );
    } else {
      addGraduationRequirement(form);
      toast.success("Requirement added");
      logAudit(
        currentUser?.name ?? "",
        currentUser?.role ?? "",
        "Add Graduation Requirement",
        `Added requirement for ${getDeptName(form.departmentId)}`,
      );
    }
    setOpen(false);
  }

  function handleDelete(id: string) {
    deleteGraduationRequirement(id);
    toast.success("Requirement deleted");
    logAudit(
      currentUser?.name ?? "",
      currentUser?.role ?? "",
      "Delete Graduation Requirement",
      `Deleted requirement ${id}`,
    );
  }

  function getDeptName(id: string) {
    if (id === "all") return "All Departments (Default)";
    const d = departments.find((d) => String(d.id) === id);
    return d?.name ?? id;
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Graduation Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Configure credit, CGPA, and duration requirements per department
          </p>
        </div>
        <Button size="sm" data-ocid="grad_req.add_button" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Add Requirement
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Min Credits</TableHead>
              <TableHead>Max Credits</TableHead>
              <TableHead>Min CGPA</TableHead>
              <TableHead>Min Duration</TableHead>
              <TableHead>Max Duration</TableHead>
              <TableHead>Grad Year Range ({currentYear})</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {graduationRequirements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground py-8"
                  data-ocid="grad_req.empty_state"
                >
                  No requirements configured. Add a default or per-department
                  rule.
                </TableCell>
              </TableRow>
            ) : (
              graduationRequirements.map((req, i) => (
                <TableRow key={req.id} data-ocid={`grad_req.item.${i + 1}`}>
                  <TableCell className="font-medium">
                    {req.departmentId === "all" ? (
                      <Badge variant="secondary">All Departments</Badge>
                    ) : (
                      getDeptName(req.departmentId)
                    )}
                  </TableCell>
                  <TableCell>{req.minCreditUnits}</TableCell>
                  <TableCell>{req.maxCreditUnits}</TableCell>
                  <TableCell>{req.minCGPA.toFixed(2)}</TableCell>
                  <TableCell>{req.minDuration} yrs</TableCell>
                  <TableCell>{req.maxDuration} yrs</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {currentYear + req.minDuration} –{" "}
                    {currentYear + req.maxDuration}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`grad_req.edit_button.${i + 1}`}
                      onClick={() => openEdit(req)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-ocid={`grad_req.delete_button.${i + 1}`}
                      onClick={() => handleDelete(req.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">How these rules work:</p>
        <p>
          • <strong>Min/Max Credits</strong>: Total credit units a student must
          accumulate to graduate.
        </p>
        <p>
          • <strong>Min CGPA</strong>: Minimum cumulative GPA required for
          graduation clearance.
        </p>
        <p>
          • <strong>Min/Max Duration</strong>: Expected years to complete the
          programme. Students beyond max duration are flagged as Spillover.
        </p>
        <p>
          • A department-specific rule overrides the &ldquo;All
          Departments&rdquo; default.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="grad_req.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Requirement" : "Add Graduation Requirement"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, departmentId: v }))
                }
              >
                <SelectTrigger data-ocid="grad_req.select">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments (Default)</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Min Credit Units</Label>
                <Input
                  type="number"
                  data-ocid="grad_req.min_credits.input"
                  value={form.minCreditUnits}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minCreditUnits: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Credit Units</Label>
                <Input
                  type="number"
                  data-ocid="grad_req.max_credits.input"
                  value={form.maxCreditUnits}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxCreditUnits: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Min CGPA</Label>
                <Input
                  type="number"
                  step="0.01"
                  data-ocid="grad_req.min_cgpa.input"
                  value={form.minCGPA}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minCGPA: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Min Duration (yrs)</Label>
                <Input
                  type="number"
                  data-ocid="grad_req.min_duration.input"
                  value={form.minDuration}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minDuration: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Duration (yrs)</Label>
                <Input
                  type="number"
                  data-ocid="grad_req.max_duration.input"
                  value={form.maxDuration}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxDuration: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            {form.departmentId !== "" && (
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                For a student admitted in {currentYear}: expected graduation
                between <strong>{currentYear + form.minDuration}</strong> and{" "}
                <strong>{currentYear + form.maxDuration}</strong>. Beyond{" "}
                {currentYear + form.maxDuration} = Spillover.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="grad_req.cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="grad_req.save_button" onClick={handleSave}>
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
