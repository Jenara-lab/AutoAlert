import { cn } from "@/lib/utils/format";

const base =
  "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20";

export function MileageInput({
  label,
  error,
  placeholder = "Ej: 45000",
  ...props
}: {
  label: string;
  error?: string;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "step" | "min">) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <div className="relative">
        <input
          className={cn(base, "pr-12")}
          type="number"
          step="1"
          min="0"
          placeholder={placeholder}
          {...props}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6B7280]">
          km
        </span>
      </div>
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
