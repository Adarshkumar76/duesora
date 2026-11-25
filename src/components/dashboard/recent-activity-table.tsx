import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Clock } from "lucide-react";

export interface RecentActivityItem {
  id: string;
  name: string;
  category: string;
  renewalDate: string;
  amount: number;
  currency?: string;
  status: "active" | "expiring" | "inactive";
}

interface RecentActivityTableProps {
  items?: RecentActivityItem[];
}

export function RecentActivityTable({ items = [] }: RecentActivityTableProps) {
  const displayItems = items;
  const hasItems = displayItems.length > 0;

  return (
    <Card className="rounded-[8px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
      <CardHeader className="pb-3 px-5 pt-4 flex flex-row items-center justify-between border-b border-border">
        <CardTitle className="text-sm font-semibold text-foreground">
          Recent Activity
        </CardTitle>
        {hasItems && (
          <Link
            href="/resources"
            className="text-xs font-semibold text-primary hover:underline transition-colors"
          >
            View All &rarr;
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {hasItems ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              {/* Table Header */}
              <thead className="bg-muted/40 border-y border-border/60 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Renewal Date</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6 text-right sm:text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayItems.map((item) => {
                  const currencySymbol =
                    item.currency === "INR"
                      ? "₹"
                      : item.currency === "EUR"
                      ? "€"
                      : item.currency === "GBP"
                      ? "£"
                      : "$";

                  const isExpiring = item.status === "expiring";
                  const isInactive = item.status === "inactive";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-6 font-medium text-foreground">
                        <Link
                          href="/resources"
                          className="hover:underline hover:text-emerald-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-mono bg-muted text-foreground border border-border">
                          {item.category}
                        </span>
                      </td>

                      {/* Renewal Date */}
                      <td className="py-3 px-6 text-muted-foreground text-xs font-mono tabular-nums">
                        {item.renewalDate}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-6 font-semibold font-mono tabular-nums text-foreground text-xs">
                        {item.amount > 0 ? (
                          `${currencySymbol}${item.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        ) : (
                          "Free"
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-6 text-right sm:text-left">
                        {isExpiring ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono border bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Expiring
                          </span>
                        ) : isInactive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono border bg-muted text-muted-foreground border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Resources and renewal events added to your workspace will be tracked here.
              </p>
            </div>
            <Link
              href="/resources/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
