import { requireWorkspaceRole } from "@/lib/auth/workspace";
import { listResources, createResource } from "@/lib/resources/repository";
import { parseCsv, serializeCsv } from "./csv";
import {
  normalizeRawRow,
  importRowSchema,
  type ValidatedImportRow,
} from "./validation";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ExportResult {
  content: string;
  contentType: string;
  filename: string;
}

export interface RowPreview {
  rowIndex: number;
  data: ValidatedImportRow;
  isDuplicate: boolean;
}

export interface RowError {
  rowIndex: number;
  raw: Record<string, unknown>;
  errors: string[];
}

export interface ImportPreviewResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: RowPreview[];
  invalidRows: RowError[];
}

export interface ImportCommitResult {
  importedCount: number;
  failedCount: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const MAX_ROWS = 1000;

export async function exportWorkspaceResources(
  userId: string,
  workspaceId: string,
  format: "csv" | "json" = "csv"
): Promise<ExportResult> {
  await requireWorkspaceRole(userId, workspaceId, "viewer");

  const { items } = await listResources(workspaceId, {
    pageSize: 1000,
  });

  const timestamp = new Date().toISOString().split("T")[0];

  if (format === "json") {
    const exportData = {
      version: "1.0",
      workspaceId,
      exportedAt: new Date().toISOString(),
      totalResources: items.length,
      resources: items.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        category: r.category,
        provider: r.provider,
        websiteUrl: r.websiteUrl,
        amount: r.amountMinor !== null ? r.amountMinor / 100 : null,
        amountMinor: r.amountMinor,
        currency: r.currency,
        billingCycle: r.billingCycle,
        renewalDate: r.renewalDate ? new Date(r.renewalDate).toISOString() : null,
        autoRenew: r.autoRenew,
        owner: r.owner ? { id: r.owner.id, name: r.owner.name, email: r.owner.email } : null,
        tags: r.tags.map((t) => t.name),
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    };

    return {
      content: JSON.stringify(exportData, null, 2),
      contentType: "application/json; charset=utf-8",
      filename: `duesora_resources_${timestamp}.json`,
    };
  }

  // Format: CSV
  const headers = [
    "Name",
    "Type",
    "Category",
    "Provider",
    "Website URL",
    "Amount",
    "Currency",
    "Billing Cycle",
    "Next Renewal",
    "Auto Renew",
    "Tags",
  ];

  const rows = items.map((r) => {
    const amount = r.amountMinor !== null ? (r.amountMinor / 100).toFixed(2) : "";
    const renewal = r.renewalDate ? new Date(r.renewalDate).toISOString().split("T")[0] : "";
    const tagsString = r.tags.map((t) => t.name).join("; ");

    return [
      r.name,
      r.type,
      r.category || "",
      r.provider || "",
      r.websiteUrl || "",
      amount,
      r.currency,
      r.billingCycle,
      renewal,
      r.autoRenew ? "true" : "false",
      tagsString,
    ];
  });

  const csvContent = serializeCsv(headers, rows);

  return {
    content: csvContent,
    contentType: "text/csv; charset=utf-8",
    filename: `duesora_resources_${timestamp}.csv`,
  };
}

export async function previewImport(
  userId: string,
  workspaceId: string,
  rawContent: string,
  format: "csv" | "json" = "csv"
): Promise<ImportPreviewResult> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  if (!rawContent || rawContent.trim() === "") {
    throw new Error("File content is empty");
  }

  if (Buffer.byteLength(rawContent, "utf-8") > MAX_FILE_SIZE) {
    throw new Error("File size exceeds maximum allowed limit of 5MB");
  }

  // Parse raw records
  let rawRecords: Record<string, unknown>[] = [];

  if (format === "json") {
    try {
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        rawRecords = parsed;
      } else if (parsed && Array.isArray(parsed.resources)) {
        rawRecords = parsed.resources;
      } else {
        throw new Error("JSON must contain an array of resources or a 'resources' array");
      }
    } catch (err) {
      throw new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : "Invalid JSON syntax"}`);
    }
  } else {
    const { headers, rows } = parseCsv(rawContent);
    if (headers.length === 0 || rows.length === 0) {
      throw new Error("CSV file must contain a header row and at least one data row");
    }

    rawRecords = rows.map((row) => {
      const record: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] ?? "";
      });
      return record;
    });
  }

  if (rawRecords.length > MAX_ROWS) {
    throw new Error(`File contains ${rawRecords.length} rows, which exceeds the maximum limit of ${MAX_ROWS} rows`);
  }

  // Fetch existing resources in this workspace to detect duplicate names
  const db = getDb();
  const existing = await db
    .select({ name: resources.name })
    .from(resources)
    .where(eq(resources.workspaceId, workspaceId));

  const existingNameSet = new Set(existing.map((e) => e.name.toLowerCase().trim()));

  const validRows: RowPreview[] = [];
  const invalidRows: RowError[] = [];
  let duplicateCount = 0;

  rawRecords.forEach((raw, idx) => {
    const rowIndex = idx + 1;
    const normalized = normalizeRawRow(raw);
    const parseResult = importRowSchema.safeParse(normalized);

    if (parseResult.success) {
      const isDuplicate = existingNameSet.has(parseResult.data.name.toLowerCase().trim());
      if (isDuplicate) duplicateCount++;
      validRows.push({
        rowIndex,
        data: parseResult.data,
        isDuplicate,
      });
    } else {
      const errors = parseResult.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`);
      invalidRows.push({
        rowIndex,
        raw,
        errors,
      });
    }
  });

  return {
    totalRows: rawRecords.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    duplicateCount,
    validRows,
    invalidRows,
  };
}

export async function commitImport(
  userId: string,
  workspaceId: string,
  rows: ValidatedImportRow[]
): Promise<ImportCommitResult> {
  await requireWorkspaceRole(userId, workspaceId, "member");

  if (!rows || rows.length === 0) {
    return { importedCount: 0, failedCount: 0 };
  }

  if (rows.length > MAX_ROWS) {
    throw new Error(`Cannot import more than ${MAX_ROWS} rows at once`);
  }

  let importedCount = 0;
  let failedCount = 0;

  for (const row of rows) {
    try {
      const parsed = importRowSchema.safeParse(row);
      if (!parsed.success) {
        failedCount++;
        continue;
      }

      const { tags, ...resData } = parsed.data;

      await createResource({
        workspaceId,
        name: resData.name,
        type: resData.type,
        category: resData.category,
        provider: resData.provider,
        websiteUrl: resData.websiteUrl,
        amountMinor: resData.amountMinor,
        currency: resData.currency,
        billingCycle: resData.billingCycle,
        renewalDate: resData.renewalDate ? new Date(resData.renewalDate) : null,
        autoRenew: resData.autoRenew,
        tags,
      });

      importedCount++;
    } catch {
      failedCount++;
    }
  }

  return {
    importedCount,
    failedCount,
  };
}
