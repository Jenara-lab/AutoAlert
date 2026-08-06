"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/format";
import { signOut } from "@/app/actions/auth";
import {
  HomeIcon,
  CarIcon,
  HistoryIcon,
  WrenchIcon,
  BellIcon,
  ChartIcon,
  SettingsIcon,
  LogOutIcon,
} from "@/components/ui/icons";

const navLinks = [
  { label: "Inicio", href: "/dashboard", icon: HomeIcon },
  { label: "Vehículos", href: "/vehicles", icon: CarIcon },
  { label: "Historial", href: "/history", icon: HistoryIcon },
  { label: "Talleres", href: "/workshops", icon: WrenchIcon },
  { label: "Alertas", href: "/alerts", icon: BellIcon },
  { label: "Reportes", href: "/reports", icon: ChartIcon },
  { label: "Ajustes", href: "/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link className="text-xl font-black tracking-tight" href="/dashboard">
          <span className="text-[#D71920]">AUTO</span>ALERT
        </Link>
      </div>

      <nav aria-label="Navegación lateral" className="flex-1 overflow-y-auto px-4 py-4">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-[#D71920] text-white shadow-sm shadow-[#D71920]/25"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <Icon size={18} className={isActive ? "text-white" : "text-gray-400"} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-100 p-4">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOutIcon size={18} className="text-gray-400" />
            Cerrar sesión
          </button>
        </form>
        <p className="mt-3 px-4 text-xs text-gray-400">AutoAlert v0.1</p>
      </div>
    </aside>
  );
}
