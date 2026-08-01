export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
      <p className="text-lg font-semibold text-[#6B7280]">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
