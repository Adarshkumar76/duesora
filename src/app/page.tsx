import { auth } from "@/auth";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPageContent } from "@/components/landing/landing-page-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-700 relative overflow-x-hidden">
      {/* Subtle Background Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-teal-500/10 dark:bg-teal-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Sticky Glass Navbar */}
      <LandingNavbar user={user} />

      {/* Dynamic Translated Landing Content & Footer */}
      <LandingPageContent user={user} />
    </div>
  );
}