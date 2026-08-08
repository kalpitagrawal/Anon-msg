import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-ink text-white hover:bg-neutral-800",
  outline: "border border-line bg-white hover:bg-surface",
  ghost: "hover:bg-surface",
};

const sizes = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef(function Button(
  { className, variant = "default", size = "default", disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});
