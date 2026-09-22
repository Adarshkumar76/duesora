import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { listUserNotifications } from "@/lib/notifications/repository";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
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

  // 2. Fetch initial notifications
  let notificationData;
  try {
    notificationData = await listUserNotifications(session.user.id, activeWorkspace.id, {
      pageSize: 50,
    });
  } catch {
    notificationData = { items: [], total: 0, unreadCount: 0 };
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <NotificationsView
            initialNotifications={notificationData.items}
            initialTotal={notificationData.total}
            initialUnreadCount={notificationData.unreadCount}
            workspaceId={activeWorkspace.id}
            userRole={activeWorkspace.role}
          />
        </main>
      </div>
    </div>
  );
}
