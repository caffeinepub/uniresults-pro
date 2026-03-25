import { Badge } from "@/components/ui/badge";
import { useApp } from "../../context/AppContext";
import type { StudentFeeRecord } from "../../context/AppContext";

function fmt(n: number) {
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}

function feeStatusBadge(status: StudentFeeRecord["status"]) {
  if (status === "paid")
    return (
      <Badge className="bg-success/15 text-success border-success/30">
        Paid
      </Badge>
    );
  if (status === "partial")
    return (
      <Badge className="bg-warning/15 text-warning border-warning/30">
        Partial Payment
      </Badge>
    );
  return (
    <Badge className="bg-destructive/15 text-destructive border-destructive/30">
      Outstanding
    </Badge>
  );
}

export default function FeeStatusTab() {
  const { currentUser, students, feeRecords } = useApp();
  const me = students.find((s) => s.userPrincipal === currentUser?.principal);
  const myFees = feeRecords
    .filter((f) => f.studentId === me?.id)
    .sort((a, b) => b.session.localeCompare(a.session));

  if (!me) {
    return (
      <div
        className="text-center py-16 text-muted-foreground"
        data-ocid="fee_status.empty_state"
      >
        Student profile not found.
      </div>
    );
  }

  if (myFees.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Fee Status</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your tuition payment records
          </p>
        </div>
        <div
          className="text-center py-16 text-muted-foreground rounded-xl border border-border"
          data-ocid="fee_status.empty_state"
        >
          No fee records found. Contact the Registrar's office for assistance.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fee Status</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your tuition payment history
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myFees.map((fee, i) => {
          const balance = fee.tuitionAmount - fee.amountPaid;
          return (
            <div
              key={String(fee.id)}
              data-ocid={`fee_status.item.${i + 1}`}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {fee.session} Session
                </span>
                {feeStatusBadge(fee.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tuition Fee</span>
                  <span className="font-medium">{fmt(fee.tuitionAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium text-success">
                    {fmt(fee.amountPaid)}
                  </span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="font-semibold text-destructive">
                      Balance Due
                    </span>
                    <span className="font-bold text-destructive">
                      {fmt(balance)}
                    </span>
                  </div>
                )}
                {balance <= 0 && (
                  <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="font-semibold text-success">Balance</span>
                    <span className="font-bold text-success">Cleared ✓</span>
                  </div>
                )}
              </div>

              {fee.paymentDate && (
                <div className="text-xs text-muted-foreground">
                  Last payment: {fee.paymentDate}
                </div>
              )}

              {fee.notes && (
                <div className="text-xs text-muted-foreground italic">
                  {fee.notes}
                </div>
              )}

              {/* Progress bar */}
              <div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${fee.status === "paid" ? "bg-success" : fee.status === "partial" ? "bg-warning" : "bg-destructive/40"}`}
                    style={{
                      width: `${Math.min(100, (fee.amountPaid / fee.tuitionAmount) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((fee.amountPaid / fee.tuitionAmount) * 100).toFixed(0)}%
                  paid
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
