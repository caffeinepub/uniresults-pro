/**
 * ScanHistoryTab.tsx
 * Unified scan history panel for all scanner types (Students, Courses, JAMB, Results).
 * Shows all historical document imports grouped by type with re-import and export options.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  BookOpen,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  History,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FileTypeBadge } from "../../components/UniversalFileUpload";
import { type ScanHistoryEntry, useApp } from "../../context/AppContext";

type ScanType = "all" | "student" | "course" | "jamb" | "result";

const TYPE_LABELS: Record<string, string> = {
  student: "Students",
  course: "Courses",
  jamb: "JAMB",
  result: "Results",
};

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  student: Users,
  course: BookOpen,
  jamb: GraduationCap,
  result: FileSpreadsheet,
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function exportEntryAsCSV(entry: ScanHistoryEntry) {
  const rows =
    entry.headers.length > 0 ? [entry.headers, ...entry.rows] : entry.rows;
  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `scan_${entry.type}_${entry.id.slice(0, 8)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}

interface ScanHistoryTabProps {
  onReimport?: (entry: ScanHistoryEntry) => void;
}

export default function ScanHistoryTab({ onReimport }: ScanHistoryTabProps) {
  const { scanHistory, deleteScanHistoryEntry, clearScanHistory } = useApp();
  const [filterType, setFilterType] = useState<ScanType>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = scanHistory.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.fileName.toLowerCase().includes(q) &&
        !e.departmentName?.toLowerCase().includes(q) &&
        !e.previewText.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // Group by type for summary counts
  const counts = scanHistory.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  function handleDelete(id: string) {
    deleteScanHistoryEntry(id);
    toast.success("Scan record deleted");
  }

  function handleClearAll() {
    if (!confirm("Clear all scan history? This cannot be undone.")) return;
    clearScanHistory();
    toast.success("Scan history cleared");
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Document Import History
          </h2>
          <p className="text-sm text-muted-foreground">
            All previously scanned and imported documents — {scanHistory.length}{" "}
            total records
          </p>
        </div>
        {scanHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={handleClearAll}
            data-ocid="scan-history.clear-all"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Type summary pills */}
      {scanHistory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["all", "student", "course", "jamb", "result"] as ScanType[]).map(
            (t) => {
              const count = t === "all" ? scanHistory.length : (counts[t] ?? 0);
              if (t !== "all" && count === 0) return null;
              const Icon = t === "all" ? History : (TYPE_ICONS[t] ?? File);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                  ${
                    filterType === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                  data-ocid={`scan-history.filter-${t}`}
                >
                  <Icon className="w-3 h-3" />
                  {t === "all" ? "All" : TYPE_LABELS[t]}
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${filterType === t ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
        </div>
      )}

      {/* Search */}
      {scanHistory.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by file name or department…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="scan-history.search"
          />
        </div>
      )}

      {/* Empty state */}
      {scanHistory.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="scan-history.empty-state"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No scan history yet
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Documents you import via any scanner (Students, Courses, JAMB) will
            be saved here automatically.
          </p>
        </div>
      )}

      {/* Filtered empty */}
      {scanHistory.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No records match your filter.
          </p>
        </div>
      )}

      {/* History list */}
      <div className="space-y-3">
        {filtered.map((entry) => {
          const Icon = TYPE_ICONS[entry.type] ?? File;
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              className="border rounded-xl overflow-hidden bg-card shadow-sm"
              data-ocid={`scan-history.entry-${entry.id}`}
            >
              {/* Header row */}
              <div className="flex items-start gap-3 p-4">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  ${
                    entry.type === "student"
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : entry.type === "course"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : entry.type === "jamb"
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-orange-100 dark:bg-orange-900/30"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5
                    ${
                      entry.type === "student"
                        ? "text-blue-600 dark:text-blue-400"
                        : entry.type === "course"
                          ? "text-green-600 dark:text-green-400"
                          : entry.type === "jamb"
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-orange-600 dark:text-orange-400"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate max-w-xs">
                      {entry.fileName}
                    </span>
                    <FileTypeBadge
                      fileType={entry.fileType}
                      fileName={entry.fileName}
                    />
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 capitalize"
                    >
                      {TYPE_LABELS[entry.type] ?? entry.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{formatDate(entry.timestamp)}</span>
                    <span className="font-medium text-foreground">
                      {entry.extractedCount} rows
                    </span>
                    {entry.departmentName && (
                      <span className="truncate max-w-[160px]">
                        {entry.departmentName}
                      </span>
                    )}
                  </div>
                  {entry.previewText && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 font-mono">
                      {entry.previewText.slice(0, 80)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    data-ocid={`scan-history.expand-${entry.id}`}
                  >
                    {isExpanded ? "Hide" : "Preview"}
                  </Button>
                  {entry.rows.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      title="Export as CSV"
                      onClick={() => exportEntryAsCSV(entry)}
                      data-ocid={`scan-history.export-${entry.id}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onReimport && entry.rows.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-primary"
                      onClick={() => onReimport(entry)}
                      data-ocid={`scan-history.reimport-${entry.id}`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Re-import
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    title="Delete record"
                    onClick={() => handleDelete(entry.id)}
                    data-ocid={`scan-history.delete-${entry.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Expanded preview table */}
              {isExpanded && entry.rows.length > 0 && (
                <div className="border-t bg-muted/30 overflow-auto max-h-64">
                  <table className="text-[11px] w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-8">
                          #
                        </th>
                        {(entry.headers.length > 0
                          ? entry.headers
                          : entry.rows[0]
                        ).map((h, i) => (
                          <th
                            key={`scan-hdr-${String(i)}`}
                            className="px-2 py-1.5 text-left font-medium text-muted-foreground"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(entry.headers.length > 0
                        ? entry.rows
                        : entry.rows.slice(1)
                      )
                        .slice(0, 50)
                        .map((row, ri) => (
                          <tr
                            key={`scan-row-${String(ri)}`}
                            className="border-t hover:bg-muted/40"
                          >
                            <td className="px-2 py-1 text-muted-foreground">
                              {ri + 1}
                            </td>
                            {row.map((cell, ci) => (
                              <td
                                key={`scan-cell-${String(ri)}-${String(ci)}`}
                                className="px-2 py-1 max-w-[160px] truncate"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {entry.rows.length > 50 && (
                    <p className="text-xs text-muted-foreground px-3 py-2">
                      Showing first 50 of {entry.rows.length} rows. Export CSV
                      to see all.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
