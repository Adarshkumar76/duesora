"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Download, Check, X } from "lucide-react";

interface ExportableResource {
  id: string;
  name: string;
  type: string;
  provider: string | null;
  status: string;
  renewalDate: string | Date | null;
  amountMinor: number | null;
  currency: string;
  billingCycle: string;
}

interface ResourcesToolbarProps {
  resources: ExportableResource[];
  currentStatus?: string;
}

export function ResourcesToolbar({
  resources,
  currentStatus,
}: ResourcesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusFilter = (status: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`/resources?${params.toString()}`);
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.set("page", "1");
    router.push(`/resources?${params.toString()}`);
  };

  // CSV Export functionality
  const handleExportCsv = () => {
    if (resources.length === 0) {
      alert("No resources available to export.");
      return;
    }

    const headers = [
      "Name",
      "Type",
      "Provider",
      "Status",
      "Next Renewal",
      "Amount",
      "Currency",
      "Billing Cycle",
    ];

    const rows = resources.map((r) => {
      const renewal = r.renewalDate
        ? new Date(r.renewalDate).toISOString().split("T")[0]
        : "";
      const amount = r.amountMinor !== null ? (r.amountMinor / 100).toFixed(2) : "0.00";

      return [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.type}"`,
        `"${(r.provider || "").replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${renewal}"`,
        `"${amount}"`,
        `"${r.currency}"`,
        `"${r.billingCycle}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `duesora_resources_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Expired", value: "expired" },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Active status pill if filtered */}
      {currentStatus && currentStatus !== "all" && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
          <span>Status: {currentStatus}</span>
          <button
            type="button"
            onClick={handleClearFilter}
            className="hover:opacity-75 cursor-pointer ml-0.5"
            aria-label="Clear status filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Filter Dropdown */}
      <div className="relative" ref={filterRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterOpen((prev) => !prev)}
          className={`rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-medium cursor-pointer ${
            currentStatus ? "bg-muted font-semibold" : ""
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </Button>

        {filterOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-2xl shadow-lg p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
            <p className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Filter by Status
            </p>
            <div className="space-y-1">
              {statusOptions.map((opt) => {
                const isSelected =
                  (!currentStatus && opt.value === "all") ||
                  currentStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusFilter(opt.value)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-foreground hover:bg-muted/70 transition-colors cursor-pointer text-left"
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Export CSV Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCsv}
        title="Export resources to CSV"
        className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-medium cursor-pointer hover:bg-muted/60"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </Button>
    </div>
  );
}
