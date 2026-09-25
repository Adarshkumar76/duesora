import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

import { calculateReminderMatch } from "@/lib/notifications/reminder-engine";

describe("Reminder Engine Interval Matching", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("identifies overdue resources (<= 0 days remaining)", () => {
    const overdue = new Date("2026-09-30T12:00:00Z");
    const match = calculateReminderMatch(overdue, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(0);
    expect(match?.severity).toBe("critical");
    expect(match?.type).toBe("renewal_overdue");
  });

  it("identifies resources due today (0 days remaining)", () => {
    const today = new Date("2026-10-01T14:00:00Z");
    const match = calculateReminderMatch(today, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(1); // within 1 day
  });

  it("matches 1-day critical reminder", () => {
    const tomorrow = new Date("2026-10-02T10:00:00Z");
    const match = calculateReminderMatch(tomorrow, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(1);
    expect(match?.severity).toBe("critical");
    expect(match?.type).toBe("renewal_upcoming");
  });

  it("matches 3-day warning reminder", () => {
    const in3Days = new Date("2026-10-04T12:00:00Z");
    const match = calculateReminderMatch(in3Days, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(3);
    expect(match?.severity).toBe("warning");
  });

  it("matches 7-day warning reminder", () => {
    const in7Days = new Date("2026-10-08T12:00:00Z");
    const match = calculateReminderMatch(in7Days, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(7);
    expect(match?.severity).toBe("warning");
  });

  it("matches 14-day info reminder", () => {
    const in14Days = new Date("2026-10-15T12:00:00Z");
    const match = calculateReminderMatch(in14Days, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(14);
    expect(match?.severity).toBe("info");
  });

  it("matches 30-day info reminder", () => {
    const in30Days = new Date("2026-10-31T12:00:00Z");
    const match = calculateReminderMatch(in30Days, now);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(30);
    expect(match?.severity).toBe("info");
  });

  it("returns null for resources renewing beyond 30 days by default", () => {
    const in45Days = new Date("2026-11-15T12:00:00Z");
    const match = calculateReminderMatch(in45Days, now);

    expect(match).toBeNull();
  });

  it("supports custom enterprise intervals like 60 and 45 days", () => {
    const customIntervals = [60, 45, 30, 14, 7, 3, 1, 0];
    const in40Days = new Date("2026-11-10T12:00:00Z");
    const match = calculateReminderMatch(in40Days, now, customIntervals);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(45);
    expect(match?.severity).toBe("info");
  });

  it("supports custom intervals with 90 days", () => {
    const customIntervals = [90, 60, 30];
    const in80Days = new Date("2026-12-20T12:00:00Z");
    const match = calculateReminderMatch(in80Days, now, customIntervals);

    expect(match).not.toBeNull();
    expect(match?.intervalDays).toBe(90);
  });
});
