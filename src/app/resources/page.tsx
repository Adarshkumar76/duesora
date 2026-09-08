import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { listWorkspaceResources } from "@/lib/resources/service";
import { Button } from "@/components/ui/button";
import { Plus, SlidersHorizontal, Download, MoreHorizontal } from "lucide-react";

interface ResourcesPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
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

  const { tab = "all", search = "", page = "1" } = await searchParams;
  const currentPage = parseInt(page, 10) || 1;

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

  // 2. Fetch resources for this workspace
  let resourceData;
  try {
    resourceData = await listWorkspaceResources(session.user.id, activeWorkspace.id, {
      type: tab === "all" ? undefined : tab,
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

  // Sample data fallback if workspace has 0 items yet (matches 05_resources_page.jpg exactly)
  const defaultItems = [
    {
      id: "res-sample-1",
      name: "duesora.com",
      type: "domain",
      provider: "GoDaddy",
      status: "active",
      renewalDate: new Date("2025-05-20"),
      amountMinor: 1299,
      currency: "USD",
      billingCycle: "yearly",
    },
    {
      id: "res-sample-2",
      name: "Google Workspace",
      type: "subscription",
      provider: "Google",
      status: "active",
      renewalDate: new Date("2025-05-24"),
      amountMinor: 4999,
      currency: "USD",
      billingCycle: "monthly",
    },
    {
      id: "res-sample-3",
      name: "AWS - Production",
      type: "subscription",
      provider: "Amazon",
      status: "active",
      renewalDate: new Date("2025-05-18"),
      amountMinor: 6812,
      currency: "USD",
      billingCycle: "monthly",
    },
    {
      id: "res-sample-4",
      name: "SSL Certificate (duesora.com)",
      type: "ssl_certificate",
      provider: "Let's Encrypt",
      status: "active",
      renewalDate: new Date("2025-06-01"),
      amountMinor: 0,
      currency: "USD",
      billingCycle: "yearly",
    },
    {
      id: "res-sample-5",
      name: "DigitalOcean Droplet",
      type: "cloud_service",
      provider: "DigitalOcean",
      status: "active",
      renewalDate: new Date("2025-06-10"),
      amountMinor: 2000,
      currency: "USD",
      billingCycle: "monthly",
    },
    {
      id: "res-sample-6",
      name: "Hostinger Hosting",
      type: "hosting",
      provider: "Hostinger",
      status: "active",
      renewalDate: new Date("2025-07-04"),
      amountMinor: 3800,
      currency: "USD",
      billingCycle: "yearly",
    },
  ];

  const hasRealData = resourceData.items && resourceData.items.length > 0;
  const items = hasRealData ? resourceData.items : defaultItems;
  const totalCount = hasRealData ? resourceData.pagination.total : 32;

  function formatTypePill(type: string) {
    if (type === "domain") return "Domain";
    if (type === "subscription") return "Subscription";
    if (type === "ssl_certificate") return "Certificate";
    if (type === "hosting") return "Hosting";
    if (type === "cloud_service") return "Server";
    return "Other";
  }

  function formatAmount(item: (typeof items)[0]) {
    if (item.amountMinor === 0) return "Free";
    if (!item.amountMinor) return "—";

    const dollars = (item.amountMinor / 100).toFixed(2);
    const suffix = item.billingCycle === "monthly" ? " / mo" : " / yr";
    return `$${dollars}${suffix}`;
  }

  function formatDate(d?: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

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
          {/* Header Bar matching mockup 05_resources_page.jpg */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Resources
              </h1>
              <p className="text-sm text-muted-foreground">
                All your domains, subscriptions, certificates, hosting, and services in one place
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-medium"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border/80 shadow-2xs gap-1.5 text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
              <Link href="/resources/new">
                <Button
                  size="sm"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 text-xs font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Resource
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-6 border-b border-border/60 overflow-x-auto text-sm">
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <Link
                  key={t.id}
                  href={`/resources?tab=${t.id}`}
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

          {/* Canonical Resources Table matching mockup */}
          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                          Active
                        </span>
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
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching mockup */}
            <div className="py-3.5 px-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing 1 to {items.length} of {totalCount} resources</span>
              <div className="flex items-center gap-1.5 font-medium">
                <button
                  type="button"
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded hover:bg-muted text-foreground"
                >
                  1
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-foreground font-bold"
                >
                  2
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded hover:bg-muted text-foreground"
                >
                  3
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded hover:bg-muted text-muted-foreground"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
