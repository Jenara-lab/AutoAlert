import { cn } from "@/lib/utils/format";

const base =
  "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20";

export function MoneyInput({
  label,
  error,
  placeholder = "0.00",
  currency = "L.",
  ...props
}: {
  label: string;
  error?: string;
  placeholder?: string;
  currency?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "step">) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
          {currency}
        </span>
        <input
          className={cn(base, "pl-10")}
          type="number"
          step="0.01"
          min="0"
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
