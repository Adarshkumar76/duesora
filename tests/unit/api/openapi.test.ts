import { describe, it, expect } from "vitest";
import { openApiSpec } from "@/lib/api/openapi";

describe("OpenAPI 3.1 Specification", () => {
  it("conforms to OpenAPI 3.1 root properties", () => {
    expect(openApiSpec.openapi).toBe("3.1.0");
    expect(openApiSpec.info.title).toContain("Duesora");
    expect(openApiSpec.info.version).toBe("1.0.0");
    expect(openApiSpec.paths).toBeDefined();
  });

  it("defines standard /api/v1 endpoints with security schemes", () => {
    expect(openApiSpec.paths["/api/v1/resources"]).toBeDefined();
    expect(openApiSpec.paths["/api/v1/resources"].get).toBeDefined();
    expect(openApiSpec.paths["/api/v1/resources"].post).toBeDefined();

    expect(openApiSpec.paths["/api/v1/resources/{id}"]).toBeDefined();
    expect(openApiSpec.paths["/api/v1/resources/{id}"].patch).toBeDefined();
    expect(openApiSpec.paths["/api/v1/resources/{id}"].delete).toBeDefined();

    expect(openApiSpec.paths["/api/v1/renewals"]).toBeDefined();
    expect(openApiSpec.components.securitySchemes.ApiKeyAuth).toBeDefined();
  });
});
