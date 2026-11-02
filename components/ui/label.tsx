import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[12px] leading-[18px] font-medium text-ink-muted",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

export { Label };
