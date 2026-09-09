import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { resources, workspaces } from "@/db/schema";
import { requireWorkspaceRole } from "@/lib/auth/workspace";

export interface DashboardData {
  workspace: {
    id: string;
    name: string;
    currency: string;
  };
  kpis: {
    totalResources: number;
    renewalsDue: number;
    totalSpend: number;
    expiringSoon: number;
  };
  renewalsOverview: Array<{
    month: string;
    actual: number;
    projected: number;
  }>;
  topCategories: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  recentActivity: Array<{
    id: string;
    name: string;
    category: string;
    renewalDate: string;
    amount: number;
    currency: string;
    status: "active" | "expiring" | "inactive";
  }>;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function getWorkspaceDashboardData(
  userId: string,
  workspaceId: string
): Promise<DashboardData> {
  // Enforce tenant authorization: caller must have at least viewer role
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const db = getDb();

  // 1. Get workspace metadata
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      defaultCurrency: workspaces.defaultCurrency,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  const workspaceInfo = {
    id: workspaceId,
    name: workspace?.name ?? "Workspace",
    currency: workspace?.defaultCurrency ?? "USD",
  };

  // 2. Fetch all workspace resources
  const workspaceResources = await db
    .select()
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId))
    .orderBy(desc(resources.createdAt))
    .limit(100);

  const totalResources = workspaceResources.length;

  if (totalResources === 0) {
    return {
      workspace: workspaceInfo,
      kpis: {
        totalResources: 0,
        renewalsDue: 0,
        totalSpend: 0,
        expiringSoon: 0,
      },
      renewalsOverview: MONTH_NAMES.map((month) => ({
        month,
        actual: 0,
        projected: 0,
      })),
      topCategories: [],
      recentActivity: [],
    };
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  const currentMonthIdx = now.getMonth();

  let renewalsDue = 0;
  let expiringSoon = 0;
  let totalSpendMinor = 0;

  // Monthly buckets for renewals overview
  const monthlyActualMinor: number[] = new Array(12).fill(0);
  const monthlyProjectedMinor: number[] = new Array(12).fill(0);

  // Category counts
  const categoryCounts: Record<string, number> = {
    Domains: 0,
    Subscriptions: 0,
    Hosting: 0,
    "SSL & Security": 0,
    Other: 0,
  };

  for (const r of workspaceResources) {
    // Tally spend
    const amountMinor = r.amountMinor ?? 0;
    totalSpendMinor += amountMinor;

    // Tally categories
    if (r.type === "domain") {
      categoryCounts["Domains"]++;
    } else if (r.type === "subscription" || r.type === "software_license") {
      categoryCounts["Subscriptions"]++;
    } else if (r.type === "hosting" || r.type === "cloud_service") {
      categoryCounts["Hosting"]++;
    } else if (r.type === "ssl_certificate") {
      categoryCounts["SSL & Security"]++;
    } else {
      categoryCounts["Other"]++;
    }

    // Renewal date calculations
    if (r.renewalDate) {
      const renewalDate = new Date(r.renewalDate);
      const renewalMonth = renewalDate.getMonth();

      // Check if renewal is due within this year or upcoming
      if (renewalDate >= now) {
        renewalsDue++;
      }

      // Check if expiring within 30 days
      if (renewalDate >= now && renewalDate <= thirtyDaysFromNow) {
        expiringSoon++;
      }

      // Distribute to monthly graph
      if (renewalMonth <= currentMonthIdx) {
        monthlyActualMinor[renewalMonth] += amountMinor;
      } else {
        monthlyProjectedMinor[renewalMonth] += amountMinor;
      }
    }
  }

  const categoryColors: Record<string, string> = {
    Domains: "#10B981",
    Subscriptions: "#34D399",
    Hosting: "#64748B",
    "SSL & Security": "#94A3B8",
    Other: "#CBD5E1",
  };

  const topCategories = Object.entries(categoryCounts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalResources) * 100) || 0,
      color: categoryColors[name] || "#10B981",
    }));

  // Map recent activity from the most recently updated or created resources
  const recentActivity = workspaceResources.slice(0, 5).map((r) => {
    let category = "Domain";
    if (r.type === "subscription") category = "Subscription";
    else if (r.type === "ssl_certificate") category = "SSL Certificate";
    else if (r.type === "hosting" || r.type === "cloud_service") category = "Hosting";
    else if (r.type === "software_license") category = "Software";
    else if (r.type === "custom") category = "Other";

    let status: "active" | "expiring" | "inactive" = "active";
    let renewalDateStr = "—";

    if (r.renewalDate) {
      const d = new Date(r.renewalDate);
      renewalDateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (d < now) {
        status = "inactive";
      } else if (d <= thirtyDaysFromNow) {
        status = "expiring";
      }
    }

    return {
      id: r.id,
      name: r.name,
      category,
      renewalDate: renewalDateStr,
      amount: (r.amountMinor ?? 0) / 100,
      currency: r.currency || "USD",
      status,
    };
  });

  const renewalsOverview = MONTH_NAMES.map((month, idx) => ({
    month,
    actual: Math.round(monthlyActualMinor[idx] / 100),
    projected: Math.round(monthlyProjectedMinor[idx] / 100),
  }));

  const totalSpend = totalSpendMinor / 100;

  return {
    workspace: workspaceInfo,
    kpis: {
      totalResources,
      renewalsDue,
      totalSpend,
      expiringSoon,
    },
    renewalsOverview,
    topCategories,
    recentActivity,
  };
}
