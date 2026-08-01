import { cn } from "@/lib/utils/format";

const base =
  "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#d71920] focus:ring-2 focus:ring-[#DC2626]/20";

export function SelectField({
  label,
  error,
  children,
  ...props
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <select className={base} {...props}>
        {children}
      </select>
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}

export function TextField({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <input className={base} {...props} />
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}

export function TextareaField({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block text-sm font-medium text-[#111111]">
      {label}
      <textarea className={base} rows={2} {...props} />
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}
