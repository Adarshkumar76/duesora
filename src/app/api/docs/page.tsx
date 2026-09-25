"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Key,
  Copy,
  Check,
  ExternalLink,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EndpointDef {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
  description: string;
  requiredPermission: "read" | "write" | "admin";
  queryParams?: { name: string; type: string; description: string; required?: boolean }[];
  requestBody?: string;
  responseExample: string;
}

const ENDPOINTS: Record<string, EndpointDef[]> = {
  Resources: [
    {
      method: "GET",
      path: "/api/v1/resources",
      summary: "List Resources",
      description: "Returns a paginated list of resources in the authenticated workspace.",
      requiredPermission: "read",
      queryParams: [
        { name: "page", type: "integer", description: "Page number (default: 1)" },
        { name: "pageSize", type: "integer", description: "Items per page (max: 100, default: 50)" },
        { name: "type", type: "string", description: "Filter by resource type (e.g. subscription, domain)" },
        { name: "status", type: "string", description: "Filter by status (active, inactive, expired)" },
        { name: "search", type: "string", description: "Search query across name, provider, description" },
      ],
      responseExample: JSON.stringify(
        {
          data: [
            {
              id: "res_88f921ab",
              workspaceId: "ws_default",
              name: "GitHub Team",
              type: "subscription",
              status: "active",
              provider: "GitHub, Inc.",
              amountMinor: 4000,
              currency: "USD",
              billingCycle: "monthly",
              renewalDate: "2026-10-15T00:00:00.000Z",
              autoRenew: true,
              totalSeats: 10,
              assignedSeats: 8,
            },
          ],
          meta: { totalCount: 1, page: 1, pageSize: 50, totalPages: 1 },
        },
        null,
        2
      ),
    },
    {
      method: "POST",
      path: "/api/v1/resources",
      summary: "Create Resource",
      description: "Provisions a new subscription, domain, or license.",
      requiredPermission: "write",
      requestBody: JSON.stringify(
        {
          name: "Datadog Pro",
          type: "subscription",
          category: "Monitoring",
          provider: "Datadog, Inc.",
          websiteUrl: "https://datadoghq.com",
          amountMinor: 15000,
          currency: "USD",
          billingCycle: "monthly",
          renewalDate: "2026-11-01",
          autoRenew: true,
          tags: ["production", "devops"],
        },
        null,
        2
      ),
      responseExample: JSON.stringify(
        {
          data: {
            id: "res_98a76b5c",
            name: "Datadog Pro",
            type: "subscription",
            amountMinor: 15000,
            currency: "USD",
            billingCycle: "monthly",
            status: "active",
            createdAt: "2026-09-25T12:00:00.000Z",
          },
        },
        null,
        2
      ),
    },
    {
      method: "GET",
      path: "/api/v1/resources/{id}",
      summary: "Get Resource by ID",
      description: "Fetches complete details for a single resource.",
      requiredPermission: "read",
      responseExample: JSON.stringify(
        {
          data: {
            id: "res_88f921ab",
            name: "GitHub Team",
            type: "subscription",
            amountMinor: 4000,
            currency: "USD",
            billingCycle: "monthly",
          },
        },
        null,
        2
      ),
    },
    {
      method: "PATCH",
      path: "/api/v1/resources/{id}",
      summary: "Update Resource",
      description: "Modifies fields of an existing resource.",
      requiredPermission: "write",
      requestBody: JSON.stringify(
        {
          amountMinor: 4500,
          renewalDate: "2026-11-15",
          autoRenew: false,
        },
        null,
        2
      ),
      responseExample: JSON.stringify(
        {
          data: {
            id: "res_88f921ab",
            name: "GitHub Team",
            amountMinor: 4500,
            autoRenew: false,
          },
        },
        null,
        2
      ),
    },
    {
      method: "DELETE",
      path: "/api/v1/resources/{id}",
      summary: "Delete Resource",
      description: "Permanently deletes a resource and records an audit event.",
      requiredPermission: "write",
      responseExample: JSON.stringify(
        {
          success: true,
          message: 'Resource "res_88f921ab" deleted successfully',
        },
        null,
        2
      ),
    },
  ],
  Renewals: [
    {
      method: "GET",
      path: "/api/v1/renewals",
      summary: "List Upcoming Renewals",
      description: "Retrieves upcoming renewals sorted chronologically by due date.",
      requiredPermission: "read",
      queryParams: [
        { name: "bucket", type: "string", description: "overdue | critical (<=7d) | upcoming (<=30d) | medium (<=90d) | later" },
        { name: "currency", type: "string", description: "Target currency code for cost normalization (default: USD)" },
        { name: "search", type: "string", description: "Filter by resource name or provider" },
      ],
      responseExample: JSON.stringify(
        {
          data: [
            {
              id: "res_123",
              name: "AWS Infrastructure",
              renewalDate: "2026-10-01T00:00:00.000Z",
              diffDays: 6,
              urgencyBucket: "critical",
              amountMinor: 250000,
              currency: "USD",
              renewalDecision: "approved",
            },
          ],
          metrics: {
            criticalCount: 1,
            upcomingCount: 4,
            totalRenewalCommitmentMinor: 325000,
          },
        },
        null,
        2
      ),
    },
  ],
};

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS.Resources[0]);
  const [testApiKey, setTestApiKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  function getMethodBadge(method: string) {
    switch (method) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "POST":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "PATCH":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  const curlCommand = `curl -X ${selectedEndpoint.method} \\
  -H "Authorization: Bearer ${testApiKey || "due_live_your_api_key_here"}" \\${
    selectedEndpoint.requestBody
      ? `\n  -H "Content-Type: application/json" \\\n  -d '${selectedEndpoint.requestBody.replace(/\n\s*/g, " ")}' \\`
      : ""
  }
  "${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}${selectedEndpoint.path.replace(
    "{id}",
    "res_example"
  )}"`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              D
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              Duesora <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">API v1</span>
            </span>
          </Link>
          <span className="text-muted-foreground text-xs hidden sm:inline">•</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Developer Reference</span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/70 hover:bg-muted/60 transition-colors flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>OpenAPI Spec</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          <Link href="/settings">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
              <Key className="w-3.5 h-3.5" />
              <span>Get API Key</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/60 bg-muted/20 p-4 space-y-6 shrink-0">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              API Key Tester
            </label>
            <input
              type="password"
              placeholder="Paste due_live_... key"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-input bg-background text-foreground outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-muted-foreground">
              Keys are never transmitted until you execute a curl request.
            </p>
          </div>

          <nav className="space-y-4">
            {Object.entries(ENDPOINTS).map(([group, endpoints]) => (
              <div key={group} className="space-y-1">
                <p className="text-xs font-bold text-foreground px-2">{group}</p>
                <div className="space-y-0.5">
                  {endpoints.map((ep) => {
                    const isSelected =
                      selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                    return (
                      <button
                        key={`${ep.method}-${ep.path}`}
                        type="button"
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-card font-semibold text-foreground shadow-2xs border border-border/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <span className="truncate">{ep.summary}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${getMethodBadge(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Endpoint Documentation Pane */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-4xl">
          {/* Header Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${getMethodBadge(
                  selectedEndpoint.method
                )}`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {selectedEndpoint.path}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {selectedEndpoint.summary}
            </h1>
            <p className="text-sm text-muted-foreground">{selectedEndpoint.description}</p>
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-muted-foreground">Required permission:</span>
              <span className="font-mono px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-semibold border border-border/50">
                {selectedEndpoint.requiredPermission}
              </span>
            </div>
          </div>

          {/* cURL Example */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                cURL Request
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(curlCommand)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? "Copied" : "Copy cURL"}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
              {curlCommand}
            </pre>
          </div>

          {/* Query Parameters (if any) */}
          {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Query Parameters
              </h2>
              <div className="border border-border/70 rounded-xl overflow-hidden divide-y divide-border/50">
                {selectedEndpoint.queryParams.map((q) => (
                  <div key={q.name} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-card">
                    <div className="space-x-2">
                      <span className="font-mono font-semibold text-foreground">{q.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({q.type})</span>
                    </div>
                    <span className="text-muted-foreground">{q.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body (if any) */}
          {selectedEndpoint.requestBody && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Request Body (JSON)
              </h2>
              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                {selectedEndpoint.requestBody}
              </pre>
            </div>
          )}

          {/* Response Example */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Response Example (200 OK)
            </h2>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
              {selectedEndpoint.responseExample}
            </pre>
          </div>
        </main>
      </div>
    </div>
  );
}
