import { cn } from "@/lib/utils/format";

type BadgeVariant = "success" | "warning" | "danger" | "muted";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700 ring-1 ring-green-200",
  warning: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  danger: "bg-red-100 text-red-700 ring-1 ring-red-200",
  muted: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
};

export function StatusBadge({
  children,
  variant = "muted",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantStyles[variant],
      )}
    >
      {children}
    </span>
  );
}
