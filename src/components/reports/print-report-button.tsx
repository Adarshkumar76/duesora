"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintReportButtonProps {
  className?: string;
  variant?: "outline" | "default";
}

export function PrintReportButton({
  className = "",
  variant = "outline",
}: PrintReportButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => window.print()}
      className={`print:hidden rounded-xl shadow-2xs text-xs font-semibold gap-1.5 cursor-pointer h-8 ${className}`}
      title="Print or Save Executive PDF Summary (Ctrl+P / Cmd+P)"
    >
      <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>Executive PDF / Print</span>
    </Button>
  );
}
