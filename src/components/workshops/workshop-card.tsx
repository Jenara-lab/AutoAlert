import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";

export function WorkshopCard({
  id,
  name,
  address,
  phone,
}: {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}) {
  return (
    <Link
      href={`/workshops/${id}`}
      className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/5 transition hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <p className="text-lg font-bold text-gray-900 transition group-hover:text-[#d71920]">
          {name}
        </p>
        <StatusBadge variant="success">Activo</StatusBadge>
      </div>
      {address && (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {address}
        </p>
      )}
      {phone && (
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          {phone}
        </p>
      )}
    </Link>
  );
}
