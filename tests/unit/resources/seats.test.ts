import { describe, it, expect } from "vitest";
import { calculateSeatMetrics } from "@/lib/resources/seats";

describe("Seat & License Utilization Optimizer Logic", () => {
  describe("calculateSeatMetrics", () => {
    it("identifies healthy utilization when assigned seats are above 80%", () => {
      const res = calculateSeatMetrics({
        resourceId: "res-1",
        resourceName: "Figma Enterprise",
        type: "software_license",
        seatTrackingEnabled: true,
        totalSeats: 50,
        assignedSeats: 45,
        costPerSeatMinor: 1500, // $15.00
        currency: "USD",
        billingCycle: "monthly",
      });

      expect(res.totalSeats).toBe(50);
      expect(res.assignedSeats).toBe(45);
      expect(res.idleSeats).toBe(5);
      expect(res.utilizationRate).toBe(90);
      expect(res.status).toBe("healthy");
      expect(res.monthlyIdleWaste).toBe(75); // 5 idle * $15 = $75
      expect(res.annualizedIdleWaste).toBe(900); // $75 * 12 = $900
      expect(res.recommendation).toContain("Healthy utilization");
    });

    it("identifies critical waste when utilization is below 50% and suggests target downgrade", () => {
      const res = calculateSeatMetrics({
        resourceId: "res-2",
        resourceName: "Zoom Pro",
        type: "subscription",
        seatTrackingEnabled: true,
        totalSeats: 100,
        assignedSeats: 30,
        costPerSeatMinor: 2000, // $20.00
        currency: "USD",
        billingCycle: "monthly",
      });

      expect(res.utilizationRate).toBe(30);
      expect(res.status).toBe("critical");
      expect(res.idleSeats).toBe(70);
      expect(res.monthlyIdleWaste).toBe(1400); // 70 * $20 = $1400
      expect(res.annualizedIdleWaste).toBe(16800); // $1400 * 12 = $16800
      expect(res.suggestedSeatDowngrade).toBe(33); // 30 assigned + 10% buffer = 33
      expect(res.potentialAnnualSavings).toBeGreaterThan(0);
      expect(res.recommendation).toContain("Critical underutilization");
      expect(res.recommendation).toContain("Downsizing from 100 to 33 seats");
    });

    it("detects 100% capacity exhaustion", () => {
      const res = calculateSeatMetrics({
        resourceId: "res-3",
        resourceName: "Google Workspace",
        type: "subscription",
        seatTrackingEnabled: true,
        totalSeats: 25,
        assignedSeats: 25,
        costPerSeatMinor: 1200,
        currency: "USD",
        billingCycle: "monthly",
      });

      expect(res.utilizationRate).toBe(100);
      expect(res.status).toBe("exhausted");
      expect(res.idleSeats).toBe(0);
      expect(res.monthlyIdleWaste).toBe(0);
      expect(res.annualizedIdleWaste).toBe(0);
      expect(res.recommendation).toContain("100% capacity reached");
    });

    it("handles yearly billing cycles properly", () => {
      const res = calculateSeatMetrics({
        resourceId: "res-4",
        resourceName: "JetBrains All Products Pack",
        type: "software_license",
        seatTrackingEnabled: true,
        totalSeats: 10,
        assignedSeats: 8,
        costPerSeatMinor: 30000, // $300/yr per seat
        currency: "USD",
        billingCycle: "yearly",
      });

      expect(res.idleSeats).toBe(2);
      expect(res.annualizedIdleWaste).toBe(600); // 2 * $300 = $600
      expect(res.monthlyIdleWaste).toBe(50); // $600 / 12 = $50
    });

    it("handles zero or null seat parameters gracefully without division by zero", () => {
      const res = calculateSeatMetrics({
        resourceId: "res-5",
        resourceName: "Test Tool",
        type: "subscription",
        seatTrackingEnabled: false,
        totalSeats: null,
        assignedSeats: null,
        costPerSeatMinor: null,
        currency: "USD",
        billingCycle: "monthly",
      });

      expect(res.totalSeats).toBe(0);
      expect(res.assignedSeats).toBe(0);
      expect(res.idleSeats).toBe(0);
      expect(res.utilizationRate).toBe(0);
      expect(res.status).toBe("warning");
    });
  });
});
