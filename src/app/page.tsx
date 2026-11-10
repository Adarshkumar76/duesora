import type { Metadata } from "next";
import { auth } from "@/auth";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPageContent } from "@/components/landing/landing-page-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Duesora - Know what you own. Know what's due.",
  description: "Track renewals, SaaS subscriptions, domains, and certificates in one deterministic ledger.",
};

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-teal-900/10 selection:text-teal-900 dark:selection:bg-teal-200/20 dark:selection:text-teal-200 relative">
      {/* Sticky Top Header */}
      <LandingNavbar user={user} />

      {/* Main Editorial Content & Footer */}
      <LandingPageContent user={user} />
    </div>
  );
}
