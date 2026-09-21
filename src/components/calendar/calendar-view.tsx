"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  X,
} from "lucide-react";

export interface CalendarEventItem {
  id: string;
  name: string;
  type?: string | null;
  provider?: string | null;
  category?: string | null;
  amountMinor?: number | null;
  currency?: string | null;
  billingCycle?: string | null;
  renewalDate: string; // ISO string
  autoRenew?: boolean | null;
}

interface CalendarViewProps {
  initialResources: CalendarEventItem[];
  workspaceId: string;
  workspaceName: string;
  calendarToken: string;
  appUrl: string;
}

export function CalendarView({
  initialResources,
  workspaceId,
  workspaceName,
  calendarToken,
  appUrl,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  const cleanAppUrl = appUrl.replace(/\/$/, "");
  const icsHttpsUrl = `${cleanAppUrl}/api/workspaces/${workspaceId}/calendar.ics?token=${calendarToken}`;
  const webcalUrl = icsHttpsUrl.replace(/^https?:\/\//i, "webcal://");

  const handleCopy = () => {
    navigator.clipboard.writeText(icsHttpsUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Map resources by day of month (YYYY-MM-DD)
  const eventsByDate = new Map<string, CalendarEventItem[]>();
  for (const item of initialResources) {
    if (!item.renewalDate) continue;
    const key = item.renewalDate.split("T")[0];
    const existing = eventsByDate.get(key) || [];
    existing.push(item);
    eventsByDate.set(key, existing);
  }

  // Generate calendar grid cells (42 cells: 6 rows of 7)
  const calendarCells = [];

  // 1. Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    const dateKey = prevDate.toISOString().split("T")[0];
    calendarCells.push({
      dayNumber: day,
      dateKey,
      isCurrentMonth: false,
      events: eventsByDate.get(dateKey) || [],
    });
  }

  // 2. Current month days
  const todayStr = new Date().toISOString().split("T")[0];
  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    calendarCells.push({
      dayNumber: day,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
      events: eventsByDate.get(dateKey) || [],
    });
  }

  // 3. Next month leading days
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    const dateKey = nextDate.toISOString().split("T")[0];
    calendarCells.push({
      dayNumber: day,
      dateKey,
      isCurrentMonth: false,
      events: eventsByDate.get(dateKey) || [],
    });
  }

  const formatAmount = (amountMinor?: number | null, currency = "USD") => {
    if (amountMinor === 0) return "Free";
    if (amountMinor === null || amountMinor === undefined) return "—";
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
    const sym = symbols[currency] || "$";
    return `${sym}${(amountMinor / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Calendar Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">
            {monthNames[month]} {year}
          </h2>

          <div className="flex items-center gap-1 border border-border/70 rounded-xl p-0.5 bg-background">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold hover:bg-muted text-foreground rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setSubscribeModalOpen(true)}
            className="rounded-xl text-xs font-semibold h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Subscribe to iCal (.ics)</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        {/* Day of week header */}
        <div className="grid grid-cols-7 border-b border-border/70 bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2.5">
          {dayNames.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* 42 Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
          {calendarCells.map((cell, idx) => {
            return (
              <div
                key={idx}
                className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth ? "bg-card" : "bg-muted/20 text-muted-foreground/60"
                } ${cell.isToday ? "ring-2 ring-inset ring-emerald-500/50 bg-emerald-500/5" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                      cell.isToday
                        ? "bg-emerald-600 text-white shadow-xs"
                        : cell.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.events.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Event chips */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {cell.events.slice(0, 2).map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelectedEvent(ev)}
                      className="w-full text-left truncate text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 transition-colors block cursor-pointer"
                      title={`${ev.name} - ${formatAmount(ev.amountMinor, ev.currency || "USD")}`}
                    >
                      <span className="truncate">{ev.name}</span>
                    </button>
                  ))}

                  {cell.events.length > 2 && (
                    <span className="text-[10px] text-muted-foreground font-medium pl-1 block">
                      +{cell.events.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground truncate">{selectedEvent.name}</h3>
                  <span className="text-xs text-muted-foreground capitalize">
                    {selectedEvent.type || "Resource"} Renewal
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm divide-y divide-border/40">
              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Renewal Date</span>
                <span className="font-semibold text-foreground">
                  {new Date(selectedEvent.renewalDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-muted-foreground">Renewal Cost</span>
                <span className="font-semibold text-foreground">
                  {formatAmount(selectedEvent.amountMinor, selectedEvent.currency || "USD")}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({selectedEvent.billingCycle || "yearly"})
                  </span>
                </span>
              </div>

              {selectedEvent.provider && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-semibold text-foreground">{selectedEvent.provider}</span>
                </div>
              )}

              {selectedEvent.category && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-semibold text-foreground">{selectedEvent.category}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl cursor-pointer"
              >
                Close
              </Button>
              <Link href={`/resources/${selectedEvent.id}`}>
                <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                  <span>View Details</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Subscribe to iCal Modal */}
      {subscribeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="bg-card border border-border/80 rounded-2xl shadow-xl max-w-lg w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Subscribe to {workspaceName} Calendar</h3>
                  <p className="text-xs text-muted-foreground">Sync all renewals live to Google, Apple, or Outlook</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubscribeModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feed URL Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Secure Subscription URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={icsHttpsUrl}
                  className="w-full px-3 py-2 text-xs font-mono bg-background border border-border/70 rounded-xl text-muted-foreground focus:outline-none select-all"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 rounded-xl text-xs font-semibold h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Setup Instructions */}
            <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60">
              <p className="font-semibold text-foreground">How to add to your calendar:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>
                  <strong className="text-foreground">Google Calendar:</strong> Click <em>&quot;+&quot; next to Other calendars</em> &rarr; <em>From URL</em> &rarr; Paste link.
                </li>
                <li>
                  <strong className="text-foreground">Apple Calendar:</strong> Go to <em>File</em> &rarr; <em>New Calendar Subscription</em> &rarr; Paste link.
                </li>
                <li>
                  <strong className="text-foreground">Outlook / Office 365:</strong> Click <em>Add Calendar</em> &rarr; <em>Subscribe from web</em> &rarr; Paste link.
                </li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <a
                href={webcalUrl}
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <span>1-Click Open in Default Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubscribeModalOpen(false)}
                className="rounded-xl cursor-pointer text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
