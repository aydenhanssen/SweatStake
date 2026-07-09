import { useState } from 'react';
import { usePhantomWallet } from '@/lib/phantomWallet';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export default function PhantomWalletButton({ compact = false }) {
  const { connected, shortenedAddress, balance, connecting, connect, disconnect, refreshBalance } = usePhantomWallet();
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
      toast({ title: 'Wallet connected', description: 'Phantom wallet connected successfully.' });
    } catch (err) {
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' });
    }
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-1.5 bg-gradient-to-r from-violet to-violet/80 hover:from-violet/90 hover:to-violet/70 text-white font-bold rounded-xl px-3 py-1.5 text-xs transition-all hover:scale-105 disabled:opacity-50 glow-violet"
      >
        {connecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.3L19.5 8 12 11.7 4.5 8 12 4.3z"/>
          </svg>
        )}
        {compact ? '' : <span className="hidden sm:inline">Connect Phantom</span>}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 glass-card rounded-xl px-3 py-1.5 text-xs transition-all hover:border-violet/40"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="font-bold text-foreground">{shortenedAddress}</span>
        {balance !== null && (
          <span className="text-muted-foreground">{balance.toFixed(4)} SOL</span>
        )}
        <span
          onClick={handleRefresh}
          className="ml-0.5 p-1 rounded-lg hover:bg-violet/20 transition-colors cursor-pointer"
          title="Refresh balance"
        >
          <RefreshCw className={`w-3 h-3 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
        </span>
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 premium-card rounded-xl p-2 shadow-xl z-50 min-w-[160px]">
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm text-destructive font-semibold hover:bg-destructive/10 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}