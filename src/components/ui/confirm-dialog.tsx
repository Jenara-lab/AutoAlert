"use client";

import { useTransition } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#111111]">{title}</h2>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#6B7280] hover:bg-[#F7F7F8]"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              danger
                ? "bg-[#dc2626] hover:bg-[#b91c1c]"
                : "bg-[#d71920] hover:bg-[#a80f16]"
            }`}
            onClick={() => startTransition(() => onConfirm())}
            disabled={pending}
          >
            {pending ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
