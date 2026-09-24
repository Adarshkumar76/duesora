"use client";

import React, { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Paperclip,
  UploadCloud,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import type { ResourceDocumentItem } from "@/lib/documents/service";

interface ResourceDocumentsCardProps {
  workspaceId: string;
  resourceId: string;
  initialDocuments: ResourceDocumentItem[];
  canManage?: boolean;
}

export function ResourceDocumentsCard({
  workspaceId,
  resourceId,
  initialDocuments,
  canManage = true,
}: ResourceDocumentsCardProps) {
  const [documents, setDocuments] = useState<ResourceDocumentItem[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.includes("pdf")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <ImageIcon className="w-4 h-4" />
        </div>
      );
    }
    if (mimeType.includes("sheet") || mimeType.includes("csv") || mimeType.includes("excel")) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Paperclip className="w-4 h-4" />
      </div>
    );
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to upload document");
      }

      setDocuments((prev) => [json.data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setError(null);
    setDeletingId(documentId);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/resources/${resourceId}/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to delete document");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Contracts & Documents</span>
          </CardTitle>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border/50">
            {documents.length} {documents.length === 1 ? "file" : "files"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {error && (
          <div className="p-3 text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone */}
        {canManage && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"
                  : "border-border/60 hover:border-emerald-500/50 hover:bg-muted/30"
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 py-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading document safely...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-1">
                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">
                    Click or drag & drop to attach contracts, SLAs, or invoices
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    PDF, DOCX, CSV, Excel, or images up to 15 MB
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <FileCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">No Documents Attached</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Attach vendor contracts, software licenses, or receipt invoices to keep all asset paperwork in one place.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 border border-border/50 rounded-xl overflow-hidden bg-background/50">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getFileIcon(doc.mimeType)}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-sm">
                      {doc.fileName}
                    </p>
                    <p
                      suppressHydrationWarning
                      className="text-[11px] text-muted-foreground truncate"
                    >
                      {formatFileSize(doc.fileSize)} • {formatDate(doc.createdAt)}
                      {doc.uploadedByName ? ` • ${doc.uploadedByName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/workspaces/${workspaceId}/resources/${resourceId}/documents/${doc.id}?download=true`}
                    download={doc.fileName}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {canManage && (
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Delete document"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
