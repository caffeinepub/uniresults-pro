import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Download, Plus, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

interface Hostel {
  id: string;
  name: string;
  type: string;
  totalRooms: number;
}
interface HostelRoom {
  id: string;
  hostelId: string;
  roomNumber: string;
  capacity: number;
  occupants: string[];
}
interface HostelAllocation {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  hostelId: string;
  roomId: string;
  roomNumber: string;
  session: string;
  status: string;
}
interface HostelData {
  hostels: Hostel[];
  rooms: HostelRoom[];
  allocations: HostelAllocation[];
}

function getHostelData(): HostelData {
  try {
    return JSON.parse(
      localStorage.getItem("hostelData") ||
        '{"hostels":[],"rooms":[],"allocations":[]}',
    );
  } catch {
    return { hostels: [], rooms: [], allocations: [] };
  }
}
function saveHostelData(d: HostelData) {
  localStorage.setItem("hostelData", JSON.stringify(d));
}

export default function HostelManagementTab() {
  const { students, academicCalendars } = useApp();
  const activeSession =
    academicCalendars.find((c) => c.isActive)?.session ?? "2024/2025";
  const [data, setData] = useState<HostelData>(getHostelData);
  const [hostelOpen, setHostelOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [newHostel, setNewHostel] = useState({
    name: "",
    type: "Male",
    totalRooms: "20",
  });
  const [newRoom, setNewRoom] = useState({
    hostelId: "",
    roomNumber: "",
    capacity: "4",
  });
  const [newAlloc, setNewAlloc] = useState({
    studentId: "",
    hostelId: "",
    roomId: "",
  });

  function addHostel() {
    if (!newHostel.name) {
      toast.error("Enter hostel name");
      return;
    }
    const h: Hostel = {
      id: `h-${Date.now()}`,
      name: newHostel.name,
      type: newHostel.type,
      totalRooms: Number.parseInt(newHostel.totalRooms) || 20,
    };
    const updated = { ...data, hostels: [...data.hostels, h] };
    setData(updated);
    saveHostelData(updated);
    setHostelOpen(false);
    toast.success("Hostel added");
  }

  function addRoom() {
    if (!newRoom.hostelId || !newRoom.roomNumber) {
      toast.error("Fill all fields");
      return;
    }
    const r: HostelRoom = {
      id: `r-${Date.now()}`,
      hostelId: newRoom.hostelId,
      roomNumber: newRoom.roomNumber,
      capacity: Number.parseInt(newRoom.capacity) || 4,
      occupants: [],
    };
    const updated = { ...data, rooms: [...data.rooms, r] };
    setData(updated);
    saveHostelData(updated);
    setRoomOpen(false);
    toast.success("Room added");
  }

  function addAllocation() {
    if (!newAlloc.studentId || !newAlloc.hostelId || !newAlloc.roomId) {
      toast.error("Fill all fields");
      return;
    }
    const student = students.find((s) => String(s.id) === newAlloc.studentId);
    const room = data.rooms.find((r) => r.id === newAlloc.roomId);
    if (!student || !room) return;
    if (room.occupants.length >= room.capacity) {
      toast.error("Room is full");
      return;
    }
    const alloc: HostelAllocation = {
      id: `a-${Date.now()}`,
      studentId: String(student.id),
      studentName: student.name,
      matricNumber: student.matricNumber,
      hostelId: newAlloc.hostelId,
      roomId: newAlloc.roomId,
      roomNumber: room.roomNumber,
      session: activeSession,
      status: "active",
    };
    const updatedRooms = data.rooms.map((r) =>
      r.id === room.id
        ? { ...r, occupants: [...r.occupants, String(student.id)] }
        : r,
    );
    const updated = {
      ...data,
      rooms: updatedRooms,
      allocations: [...data.allocations, alloc],
    };
    setData(updated);
    saveHostelData(updated);
    setAllocOpen(false);
    toast.success(`Room ${room.roomNumber} allocated to ${student.name}`);
  }

  function exportCSV() {
    const header = "S/N,Student Name,Matric No,Hostel,Room,Session,Status";
    const rows = data.allocations.map((a, i) => {
      const hostel = data.hostels.find((h) => h.id === a.hostelId);
      return `${i + 1},"${a.studentName}",${a.matricNumber},"${hostel?.name ?? "N/A"}",${a.roomNumber},${a.session},${a.status}`;
    });
    const blob = new Blob([`${header}\n${rows.join("\n")}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hostel_allocations.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Hostel Management
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.hostels.length} hostels &middot; {data.allocations.length}{" "}
            allocations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            data-ocid="hostel.upload_button"
          >
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            data-ocid="hostel.secondary_button"
          >
            <Printer className="w-3 h-3 mr-1" /> Print
          </Button>
        </div>
      </div>

      <Tabs defaultValue="allocations">
        <TabsList>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="hostels">Hostels</TabsTrigger>
        </TabsList>

        <TabsContent value="hostels" className="space-y-3 mt-3">
          <Dialog open={hostelOpen} onOpenChange={setHostelOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                data-ocid="hostel.open_modal_button"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Hostel
              </Button>
            </DialogTrigger>
            <DialogContent data-ocid="hostel.dialog">
              <DialogHeader>
                <DialogTitle>Add Hostel</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Hostel Name</Label>
                  <Input
                    className="mt-1"
                    value={newHostel.name}
                    onChange={(e) =>
                      setNewHostel((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Queen Amina Hall"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={newHostel.type}
                      onValueChange={(v) =>
                        setNewHostel((p) => ({ ...p, type: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Total Rooms</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={newHostel.totalRooms}
                      onChange={(e) =>
                        setNewHostel((p) => ({
                          ...p,
                          totalRooms: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-ocid="hostel.cancel_button"
                  onClick={() => setHostelOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  data-ocid="hostel.confirm_button"
                  className="bg-primary text-primary-foreground"
                  onClick={addHostel}
                >
                  Add Hostel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.hostels.map((h) => {
              const rooms = data.rooms.filter((r) => r.hostelId === h.id);
              const occupied = rooms.reduce(
                (s, r) => s + r.occupants.length,
                0,
              );
              const capacity = rooms.reduce((s, r) => s + r.capacity, 0);
              return (
                <div
                  key={h.id}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{h.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {h.type} &middot; {h.totalRooms} rooms
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {occupied}/{capacity} occupied
                    </Badge>
                  </div>
                </div>
              );
            })}
            {data.hostels.length === 0 && (
              <p
                className="text-sm text-muted-foreground col-span-2 text-center py-8"
                data-ocid="hostel.empty_state"
              >
                No hostels added yet
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-3 mt-3">
          <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary text-primary-foreground">
                <Plus className="w-3 h-3 mr-1" /> Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Hostel</Label>
                  <Select
                    value={newRoom.hostelId}
                    onValueChange={(v) =>
                      setNewRoom((p) => ({ ...p, hostelId: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select hostel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {data.hostels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Room Number</Label>
                    <Input
                      className="mt-1"
                      value={newRoom.roomNumber}
                      onChange={(e) =>
                        setNewRoom((p) => ({
                          ...p,
                          roomNumber: e.target.value,
                        }))
                      }
                      placeholder="e.g. A101"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Capacity</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      value={newRoom.capacity}
                      onChange={(e) =>
                        setNewRoom((p) => ({ ...p, capacity: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRoomOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={addRoom}
                >
                  Add Room
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="bg-card rounded-xl border border-border shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Occupied</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rooms.map((r, i) => {
                  const hostel = data.hostels.find((h) => h.id === r.hostelId);
                  const full = r.occupants.length >= r.capacity;
                  return (
                    <TableRow
                      key={r.id}
                      data-ocid={`hostel.room.item.${i + 1}`}
                    >
                      <TableCell className="text-sm">
                        {hostel?.name ?? "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.roomNumber}
                      </TableCell>
                      <TableCell className="text-sm">{r.capacity}</TableCell>
                      <TableCell className="text-sm">
                        {r.occupants.length}
                      </TableCell>
                      <TableCell>
                        {full ? (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">
                            Full
                          </Badge>
                        ) : (
                          <Badge className="bg-success/15 text-success border-success/30 text-xs">
                            Available
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data.rooms.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No rooms added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-3 mt-3">
          <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                data-ocid="hostel.primary_button"
              >
                <Plus className="w-3 h-3 mr-1" /> Allocate Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Room to Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Student</Label>
                  <Select
                    value={newAlloc.studentId}
                    onValueChange={(v) =>
                      setNewAlloc((p) => ({ ...p, studentId: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={String(s.id)} value={String(s.id)}>
                          {s.name} — {s.matricNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Hostel</Label>
                  <Select
                    value={newAlloc.hostelId}
                    onValueChange={(v) =>
                      setNewAlloc((p) => ({ ...p, hostelId: v, roomId: "" }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select hostel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {data.hostels.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Room</Label>
                  <Select
                    value={newAlloc.roomId}
                    onValueChange={(v) =>
                      setNewAlloc((p) => ({ ...p, roomId: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {data.rooms
                        .filter(
                          (r) =>
                            r.hostelId === newAlloc.hostelId &&
                            r.occupants.length < r.capacity,
                        )
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.roomNumber} ({r.occupants.length}/{r.capacity})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAllocOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground"
                  onClick={addAllocation}
                >
                  Allocate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="bg-card rounded-xl border border-border shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S/N</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.allocations.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                      data-ocid="hostel.empty_state"
                    >
                      No allocations yet
                    </TableCell>
                  </TableRow>
                )}
                {data.allocations.map((a, i) => {
                  const hostel = data.hostels.find((h) => h.id === a.hostelId);
                  return (
                    <TableRow key={a.id} data-ocid={`hostel.item.${i + 1}`}>
                      <TableCell className="text-muted-foreground text-sm">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {a.studentName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {a.matricNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        {hostel?.name ?? "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {a.roomNumber}
                      </TableCell>
                      <TableCell className="text-sm">{a.session}</TableCell>
                      <TableCell>
                        <Badge className="bg-success/15 text-success border-success/30 text-xs capitalize">
                          {a.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
