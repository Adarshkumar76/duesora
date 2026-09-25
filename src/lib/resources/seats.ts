import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";

export interface SeatUtilizationMetrics {
  resourceId: string;
  resourceName: string;
  type: string;
  seatTrackingEnabled: boolean;
  totalSeats: number;
  assignedSeats: number;
  idleSeats: number;
  utilizationRate: number; // 0 - 100
  costPerSeat: number | null;
  currency: string;
  billingCycle: string;
  monthlyIdleWaste: number;
  annualizedIdleWaste: number;
  status: "healthy" | "warning" | "critical" | "exhausted";
  recommendation: string;
  suggestedSeatDowngrade: number | null;
  potentialAnnualSavings: number;
}

export interface WorkspaceSeatOptimizationReport {
  totalTrackedSubscriptions: number;
  totalSeatsPurchased: number;
  totalSeatsAssigned: number;
  totalIdleSeats: number;
  overallUtilizationRate: number;
  totalAnnualWastedSpend: number;
  currency: string;
  topWastefulSubscriptions: SeatUtilizationMetrics[];
  allTrackedResources: SeatUtilizationMetrics[];
}

export interface CalculateSeatParams {
  resourceId: string;
  resourceName: string;
  type: string;
  seatTrackingEnabled: boolean;
  totalSeats: number | null;
  assignedSeats: number | null;
  costPerSeatMinor: number | null;
  currency: string;
  billingCycle: string;
}

/**
 * Pure calculation function for seat utilization and waste metrics.
 */
export function calculateSeatMetrics(params: CalculateSeatParams): SeatUtilizationMetrics {
  const total = Math.max(0, params.totalSeats || 0);
  const assigned = Math.max(0, params.assignedSeats || 0);
  const idle = Math.max(0, total - assigned);
  const rate = total > 0 ? Math.min(100, Math.round((assigned / total) * 100)) : 0;
  const costPerSeat = params.costPerSeatMinor !== null ? params.costPerSeatMinor / 100 : null;

  // Monthly and Annual idle waste calculation
  let monthlyIdleWaste = 0;
  let annualizedIdleWaste = 0;

  if (costPerSeat && costPerSeat > 0 && idle > 0) {
    const cycle = params.billingCycle.toLowerCase();
    if (cycle === "yearly" || cycle === "annual") {
      annualizedIdleWaste = idle * costPerSeat;
      monthlyIdleWaste = annualizedIdleWaste / 12;
    } else if (cycle === "quarterly") {
      monthlyIdleWaste = (idle * costPerSeat) / 3;
      annualizedIdleWaste = monthlyIdleWaste * 12;
    } else {
      // monthly / default
      monthlyIdleWaste = idle * costPerSeat;
      annualizedIdleWaste = monthlyIdleWaste * 12;
    }
  }

  // Determine utilization status
  let status: "healthy" | "warning" | "critical" | "exhausted" = "healthy";
  let recommendation = "Seat utilization is optimal.";
  let suggestedSeatDowngrade: number | null = null;
  let potentialAnnualSavings = 0;

  if (total === 0) {
    status = "warning";
    recommendation = "No seats configured for tracking.";
  } else if (assigned >= total) {
    status = "exhausted";
    recommendation = "100% capacity reached. Consider purchasing additional seats for new team members.";
  } else if (rate < 50) {
    status = "critical";
    // Recommend keeping assigned + 10% buffer
    const buffer = Math.max(1, Math.ceil(assigned * 0.1));
    const suggestedTarget = assigned + buffer;
    if (suggestedTarget < total) {
      suggestedSeatDowngrade = suggestedTarget;
      const recoverableSeats = total - suggestedTarget;
      potentialAnnualSavings = costPerSeat ? (annualizedIdleWaste / idle) * recoverableSeats : 0;
      recommendation = `Critical underutilization (${rate}%). Downsizing from ${total} to ${suggestedTarget} seats saves approx. ${params.currency} ${Math.round(potentialAnnualSavings).toLocaleString()}/yr upon renewal.`;
    } else {
      recommendation = `Low seat utilization (${rate}%). Review active accounts before next renewal.`;
    }
  } else if (rate < 80) {
    status = "warning";
    const suggestedTarget = Math.max(assigned, Math.ceil(assigned * 1.15));
    if (suggestedTarget < total) {
      suggestedSeatDowngrade = suggestedTarget;
      const recoverableSeats = total - suggestedTarget;
      potentialAnnualSavings = costPerSeat ? (annualizedIdleWaste / idle) * recoverableSeats : 0;
      recommendation = `Moderate waste (${idle} idle seats). Consider adjusting tier to ${suggestedTarget} seats to save ${params.currency} ${Math.round(potentialAnnualSavings).toLocaleString()}/yr.`;
    } else {
      recommendation = `${idle} idle seats available for future allocation.`;
    }
  } else {
    status = "healthy";
    recommendation = `Healthy utilization (${rate}%). ${idle} spare seat${idle === 1 ? "" : "s"} remaining for growth.`;
  }

  return {
    resourceId: params.resourceId,
    resourceName: params.resourceName,
    type: params.type,
    seatTrackingEnabled: params.seatTrackingEnabled,
    totalSeats: total,
    assignedSeats: assigned,
    idleSeats: idle,
    utilizationRate: rate,
    costPerSeat,
    currency: params.currency,
    billingCycle: params.billingCycle,
    monthlyIdleWaste: Math.round(monthlyIdleWaste * 100) / 100,
    annualizedIdleWaste: Math.round(annualizedIdleWaste * 100) / 100,
    status,
    recommendation,
    suggestedSeatDowngrade,
    potentialAnnualSavings: Math.round(potentialAnnualSavings * 100) / 100,
  };
}

