import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listWorkspaceResources } from "@/lib/resources/service";
import { listWorkspaceTags } from "@/lib/tags/service";
import { listWorkspaceTeam, type TeamMemberItem } from "@/lib/team/service";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, SearchX } from "lucide-react";
import { ResourcesToolbar } from "@/components/resources/resources-toolbar";
import { ResourcesPagination } from "@/components/resources/resources-pagination";
import { ResourcesTable } from "@/components/resources/resources-table";

interface ResourcesPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    tag?: string;
    category?: string;
    ownerId?: string;
    status?: "all" | "active" | "inactive" | "expired";
    page?: string;
  }>;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "domain", label: "Domains" },
  { id: "subscription", label: "Subscriptions" },
  { id: "ssl_certificate", label: "Certificates" },
  { id: "hosting", label: "Hosting" },
  { id: "other", label: "Other" },
];

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
};

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { tab = "all", search = "", tag, category, ownerId, status, page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  // 1. Resolve user's active workspace (via cookie or fallback)
  const sessionWorkspaceId = (session?.user as { workspaceId?: string | null } | undefined)?.workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // 2. Fetch workspace tags for filter dropdown
  let availableTags: Awaited<ReturnType<typeof listWorkspaceTags>> = [];
  try {
    availableTags = await listWorkspaceTags(session.user.id, activeWorkspace.id);
  } catch {
    availableTags = [];
  }

  // 3. Fetch workspace team members for bulk owner assignment
  let teamMembers: Array<{ id: string; name: string | null; email: string; role: string }> = [];
  try {
    const teamOverview = await listWorkspaceTeam(activeWorkspace.id, session.user.id);
    teamMembers = teamOverview.members.map((m: TeamMemberItem) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
    }));
  } catch {
    teamMembers = [];
  }

  // 3. Fetch resources from database (no mock fallback!)
  let resourceData;
  try {
    resourceData = await listWorkspaceResources(session.user.id, activeWorkspace.id, {
      type: tab === "all" ? undefined : tab === "other" ? "custom" : tab,
      status: status === "all" ? undefined : status,
      search: search || undefined,
      tag: tag || undefined,
      category: category || undefined,
      ownerId: ownerId || undefined,
      page: currentPage,
      pageSize: 10,
    });
  } catch {
    resourceData = {
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 },
    };
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  const items = resourceData.items;
  const totalCount = resourceData.pagination.total;
  const totalPages = Math.max(1, resourceData.pagination.totalPages);

  const isFiltered = Boolean(search || (status && status !== "all") || (tab && tab !== "all"));

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-row">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Resources
              </h1>
              <p className="text-sm text-muted-foreground">
                All your domains, subscriptions, certificates, hosting, and services in one place
              </p>
            </div>

            {/* Action Buttons Toolbar (Working Filters & CSV Export) */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              <ResourcesToolbar
                resources={items}
                workspaceId={activeWorkspace.id}
                currentStatus={status}
                currentTag={tag}
                currentCategory={category}
                availableTags={availableTags}
              />
              {activeWorkspace.role !== "viewer" && (
                <Link href="/resources/new">
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Resource</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-6 border-b border-border/60 overflow-x-auto text-sm">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              const tabParams = new URLSearchParams();
              if (t.id !== "all") tabParams.set("tab", t.id);
              if (status && status !== "all") tabParams.set("status", status);
              if (tag) tabParams.set("tag", tag);
              if (category) tabParams.set("category", category);
              if (search) tabParams.set("search", search);
              tabParams.set("page", "1");

              return (
                <Link
                  key={t.id}
                  href={`/resources?${tabParams.toString()}`}
                  className={`pb-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
                    isActive
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {/* Resources Table or Empty State Card */}
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            {items.length > 0 ? (
              <>
                <ResourcesTable
                  items={items}
                  workspaceId={activeWorkspace.id}
                  userRole={activeWorkspace.role}
                  availableTags={availableTags}
                  teamMembers={teamMembers}
                />

                {/* Pagination Footer */}
                <ResourcesPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={10}
                  tab={tab}
                  status={status}
                  search={search}
                />
              </>
            ) : (
              /* High-fidelity Empty State */
              <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  {isFiltered ? (
                    <SearchX className="w-7 h-7" />
                  ) : (
                    <FolderKanban className="w-7 h-7" />
                  )}
                </div>

                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-base font-bold text-foreground">
                    {isFiltered ? "No matching resources" : "No resources added yet"}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isFiltered
                      ? "No resources matched your current search filters. Try clearing your filters or search keyword to view all resources."
                      : "Start tracking your domains, subscriptions, SSL certificates, hosting, and cloud infrastructure renewals in one place."}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  {isFiltered ? (
                    <Link href="/resources">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-border/80 text-xs font-semibold cursor-pointer"
                      >
                        Clear All Filters
                      </Button>
                    </Link>
                  ) : null}

                  <Link href="/resources/new">
                    <Button
                      size="sm"
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Resource</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
