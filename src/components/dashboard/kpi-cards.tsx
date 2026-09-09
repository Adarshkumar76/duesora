import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Resources */}
      <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <CardContent className="p-0 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Total Resources
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {kpis.totalResources}
          </p>
        </CardContent>
      </Card>

      {/* 2. Renewals Due */}
      <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <CardContent className="p-0 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Renewals Due
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {kpis.renewalsDue}
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Spend */}
      <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <CardContent className="p-0 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Total Spend
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {formattedSpend}
          </p>
        </CardContent>
      </Card>

      {/* 4. Expiring Soon with Within 30 Days Badge */}
      <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
        <CardContent className="p-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              kpis.expiringSoon > 0
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300/70"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300/70"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                kpis.expiringSoon > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`} />
              {kpis.expiringSoon > 0 ? "Within 30 Days" : "Healthy"}
            </span>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {kpis.expiringSoon}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
