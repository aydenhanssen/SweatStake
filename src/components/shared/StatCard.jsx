export default function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`w-4 h-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />}
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-black ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}