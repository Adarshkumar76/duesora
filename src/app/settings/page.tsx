import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { type WorkspaceRole } from "@/lib/auth/permissions";
import { listWorkspaceTeam } from "@/lib/team/service";
import { listWebhookEndpoints } from "@/lib/webhooks/repository";
import { isEmailConfigured } from "@/lib/notifications/email";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { WebhooksManager } from "@/components/settings/webhooks-manager";
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form";
import { TeamManagement } from "@/components/settings/team-management";
import { ChatIntegrations } from "@/components/settings/chat-integrations";
import { listNotificationChannels } from "@/lib/integrations/chat/repository";
import { Building2, Mail, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  // 2. Fetch team members & invitations
  let teamData: Awaited<ReturnType<typeof listWorkspaceTeam>> = {
    members: [],
    invitations: [],
    currentUserRole: (activeWorkspace.role as WorkspaceRole) || "viewer",
  };
  try {
    teamData = await listWorkspaceTeam(activeWorkspace.id, session.user.id);
  } catch {
    // fallback
  }

  // 3. Fetch webhooks for active workspace
  let endpoints: Awaited<ReturnType<typeof listWebhookEndpoints>> = [];
  try {
    endpoints = await listWebhookEndpoints(activeWorkspace.id);
  } catch {
    endpoints = [];
  }

  // 4. Fetch Slack & Discord channels
  let chatChannels: Awaited<ReturnType<typeof listNotificationChannels>> = [];
  try {
    chatChannels = await listNotificationChannels(activeWorkspace.id);
  } catch {
    chatChannels = [];
  }

  const emailReady = isEmailConfigured();

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Workspace Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage outbound integrations, notification channels, and workspace configuration.
            </p>
          </div>

          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-4.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active Workspace</span>
              </div>
              <p className="text-base font-bold text-foreground truncate">{activeWorkspace.name}</p>
              <span className="inline-block text-[11px] font-mono text-muted-foreground truncate max-w-full">
                ID: {activeWorkspace.id}
              </span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Your Role</span>
              </div>
              <p className="text-base font-bold capitalize text-foreground">{activeWorkspace.role}</p>
              <span className="text-[11px] text-muted-foreground">
                {activeWorkspace.role === "owner" || activeWorkspace.role === "admin"
                  ? "Full administrative permissions"
                  : activeWorkspace.role === "member"
                  ? "Standard workspace member"
                  : "Read-only workspace viewer"}
              </span>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>SMTP Email Delivery</span>
              </div>
              <p className="text-base font-bold text-foreground">
                {emailReady ? "Configured" : "Simulation Mode"}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {emailReady
                  ? "Delivering live via SMTP server"
                  : "Simulated in logs (SMTP_* env vars unset)"}
              </span>
            </div>
          </div>

          {/* Workspace General & Profile Settings */}
          <WorkspaceSettingsForm
            workspace={activeWorkspace}
            user={{
              name: session.user.name,
              email: session.user.email,
            }}
          />

          {/* Team & Member Access Management */}
          <TeamManagement
            workspaceId={activeWorkspace.id}
            initialMembers={teamData.members}
            initialInvitations={teamData.invitations}
            currentUserRole={teamData.currentUserRole}
          />

          {/* Slack & Discord Alert Webhooks */}
          <div className="pt-2">
            <ChatIntegrations
              workspaceId={activeWorkspace.id}
              initialChannels={chatChannels}
              currentUserRole={activeWorkspace.role}
            />
          </div>

          {/* Custom Webhooks Section */}
          <div className="pt-2">
            <WebhooksManager
              initialEndpoints={endpoints}
              workspaceId={activeWorkspace.id}
              userRole={activeWorkspace.role}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
