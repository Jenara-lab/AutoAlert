import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return <section className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
    <Link className="text-xl font-black tracking-tight" href="/"><span className="text-[#d71920]">AUTO</span>ALERT</Link>
    <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-[#d71920]">Crea tu cuenta</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Tu historial, siempre a la mano.</h1>
    <p className="mt-3 text-sm leading-6 text-[#6B7280]">Elige tu rol. Podrás completar tu información después.</p>
    <div className="mt-7"><AuthForm mode="register" /></div>
  </section>;
}
