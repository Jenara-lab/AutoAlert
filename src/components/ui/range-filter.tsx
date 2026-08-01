"use client";

import { cn } from "@/lib/utils/format";

export function RangeFilter({
  label,
  options,
  value,
  onChange,
  allLabel = "Todos",
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#6B7280]">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            value === ""
              ? "bg-[#111111] text-white"
              : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F7F7F8]"
          )}
        >
          {allLabel}
        </button>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              value === opt.value
                ? "bg-[#d71920] text-white"
                : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F7F7F8]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
