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
import { Camera, Pencil, Plus, Printer, Trash2, Users } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCamera } from "../../camera/useCamera";
import type { StaffMember } from "../../context/AppContext";
import { useApp } from "../../context/AppContext";
import StaffIDCardModal from "./StaffIDCardModal";

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
  const [idCardMember, setIdCardMember] = useState<StaffMember | null>(null);
  const [photoModalMember, setPhotoModalMember] = useState<StaffMember | null>(
    null,
  );
  const [photoModalMode, setPhotoModalMode] = useState<"idle" | "camera">(
    "idle",
  );
  const [staffPhotos, setStaffPhotos] = useState<Record<string, string>>(() => {
    const photos: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("staff_photo_url_")) {
        photos[key.replace("staff_photo_url_", "")] =
          localStorage.getItem(key) || "";
      }
    }
    return photos;
  });
  const staffCamera = useCamera({
    facingMode: "user",
    width: 640,
    height: 480,
  });

  function openPhotoModal(m: StaffMember) {
    setPhotoModalMember(m);
    setPhotoModalMode("idle");
  }

  function handleFileUpload(
    staffId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      localStorage.setItem(`staff_photo_url_${staffId}`, url);
      setStaffPhotos((prev) => ({ ...prev, [staffId]: url }));
      toast.success("Staff photo saved.");
    };
    reader.readAsDataURL(file);
  }

  async function captureStaffPhoto(staffId: string) {
    const file = await staffCamera.capturePhoto();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      localStorage.setItem(`staff_photo_url_${staffId}`, url);
      setStaffPhotos((prev) => ({ ...prev, [staffId]: url }));
      toast.success("Staff photo captured.");
      staffCamera.stopCamera();
      setPhotoModalMode("idle");
    };
    reader.readAsDataURL(file);
  }

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
              <TableHead className="w-10">Photo</TableHead>
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
                  colSpan={10}
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="staff.empty_state"
                >
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m, i) => {
                const dept = departments.find(
                  (d) => String(d.id) === String(m.departmentId),
                );
                const faculty = faculties.find(
                  (f) => String(f.id) === String(m.facultyId),
                );
                const courseCount = m.courseIds.filter((cid) =>
                  courses.some((c) => c.id === cid),
                ).length;
                return (
                  <TableRow
                    key={String(m.id)}
                    data-ocid={`staff.item.${i + 1}`}
                  >
                    <TableCell>
                      <button
                        type="button"
                        title="Add/Edit Photo"
                        onClick={() => openPhotoModal(m)}
                        className="w-8 h-8 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center hover:ring-2 hover:ring-primary transition-all"
                      >
                        {staffPhotos[String(m.id)] ? (
                          <img
                            src={staffPhotos[String(m.id)]}
                            alt={m.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </TableCell>
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
                          data-ocid={`staff.print_button.${i + 1}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground"
                          onClick={() => setIdCardMember(m)}
                        >
                          <Printer className="w-3 h-3" />
                        </Button>
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

      {/* Staff Photo Modal */}
      {photoModalMember && (
        <Dialog
          open={!!photoModalMember}
          onOpenChange={(open) => {
            if (!open) {
              staffCamera.stopCamera();
              setPhotoModalMember(null);
              setPhotoModalMode("idle");
            }
          }}
        >
          <DialogContent data-ocid="staff.photo.dialog" className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Staff Photo — {photoModalMember.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {staffPhotos[String(photoModalMember.id)] && (
                <div className="flex justify-center">
                  <img
                    src={staffPhotos[String(photoModalMember.id)]}
                    alt={photoModalMember.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                </div>
              )}
              {photoModalMode === "camera" ? (
                <div className="space-y-2">
                  <div
                    className="rounded-lg overflow-hidden bg-muted border border-border"
                    style={{ aspectRatio: "4/3" }}
                  >
                    <video
                      ref={staffCamera.videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={staffCamera.canvasRef} className="hidden" />
                  </div>
                  {staffCamera.error && (
                    <p className="text-xs text-destructive">
                      {staffCamera.error.message}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        captureStaffPhoto(String(photoModalMember.id))
                      }
                      disabled={!staffCamera.isActive}
                    >
                      <Camera className="w-3.5 h-3.5 mr-1" /> Capture
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        staffCamera.stopCamera();
                        setPhotoModalMode("idle");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => {
                      setPhotoModalMode("camera");
                      staffCamera.startCamera();
                    }}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1" /> Use Webcam
                  </Button>
                  <Label className="cursor-pointer">
                    <Button size="sm" variant="outline" asChild>
                      <span>Upload Photo</span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(String(photoModalMember.id), e)
                      }
                    />
                  </Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                data-ocid="staff.photo.close_button"
                onClick={() => {
                  staffCamera.stopCamera();
                  setPhotoModalMember(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {idCardMember && (
        <StaffIDCardModal
          staff={idCardMember}
          departmentName={
            departments.find(
              (d) => String(d.id) === String(idCardMember.departmentId),
            )?.name
          }
          facultyName={
            faculties.find(
              (f) => String(f.id) === String(idCardMember.facultyId),
            )?.name
          }
          open={!!idCardMember}
          onClose={() => setIdCardMember(null)}
        />
      )}

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
