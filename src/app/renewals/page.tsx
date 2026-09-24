import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceRenewals } from "@/lib/renewals/service";
import { RenewalsMetrics } from "@/components/renewals/renewals-metrics";
import { RenewalsPipeline } from "@/components/renewals/renewals-pipeline";
import { RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

interface RenewalsPageProps {
  searchParams: Promise<{
    bucket?: string;
    search?: string;
    type?: string;
    decision?: string;
  }>;
}

export default async function RenewalsPage({ searchParams }: RenewalsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  const { bucket, search, type, decision } = await searchParams;

  // 1. Resolve active workspace
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // 2. Fetch renewals pipeline and cash-flow forecast
  let renewalsData: Awaited<ReturnType<typeof listWorkspaceRenewals>> = {
    items: [],
    metrics: {
      overdueCount: 0,
      overdueCostMinor: 0,
      next7DaysCount: 0,
      next7DaysCostMinor: 0,
      next30DaysCount: 0,
      next30DaysCostMinor: 0,
      next90DaysCount: 0,
      next90DaysCostMinor: 0,
      currency: activeWorkspace.defaultCurrency || "USD",
      needsReviewCount: 0,
      approvedCount: 0,
      cancelCount: 0,
      projectedSavingsMinor: 0,
      negotiateCount: 0,
    },
  };

  try {
    renewalsData = await listWorkspaceRenewals(
      session.user.id,
      activeWorkspace.id,
      activeWorkspace.defaultCurrency || "USD",
      {
        bucket: (bucket as "all" | "overdue" | "critical" | "upcoming" | "medium" | "later") || undefined,
        search: search || undefined,
        type: type || undefined,
        decision: (decision as "all" | "none" | "needs_review" | "approved" | "cancel" | "negotiate") || undefined,
      }
    );
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
                <RefreshCw className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Renewals & Expiry Pipeline
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Action-oriented renewal queue, urgency horizons, and cash-flow projections across all your assets.
              </p>
            </div>
          </div>

          {/* Cash-Flow Forecast Metrics */}
          <RenewalsMetrics metrics={renewalsData.metrics} />

          {/* Renewals Urgency Horizon Pipeline */}
          <RenewalsPipeline
            initialItems={renewalsData.items}
            workspaceId={activeWorkspace.id}
            userRole={activeWorkspace.role}
            workspaceCurrency={activeWorkspace.defaultCurrency || "USD"}
          />
        </main>
      </div>
    </div>
  );
}
