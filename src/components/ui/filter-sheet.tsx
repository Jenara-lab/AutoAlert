"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/format";

export function FilterSheet({
  children,
  label = "Filtros",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#F7F7F8]"
      >
        <span>🔍</span>
        {label}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
