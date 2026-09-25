import { openApiSpec } from "@/lib/api/openapi";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
