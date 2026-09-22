import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { ResourceForm } from "./resource-form";

export default async function NewResourcePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 1. Resolve user's active workspace (via cookie or fallback)
  const sessionWorkspaceId = (session.user as { workspaceId?: string | null }).workspaceId;
  const { activeWorkspace, userWorkspaces } = await resolveActiveWorkspace(
    session.user.id,
    sessionWorkspaceId
  );

  // Viewers cannot create resources
  if (activeWorkspace.role === "viewer") {
    redirect("/resources");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header Bar matching mockup 06_add_resource_page.jpg */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Add Resource
            </h1>
            <p className="text-sm text-muted-foreground">
              Track a new domain, subscription, certificate, hosting, or other recurring asset for{" "}
              <span className="font-semibold text-foreground">{activeWorkspace.name}</span>
            </p>
          </div>

          {/* Clean Form Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs">
            <ResourceForm workspaceId={activeWorkspace.id} />
          </div>
        </main>
      </div>
    </div>
  );
}
