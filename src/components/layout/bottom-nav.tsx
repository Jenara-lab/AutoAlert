"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/format";
import {
  HomeIcon,
  CarIcon,
  WrenchIcon,
  BellIcon,
  ChartIcon,
} from "@/components/ui/icons";

const mainNav = [
  { label: "Inicio", href: "/dashboard", icon: HomeIcon },
  { label: "Vehículos", href: "/vehicles", icon: CarIcon },
  { label: "Talleres", href: "/workshops", icon: WrenchIcon },
  { label: "Alertas", href: "/alerts", icon: BellIcon },
  { label: "Reportes", href: "/reports", icon: ChartIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-1">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-2 text-[10px] font-semibold transition",
                isActive ? "text-[#D71920]" : "text-gray-500 hover:text-gray-900",
              )}
            >
              <Icon size={20} className={isActive ? "text-[#D71920]" : "text-gray-400"} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
