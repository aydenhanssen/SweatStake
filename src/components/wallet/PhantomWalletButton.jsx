import { useState } from 'react';
import { usePhantomWallet } from '@/lib/phantomWallet';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Check, Copy } from 'lucide-react';
import PhantomLogo from '@/components/wallet/PhantomLogo';

export default function PhantomWalletButton({ compact = false }) {
  const { connected, address, shortenedAddress, balance, balanceError, connecting, connect, disconnect, refreshBalance } = usePhantomWallet();
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
          <PhantomLogo size={20} />
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
        <PhantomLogo size={30} showStatus connected />
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
                  {balanceError ? (
                    <span className="text-xs font-bold text-destructive">Error</span>
                  ) : balance !== null ? (
                    <span className="text-xs font-bold text-gradient-gold">{balance.toFixed(4)} SOL</span>
                  ) : (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
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
              {balanceError && (
                <p className="text-[10px] text-destructive/80 leading-relaxed">{balanceError}</p>
              )}
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