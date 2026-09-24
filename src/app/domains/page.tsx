import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceDomains } from "@/lib/domains/service";
import { DomainsMetrics } from "@/components/domains/domains-metrics";
import { DomainsTable } from "@/components/domains/domains-table";
import { Button } from "@/components/ui/button";
import { Plus, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

interface DomainsPageProps {
  searchParams: Promise<{
    type?: string;
    health?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function DomainsPage({ searchParams }: DomainsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
    return null;
  }

  const { type, health, status, search, page } = await searchParams;

  // 1. Resolve user's active workspace
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // 2. Fetch domain assets and monitor telemetry
  let domainData: Awaited<ReturnType<typeof listWorkspaceDomains>> = {
    items: [],
    metrics: {
      totalDomains: 0,
      totalCertificates: 0,
      healthyMonitors: 0,
      expiringSoon: 0,
      failingMonitors: 0,
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    },
  };

  try {
    domainData = await listWorkspaceDomains(session.user.id, activeWorkspace.id, {
      type: (type as "all" | "domain" | "ssl_certificate") || undefined,
      health: (health as "all" | "healthy" | "warning" | "critical" | "error" | "unmonitored") || undefined,
      status: (status as "all" | "active" | "inactive" | "expired") || undefined,
      search: search || undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: 20,
    });
  } catch {
    // Fallback if query fails
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
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Domains & SSL Monitoring
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Track domain expirations, nameservers, and monitor SSL/TLS certificate validity with automated background checks.
              </p>
            </div>

            {/* Quick Action Button */}
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link href="/resources/new?type=domain">
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Domain</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Metrics Summary Cards */}
          <DomainsMetrics metrics={domainData.metrics} />

          {/* Interactive Domains Table with Filters & Live Probes */}
          <DomainsTable
            initialItems={domainData.items}
            workspaceId={activeWorkspace.id}
            userRole={activeWorkspace.role}
            totalCount={domainData.pagination.total}
            currentPage={domainData.pagination.page}
            totalPages={domainData.pagination.totalPages}
          />
        </main>
      </div>
    </div>
  );
}
