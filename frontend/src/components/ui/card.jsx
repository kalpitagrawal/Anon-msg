import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}
