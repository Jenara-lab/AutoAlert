import { cn } from "@/lib/utils/format";

type BadgeVariant = "success" | "warning" | "danger" | "muted";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[#15803D]/10 text-[#15803D]",
  warning: "bg-[#D97706]/10 text-[#D97706]",
  danger: "bg-[#DC2626]/10 text-[#DC2626]",
  muted: "bg-[#F7F7F8] text-[#6B7280]",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
      )}
    >
      {children}
    </span>
  );
}
