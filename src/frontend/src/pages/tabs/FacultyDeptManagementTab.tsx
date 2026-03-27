import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type ExtendedDepartment,
  type Faculty,
  useApp,
} from "../../context/AppContext";

interface Props {
  readOnly?: boolean;
}

export default function FacultyDeptManagementTab({ readOnly = false }: Props) {
  const {
    faculties,
    departments,
    courses,
    students,
    addFaculty,
    updateFaculty,
    deleteFaculty,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useApp();

  // Faculty state
  const [facSearch, setFacSearch] = useState("");
  const [editingFacId, setEditingFacId] = useState<bigint | null>(null);
  const [editingFacName, setEditingFacName] = useState("");
  const [newFacName, setNewFacName] = useState("");

  // Department state
  const [deptSearch, setDeptSearch] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<bigint | null>(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [editingDeptFacultyId, setEditingDeptFacultyId] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptFacultyId, setNewDeptFacultyId] = useState("");

  const filteredFaculties = faculties.filter((f) =>
    f.name.toLowerCase().includes(facSearch.toLowerCase()),
  );

  const filteredDepts = departments.filter((d) => {
    const fac = faculties.find((f) => String(f.id) === String(d.facultyId));
    const q = deptSearch.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (fac?.name ?? "").toLowerCase().includes(q)
    );
  });

  function handleAddFaculty() {
    if (!newFacName.trim()) {
      toast.error("Faculty name is required");
      return;
    }
    addFaculty({ id: BigInt(Date.now()), name: newFacName.trim() });
    setNewFacName("");
    toast.success("Faculty added");
  }

  function startEditFaculty(f: Faculty) {
    setEditingFacId(f.id);
    setEditingFacName(f.name);
  }

  function saveEditFaculty(id: bigint) {
    if (!editingFacName.trim()) {
      toast.error("Faculty name cannot be empty");
      return;
    }
    updateFaculty(id, { name: editingFacName.trim() });
    setEditingFacId(null);
    toast.success("Faculty updated");
  }

  function handleDeleteFaculty(id: bigint) {
    deleteFaculty(id);
    toast.success("Faculty deleted");
  }

  function handleAddDepartment() {
    if (!newDeptName.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (!newDeptFacultyId) {
      toast.error("Please select a faculty");
      return;
    }
    addDepartment({
      id: BigInt(Date.now()),
      name: newDeptName.trim(),
      facultyId: BigInt(newDeptFacultyId),
    });
    setNewDeptName("");
    setNewDeptFacultyId("");
    toast.success("Department added");
  }

  function startEditDept(d: ExtendedDepartment) {
    setEditingDeptId(d.id);
    setEditingDeptName(d.name);
    setEditingDeptFacultyId(d.facultyId ? String(d.facultyId) : "");
  }

  function saveEditDept(id: bigint) {
    if (!editingDeptName.trim()) {
      toast.error("Department name cannot be empty");
      return;
    }
    updateDepartment(id, {
      name: editingDeptName.trim(),
      facultyId: editingDeptFacultyId
        ? BigInt(editingDeptFacultyId)
        : undefined,
    });
    setEditingDeptId(null);
    toast.success("Department updated");
  }

  function handleDeleteDept(id: bigint) {
    deleteDepartment(id);
    toast.success("Department deleted");
  }

  return (
    <div className="space-y-8">
      {/* FACULTIES */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Faculties</CardTitle>
            <Badge variant="secondary">{faculties.length} total</Badge>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="faculty_mgmt.search_input"
              placeholder="Search faculties..."
              value={facSearch}
              onChange={(e) => setFacSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">S/N</TableHead>
                  <TableHead>Faculty Name</TableHead>
                  <TableHead className="text-center">Departments</TableHead>
                  {!readOnly && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculties.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={readOnly ? 3 : 4}
                      className="text-center text-muted-foreground py-6"
                      data-ocid="faculty_mgmt.empty_state"
                    >
                      No faculties found
                    </TableCell>
                  </TableRow>
                )}
                {filteredFaculties.map((f, i) => {
                  const deptCount = departments.filter(
                    (d) => String(d.facultyId) === String(f.id),
                  ).length;
                  const isEditing = String(editingFacId) === String(f.id);
                  return (
                    <TableRow
                      key={String(f.id)}
                      data-ocid={`faculty_mgmt.item.${i + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        {isEditing && !readOnly ? (
                          <Input
                            data-ocid="faculty_mgmt.input"
                            value={editingFacName}
                            onChange={(e) => setEditingFacName(e.target.value)}
                            className="h-7 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditFaculty(f.id);
                              if (e.key === "Escape") setEditingFacId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium">{f.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {deptCount}
                        </Badge>
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  data-ocid="faculty_mgmt.save_button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600"
                                  onClick={() => saveEditFaculty(f.id)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  data-ocid="faculty_mgmt.cancel_button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditingFacId(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  data-ocid={`faculty_mgmt.edit_button.${i + 1}`}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => startEditFaculty(f)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      data-ocid={`faculty_mgmt.delete_button.${i + 1}`}
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent data-ocid="faculty_mgmt.dialog">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Faculty
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete{" "}
                                        <strong>{f.name}</strong>? This will
                                        also remove all departments under it.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-ocid="faculty_mgmt.cancel_button">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        data-ocid="faculty_mgmt.confirm_button"
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() =>
                                          handleDeleteFaculty(f.id)
                                        }
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {!readOnly && (
            <div className="flex gap-2 pt-1">
              <Input
                data-ocid="faculty_mgmt.input"
                placeholder="New faculty name"
                value={newFacName}
                onChange={(e) => setNewFacName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddFaculty()}
              />
              <Button
                data-ocid="faculty_mgmt.primary_button"
                size="sm"
                onClick={handleAddFaculty}
                className="shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Faculty
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DEPARTMENTS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">Departments</CardTitle>
            <Badge variant="secondary">{departments.length} total</Badge>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              data-ocid="dept_mgmt.search_input"
              placeholder="Search by name or faculty..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">S/N</TableHead>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  {!readOnly && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={readOnly ? 5 : 6}
                      className="text-center text-muted-foreground py-6"
                      data-ocid="dept_mgmt.empty_state"
                    >
                      No departments found
                    </TableCell>
                  </TableRow>
                )}
                {filteredDepts.map((d, i) => {
                  const fac = faculties.find(
                    (f) => String(f.id) === String(d.facultyId),
                  );
                  const courseCount = courses.filter(
                    (c) => String(c.departmentId) === String(d.id),
                  ).length;
                  const studentCount = students.filter(
                    (s) => String(s.departmentId) === String(d.id),
                  ).length;
                  const isEditing = String(editingDeptId) === String(d.id);
                  return (
                    <TableRow
                      key={String(d.id)}
                      data-ocid={`dept_mgmt.item.${i + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        {isEditing && !readOnly ? (
                          <Input
                            data-ocid="dept_mgmt.input"
                            value={editingDeptName}
                            onChange={(e) => setEditingDeptName(e.target.value)}
                            className="h-7 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditingDeptId(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium">{d.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing && !readOnly ? (
                          <Select
                            value={editingDeptFacultyId}
                            onValueChange={setEditingDeptFacultyId}
                          >
                            <SelectTrigger
                              data-ocid="dept_mgmt.select"
                              className="h-7 text-sm w-40"
                            >
                              <SelectValue placeholder="Faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              {faculties.map((f) => (
                                <SelectItem
                                  key={String(f.id)}
                                  value={String(f.id)}
                                >
                                  {f.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {fac?.name ?? "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {courseCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {studentCount}
                        </Badge>
                      </TableCell>
                      {!readOnly && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  data-ocid="dept_mgmt.save_button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-green-600"
                                  onClick={() => saveEditDept(d.id)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  data-ocid="dept_mgmt.cancel_button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => setEditingDeptId(null)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  data-ocid={`dept_mgmt.edit_button.${i + 1}`}
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => startEditDept(d)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      data-ocid={`dept_mgmt.delete_button.${i + 1}`}
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent data-ocid="dept_mgmt.dialog">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Department
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Delete <strong>{d.name}</strong>? This
                                        cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel data-ocid="dept_mgmt.cancel_button">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        data-ocid="dept_mgmt.confirm_button"
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => handleDeleteDept(d.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {!readOnly && (
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Add New Department
              </Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  data-ocid="dept_mgmt.input"
                  placeholder="Department name"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="h-8 text-sm flex-1 min-w-40"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDepartment()}
                />
                <Select
                  value={newDeptFacultyId}
                  onValueChange={setNewDeptFacultyId}
                >
                  <SelectTrigger
                    data-ocid="dept_mgmt.select"
                    className="h-8 text-sm w-52"
                  >
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
                <Button
                  data-ocid="dept_mgmt.primary_button"
                  size="sm"
                  onClick={handleAddDepartment}
                  className="shrink-0"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Department
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
