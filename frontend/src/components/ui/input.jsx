import { cn } from "@/lib/utils";

export function Input({ className, type = "text", error, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border bg-white px-4 text-sm transition-colors duration-150 placeholder:text-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
        error ? "border-red-500" : "border-line",
        className
      )}
      {...props}
    />
  );
}
