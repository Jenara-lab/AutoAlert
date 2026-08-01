import Link from "next/link";
import { cn } from "@/lib/utils/format";

const base =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-[#d71920] text-white hover:bg-[#a80f16]",
  secondary: "border-2 border-[#d71920] bg-white text-[#d71920] hover:bg-[#d71920]/10",
  ghost: "bg-transparent text-[#d71920] hover:bg-[#d71920]/10",
} as const;

type Variant = keyof typeof variants;

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(base, variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
