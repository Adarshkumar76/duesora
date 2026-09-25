export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Duesora Public REST API",
    version: "1.0.0",
    description:
      "Operational inventory API for subscriptions, domains, and renewals. Authenticated via workspace developer keys (`due_live_...`).",
    contact: {
      name: "Duesora Core Team",
      url: "https://github.com/Adarshkumar76/duesora",
    },
    license: {
      name: "MIT",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Duesora Instance",
    },
  ],
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "due_live_*",
        description: "Workspace developer API token with format `due_live_<hex>`.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "UNAUTHORIZED" },
              message: { type: "string", example: "Invalid or revoked API key" },
            },
          },
        },
      },
      Resource: {
        type: "object",
        required: ["id", "workspaceId", "name", "type", "status", "currency", "billingCycle"],
        properties: {
          id: { type: "string", example: "res_abc123" },
          workspaceId: { type: "string", example: "ws_default" },
          name: { type: "string", example: "GitHub Enterprise" },
          type: {
            type: "string",
            enum: [
              "domain",
              "ssl_certificate",
              "subscription",
              "hosting",
              "cloud_service",
              "software_license",
              "contract",
              "warranty",
              "document",
              "custom",
            ],
            example: "subscription",
          },
          status: { type: "string", enum: ["active", "inactive", "expired", "archived"], example: "active" },
          category: { type: "string", nullable: true, example: "Developer Tools" },
          provider: { type: "string", nullable: true, example: "GitHub, Inc." },
          websiteUrl: { type: "string", nullable: true, example: "https://github.com" },
          amountMinor: { type: "integer", nullable: true, example: 4200, description: "Amount in minor currency units (cents)" },
          currency: { type: "string", example: "USD" },
          billingCycle: { type: "string", enum: ["monthly", "yearly", "quarterly", "one_time", "lifetime"], example: "monthly" },
          renewalDate: { type: "string", format: "date-time", nullable: true, example: "2026-10-15T00:00:00.000Z" },
          autoRenew: { type: "boolean", example: true },
          totalSeats: { type: "integer", nullable: true, example: 10 },
          assignedSeats: { type: "integer", nullable: true, example: 8 },
          tags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                color: { type: "string" },
              },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateResourceInput: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Datadog APM" },
          type: {
            type: "string",
            enum: [
              "domain",
              "ssl_certificate",
              "subscription",
              "hosting",
              "cloud_service",
              "software_license",
              "contract",
              "warranty",
              "document",
              "custom",
            ],
            default: "subscription",
          },
          category: { type: "string", example: "Observability" },
          provider: { type: "string", example: "Datadog" },
          websiteUrl: { type: "string", example: "https://app.datadoghq.com" },
          amountMinor: { type: "integer", example: 15000, description: "Amount in cents (e.g. 15000 = $150.00)" },
          currency: { type: "string", default: "USD", example: "USD" },
          billingCycle: { type: "string", enum: ["monthly", "yearly", "quarterly", "one_time", "lifetime"], default: "monthly" },
          renewalDate: { type: "string", format: "date", example: "2026-11-01" },
          autoRenew: { type: "boolean", default: true },
          tags: { type: "array", items: { type: "string" }, example: ["production", "devops"] },
        },
      },
      UpdateResourceInput: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          provider: { type: "string" },
          websiteUrl: { type: "string" },
          amountMinor: { type: "integer" },
          currency: { type: "string" },
          billingCycle: { type: "string", enum: ["monthly", "yearly", "quarterly", "one_time", "lifetime"] },
          renewalDate: { type: "string", format: "date" },
          autoRenew: { type: "boolean" },
          status: { type: "string", enum: ["active", "inactive", "expired", "archived"] },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  paths: {
    "/api/v1/resources": {
      get: {
        summary: "List Resources",
        description: "Returns a paginated list of resources within the workspace associated with your API key.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
          { name: "type", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive", "expired"] } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Resource" } },
                    meta: {
                      type: "object",
                      properties: {
                        totalCount: { type: "integer" },
                        page: { type: "integer" },
                        pageSize: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        summary: "Create Resource",
        description: "Creates a new subscription, domain, or license. Requires `write` or `admin` API key permissions.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateResourceInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Resource created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Resource" },
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden - Insufficient permissions" },
        },
      },
    },
    "/api/v1/resources/{id}": {
      get: {
        summary: "Get Resource by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Resource retrieved",
            content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Resource" } } } } },
          },
          "404": { description: "Resource not found" },
        },
      },
      patch: {
        summary: "Update Resource",
        description: "Updates an existing resource. Requires `write` permissions.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateResourceInput" } } },
        },
        responses: {
          "200": {
            description: "Resource updated successfully",
            content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Resource" } } } } },
          },
          "404": { description: "Resource not found" },
        },
      },
      delete: {
        summary: "Delete Resource",
        description: "Deletes a resource. Requires `write` permissions.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Resource deleted",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, message: { type: "string" } } } } },
          },
          "404": { description: "Resource not found" },
        },
      },
    },
    "/api/v1/renewals": {
      get: {
        summary: "List Upcoming Renewals",
        description: "Retrieves upcoming renewals sorted chronologically with horizon calculations.",
        parameters: [
          { name: "currency", in: "query", schema: { type: "string", default: "USD" } },
          { name: "bucket", in: "query", schema: { type: "string", enum: ["overdue", "critical", "upcoming", "medium", "later"] } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Renewals list and cost horizon metrics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { type: "object" } },
                    metrics: { type: "object" },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};
