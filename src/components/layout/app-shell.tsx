import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 antialiased">
      <Sidebar />

      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur lg:left-64 lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link className="text-xl font-black tracking-tight" href="/dashboard">
            <span className="text-[#D71920]">AUTO</span>ALERT
          </Link>
          <MobileMenu />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 lg:ml-64 lg:pl-8 lg:pr-8 lg:pb-10 lg:pt-8">
        {children}
      </main>

      <BottomNav />

      <p className="sr-only">Sesión iniciada como {email}</p>

      <form action={signOut} className="sr-only">
        <button type="submit" aria-label="Cerrar sesión">
          Salir
        </button>
      </form>
    </div>
  );
}
