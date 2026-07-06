import { TIERS } from '@/lib/constants';

export default function TierBadge({ tier, size = 'sm' }) {
  const t = TIERS[tier];
  if (!t) return null;
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  return (
    <span className={`${sizes[size]} font-bold uppercase tracking-wider rounded-full ${t.color} ${t.bg} ${t.border} border`}>
      {t.label}
    </span>
  );
}