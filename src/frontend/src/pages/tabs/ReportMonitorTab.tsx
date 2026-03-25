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
import { ClipboardList, Printer, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const LOG_KEY = "reportActivityLog";

interface ReportLogEntry {
  reportType: "Senate" | "Departmental";
  department: string;
  session: string;
  generatedBy: string;
  action: "Print" | "CSV";
  timestamp: string;
}

function loadLog(): ReportLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {}
  return [];
}

export default function ReportMonitorTab() {
  const [log, setLog] = useState<ReportLogEntry[]>(loadLog);
  const [typeFilter, setTypeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [clearOpen, setClearOpen] = useState(false);

  const filtered = useMemo(() => {
    return log.filter((e) => {
      if (typeFilter !== "all" && e.reportType !== typeFilter) return false;
      if (
        deptFilter &&
        !e.department.toLowerCase().includes(deptFilter.toLowerCase())
      )
        return false;
      if (dateFilter && !e.timestamp.startsWith(dateFilter)) return false;
      return true;
    });
  }, [log, typeFilter, deptFilter, dateFilter]);

  function clearLog() {
    localStorage.removeItem(LOG_KEY);
    setLog([]);
    setClearOpen(false);
    toast.success("Report activity log cleared.");
  }

  function printLog() {
    window.print();
  }

  return (
    <div className="space-y-5" data-ocid="report_monitor.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Report Activity Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Track all report generation and export events across the system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={printLog}
            data-ocid="report_monitor.print.button"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
          <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                data-ocid="report_monitor.clear.delete_button"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear Log
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="report_monitor.clear.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Report Activity Log?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove all {log.length} log entries.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="report_monitor.clear.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="report_monitor.clear.confirm_button"
                  onClick={clearLog}
                  className="bg-destructive text-destructive-foreground"
                >
                  Yes, Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/20 rounded-lg border border-border/50 no-print">
        <div className="space-y-1">
          <Label className="text-xs">Report Type</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              className="h-8 text-xs w-36"
              data-ocid="report_monitor.type.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Senate">Senate</SelectItem>
              <SelectItem value="Departmental">Departmental</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Input
            className="h-8 text-xs w-44"
            placeholder="Filter department..."
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            data-ocid="report_monitor.dept.search_input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <input
            type="date"
            className="h-8 text-xs border border-input rounded-md px-2 bg-background"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="ml-auto text-xs text-muted-foreground self-end pb-1">
          Showing {filtered.length} of {log.length} entries
        </div>
      </div>

      {log.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg"
          data-ocid="report_monitor.empty_state"
        >
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No report activity yet</p>
          <p className="text-sm mt-1">
            Report generation events will appear here automatically when Senate
            or Departmental reports are printed or exported.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">S/No</TableHead>
                <TableHead>Report Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No entries match filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry, i) => (
                  <TableRow
                    key={`${entry.timestamp}_${i}`}
                    data-ocid={`report_monitor.item.${i + 1}`}
                    className="hover:bg-muted/30"
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.reportType === "Senate"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {entry.reportType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.department || "All"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {entry.session || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.generatedBy}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
