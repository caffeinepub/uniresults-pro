import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Building2,
  CheckCircle,
  ClipboardList,
  GraduationCap,
  HardDrive,
  Settings,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function SystemSummaryTab() {
  const {
    students,
    staffMembers,
    faculties,
    departments,
    courses,
    results,
    auditLog,
    institutionSettings,
    syncStatus,
  } = useApp();

  const publishedCount = results.filter((r) => r.status === "published").length;
  const pendingApprovals = results.filter(
    (r) =>
      r.status === "submitted" ||
      r.status === "hod_approved" ||
      r.status === "dean_approved",
  ).length;

  const recentAudit = [...auditLog]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Total Staff",
      value: staffMembers.length,
      icon: GraduationCap,
      color: "text-purple-500",
    },
    {
      label: "Faculties",
      value: faculties.length,
      icon: Building2,
      color: "text-amber-500",
    },
    {
      label: "Departments",
      value: departments.length,
      icon: ClipboardList,
      color: "text-green-500",
    },
    {
      label: "Courses",
      value: courses.length,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      label: "Published Results",
      value: publishedCount,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      icon: ClipboardList,
      color: pendingApprovals > 0 ? "text-amber-500" : "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">System Summary</h2>
      </div>

      {/* Stats Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        data-ocid="system_summary.stats_grid"
      >
        {stats.map((s) => (
          <Card
            key={s.label}
            className="bg-card border border-border rounded-xl"
          >
            <CardHeader className="pb-1 pt-4 px-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Institution Info */}
      <Card
        className="bg-card border border-border rounded-xl"
        data-ocid="system_summary.institution_info"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Institution Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {(
              [
                ["Name", institutionSettings.name],
                ["Type", institutionSettings.institutionType ?? "University"],
                ["Email", institutionSettings.email],
                ["Phone", institutionSettings.phone],
                ["Address", institutionSettings.address],
                ["Website", institutionSettings.website],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium truncate">{value || "-"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card border border-border rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {syncStatus.isOnline ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive" />
              )}
              Connectivity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Network Status</span>
                <Badge
                  className={
                    syncStatus.isOnline
                      ? "bg-success/20 text-success border-0"
                      : "bg-destructive/20 text-destructive border-0"
                  }
                >
                  {syncStatus.isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              {syncStatus.lastSaved && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Saved</span>
                  <span className="text-xs text-muted-foreground">
                    {syncStatus.lastSaved}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              Data Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Students</span>
                <Badge variant="outline">{students.length} records</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Results</span>
                <Badge variant="outline">{results.length} records</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Courses</span>
                <Badge variant="outline">{courses.length} records</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Log */}
      <Card className="bg-card border border-border rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Recent Activity (Last 10)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAudit.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No audit entries yet
                  </TableCell>
                </TableRow>
              )}
              {recentAudit.map((entry) => (
                <TableRow key={String(entry.id)} className="text-xs">
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="text-[10px]">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.actorName}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {entry.details}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
