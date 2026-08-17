import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-10 text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Duesora logo"
              width={110}
              height={110}
              priority
            />
          </div>

          <Badge variant="secondary" className="mb-4">
            Open Source
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Duesora
          </h1>

          <p className="text-lg text-muted-foreground mb-2">
            Know what you own. Know what&apos;s due.
          </p>

          <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8">
            Track renewals, expirations, recurring costs, ownership, domains,
            SSL certificates, SaaS subscriptions, licenses and other important
            resources in one place.
          </p>

          <div className="flex justify-center gap-3">
            <Button>Get Started</Button>
            <Button variant="outline">View Documentation</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}