import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import * as dbModule from "@/db";

vi.mock("@/db", () => ({
  getDb: vi.fn(),
}));

describe("Health API (/api/health)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns HTTP 200 with status ok when database responds", async () => {
    const fakeDb = {
      execute: vi.fn().mockResolvedValue([{ 1: 1 }]),
    };
    vi.mocked(dbModule.getDb).mockReturnValue(fakeDb as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.services.database).toBe("connected");
    expect(typeof data.uptime).toBe("number");
    expect(typeof data.timestamp).toBe("string");
  });

  it("returns HTTP 503 with status degraded when database fails", async () => {
    const fakeDb = {
      execute: vi.fn().mockRejectedValue(new Error("Database offline")),
    };
    vi.mocked(dbModule.getDb).mockReturnValue(fakeDb as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("degraded");
    expect(data.services.database).toBe("disconnected");
  });
});
