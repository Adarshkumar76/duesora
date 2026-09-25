import { auth } from "@/auth";
import { runSecurityAudit } from "@/cli/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const report = runSecurityAudit();

  return Response.json(report, {
    status: report.overallStatus === "insecure" ? 503 : 200,
  });
}
