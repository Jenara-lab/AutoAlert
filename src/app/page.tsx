import Link from "next/link";

export default function Home() {
  return <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#d71920]">AutoAlert</p>
    <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#111111] sm:text-6xl">El cuidado de tu vehículo, bajo control.</h1>
    <p className="mt-6 max-w-xl text-lg leading-8 text-[#6B7280]">Registra tu información mecánica y mantén el control de tus servicios en un solo lugar.</p>
    <div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-xl bg-[#d71920] px-5 py-3 font-semibold text-white hover:bg-[#a80f16]" href="/register">Crear cuenta</Link><Link className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 font-semibold text-[#111111]" href="/login">Iniciar sesión</Link></div>
  </main>;
}
