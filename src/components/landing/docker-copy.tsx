"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { useTranslation } from "@/components/i18n/i18n-provider";

export function DockerCopy() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const command = "docker run -d -p 3000:3000 --name duesora duesora/duesora:latest";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-[6px] border border-border bg-card p-3 sm:p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 overflow-x-auto w-full min-w-0">
        <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-muted-foreground select-none">$</span>
        <code className="text-foreground select-all whitespace-nowrap">{command}</code>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>{t("landing.copiedCommand")}</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>{t("landing.copyCommand")}</span>
          </>
        )}
      </button>
    </div>
  );
}
