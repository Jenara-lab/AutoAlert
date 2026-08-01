import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return <section className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
    <Link className="text-xl font-black tracking-tight" href="/"><span className="text-[#d71920]">AUTO</span>ALERT</Link>
    <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#d71920]">Bienvenido</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Controla el cuidado de tu vehículo.</h1>
    <p className="mt-3 text-sm leading-6 text-[#6B7280]">Inicia sesión para acceder a tu espacio de mantenimiento vehicular.</p>
    {message && <p className="mt-5 rounded-xl bg-[#15803D]/10 p-3 text-sm text-[#15803D]">{message}</p>}
    <div className="mt-7"><AuthForm mode="login" /></div>
  </section>;
}
