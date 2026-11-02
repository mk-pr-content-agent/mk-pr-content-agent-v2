import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerdictType } from "@/lib/pipeline/types";
import type { RuleSeverity } from "@/lib/rules/loader";

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict?: VerdictType | null;
  className?: string;
}) {
  if (!verdict) {
    return (
      <span
        className={cn(
          "inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-line bg-surface-subtle px-2 py-1 text-[12px] leading-[18px] font-medium text-ink-muted",
          className
        )}
      >
        <Info className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span>대기</span>
      </span>
    );
  }

  if (verdict === "REJECT") {
    return (
      <span
        className={cn(
          "inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-reject bg-reject-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-reject",
          className
        )}
      >
        <XCircle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span>반려</span>
      </span>
    );
  }

  if (verdict === "HOLD") {
    return (
      <span
        className={cn(
          "inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-hold bg-hold-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-hold",
          className
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span>보류</span>
      </span>
    );
  }

  if (verdict === "PASS_WITH_EDIT") {
    return (
      <span
        className={cn(
          "inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-info bg-info-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-info",
          className
        )}
      >
        <Info className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span>수정 후 통과</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-pass bg-pass-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-pass",
        className
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
      <span>통과</span>
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: RuleSeverity }) {
  if (severity === "BLOCK") {
    return (
      <span className="inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-reject bg-reject-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-reject">
        <XCircle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span>위반</span>
      </span>
    );
  }
  if (severity === "WARN") {
    return (
      <span className="inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-hold bg-hold-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-hold">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
        <span>경고</span>
      </span>
    );
  }
  return (
    <span className="inline-flex h-[24px] shrink-0 whitespace-nowrap items-center gap-1 rounded-md border-hairline border-info bg-info-bg px-2 py-1 text-[12px] leading-[18px] font-medium text-info">
      <Info className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
      <span>정보</span>
    </span>
  );
}
