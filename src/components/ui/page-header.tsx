import Link from "next/link";
import { cn } from "@/lib/utils/format";

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-start justify-between gap-4 lg:mb-8", className)}>
      <div>
        {backHref && (
          <Link
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-[#d71920]"
            href={backHref}
          >
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
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm font-medium text-gray-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
