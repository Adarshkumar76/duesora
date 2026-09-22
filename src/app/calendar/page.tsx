import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { resolveActiveWorkspace } from "@/lib/auth/active-workspace";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateCalendarToken } from "@/lib/calendar/token";
import { CalendarView, type CalendarEventItem } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
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

  // 2. Fetch resources with renewal dates
  const db = getDb();
  const rawResources = await db
    .select({
      id: resources.id,
      name: resources.name,
      type: resources.type,
      provider: resources.provider,
      category: resources.category,
      amountMinor: resources.amountMinor,
      currency: resources.currency,
      billingCycle: resources.billingCycle,
      renewalDate: resources.renewalDate,
      autoRenew: resources.autoRenew,
    })
    .from(resources)
    .where(eq(resources.workspaceId, activeWorkspace.id))
    .orderBy(desc(resources.renewalDate));

  const items: CalendarEventItem[] = rawResources
    .filter((r) => r.renewalDate !== null)
    .map((r) => ({
      ...r,
      renewalDate: new Date(r.renewalDate!).toISOString(),
    }));

  const calendarToken = generateCalendarToken(activeWorkspace.id);
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Renewal Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visualize upcoming subscription and domain renewal deadlines, or subscribe directly to your calendar.
            </p>
          </div>

          <CalendarView
            initialResources={items}
            workspaceId={activeWorkspace.id}
            workspaceName={activeWorkspace.name}
            calendarToken={calendarToken}
            appUrl={appUrl}
          />
        </main>
      </div>
    </div>
  );
}
