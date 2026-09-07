import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

// Mock the db module
vi.mock("@/db", () => ({
  getDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue([{ 1: 1 }]),
  })),
}));

describe("GET /api/health", () => {
  it("returns 200 ok when database is reachable", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(data.services.database).toBe("connected");
    expect(data.timestamp).toBeDefined();
    expect(typeof data.uptime).toBe("number");
  });
});
