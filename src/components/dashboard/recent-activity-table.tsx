import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface RecentActivityItem {
  id: string;
  name: string;
  category: string;
  renewalDate: string;
  amount: number;
  status: "active" | "expiring" | "inactive";
}

interface RecentActivityTableProps {
  items?: RecentActivityItem[];
}

const DEFAULT_ITEMS: RecentActivityItem[] = [
  {
    id: "act-1",
    name: "duesora.com",
    category: "Domains",
    renewalDate: "Aug 11, 2022",
    amount: 1248.75,
    status: "active",
  },
  {
    id: "act-2",
    name: "Google Workspace",
    category: "Google Workspace",
    renewalDate: "Sep 29, 2023",
    amount: 130.0,
    status: "active",
  },
  {
    id: "act-3",
    name: "AWS - Production",
    category: "Hosting",
    renewalDate: "Jun 18, 2023",
    amount: 100.0,
    status: "active",
  },
  {
    id: "act-4",
    name: "SSL Certificate",
    category: "SSL Certificate",
    renewalDate: "Jun 16, 2023",
    amount: 50.0,
    status: "active",
  },
  {
    id: "act-5",
    name: "DigitalOcean Droplet",
    category: "DigitalOcean Droplet",
    renewalDate: "Jun 16, 2023",
    amount: 150.0,
    status: "active",
  },
];

export function RecentActivityTable({ items }: RecentActivityTableProps) {
  const displayItems = items && items.length > 0 ? items : DEFAULT_ITEMS;

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* Table Header with soft background matching mockup */}
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
              {displayItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-muted/20 transition-colors"
                >
                  {/* Name */}
                  <td className="py-3.5 px-6 font-medium text-foreground">
                    {item.name}
                  </td>

                  {/* Category Badge matching mockup pills */}
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                      {item.category}
                    </span>
                  </td>

                  {/* Renewal Date */}
                  <td className="py-3.5 px-6 text-muted-foreground text-xs sm:text-sm">
                    {item.renewalDate}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-6 font-semibold text-foreground">
                    ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Status Badge with Dot matching mockup */}
                  <td className="py-3.5 px-6 text-right sm:text-left">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
