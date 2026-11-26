"use client";

import {
  Globe,
  Lock,
  CreditCard,
  Server,
} from "lucide-react";

interface PreviewItem {
  id: string;
  name: string;
  category: string;
  provider: string;
  renewal: string;
  cost: string;
  urgent?: boolean;
  icon: typeof Globe;
}

const ITEMS: PreviewItem[] = [
  {
    id: "1",
    name: "api.duesora.com",
    category: "SSL Certificate",
    provider: "Let's Encrypt",
    renewal: "In 3 days",
    cost: "$0.00",
    urgent: true,
    icon: Lock,
  },
  {
    id: "2",
    name: "duesora.com",
    category: "Domain",
    provider: "Namecheap",
    renewal: "In 18 days",
    cost: "$14.00/yr",
    icon: Globe,
  },
  {
    id: "3",
    name: "Linear Standard",
    category: "Subscription",
    provider: "5 seats",
    renewal: "In 22 days",
    cost: "$60.00/mo",
    icon: CreditCard,
  },
  {
    id: "4",
    name: "Production RDS",
    category: "Database",
    provider: "AWS PostgreSQL",
    renewal: "In 29 days",
    cost: "$145.00/mo",
    icon: Server,
  },
];

export function HeroPreview() {
  return (
    <div className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0 rounded-[8px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden text-left">
      {/* Minimal Header */}
      <div className="bg-muted/30 border-b border-border px-3.5 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-foreground text-xs">Upcoming renewals</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">4 items</span>
      </div>

      {/* Clean Items List */}
      <div className="divide-y divide-border">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-[4px] bg-muted/80 border border-border flex items-center justify-center shrink-0 text-primary">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-foreground truncate block text-xs">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {item.category} · {item.provider}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`font-mono text-[11px] font-medium block ${
                    item.urgent
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.renewal}
                </span>
                <span className="font-mono text-xs font-semibold text-foreground block">
                  {item.cost}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Summary Footer */}
      <div className="bg-muted/20 border-t border-border px-3.5 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Monthly spend:{" "}
          <strong className="font-mono font-semibold text-foreground">$205.00</strong>
        </span>
        <span className="font-mono text-[10px]">All on schedule</span>
      </div>
    </div>
  );
}
