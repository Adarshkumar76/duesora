"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export function DockerCopy() {
  const [copied, setCopied] = useState(false);
  const command = "docker run -d -p 3000:3000 --name duesora duesora/duesora:latest";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-slate-950 text-slate-100 p-4 sm:p-5 shadow-xl font-mono text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3 overflow-x-auto w-full">
        <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-emerald-400 select-none">$</span>
        <code className="text-slate-200 select-all whitespace-nowrap">{command}</code>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Command</span>
          </>
        )}
      </button>
    </div>
  );
}
