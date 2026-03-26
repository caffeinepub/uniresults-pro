const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-warning/15 text-warning",
  hod_approved: "bg-blue-500/15 text-blue-600",
  dean_approved: "bg-violet-500/15 text-violet-600",
  approved: "bg-success/15 text-success",
  published: "bg-primary/10 text-primary",
  rejected: "bg-destructive/15 text-destructive",
  active: "bg-success/15 text-success",
  accepted: "bg-blue-100 text-blue-800",
  graduated: "bg-purple-100 text-purple-800",
  withdrawn: "bg-red-100 text-red-800",
  deferred: "bg-amber-100 text-amber-800",
  inactive: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  hod_approved: "HOD Approved",
  dean_approved: "Dean Approved",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const label = statusLabels[s] ?? status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        statusStyles[s] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}
