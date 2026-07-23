export default function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className={`premium-card rounded-2xl p-4 flex flex-col gap-1.5 min-w-0 overflow-hidden transition-all hover:border-primary/30 ${accent ? 'glow-primary' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? 'bg-primary/15' : 'bg-secondary/60'}`}>
            <Icon className={`w-3.5 h-3.5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        )}
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate min-w-0">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-black font-heading truncate ${accent ? 'text-gradient-gold' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}