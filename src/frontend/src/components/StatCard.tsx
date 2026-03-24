interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-primary",
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 shadow-xs">
      <div
        className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
