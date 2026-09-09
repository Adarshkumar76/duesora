import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { listWorkspaceResources } from "@/lib/resources/service";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FolderKanban, SearchX } from "lucide-react";
import { ResourcesToolbar } from "@/components/resources/resources-toolbar";
import { ResourcesPagination } from "@/components/resources/resources-pagination";

interface ResourcesPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
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

export default async function ResourcesPage({ searchParams }: ResourcesPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { tab = "all", search = "", status, page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);

  // 1. Fetch user's workspaces
  const userWorkspaces = await listUserWorkspaces(session.user.id);
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;

  const activeWorkspace =
    userWorkspaces.find((w) => w.id === sessionWorkspaceId) ||
    userWorkspaces[0] || {
      id: sessionWorkspaceId || "default-workspace",
      name: "Personal Workspace",
      role: "owner",
    };

  // 2. Fetch resources from database (no mock fallback!)
  let resourceData;
  try {
    resourceData = await listWorkspaceResources(session.user.id, activeWorkspace.id, {
      type: tab === "all" ? undefined : tab === "other" ? "custom" : tab,
      status: status === "all" ? undefined : status,
      search: search || undefined,
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

  function formatTypePill(type: string) {
    if (type === "domain") return "Domain";
    if (type === "subscription") return "Subscription";
    if (type === "ssl_certificate") return "Certificate";
    if (type === "hosting") return "Hosting";
    if (type === "cloud_service") return "Server";
    if (type === "software_license") return "Software";
    return "Other";
  }

  function formatAmount(item: (typeof items)[0]) {
    if (item.amountMinor === 0) return "Free";
    if (!item.amountMinor && item.amountMinor !== 0) return "—";

    const symbol =
      item.currency === "INR"
        ? "₹"
        : item.currency === "EUR"
        ? "€"
        : item.currency === "GBP"
        ? "£"
        : "$";

    const amountFormatted = (item.amountMinor / 100).toFixed(2);
    const suffix =
      item.billingCycle === "monthly"
        ? " / mo"
        : item.billingCycle === "quarterly"
        ? " / qtr"
        : item.billingCycle === "yearly"
        ? " / yr"
        : "";
    return `${symbol}${amountFormatted}${suffix}`;
  }

  function formatDate(d?: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  const isFiltered = Boolean(search || (status && status !== "all") || (tab && tab !== "all"));

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-row">
      {/* Sidebar */}
      <div className="hidden md:block shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          user={session.user}
          currentWorkspace={activeWorkspace}
          workspaces={userWorkspaces}
          onSignOut={handleSignOut}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
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
            <div className="flex items-center gap-2.5">
              <ResourcesToolbar
                resources={items}
                currentStatus={status}
              />
              <Link href="/resources/new">
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Resource</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-6 border-b border-border/60 overflow-x-auto text-sm">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              const tabParams = new URLSearchParams();
              if (t.id !== "all") tabParams.set("tab", t.id);
              if (status && status !== "all") tabParams.set("status", status);
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground">
                      <tr>
                        <th className="py-3.5 px-6">Name</th>
                        <th className="py-3.5 px-6">Type</th>
                        <th className="py-3.5 px-6">Provider</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Next Renewal</th>
                        <th className="py-3.5 px-6">Amount</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          {/* Name */}
                          <td className="py-4 px-6 font-medium text-foreground">
                            {item.name}
                          </td>

                          {/* Type Pill */}
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {formatTypePill(item.type)}
                            </span>
                          </td>

                          {/* Provider */}
                          <td className="py-4 px-6 text-foreground font-normal">
                            {item.provider || "—"}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            {item.status === "active" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                                Active
                              </span>
                            ) : item.status === "expired" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100/80 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300/40">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Next Renewal */}
                          <td className="py-4 px-6 text-muted-foreground text-xs sm:text-sm">
                            {formatDate(item.renewalDate)}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6 font-semibold text-foreground">
                            {formatAmount(item)}
                          </td>

                          {/* Actions Menu */}
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              aria-label="Actions"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
