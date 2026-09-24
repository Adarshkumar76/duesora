import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceSubscriptions } from "@/lib/subscriptions/service";
import { SubscriptionsSummary } from "@/components/subscriptions/subscriptions-summary";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

interface SubscriptionsPageProps {
  searchParams: Promise<{
    type?: string;
    cycle?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function SubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  const { type, cycle, status, search, page } = await searchParams;

  // 1. Resolve active workspace
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // 2. Query subscriptions with recurring spend normalization
  let subscriptionData: Awaited<ReturnType<typeof listWorkspaceSubscriptions>> = {
    items: [],
    metrics: {
      monthlyBurnRateMinor: 0,
      annualProjectedMinor: 0,
      totalActiveSubscriptions: 0,
      topVendor: null,
      currency: activeWorkspace.defaultCurrency || "USD",
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    },
  };

  try {
    subscriptionData = await listWorkspaceSubscriptions(
      session.user.id,
      activeWorkspace.id,
      activeWorkspace.defaultCurrency || "USD",
      {
        type: (type as "all" | "subscription" | "cloud_service" | "hosting" | "software_license") || undefined,
        billingCycle: (cycle as "all" | "monthly" | "yearly" | "quarterly" | "one_time") || undefined,
        status: (status as "all" | "active" | "inactive" | "expired") || undefined,
        search: search || undefined,
        page: page ? parseInt(page, 10) : 1,
        pageSize: 20,
      }
    );
  } catch {
    // Fallback on error
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const canEdit =
    activeWorkspace.role === "owner" ||
    activeWorkspace.role === "admin" ||
    activeWorkspace.role === "member";

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
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Subscriptions & Recurring Spend
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your SaaS tools, cloud infrastructure, licenses, and predictable recurring commitments.
              </p>
            </div>

            {/* Quick Action Button */}
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link href="/resources/new?type=subscription">
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Subscription</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Spend Summary Metrics */}
          <SubscriptionsSummary metrics={subscriptionData.metrics} />

          {/* Subscriptions Table with Search & Cadence Filters */}
          <SubscriptionsTable
            initialItems={subscriptionData.items}
            workspaceId={activeWorkspace.id}
            userRole={activeWorkspace.role}
            totalCount={subscriptionData.pagination.total}
            currentPage={subscriptionData.pagination.page}
            totalPages={subscriptionData.pagination.totalPages}
            workspaceCurrency={activeWorkspace.defaultCurrency || "USD"}
          />
        </main>
      </div>
    </div>
  );
}
