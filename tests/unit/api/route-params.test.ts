import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { resolveWorkspaceId, resolveResourceRouteParams } from "@/lib/api/route-params";

describe("Route Params Resolver", () => {
  describe("resolveWorkspaceId", () => {
    it("resolves workspaceId from context with params Promise", async () => {
      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/audit");
      const ctx = { params: Promise.resolve({ workspaceId: "ws-1" }) };
      const id = await resolveWorkspaceId(req, ctx);
      expect(id).toBe("ws-1");
    });

    it("resolves workspaceId from context with sync params object", async () => {
      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-2/audit");
      const ctx = { params: { workspaceId: "ws-2" } };
      const id = await resolveWorkspaceId(req, ctx);
      expect(id).toBe("ws-2");
    });

    it("falls back to URL pathname when context is undefined", async () => {
      const req = new NextRequest("http://localhost:3000/api/workspaces/4adbf433-d46c-4228/audit");
      const id = await resolveWorkspaceId(req, undefined);
      expect(id).toBe("4adbf433-d46c-4228");
    });

    it("falls back to URL pathname when params Promise resolves to undefined", async () => {
      const req = new NextRequest("http://localhost:3000/api/workspaces/4adbf433-d46c-4228/audit");
      const ctx = { params: Promise.resolve(undefined) };
      const id = await resolveWorkspaceId(req, ctx);
      expect(id).toBe("4adbf433-d46c-4228");
    });

    it("returns null if pathname has no workspaceId and context is empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/health");
      const id = await resolveWorkspaceId(req, {});
      expect(id).toBeNull();
    });
  });

  describe("resolveResourceRouteParams", () => {
    it("resolves workspaceId and resourceId from params Promise", async () => {
      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-1/resources/res-100/renew");
      const ctx = { params: Promise.resolve({ workspaceId: "ws-1", resourceId: "res-100" }) };
      const res = await resolveResourceRouteParams(req, ctx);
      expect(res).toEqual({ workspaceId: "ws-1", resourceId: "res-100" });
    });

    it("falls back to URL pathname when context is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/workspaces/ws-abc/resources/res-xyz/renew");
      const res = await resolveResourceRouteParams(req, undefined);
      expect(res).toEqual({ workspaceId: "ws-abc", resourceId: "res-xyz" });
    });
  });
});
