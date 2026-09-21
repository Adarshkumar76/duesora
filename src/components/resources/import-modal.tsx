"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { ValidatedImportRow } from "@/lib/import-export/validation";
import type { ImportPreviewResult } from "@/lib/import-export/service";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function ImportModal({ isOpen, onClose, workspaceId }: ImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"valid" | "invalid">("valid");
  const [skipDuplicates, setSkipDuplicates] = useState(false);

  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<{ importedCount: number; failedCount: number } | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFileName(null);
    setPreviewData(null);
    setErrorMsg(null);
    setCommitResult(null);
    setLoading(false);
    setCommitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);

    // 5MB check
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 5MB limit. Please upload a smaller file.");
      return;
    }

    const name = file.name.toLowerCase();
    let format: "csv" | "json" = "csv";
    if (name.endsWith(".json")) {
      format = "json";
    } else if (name.endsWith(".csv")) {
      format = "csv";
    } else {
      setErrorMsg("Unsupported file type. Please upload a .csv or .json file.");
      return;
    }

    setSelectedFileName(file.name);
    setLoading(true);

    try {
      const text = await file.text();

      const res = await fetch(`/api/workspaces/${workspaceId}/resources/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "preview",
          format,
          content: text,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to analyze import file");
      }

      setPreviewData(json.data);
      if (json.data.validCount === 0 && json.data.invalidCount > 0) {
        setActiveTab("invalid");
      } else {
        setActiveTab("valid");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error reading or parsing file");
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || previewData.validCount === 0) return;

    setCommitting(true);
    setErrorMsg(null);

    try {
      const rowsToImport: ValidatedImportRow[] = previewData.validRows
        .filter((r) => (!skipDuplicates ? true : !r.isDuplicate))
        .map((r) => r.data);

      if (rowsToImport.length === 0) {
        throw new Error("No rows selected for import (all valid rows are duplicates).");
      }

      const res = await fetch(`/api/workspaces/${workspaceId}/resources/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "commit",
          rows: rowsToImport,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to commit import");
      }

      setCommitResult(json.data);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to import resources");
    } finally {
      setCommitting(false);
    }
  };

  const rowsToImportCount = previewData
    ? previewData.validRows.filter((r) => (!skipDuplicates ? true : !r.isDuplicate)).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-2xl bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 bg-muted/30">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-foreground">Import Resources</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Add multiple subscriptions, domains, or licenses via CSV or JSON.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-destructive/10 text-destructive text-xs border border-destructive/20 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Screen after Commit */}
          {commitResult ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Import Complete!</h3>
                <p className="text-xs text-muted-foreground">
                  Successfully imported{" "}
                  <strong className="text-foreground">{commitResult.importedCount}</strong> resources.
                  {commitResult.failedCount > 0 && (
                    <span className="text-destructive ml-1">
                      ({commitResult.failedCount} rows failed)
                    </span>
                  )}
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="rounded-xl border-border/80 text-xs font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Import Another
                </Button>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer shadow-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : !previewData ? (
            /* Upload Dropzone */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .json, text/csv, application/json"
                onChange={handleFileChange}
                className="hidden"
                id="resource-import-input"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]"
                    : "border-border/80 hover:border-emerald-500/60 hover:bg-muted/30"
                }`}
              >
                {loading ? (
                  <div className="py-6 flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-xs font-medium text-foreground">Analyzing file contents...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Accepts CSV or JSON files up to 5MB (max 1,000 rows)
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-muted text-muted-foreground">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV (RFC-4180)
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-muted text-muted-foreground">
                        <FileCode className="w-3.5 h-3.5" /> JSON format
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Template / CSV format instructions */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground">Recommended CSV Column Headers:</p>
                <p className="text-muted-foreground font-mono text-[11px]">
                  Name, Type, Category, Provider, Website URL, Amount, Currency, Billing Cycle, Next Renewal, Auto Renew, Tags
                </p>
                <p className="text-[11px] text-muted-foreground">
                  * Only <strong>Name</strong> and <strong>Type</strong> are required. Types: domain, subscription, ssl_certificate, hosting, cloud_service, software_license, custom.
                </p>
              </div>
            </div>
          ) : (
            /* Preview Analysis Screen */
            <div className="space-y-4">
              {selectedFileName && (
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    File: <strong className="text-foreground font-mono">{selectedFileName}</strong>
                  </span>
                </div>
              )}
              {/* Summary Badges */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-3 text-center">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Total Rows
                  </span>
                  <span className="text-lg font-bold text-foreground">{previewData.totalRows}</span>
                </div>
                <div className="rounded-2xl border border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
                  <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    Valid
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {previewData.validCount}
                  </span>
                </div>
                <div className="rounded-2xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-center">
                  <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                    Duplicates
                  </span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    {previewData.duplicateCount}
                  </span>
                </div>
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-center">
                  <span className="text-[11px] font-medium text-destructive uppercase tracking-wider block">
                    Invalid
                  </span>
                  <span className="text-lg font-bold text-destructive">
                    {previewData.invalidCount}
                  </span>
                </div>
              </div>

              {/* Duplicate Filter Checkbox */}
              {previewData.duplicateCount > 0 && (
                <label className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300/30 text-xs text-amber-800 dark:text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>
                    Skip duplicate resources with names that already exist in this workspace ({previewData.duplicateCount} found)
                  </span>
                </label>
              )}

              {/* Tabs for preview */}
              <div className="flex items-center gap-3 border-b border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("valid")}
                  className={`pb-2 font-medium border-b-2 transition-colors cursor-pointer ${
                    activeTab === "valid"
                      ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Valid Rows ({previewData.validCount})
                </button>
                {previewData.invalidCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("invalid")}
                    className={`pb-2 font-medium border-b-2 transition-colors cursor-pointer ${
                      activeTab === "invalid"
                        ? "border-destructive text-destructive font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Errors ({previewData.invalidCount})
                  </button>
                )}
              </div>

              {/* Table Preview */}
              <div className="rounded-2xl border border-border/80 overflow-hidden max-h-56 overflow-y-auto overflow-x-auto text-xs">
                {activeTab === "valid" ? (
                  previewData.validRows.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">No valid rows found.</div>
                  ) : (
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground sticky top-0">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Tags</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {previewData.validRows.map((r) => (
                          <tr
                            key={r.rowIndex}
                            className={`hover:bg-muted/20 ${
                              skipDuplicates && r.isDuplicate ? "opacity-50 line-through" : ""
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-muted-foreground">{r.rowIndex}</td>
                            <td className="py-2 px-3 font-medium text-foreground">{r.data.name}</td>
                            <td className="py-2 px-3 capitalize text-muted-foreground">{r.data.type}</td>
                            <td className="py-2 px-3 text-muted-foreground">{r.data.category || "—"}</td>
                            <td className="py-2 px-3 text-muted-foreground font-mono">
                              {r.data.amountMinor !== null
                                ? `${(r.data.amountMinor / 100).toFixed(2)} ${r.data.currency}`
                                : "—"}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                              {r.data.tags.length > 0 ? r.data.tags.join(", ") : "—"}
                            </td>
                            <td className="py-2 px-3">
                              {r.isDuplicate ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : (
                  <table className="w-full text-left min-w-[400px]">
                    <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Raw Name</th>
                        <th className="py-2 px-3">Validation Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {previewData.invalidRows.map((err) => (
                        <tr key={err.rowIndex} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-mono text-muted-foreground">{err.rowIndex}</td>
                          <td className="py-2 px-3 font-medium text-foreground">
                            {String(err.raw.name || err.raw.Name || "(Blank)")}
                          </td>
                          <td className="py-2 px-3 text-destructive">
                            <ul className="list-disc list-inside space-y-0.5">
                              {err.errors.map((msg, i) => (
                                <li key={i}>{msg}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/60 bg-muted/20">
          <div>
            {previewData && !commitResult && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={committing}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Choose another file
              </Button>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={committing}
              className="flex-1 sm:flex-none rounded-xl border-border/80 text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            {previewData && !commitResult && (
              <Button
                size="sm"
                onClick={handleCommitImport}
                disabled={committing || rowsToImportCount === 0}
                className="flex-1 sm:flex-none rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer shadow-xs gap-1.5"
              >
                {committing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Import {rowsToImportCount}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
