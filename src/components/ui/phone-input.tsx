import { cn } from "@/lib/utils/format";

const base =
  "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#D71920] focus:ring-2 focus:ring-[#DC2626]/20";

export function PhoneInput({
  label,
  error,
  placeholder = "+504 9999-0000",
  ...props
}: {
  label: string;
  error?: string;
  placeholder?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode">) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <input
        className={base}
        type="tel"
        inputMode="tel"
        placeholder={placeholder}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
