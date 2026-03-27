import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  ScrollText,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";

type SortDir = "asc" | "desc";

const ACTION_TYPES = [
  "All Actions",
  "Student Added",
  "Student Updated",
  "Student Deleted",
  "Result Submitted",
  "Result Approved",
  "Result Published",
  "Result Rejected",
  "Course Added",
  "Course Deleted",
  "Fee Updated",
  "User Added",
  "User Updated",
  "Login",
  "Settings Updated",
];

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "SuperAdmin":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    case "Registrar":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "HOD":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    case "Dean":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "Lecturer":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "Student":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function AuditLogTab() {
  const { auditLog } = useApp();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortCol, setSortCol] = useState("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const roles = useMemo(
    () => Array.from(new Set(auditLog.map((e) => e.actorRole))).filter(Boolean),
    [auditLog],
  );

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function SortIcon({ c }: { c: string }) {
    if (sortCol !== c)
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    );
  }

  const filtered = useMemo(() => {
    let entries = auditLog.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !entry.actorName.toLowerCase().includes(q) &&
          !entry.action.toLowerCase().includes(q) &&
          !entry.details.toLowerCase().includes(q)
        )
          return false;
      }
      if (roleFilter !== "all" && entry.actorRole !== roleFilter) return false;
      if (
        actionFilter !== "all" &&
        !entry.action.toLowerCase().includes(actionFilter.toLowerCase())
      )
        return false;
      if (dateFrom && entry.timestamp < dateFrom) return false;
      if (dateTo && entry.timestamp > `${dateTo}T23:59:59`) return false;
      return true;
    });

    entries = [...entries].sort((a, b) => {
      if (sortCol === "timestamp") {
        return sortDir === "asc"
          ? a.timestamp.localeCompare(b.timestamp)
          : b.timestamp.localeCompare(a.timestamp);
      }
      if (sortCol === "actor") {
        return sortDir === "asc"
          ? a.actorName.localeCompare(b.actorName)
          : b.actorName.localeCompare(a.actorName);
      }
      if (sortCol === "role") {
        return sortDir === "asc"
          ? a.actorRole.localeCompare(b.actorRole)
          : b.actorRole.localeCompare(a.actorRole);
      }
      if (sortCol === "action") {
        return sortDir === "asc"
          ? a.action.localeCompare(b.action)
          : b.action.localeCompare(a.action);
      }
      return 0;
    });

    return entries;
  }, [
    auditLog,
    search,
    roleFilter,
    actionFilter,
    dateFrom,
    dateTo,
    sortCol,
    sortDir,
  ]);

  function handleDownload() {
    const header = "Timestamp,Actor,Role,Action,Details";
    const rows = filtered.map((e) =>
      [
        e.timestamp,
        `"${e.actorName}"`,
        e.actorRole,
        `"${e.action}"`,
        `"${e.details.replace(/"/g, "'")}"`,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log downloaded");
  }

  return (
    <div className="space-y-5" data-ocid="audit_log.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {auditLog.length} entries
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          data-ocid="audit_log.download_button"
          className="gap-1.5"
        >
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/20 rounded-xl border border-border/50">
        <div className="space-y-1">
          <Label className="text-xs">Search</Label>
          <Input
            data-ocid="audit_log.search_input"
            placeholder="Actor, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger
              data-ocid="audit_log.role.select"
              className="w-40 h-8 text-xs"
            >
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Action Type</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger
              data-ocid="audit_log.action.select"
              className="w-44 h-8 text-xs"
            >
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {ACTION_TYPES.slice(1).map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From Date</Label>
          <Input
            data-ocid="audit_log.date_from.input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36 h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To Date</Label>
          <Input
            data-ocid="audit_log.date_to.input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36 h-8 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("timestamp")}
                >
                  Timestamp <SortIcon c="timestamp" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("actor")}
                >
                  Actor <SortIcon c="actor" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("role")}
                >
                  Role <SortIcon c="role" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center"
                  onClick={() => toggleSort("action")}
                >
                  Action <SortIcon c="action" />
                </button>
              </TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="audit_log.empty_state"
                >
                  No audit entries match the current filters
                </TableCell>
              </TableRow>
            )}
            {filtered.slice(0, 200).map((entry, i) => (
              <TableRow
                key={String(entry.id)}
                data-ocid={`audit_log.item.${i + 1}`}
              >
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {fmt(entry.timestamp)}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {entry.actorName}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeClass(entry.actorRole)}`}
                  >
                    {entry.actorRole}
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {entry.action}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {entry.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 200 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing 200 of {filtered.length} entries. Use filters to narrow down
          results.
        </p>
      )}
    </div>
  );
}
