import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { getWorkspaceSpendReport } from "@/lib/reports/service";
import { getWorkspaceBudgetStatus } from "@/lib/budgets/service";
import { listWorkspacePriceChanges } from "@/lib/resources/cost-history";
import { ReportSummaryCards } from "@/components/reports/report-summary-cards";
import { BudgetProgressCard } from "@/components/dashboard/budget-progress-card";
import { SpendBreakdowns } from "@/components/reports/spend-breakdowns";
import { TopExpensesTable } from "@/components/reports/top-expenses-table";
import { RecentPriceChangesCard } from "@/components/reports/recent-price-changes-card";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { CashflowChart } from "@/components/reports/cashflow-chart";
import { CategoryDonut } from "@/components/reports/category-donut";
import { FileText } from "lucide-react";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  // 1. Resolve active workspace
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // 2. Fetch spend report and cost breakdown
  let reportData: Awaited<ReturnType<typeof getWorkspaceSpendReport>> = {
    totalAnnualRunRateMinor: 0,
    totalMonthlyRunRateMinor: 0,
    averageAssetCostMinor: 0,
    totalResources: 0,
    payingResources: 0,
    currency: activeWorkspace.defaultCurrency || "USD",
    categories: [],
    cadences: [],
    currencies: [],
    topCostDrivers: [],
    monthlyForecast: [],
  };

  try {
    reportData = await getWorkspaceSpendReport(
      session.user.id,
      activeWorkspace.id,
      activeWorkspace.defaultCurrency || "USD"
    );
  } catch {
    // Fallback on error
  }

  // 3. Fetch workspace budget status
  let budgetStatus = null;
  try {
    budgetStatus = await getWorkspaceBudgetStatus(session.user.id, activeWorkspace.id);
  } catch {
    // Fallback on error
  }

  // 4. Fetch recent workspace price changes
  let recentPriceChanges: Awaited<ReturnType<typeof listWorkspacePriceChanges>> = [];
  try {
    recentPriceChanges = await listWorkspacePriceChanges(session.user.id, activeWorkspace.id, { limit: 10 });
  } catch {
    // Fallback on error
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-emerald-500/20">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          user={session.user}
          currentWorkspace={activeWorkspace}
          workspaces={userWorkspaces}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Spend Reports & Cost Analytics
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive cost analysis, category distributions, cadence allocation, and exportable financial summaries.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <PrintReportButton />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <ReportSummaryCards summary={reportData} />

          {/* 12-Month Renewal Cashflow Forecast Chart */}
          <CashflowChart
            forecast={reportData.monthlyForecast}
            currency={reportData.currency}
          />

          {/* Budget Velocity & Spend Alerts */}
          {budgetStatus && (
            <BudgetProgressCard
              status={budgetStatus}
              workspaceId={activeWorkspace.id}
            />
          )}

          {/* Category Distribution Donut / Progress */}
          <CategoryDonut
            categories={reportData.categories}
            currency={reportData.currency}
          />

          {/* Distribution & Breakdown Cards */}
          <SpendBreakdowns summary={reportData} />

          {/* Top 10 Cost Drivers & Export Buttons */}
          <TopExpensesTable
            topCostDrivers={reportData.topCostDrivers}
            workspaceId={activeWorkspace.id}
            workspaceCurrency={reportData.currency}
          />

          {/* Creeping SaaS Costs & Workspace Price Shifts */}
          <RecentPriceChangesCard changes={recentPriceChanges} />
        </main>
      </div>
    </div>
  );
}
