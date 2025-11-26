"use client";

import { cn } from "@/lib/utils";

interface SessionStatusBadgeProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}

export function SessionStatusBadge({
  isActive,
  activeLabel = "진행중",
  inactiveLabel = "종료",
  className,
}: SessionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs",
        isActive
          ? "border-emerald-200 bg-emerald-100 text-emerald-600 dark:border-emerald-500 dark:bg-transparent dark:text-emerald-300"
          : "border-slate-300 bg-slate-200 text-slate-600 dark:border-slate-700 dark:bg-transparent dark:text-slate-400",
        className
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}

