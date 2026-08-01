"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/format";

const navLinks = [
  { label: "Inicio", href: "/dashboard" },
  { label: "Vehículos", href: "/vehicles" },
  { label: "Historial", href: "/history" },
  { label: "Talleres", href: "/workshops" },
  { label: "Alertas", href: "/alerts" },
  { label: "Reportes", href: "/reports" },
  { label: "Ajustes", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación lateral"
      className="fixed left-0 top-0 z-20 hidden h-screen w-60 border-r border-[#E5E7EB] bg-white pt-20 lg:block"
    >
      <ul className="space-y-1 px-3">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-[#D71920]/10 text-[#D71920]"
                    : "text-[#6B7280] hover:bg-[#F7F7F8] hover:text-[#111111]",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
