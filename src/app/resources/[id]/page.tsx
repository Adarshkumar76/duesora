import { auth, signOut } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { listUserWorkspaces } from "@/lib/auth/workspace";
import { getWorkspaceResource } from "@/lib/resources/service";
import { ResourceDetailsActions } from "@/components/resources/resource-details-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Globe,
  RefreshCw,
  Shield,
  Server,
  Code,
  FileText,
  Clock,
  ArrowLeft,
} from "lucide-react";

interface ResourceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourceDetailsPage({
  params,
}: ResourceDetailsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id: resourceId } = await params;

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

  // 2. Fetch the resource
  type ResourceEntity = NonNullable<Awaited<ReturnType<typeof getWorkspaceResource>>>;
  let resource: ResourceEntity | null = null;
  try {
    resource = await getWorkspaceResource(
      session.user.id,
      activeWorkspace.id,
      resourceId
    );
  } catch {
    notFound();
  }

  if (!resource) {
    notFound();
  }
  const r = resource;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  // Formatting helpers
  const currencySymbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  const currencySymbol = currencySymbols[r.currency] || "$";

  function formatAmount() {
    if (r.amountMinor === 0) return "Free";
    if (r.amountMinor === null || r.amountMinor === undefined) return "—";

    const dollars = (r.amountMinor / 100).toFixed(2);
    const suffix =
      r.billingCycle === "monthly"
        ? " / mo"
        : r.billingCycle === "quarterly"
        ? " / qtr"
        : r.billingCycle === "yearly"
        ? " / yr"
        : "";
    return `${currencySymbol}${dollars}${suffix}`;
  }

  function formatDate(d?: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function formatTypePill(type: string) {
    if (type === "domain") return "Domain";
    if (type === "subscription") return "Subscription";
    if (type === "ssl_certificate") return "Certificate";
    if (type === "hosting") return "Hosting";
    if (type === "cloud_service") return "Cloud Service";
    if (type === "software_license") return "Software License";
    return "Other";
  }

  function getTypeIcon(type: string) {
    if (type === "domain") return <Globe className="w-5 h-5 text-emerald-600" />;
    if (type === "subscription") return <RefreshCw className="w-5 h-5 text-emerald-600" />;
    if (type === "ssl_certificate") return <Shield className="w-5 h-5 text-emerald-600" />;
    if (type === "hosting" || type === "cloud_service") return <Server className="w-5 h-5 text-emerald-600" />;
    if (type === "software_license") return <Code className="w-5 h-5 text-emerald-600" />;
    return <FileText className="w-5 h-5 text-emerald-600" />;
  }

  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(now.getDate() + 30);
  const isExpiringSoon =
    resource.renewalDate &&
    new Date(resource.renewalDate) >= now &&
    new Date(resource.renewalDate) <= thirtyDaysLater;

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
          {/* Breadcrumb matching mockup 07_resource_details_page.jpg */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Link
              href="/resources"
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Resources</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-xs">
              {resource.name}
            </span>
          </div>

          {/* Page Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Resource Details
              </h1>
            </div>

            {/* Edit & Delete Action Buttons */}
            <ResourceDetailsActions
              resource={resource}
              workspaceId={activeWorkspace.id}
            />
          </div>

          {/* Hero Resource Summary Card matching mockup 07_resource_details_page.jpg */}
          <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            {/* Header: Icon, Name & Status */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                  {getTypeIcon(resource.type)}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    {resource.name}
                  </h2>
                  {resource.status === "active" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                      Active
                    </span>
                  ) : resource.status === "expired" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100/80 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300/40">
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40">
                      Inactive
                    </span>
                  )}
                  {isExpiringSoon && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Within 30 Days
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 4-Column Metrics Band matching mockup */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60 bg-muted/20">
              <div className="p-4 sm:p-5 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Type</p>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {formatTypePill(resource.type)}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Provider</p>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {resource.provider || "—"}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Next Renewal</p>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {formatDate(resource.renewalDate)}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Amount</p>
                <p className="text-sm sm:text-base font-bold text-foreground">
                  {formatAmount()}
                </p>
              </div>
            </div>
          </Card>

          {/* Two-Column Grid Layout matching mockup 07_resource_details_page.jpg */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: General Information */}
              <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground">
                    General Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/50 text-sm">
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {resource.type === "domain" ? "Domain Name" : "Resource Name"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {resource.name}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {resource.type === "domain" ? "Registrar" : "Provider"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {resource.provider || "—"}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {resource.type === "domain" ? "Nameservers / DNS" : "Website / Service URL"}
                    </span>
                    {resource.websiteUrl ? (
                      <a
                        href={
                          resource.websiteUrl.startsWith("http")
                            ? resource.websiteUrl
                            : `https://${resource.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline truncate max-w-xs"
                      >
                        {resource.websiteUrl}
                      </a>
                    ) : (
                      <span className="font-semibold text-muted-foreground">—</span>
                    )}
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Auto-renew</span>
                    <span className="font-semibold text-foreground">
                      {resource.autoRenew ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Notes / Description */}
              <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground">
                    Notes / Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">
                    {resource.description ||
                      "No internal notes or description provided for this resource."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (Span 5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card 3: Renewal Information */}
              <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground">
                    Renewal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/50 text-sm">
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Renewal cycle</span>
                    <span className="font-semibold text-foreground capitalize">
                      {resource.billingCycle === "yearly" ? "Annual" : resource.billingCycle}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="font-semibold text-foreground">
                      Default Payment Method
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Next charge</span>
                    <span className="font-semibold text-foreground">
                      {formatAmount()} on {formatDate(resource.renewalDate)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Recent Activity Timeline matching mockup */}
              <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
                    {/* Event 1 */}
                    <div className="relative space-y-0.5">
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-card" />
                      <p className="text-xs font-semibold text-foreground">
                        Auto renew {resource.autoRenew ? "enabled" : "disabled"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Configuration verified
                      </p>
                    </div>

                    {/* Event 2 */}
                    <div className="relative space-y-0.5">
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-card" />
                      <p className="text-xs font-semibold text-foreground">
                        Renewal reminder scheduled
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Next notification set for 30 days before {formatDate(resource.renewalDate)}
                      </p>
                    </div>

                    {/* Event 3 */}
                    <div className="relative space-y-0.5">
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-card" />
                      <p className="text-xs font-semibold text-foreground">
                        Last updated by {session.user.name || "Workspace Member"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(resource.updatedAt || resource.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
