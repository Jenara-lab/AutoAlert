import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {backHref && (
          <Link
            className="mb-2 inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#d71920]"
            href={backHref}
          >
            ← Volver
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[#111111] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
