import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PUT } from "@/app/api/workspaces/[workspaceId]/resources/[resourceId]/renewal-decision/route";
import { auth } from "@/auth";
import { updateRenewalDecision } from "@/lib/renewals/decision";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/renewals/decision", () => ({
  updateRenewalDecision: vi.fn(),
  ALLOWED_RENEWAL_DECISIONS: ["none", "needs_review", "approved", "cancel", "negotiate"],
}));

describe("API: /api/workspaces/[workspaceId]/resources/[resourceId]/renewal-decision", () => {
  const context = {
    params: Promise.resolve({
      workspaceId: "ws-test-1",
      resourceId: "res-test-1",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    const req = new NextRequest(
      "http://localhost:3000/api/workspaces/ws-test-1/resources/res-test-1/renewal-decision",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      }
    );

    const res = await PUT(req, context);
    expect(res.status).toBe(401);
  });

  it("returns 400 when payload is missing or invalid decision", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);

    const req = new NextRequest(
      "http://localhost:3000/api/workspaces/ws-test-1/resources/res-test-1/renewal-decision",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "not_a_valid_decision" }),
      }
    );

    const res = await PUT(req, context);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain("Invalid renewal decision");
  });

  it("returns 403 when user does not have permission", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-viewer" } } as never);
    vi.mocked(updateRenewalDecision).mockRejectedValue(new Error("FORBIDDEN"));

    const req = new NextRequest(
      "http://localhost:3000/api/workspaces/ws-test-1/resources/res-test-1/renewal-decision",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      }
    );

    const res = await PUT(req, context);
    expect(res.status).toBe(403);
  });

  it("returns 404 when resource is not found", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-admin" } } as never);
    vi.mocked(updateRenewalDecision).mockRejectedValue(new Error("Resource not found"));

    const req = new NextRequest(
      "http://localhost:3000/api/workspaces/ws-test-1/resources/res-test-1/renewal-decision",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "cancel" }),
      }
    );

    const res = await PUT(req, context);
    expect(res.status).toBe(404);
  });

  it("returns 200 with updated resource on valid submission", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-lead" } } as never);
    const mockUpdated = {
      id: "res-test-1",
      workspaceId: "ws-test-1",
      name: "GitHub Enterprise",
      renewalDecision: "approved",
      decisionNotes: "Approved for FY26",
      cancellationNoticeDays: 30,
    };
    vi.mocked(updateRenewalDecision).mockResolvedValue(mockUpdated as never);

    const req = new NextRequest(
      "http://localhost:3000/api/workspaces/ws-test-1/resources/res-test-1/renewal-decision",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "approved",
          notes: "Approved for FY26",
          cancellationNoticeDays: 30,
        }),
      }
    );

    const res = await PUT(req, context);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.resource.renewalDecision).toBe("approved");
    expect(updateRenewalDecision).toHaveBeenCalledWith("user-lead", "ws-test-1", "res-test-1", {
      decision: "approved",
      notes: "Approved for FY26",
      cancellationNoticeDays: 30,
      cancellationDeadline: undefined,
    });
  });
});
