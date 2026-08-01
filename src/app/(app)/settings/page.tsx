"use client";

import { useTransition, useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getProfile,
  updateProfile,
  changePassword,
  type UpdateProfileValues,
  type PasswordChangeValues,
} from "@/app/actions/settings";

const CURRENCY_OPTIONS = [
  { value: "HNL", label: "Lempira (HNL)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "GTQ", label: "Quetzal (GTQ)" },
  { value: "NIO", label: "Córdoba (NIO)" },
  { value: "CRC", label: "Colón (CRC)" },
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    currencyCode: string;
    emailAlertsEnabled: boolean;
    whatsappAlertsEnabled: boolean;
    dateLeadDays: number;
    mileageThresholdKm: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getProfile();
      if ("data" in result) {
        setProfile(result.data);
      } else {
        setLoadError(result.error);
      }
      setLoaded(true);
    });
  }, []);

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    setProfileMessage(null);
    setProfileError(null);

    const form = new FormData(e.currentTarget);
    const values: UpdateProfileValues = {
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      currencyCode: String(form.get("currencyCode") || "HNL"),
      emailAlertsEnabled: form.get("emailAlertsEnabled") === "on",
      whatsappAlertsEnabled: form.get("whatsappAlertsEnabled") === "on",
      dateLeadDays: Number(form.get("dateLeadDays") || 15),
      mileageThresholdKm: Number(form.get("mileageThresholdKm") || 300),
    };

    startTransition(async () => {
      const result = await updateProfile(values);
      if ("error" in result) {
        setProfileError(result.error);
      } else {
        setProfileMessage("Perfil actualizado correctamente.");
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    const form = new FormData(e.currentTarget);
    const values: PasswordChangeValues = {
      currentPassword: String(form.get("currentPassword") || ""),
      newPassword: String(form.get("newPassword") || ""),
      confirmPassword: String(form.get("confirmPassword") || ""),
    };

    startTransition(async () => {
      const result = await changePassword(values);
      if ("error" in result) {
        setPasswordError(result.error);
      } else {
        setPasswordMessage("Contraseña actualizada correctamente.");
        e.currentTarget.reset();
      }
    });
  };

  if (!loaded) {
    return (
      <section>
        <PageHeader title="Ajustes" subtitle="Perfil y configuración" />
        <div className="mt-6">
          <LoadingSkeleton rows={6} />
        </div>
      </section>
    );
  }

  if (loadError || !profile) {
    return (
      <section>
        <PageHeader title="Ajustes" subtitle="Perfil y configuración" />
        <div className="mt-6">
          <EmptyState
            title="No se pudo cargar el perfil"
            description={loadError || "Tu perfil no está disponible."}
          />
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title="Ajustes" subtitle="Perfil y configuración" />

      <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Información personal</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#6B7280]">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] bg-[#F7F7F8] px-4 py-3 text-sm text-[#6B7280]"
              />
              <p className="mt-1 text-xs text-[#6B7280]">No se puede cambiar desde aquí.</p>
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#6B7280]">
                Nombre completo
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={profile.fullName}
                required
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#6B7280]">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="+50499001122"
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                Necesario para recibir alertas por WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Moneda</h2>
          <div className="mt-4">
            <label htmlFor="currencyCode" className="block text-sm font-medium text-[#6B7280]">
              Moneda predeterminada
            </label>
            <select
              id="currencyCode"
              name="currencyCode"
              defaultValue={profile.currencyCode}
              className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Notificaciones</h2>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="emailAlertsEnabled"
                defaultChecked={profile.emailAlertsEnabled}
                className="h-5 w-5 rounded border-[#E5E7EB] text-[#d71920] focus:ring-[#d71920]"
              />
              <span className="text-sm">Recibir alertas por correo electrónico</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="whatsappAlertsEnabled"
                defaultChecked={profile.whatsappAlertsEnabled}
                className="h-5 w-5 rounded border-[#E5E7EB] text-[#d71920] focus:ring-[#d71920]"
              />
              <span className="text-sm">Recibir alertas por WhatsApp</span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Umbrales de alerta</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="dateLeadDays" className="block text-sm font-medium text-[#6B7280]">
                Días de anticipación para servicios
              </label>
              <input
                id="dateLeadDays"
                name="dateLeadDays"
                type="number"
                min={1}
                max={90}
                defaultValue={profile.dateLeadDays}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                Se enviarán alertas cuando un servicio esté a {profile.dateLeadDays} días o menos.
              </p>
            </div>
            <div>
              <label
                htmlFor="mileageThresholdKm"
                className="block text-sm font-medium text-[#6B7280]"
              >
                Umbral de kilometraje (km)
              </label>
              <input
                id="mileageThresholdKm"
                name="mileageThresholdKm"
                type="number"
                min={50}
                max={2000}
                defaultValue={profile.mileageThresholdKm}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                Se enviarán alertas cuando falten {profile.mileageThresholdKm} km o menos para el
                próximo servicio.
              </p>
            </div>
          </div>
        </div>

        {profileMessage && (
          <div className="rounded-xl border border-[#15803D]/20 bg-[#15803D]/10 p-4 text-sm text-[#15803D]">
            {profileMessage}
          </div>
        )}
        {profileError && (
          <div className="rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/10 p-4 text-sm text-[#DC2626]">
            {profileError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-[#d71920] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a80f16] disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="mt-10 space-y-6">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-[#6B7280]"
              >
                Contraseña actual
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-[#6B7280]">
                Nueva contraseña
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#6B7280]"
              >
                Confirmar nueva contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#d71920] focus:outline-none focus:ring-1 focus:ring-[#d71920]"
              />
            </div>
          </div>
        </div>

        {passwordMessage && (
          <div className="rounded-xl border border-[#15803D]/20 bg-[#15803D]/10 p-4 text-sm text-[#15803D]">
            {passwordMessage}
          </div>
        )}
        {passwordError && (
          <div className="rounded-xl border border-[#DC2626]/20 bg-[#DC2626]/10 p-4 text-sm text-[#DC2626]">
            {passwordError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl border-2 border-[#111111] bg-white px-6 py-3 text-sm font-semibold text-[#111111] hover:bg-[#111111] hover:text-white disabled:opacity-50"
        >
          {isPending ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </section>
  );
}
