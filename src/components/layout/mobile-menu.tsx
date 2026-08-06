"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/format";
import { MenuIcon, XIcon } from "@/components/ui/icons";
import { signOut } from "@/app/actions/auth";
import {
  HomeIcon,
  CarIcon,
  HistoryIcon,
  WrenchIcon,
  BellIcon,
  ChartIcon,
  LogOutIcon,
} from "@/components/ui/icons";

const navLinks = [
  { label: "Inicio", href: "/dashboard", icon: HomeIcon },
  { label: "Vehículos", href: "/vehicles", icon: CarIcon },
  { label: "Talleres", href: "/workshops", icon: WrenchIcon },
  { label: "Alertas", href: "/alerts", icon: BellIcon },
  { label: "Reportes", href: "/reports", icon: ChartIcon },
  { label: "Historial", href: "/history", icon: HistoryIcon },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menu = open
    ? createPortal(
        <>
          <div
            className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 top-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col overflow-y-auto bg-white lg:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between bg-white px-5">
              <span className="text-xl font-black tracking-tight">
                <span className="text-[#D71920]">AUTO</span>ALERT
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100"
                aria-label="Cerrar menú"
              >
                <XIcon size={22} />
              </button>
            </div>

            <nav aria-label="Navegación móvil" className="flex flex-1 flex-col justify-center bg-white px-8 pb-16">
              <ul className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold transition",
                          isActive
                            ? "bg-[#D71920] text-white shadow-sm shadow-[#D71920]/25"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        )}
                      >
                        <Icon
                          size={22}
                          className={isActive ? "text-white" : "text-gray-500"}
                        />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <form action={signOut} className="mt-10">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 px-4 py-4 text-base font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogOutIcon size={22} className="text-gray-500" />
                  Salir de la sesión
                </button>
              </form>
            </nav>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 lg:hidden"
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <MenuIcon size={22} />
      </button>

      {menu}
    </>
  );
}
