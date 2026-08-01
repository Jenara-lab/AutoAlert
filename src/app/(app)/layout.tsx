import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let email = "";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    email = user.email ?? "";
  } catch {
    redirect("/login?message=Configura%20Supabase%20para%20continuar.");
  }

  return <AppShell email={email}>{children}</AppShell>;
}
