import { describe, it, expect } from "vitest";
import {
  computeAnnualizedAmount,
  computeWorkspaceDependencyGraph,
  type RawResourceForGraph,
  type RawEdgeForGraph,
} from "@/lib/resources/dependencies";

describe("Workspace Dependency Graph & Blast Radius Logic", () => {
  describe("computeAnnualizedAmount", () => {
    it("normalizes monthly billing to annual amount", () => {
      expect(computeAnnualizedAmount(1000, "monthly")).toBe(120); // 1000 minor = $10 * 12 = $120
    });

    it("normalizes quarterly billing to annual amount", () => {
      expect(computeAnnualizedAmount(5000, "quarterly")).toBe(200); // $50 * 4 = $200
    });

    it("handles yearly billing as direct amount", () => {
      expect(computeAnnualizedAmount(9900, "yearly")).toBe(99); // $99
    });

    it("returns 0 for empty or invalid amounts", () => {
      expect(computeAnnualizedAmount(null, "yearly")).toBe(0);
      expect(computeAnnualizedAmount(0, "monthly")).toBe(0);
    });
  });

  describe("computeWorkspaceDependencyGraph", () => {
    it("computes transitive blast radius across a multi-hop chain", () => {
      // Scenario:
      // Web App (A) depends on API Backend (B)
      // API Backend (B) depends on Database (C)
      // Database (C) depends on AWS Account (D)
      // If AWS (D) goes down: C, B, A are all in the blast radius!
      const rawNodes: RawResourceForGraph[] = [
        {
          id: "node-a",
          name: "Web App Frontend",
          type: "subscription",
          status: "active",
          category: "frontend",
          amountMinor: 2000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: new Date(),
          provider: "Vercel",
        },
        {
          id: "node-b",
          name: "API Backend",
          type: "cloud_service",
          status: "active",
          category: "backend",
          amountMinor: 5000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: new Date(),
          provider: "Render",
        },
        {
          id: "node-c",
          name: "Production PostgreSQL",
          type: "hosting",
          status: "active",
          category: "database",
          amountMinor: 10000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: new Date(),
          provider: "AWS RDS",
        },
        {
          id: "node-d",
          name: "AWS Root Account",
          type: "cloud_service",
          status: "active",
          category: "infrastructure",
          amountMinor: 20000,
          currency: "USD",
          billingCycle: "yearly",
          renewalDate: new Date(),
          provider: "Amazon Web Services",
        },
      ];

      const rawEdges: RawEdgeForGraph[] = [
        { id: "e1", resourceId: "node-a", dependsOnResourceId: "node-b", notes: "API queries" },
        { id: "e2", resourceId: "node-b", dependsOnResourceId: "node-c", notes: "DB connection" },
        { id: "e3", resourceId: "node-c", dependsOnResourceId: "node-d", notes: "Cloud hosting" },
      ];

      const graph = computeWorkspaceDependencyGraph(rawNodes, rawEdges);

      expect(graph.stats.totalNodes).toBe(4);
      expect(graph.stats.totalEdges).toBe(3);

      const nodeD = graph.nodes.find((n) => n.id === "node-d");
      expect(nodeD).toBeDefined();
      // node-d has direct dependents: node-c
      expect(nodeD!.directDependentsCount).toBe(1);
      // node-d has transitive blast radius: node-c, node-b, node-a (3 total)
      expect(nodeD!.totalBlastRadiusCount).toBe(3);
      expect(nodeD!.downstreamNodeIds).toContain("node-c");
      expect(nodeD!.downstreamNodeIds).toContain("node-b");
      expect(nodeD!.downstreamNodeIds).toContain("node-a");
      expect(nodeD!.isCriticalSPOF).toBe(true);

      const nodeA = graph.nodes.find((n) => n.id === "node-a");
      expect(nodeA).toBeDefined();
      // node-a has 0 downstream dependents
      expect(nodeA!.totalBlastRadiusCount).toBe(0);
      // node-a depends upstream on b, c, d
      expect(nodeA!.upstreamNodeIds).toContain("node-b");
      expect(nodeA!.upstreamNodeIds).toContain("node-c");
      expect(nodeA!.upstreamNodeIds).toContain("node-d");
    });

    it("identifies Single Points of Failure when a shared prerequisite has multiple direct dependents", () => {
      // DNS Provider (Cloudflare) has 3 services depending on it directly
      const rawNodes: RawResourceForGraph[] = [
        {
          id: "dns",
          name: "Cloudflare DNS",
          type: "domain",
          status: "active",
          category: "networking",
          amountMinor: 2500,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: null,
          provider: "Cloudflare",
        },
        {
          id: "site1",
          name: "Customer Portal",
          type: "subscription",
          status: "active",
          category: "app",
          amountMinor: 1000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: null,
          provider: null,
        },
        {
          id: "site2",
          name: "Marketing Website",
          type: "subscription",
          status: "active",
          category: "app",
          amountMinor: 1000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: null,
          provider: null,
        },
      ];

      const rawEdges: RawEdgeForGraph[] = [
        { id: "e1", resourceId: "site1", dependsOnResourceId: "dns", notes: null },
        { id: "e2", resourceId: "site2", dependsOnResourceId: "dns", notes: null },
      ];

      const graph = computeWorkspaceDependencyGraph(rawNodes, rawEdges);
      const dnsNode = graph.nodes.find((n) => n.id === "dns");

      expect(dnsNode?.isCriticalSPOF).toBe(true);
      expect(dnsNode?.totalBlastRadiusCount).toBe(2);
      expect(graph.stats.spofCount).toBe(1);
    });

    it("gracefully terminates without infinite recursion on accidental circular dependencies", () => {
      const rawNodes: RawResourceForGraph[] = [
        {
          id: "n1",
          name: "Service 1",
          type: "cloud_service",
          status: "active",
          category: null,
          amountMinor: null,
          currency: "USD",
          billingCycle: "yearly",
          renewalDate: null,
          provider: null,
        },
        {
          id: "n2",
          name: "Service 2",
          type: "cloud_service",
          status: "active",
          category: null,
          amountMinor: null,
          currency: "USD",
          billingCycle: "yearly",
          renewalDate: null,
          provider: null,
        },
      ];

      // n1 depends on n2, and n2 depends on n1
      const rawEdges: RawEdgeForGraph[] = [
        { id: "e1", resourceId: "n1", dependsOnResourceId: "n2", notes: null },
        { id: "e2", resourceId: "n2", dependsOnResourceId: "n1", notes: null },
      ];

      const graph = computeWorkspaceDependencyGraph(rawNodes, rawEdges);
      expect(graph.nodes.length).toBe(2);
      expect(graph.edges.length).toBe(2);
      // Both nodes should identify the other without crashing
      expect(graph.nodes.find((n) => n.id === "n1")?.downstreamNodeIds).toContain("n2");
      expect(graph.nodes.find((n) => n.id === "n2")?.downstreamNodeIds).toContain("n1");
    });
  });
});
