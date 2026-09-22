import { auth } from "@/auth";
import { getInvitationByToken } from "@/lib/team/service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteAcceptCard } from "./invite-accept-card";
import { Users, AlertCircle, Shield, Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();
  const inviteResult = await getInvitationByToken(token);

  if (!inviteResult.valid || !inviteResult.invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <Card className="max-w-md w-full rounded-2xl border border-border/80 shadow-lg text-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-bold text-foreground">
              Invitation Invalid or Expired
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {inviteResult.reason || "This invitation link is no longer active."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Duesora Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invitation } = inviteResult;
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground selection:bg-emerald-500/20">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Due<span className="text-emerald-500">sora</span>
          </span>
          <p className="text-xs text-muted-foreground">Modern IT Asset & Renewal Management</p>
        </div>

        {/* Invitation Card */}
        <Card className="rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border/40">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">
              You&apos;ve Been Invited!
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              <strong>{invitation.inviterName}</strong> invited you to collaborate in:
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* Workspace Info Box */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-foreground">{invitation.workspace.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span>
                  Role: <strong className="uppercase text-foreground">{invitation.role}</strong>
                </span>
              </div>
            </div>

            {/* Accept or Sign In Actions */}
            <InviteAcceptCard
              token={token}
              isLoggedIn={isLoggedIn}
              workspaceName={invitation.workspace.name}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
