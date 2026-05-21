const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Acceptée', className: 'bg-blue-100 text-blue-700' },
  date_proposed: {
    label: 'Date proposée',
    className: 'bg-purple-100 text-purple-700',
  },
  confirmed: { label: 'Confirmée', className: 'bg-indigo-100 text-indigo-700' },
  celebrated: { label: 'Célébrée', className: 'bg-green-100 text-green-700' },
  declined: { label: 'Refusée', className: 'bg-red-100 text-red-700' },
};

export function IntentionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
