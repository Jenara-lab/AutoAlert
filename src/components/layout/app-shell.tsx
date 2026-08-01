import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { BottomNav } from "@/components/layout/bottom-nav";

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#111111]">
      <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link className="text-lg font-black tracking-tight" href="/dashboard">
            <span className="text-[#D71920]">AUTO</span>ALERT
          </Link>
          <div className="flex items-center gap-4">
            <Link className="text-sm font-medium text-[#6B7280] hover:text-[#D71920]" href="/vehicles">
              Vehículos
            </Link>
            <Link className="text-sm font-medium text-[#6B7280] hover:text-[#D71920]" href="/workshops">
              Talleres
            </Link>
            <Link className="text-sm font-medium text-[#6B7280] hover:text-[#D71920]" href="/alerts">
              Alertas
            </Link>
            <Link className="text-sm font-medium text-[#6B7280] hover:text-[#D71920]" href="/reports">
              Reportes
            </Link>
            <Link className="text-sm font-medium text-[#6B7280] hover:text-[#D71920]" href="/settings">
              Ajustes
            </Link>
            <form action={signOut}>
              <button className="text-sm font-medium text-[#6B7280] hover:text-[#D71920]">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">{children}</main>

      <BottomNav />

      <p className="sr-only">Sesión iniciada como {email}</p>
    </div>
  );
}
