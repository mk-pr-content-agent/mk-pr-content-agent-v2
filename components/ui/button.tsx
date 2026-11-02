import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-[14px] leading-[22px] font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:bg-surface-subtle disabled:text-ink-muted",
  {
    variants: {
      variant: {
        primary: "bg-primary text-surface hover:bg-primary-hover",
        secondary:
          "bg-surface border-hairline border-secondary text-secondary hover:bg-secondary-subtle",
        ghost: "bg-transparent text-ink hover:bg-surface-subtle",
        danger:
          "bg-surface border-hairline border-reject text-reject hover:bg-reject-bg",
      },
      size: {
        default: "h-[36px] px-4 py-2",
        sm: "h-[32px] px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
