import { useState } from 'react';
import { usePhantomWallet } from '@/lib/phantomWallet';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Check, Copy } from 'lucide-react';

export default function PhantomWalletButton({ compact = false }) {
  const { connected, address, shortenedAddress, balance, connecting, connect, disconnect, refreshBalance } = usePhantomWallet();
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
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
        className="relative flex items-center justify-center w-9 h-9 rounded-xl glass-card transition-all hover:border-violet/40 hover:scale-105"
        title={shortenedAddress}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <defs>
            <linearGradient id="phantom-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#AB9FF2" />
              <stop offset="100%" stopColor="#7B3FE4" />
            </linearGradient>
          </defs>
          <path fill="url(#phantom-grad)" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.04 0 3.93-.61 5.5-1.66l-1.2-1.6A8.02 8.02 0 0 1 12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 1.21-.27 2.35-.75 3.38-.35.75-.93 1.12-1.55 1.12-.69 0-1.2-.48-1.2-1.2V12c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4c1.1 0 2.09-.45 2.81-1.17.33 1.02 1.25 1.67 2.39 1.67 1.31 0 2.47-.74 3.06-1.98.57-1.2.89-2.55.89-3.92C22 6.48 17.52 2 12 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-background">
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
        </span>
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 premium-card rounded-2xl p-3 shadow-2xl z-50 min-w-[200px]">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Connected</span>
            </div>
            <div className="pt-2.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Address</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-bold text-foreground hover:text-violet-light transition-colors"
                >
                  {shortenedAddress}
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Balance</span>
                <div className="flex items-center gap-1.5">
                  {balance !== null ? (
                    <span className="text-xs font-bold text-gradient-gold">{balance.toFixed(4)} SOL</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <span
                    onClick={handleRefresh}
                    className="p-0.5 rounded-md hover:bg-violet/20 transition-colors cursor-pointer"
                    title="Refresh balance"
                  >
                    <RefreshCw className={`w-3 h-3 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full mt-3 px-3 py-2 text-sm text-destructive font-bold hover:bg-destructive/10 rounded-xl transition-colors border border-destructive/20"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}