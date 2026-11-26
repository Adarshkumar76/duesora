import { auth } from "@/auth";
import { getInvitationByToken } from "@/lib/team/service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteAcceptCard } from "./invite-accept-card";
import { Users, AlertCircle, Shield, Building2 } from "lucide-react";
import { Logo } from "@/components/logo";
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
        <Card className="max-w-md w-full rounded-[8px] border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-center p-6 space-y-4">
          <div className="w-10 h-10 rounded-[6px] bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <CardHeader className="p-0">
            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
              Invitation Invalid or Expired
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {inviteResult.reason || "This invitation link is no longer active."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <Link
              href="/"
              className="inline-block px-3.5 py-2 rounded-[6px] text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            >
              Back to Home
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invitation } = inviteResult;
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground selection:bg-teal-900/10 selection:text-teal-900 dark:selection:bg-teal-200/20 dark:selection:text-teal-200">
      <div className="max-w-md w-full space-y-4">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <Logo size={28} color="#0F766E" />
              <span className="text-base font-bold tracking-tight text-foreground">Duesora</span>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Renewal, Expiry &amp; Ownership Management</p>
        </div>

        {/* Invitation Card */}
        <Card className="rounded-[8px] border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <CardHeader className="text-center pb-4 border-b border-border/60">
            <div className="w-10 h-10 rounded-[6px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="text-base sm:text-lg font-serif font-normal text-foreground">
              Workspace Invitation
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              <strong>{invitation.inviterName}</strong> invited you to collaborate in:
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Workspace Info Box */}
            <div className="p-3.5 rounded-[6px] bg-muted/30 border border-border space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-foreground">{invitation.workspace.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>
                  Role: <strong className="uppercase font-mono text-foreground text-[11px]">{invitation.role}</strong>
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
