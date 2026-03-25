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
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StaffMember } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";

const DESIGNATIONS: StaffMember["designation"][] = [
  "Graduate Assistant",
  "Assistant Lecturer",
  "Lecturer II",
  "Lecturer I",
  "Senior Lecturer",
  "Associate Professor",
  "Professor",
];

export default function StaffTab() {
  const {
    staffMembers,
    departments,
    faculties,
    courses,
    addStaffMember,
    updateStaffMember,
    removeStaffMember,
  } = useApp();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffMember | null>(null);

  const emptyForm = {
    name: "",
    staffId: "",
    departmentId: "",
    facultyId: "",
    qualification: "",
    designation: "Lecturer II" as StaffMember["designation"],
    dateJoined: "",
    email: "",
    phone: "",
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    return staffMembers.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.staffId.toLowerCase().includes(search.toLowerCase());
      const matchDept =
        deptFilter === "all" || String(s.departmentId) === deptFilter;
      const matchDesig =
        designationFilter === "all" || s.designation === designationFilter;
      return matchSearch && matchDept && matchDesig;
    });
  }, [staffMembers, search, deptFilter, designationFilter]);

  function openAdd() {
    setEditMember(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(m: StaffMember) {
    setEditMember(m);
    setForm({
      name: m.name,
      staffId: m.staffId,
      departmentId: String(m.departmentId),
      facultyId: String(m.facultyId),
      qualification: m.qualification,
      designation: m.designation,
      dateJoined: m.dateJoined,
      email: m.email ?? "",
      phone: m.phone ?? "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.staffId || !form.departmentId) {
      toast.error("Name, Staff ID, and Department are required");
      return;
    }
    const member: StaffMember = {
      id: editMember?.id ?? BigInt(Date.now()),
      name: form.name,
      staffId: form.staffId,
      departmentId: BigInt(form.departmentId),
      facultyId: form.facultyId ? BigInt(form.facultyId) : BigInt(1),
      qualification: form.qualification,
      designation: form.designation,
      courseIds: editMember?.courseIds ?? [],
      dateJoined: form.dateJoined || new Date().toISOString().slice(0, 10),
      email: form.email || undefined,
      phone: form.phone || undefined,
    };
    if (editMember) {
      updateStaffMember(member);
      toast.success("Staff record updated");
    } else {
      addStaffMember(member);
      toast.success("Staff member added");
    }
    setOpen(false);
  }

  function handleDelete() {
    if (!confirmDelete) return;
    removeStaffMember(confirmDelete.id);
    setConfirmDelete(null);
    toast.success("Staff member removed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Directory</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {staffMembers.length} staff member
          {staffMembers.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Input
            data-ocid="staff.search_input"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger data-ocid="staff.dept.select" className="w-44">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={String(d.id)} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={designationFilter}
            onValueChange={setDesignationFilter}
          >
            <SelectTrigger
              data-ocid="staff.designation.select"
              className="w-44"
            >
              <SelectValue placeholder="All Designations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designations</SelectItem>
              {DESIGNATIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button data-ocid="staff.add_button" onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Staff
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Staff ID</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="staff.empty_state"
                >
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m, i) => {
                const dept = departments.find((d) => d.id === m.departmentId);
                const faculty = faculties.find((f) => f.id === m.facultyId);
                const courseCount = m.courseIds.filter((cid) =>
                  courses.some((c) => c.id === cid),
                ).length;
                return (
                  <TableRow
                    key={String(m.id)}
                    data-ocid={`staff.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {m.staffId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {m.designation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {dept?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {faculty?.name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">{courseCount}</TableCell>
                    <TableCell className="text-sm">{m.email ?? "-"}</TableCell>
                    <TableCell className="text-sm">{m.dateJoined}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          data-ocid={`staff.edit_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          data-ocid={`staff.delete_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setConfirmDelete(m)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg" data-ocid="staff.dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {editMember ? "Edit Staff Member" : "Add Staff Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Full Name</Label>
                <Input
                  data-ocid="staff.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <Label>Staff ID</Label>
                <Input
                  data-ocid="staff.id.input"
                  value={form.staffId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, staffId: e.target.value }))
                  }
                  placeholder="CSC/STF/005"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Department</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => {
                    const dept = departments.find((d) => String(d.id) === v);
                    setForm((f) => ({
                      ...f,
                      departmentId: v,
                      facultyId: dept?.facultyId
                        ? String(dept.facultyId)
                        : f.facultyId,
                    }));
                  }}
                >
                  <SelectTrigger data-ocid="staff.department.select">
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={String(d.id)} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Faculty</Label>
                <Select
                  value={form.facultyId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, facultyId: v }))
                  }
                >
                  <SelectTrigger data-ocid="staff.faculty.select">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={String(f.id)} value={String(f.id)}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Designation</Label>
              <Select
                value={form.designation}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    designation: v as StaffMember["designation"],
                  }))
                }
              >
                <SelectTrigger data-ocid="staff.designation_form.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESIGNATIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Qualification</Label>
              <Input
                data-ocid="staff.qualification.input"
                value={form.qualification}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qualification: e.target.value }))
                }
                placeholder="Ph.D Computer Science, University of Lagos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  data-ocid="staff.email.input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  data-ocid="staff.phone.input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Date Joined</Label>
              <Input
                data-ocid="staff.date_joined.input"
                type="date"
                value={form.dateJoined}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateJoined: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="staff.cancel_button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button data-ocid="staff.save_button" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent data-ocid="staff.delete_dialog">
          <DialogHeader>
            <DialogTitle>Remove Staff Member?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <strong>{confirmDelete?.name}</strong> from the system? This cannot
            be undone.
          </p>
          <DialogFooter>
            <Button
              data-ocid="staff.delete_cancel_button"
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="staff.delete_confirm_button"
              variant="destructive"
              onClick={handleDelete}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
