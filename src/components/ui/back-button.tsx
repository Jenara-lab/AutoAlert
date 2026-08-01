import Link from "next/link";

export function BackButton({ href, label = "← Volver" }: { href: string; label?: string }) {
  return (
    <Link
      className="mb-4 inline-flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#D71920]"
      href={href}
    >
      {label}
    </Link>
  );
}
