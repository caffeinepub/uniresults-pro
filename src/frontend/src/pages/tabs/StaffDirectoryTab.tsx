import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  ArrowUpDown,
  Download,
  Eye,
  Printer,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { StaffMember } from "../../context/AppContext";

type SortKey = keyof Pick<
  StaffMember,
  "name" | "staffId" | "designation" | "dateJoined" | "qualification"
>;

export default function StaffDirectoryTab() {
  const { staffMembers, departments, faculties } = useApp();

  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const designations = useMemo(() => {
    const set = new Set(staffMembers.map((s) => s.designation));
    return Array.from(set).sort();
  }, [staffMembers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staffMembers
      .filter((s) => {
        const deptMatch =
          filterDept === "all" || String(s.departmentId) === filterDept;
        const facMatch =
          filterFaculty === "all" || String(s.facultyId) === filterFaculty;
        const roleMatch = filterRole === "all" || s.designation === filterRole;
        const searchMatch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.staffId.toLowerCase().includes(q) ||
          (s.email ?? "").toLowerCase().includes(q);
        return deptMatch && facMatch && roleMatch && searchMatch;
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? "") as string;
        const bv = (b[sortKey] ?? "") as string;
        const cmp = av.localeCompare(bv);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [
    staffMembers,
    search,
    filterDept,
    filterFaculty,
    filterRole,
    sortKey,
    sortDir,
  ]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getDeptName(deptId: bigint) {
    return (
      departments.find((d) => String(d.id) === String(deptId))?.name ?? "-"
    );
  }

  function getFacultyName(facId: bigint) {
    return faculties.find((f) => String(f.id) === String(facId))?.name ?? "-";
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    const header = [
      "Name",
      "Staff ID",
      "Designation",
      "Department",
      "Faculty",
      "Qualification",
      "Email",
      "Phone",
      "Date Joined",
    ];
    const rows = filtered.map((s) => [
      s.name,
      s.staffId,
      s.designation,
      getDeptName(s.departmentId),
      getFacultyName(s.facultyId),
      s.qualification,
      s.email ?? "",
      s.phone ?? "",
      s.dateJoined,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff_directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Staff Directory</h2>
          <Badge variant="secondary">{filtered.length} staff</Badge>
        </div>
        <div className="flex gap-2 no-print">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            data-ocid="staff_directory.print"
          >
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            data-ocid="staff_directory.export_button"
          >
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 no-print">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search name, ID, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="staff_directory.search"
          />
        </div>
        <Select value={filterFaculty} onValueChange={setFilterFaculty}>
          <SelectTrigger data-ocid="staff_directory.filter_faculty">
            <SelectValue placeholder="All Faculties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Faculties</SelectItem>
            {faculties.map((f) => (
              <SelectItem key={String(f.id)} value={String(f.id)}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterDept}
          onValueChange={setFilterDept}
          data-ocid="staff_directory.filter_dept"
        >
          <SelectTrigger>
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
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger>
            <SelectValue placeholder="All Designations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Designations</SelectItem>
            {designations.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-primary font-semibold"
                  onClick={() => toggleSort("name")}
                  type="button"
                >
                  Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-primary font-semibold"
                  onClick={() => toggleSort("staffId")}
                  type="button"
                >
                  Staff ID <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-primary font-semibold"
                  onClick={() => toggleSort("designation")}
                  type="button"
                >
                  Designation <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-primary font-semibold"
                  onClick={() => toggleSort("qualification")}
                  type="button"
                >
                  Qualification <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-primary font-semibold"
                  onClick={() => toggleSort("dateJoined")}
                  type="button"
                >
                  Date Joined <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead className="no-print">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-muted-foreground py-10"
                  data-ocid="staff_directory.empty_state"
                >
                  No staff found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((staff, idx) => (
              <TableRow
                key={String(staff.id)}
                className="hover:bg-muted/20"
                data-ocid={`staff_directory.table_row.${idx + 1}`}
              >
                <TableCell className="text-center text-muted-foreground text-xs">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  {staff.staffId}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {staff.designation}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {getDeptName(staff.departmentId)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {getFacultyName(staff.facultyId)}
                </TableCell>
                <TableCell className="text-sm">{staff.qualification}</TableCell>
                <TableCell className="text-sm">{staff.email ?? "-"}</TableCell>
                <TableCell className="text-sm">{staff.phone ?? "-"}</TableCell>
                <TableCell className="text-sm">{staff.dateJoined}</TableCell>
                <TableCell className="no-print">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedStaff(staff)}
                    data-ocid={`staff_directory.view_button.${idx + 1}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Profile Modal */}
      <Dialog
        open={!!selectedStaff}
        onOpenChange={(o) => !o && setSelectedStaff(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Staff Profile</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedStaff.photoUrl ? (
                  <img
                    src={selectedStaff.photoUrl}
                    alt={selectedStaff.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {selectedStaff.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold">{selectedStaff.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedStaff.designation}
                  </p>
                  <p className="text-xs font-mono text-primary">
                    {selectedStaff.staffId}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(
                  [
                    ["Department", getDeptName(selectedStaff.departmentId)],
                    ["Faculty", getFacultyName(selectedStaff.facultyId)],
                    ["Qualification", selectedStaff.qualification],
                    ["Role", selectedStaff.role ?? "Lecturer"],
                    ["Email", selectedStaff.email ?? "-"],
                    ["Phone", selectedStaff.phone ?? "-"],
                    ["Date Joined", selectedStaff.dateJoined],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStaff(null)}
                  data-ocid="staff_directory.close_button"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
