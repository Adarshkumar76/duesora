import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Layers, TrendingUp } from "lucide-react";

interface KpiCardsProps {
  kpis: {
    totalResources: number;
    renewalsDue: number;
    totalSpend: number;
    expiringSoon: number;
  };
  currency?: string;
}

export function KpiCards({ kpis, currency = "USD" }: KpiCardsProps) {
  const currencyCode = ["USD", "INR", "EUR", "GBP"].includes(currency)
    ? currency
    : "USD";

  const formattedSpend = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(kpis.totalSpend);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Resources */}
      <Card className="rounded-[8px] border border-border bg-card p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-left">
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Resources</span>
            <Layers className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-foreground">
            {kpis.totalResources}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Active assets in workspace
          </p>
        </CardContent>
      </Card>

      {/* 2. Renewals Due */}
      <Card className="rounded-[8px] border border-border bg-card p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-left">
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Renewals Due</span>
            <RefreshCw className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-foreground">
            {kpis.renewalsDue}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Scheduled for this billing period
          </p>
        </CardContent>
      </Card>

      {/* 3. Monthly Recurring Spend */}
      <Card className="rounded-[8px] border border-border bg-card p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-left">
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Monthly Spend</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-foreground">
            {formattedSpend}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Normalized monthly cost
          </p>
        </CardContent>
      </Card>

      {/* 4. Expiring Soon */}
      <Card className="rounded-[8px] border border-border bg-card p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] text-left">
        <CardContent className="p-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Expiring Soon</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono border ${kpis.expiringSoon > 0
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${kpis.expiringSoon > 0 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
              />
              {kpis.expiringSoon > 0 ? "Within 30d" : "All Healthy"}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-foreground">
            {kpis.expiringSoon}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {kpis.expiringSoon > 0 ? "Requires review or renewal" : "No immediate deadlines"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