/**
 * Fetches workspace-wide seat optimization metrics and highlights top waste opportunities.
 */
export async function getWorkspaceSeatOptimizationReport(
  workspaceId: string
): Promise<WorkspaceSeatOptimizationReport> {
  const db = getDb();

  const rows = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      seatTrackingEnabled: resources.seatTrackingEnabled,
      totalSeats: resources.totalSeats,
      assignedSeats: resources.assignedSeats,
      costPerSeatMinor: resources.costPerSeatMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
    })
    .from(resources)
    .where(
      and(
        eq(resources.workspaceId, workspaceId),
        eq(resources.seatTrackingEnabled, true)
      )
    )
    .orderBy(desc(resources.createdAt));

  const allTracked = rows.map((r) =>
    calculateSeatMetrics({
      resourceId: r.id,
      resourceName: r.name,
      type: r.type,
      seatTrackingEnabled: r.seatTrackingEnabled,
      totalSeats: r.totalSeats,
      assignedSeats: r.assignedSeats,
      costPerSeatMinor: r.costPerSeatMinor,
      currency: r.currency,
      billingCycle: r.billingCycle,
    })
  );

  let totalPurchased = 0;
  let totalAssigned = 0;
  let totalAnnualWastedSpend = 0;

  for (const m of allTracked) {
    totalPurchased += m.totalSeats;
    totalAssigned += m.assignedSeats;
    totalAnnualWastedSpend += m.annualizedIdleWaste;
  }

  const totalIdle = Math.max(0, totalPurchased - totalAssigned);
  const overallRate = totalPurchased > 0 ? Math.round((totalAssigned / totalPurchased) * 100) : 0;

  // Sort by highest annualized idle waste
  const sortedByWaste = [...allTracked].sort(
    (a, b) => b.annualizedIdleWaste - a.annualizedIdleWaste
  );

  const topWasteful = sortedByWaste.filter((s) => s.idleSeats > 0).slice(0, 5);
  const defaultCurrency = allTracked[0]?.currency || "USD";

  return {
    totalTrackedSubscriptions: allTracked.length,
    totalSeatsPurchased: totalPurchased,
    totalSeatsAssigned: totalAssigned,
    totalIdleSeats: totalIdle,
    overallUtilizationRate: overallRate,
    totalAnnualWastedSpend: Math.round(totalAnnualWastedSpend * 100) / 100,
    currency: defaultCurrency,
    topWastefulSubscriptions: topWasteful,
    allTrackedResources: allTracked,
  };
}

/**
 * Updates seat allocation for a given resource.
 */
export async function updateResourceSeatAllocation(
  userId: string,
  workspaceId: string,
  resourceId: string,
  payload: {
    seatTrackingEnabled?: boolean;
    totalSeats?: number | null;
    assignedSeats?: number | null;
    costPerSeatMinor?: number | null;
  }
): Promise<SeatUtilizationMetrics> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  const db = getDb();

  const [existing] = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
    })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)))
    .limit(1);

  if (!existing) {
    throw new Error("Resource not found");
  }

  const [updated] = await db
    .update(resources)
    .set({
      seatTrackingEnabled: payload.seatTrackingEnabled,
      totalSeats: payload.totalSeats,
      assignedSeats: payload.assignedSeats,
      costPerSeatMinor: payload.costPerSeatMinor,
      updatedAt: new Date(),
    })
    .where(and(eq(resources.id, resourceId), eq(resources.workspaceId, workspaceId)))
    .returning();

  return calculateSeatMetrics({
    resourceId: updated.id,
    resourceName: updated.name,
    type: updated.type,
    seatTrackingEnabled: updated.seatTrackingEnabled,
    totalSeats: updated.totalSeats,
    assignedSeats: updated.assignedSeats,
    costPerSeatMinor: updated.costPerSeatMinor,
    currency: updated.currency,
    billingCycle: updated.billingCycle,
  });
}
