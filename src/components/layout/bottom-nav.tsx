"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/format";

const mainNav = [
  { label: "Inicio", href: "/dashboard", icon: "⌂" },
  { label: "Vehículos", href: "/vehicles", icon: "▣" },
  { label: "Registrar", href: "/dashboard/add", icon: "+", isAdd: true },
  { label: "Historial", href: "/history", icon: "◷" },
];

const moreNav = [
  { label: "Talleres", href: "/workshops", icon: "🔧" },
  { label: "Alertas", href: "/alerts", icon: "🔔" },
  { label: "Reportes", href: "/reports", icon: "📊" },
  { label: "Ajustes", href: "/settings", icon: "⚙️" },
];

export function BottomNav() {
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
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E7EB] bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {mainNav.map((item) =>
          item.isAdd ? (
            <Link
              key={item.label}
              className="flex h-14 w-14 -mt-4 flex-col items-center justify-center rounded-full bg-[#D71920] text-white shadow-lg"
              href={item.href}
            >
              <span className="text-xl font-bold">+</span>
            </Link>
          ) : (
            <Link
              key={item.label}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-3 text-[10px] text-[#6B7280] hover:text-[#D71920]"
              href={item.href}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ),
        )}

        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-3 text-[10px] text-[#6B7280] hover:text-[#D71920]"
          >
            <span className="text-base">⋯</span>
            Más
          </button>

          {open && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-2xl border border-[#E5E7EB] bg-white shadow-lg">
              {moreNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#111111] hover:bg-[#F7F7F8] first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
