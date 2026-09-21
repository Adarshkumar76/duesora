"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Download, Check, X } from "lucide-react";

interface ExportableResource {
  id: string;
  name: string;
  type: string;
  category?: string | null;
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
  currentTag?: string;
  currentCategory?: string;
  availableTags?: Array<{ id: string; name: string; colorToken: string }>;
}

export function ResourcesToolbar({
  resources,
  currentStatus,
  currentTag,
  currentCategory,
  availableTags = [],
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

  const handleTagFilter = (tag: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) {
      params.set("tag", tag);
    } else {
      params.delete("tag");
    }
    params.set("page", "1");
    router.push(`/resources?${params.toString()}`);
    setFilterOpen(false);
  };

  const handleClearStatus = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.set("page", "1");
    router.push(`/resources?${params.toString()}`);
  };

  const handleClearTag = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    params.set("page", "1");
    router.push(`/resources?${params.toString()}`);
  };

  const handleClearCategory = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
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
    <div className="flex items-center flex-wrap gap-2">
      {/* Active status pill if filtered */}
      {currentStatus && currentStatus !== "all" && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
          <span>Status: {currentStatus}</span>
          <button
            type="button"
            onClick={handleClearStatus}
            className="hover:opacity-75 cursor-pointer ml-0.5"
            aria-label="Clear status filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Active tag pill if filtered */}
      {currentTag && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300/40">
          <span>Tag: #{currentTag}</span>
          <button
            type="button"
            onClick={handleClearTag}
            className="hover:opacity-75 cursor-pointer ml-0.5"
            aria-label="Clear tag filter"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {/* Active category pill if filtered */}
      {currentCategory && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300/40">
          <span>Category: {currentCategory}</span>
          <button
            type="button"
            onClick={handleClearCategory}
            className="hover:opacity-75 cursor-pointer ml-0.5"
            aria-label="Clear category filter"
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
            currentStatus || currentTag || currentCategory ? "bg-muted font-semibold" : ""
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </Button>

        {filterOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border/80 rounded-2xl shadow-lg p-2.5 z-50 animate-in fade-in-0 zoom-in-95 duration-100 space-y-2">
            <div>
              <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Filter by Status
              </p>
              <div className="space-y-0.5">
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

            {availableTags.length > 0 && (
              <div className="pt-2 border-t border-border/60">
                <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Filter by Tag
                </p>
                <div className="flex flex-wrap gap-1 p-1 max-h-36 overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = currentTag?.toLowerCase() === tag.name.toLowerCase();
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagFilter(isSelected ? null : tag.name)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
