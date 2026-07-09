import { useState } from 'react';
import { usePhantomWallet } from '@/lib/phantomWallet';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function PhantomWalletButton({ compact = false }) {
  const { connected, shortenedAddress, balance, connecting, connect, disconnect } = usePhantomWallet();
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);

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
        className="flex items-center gap-1.5 bg-[#AB9FF2] hover:bg-[#AB9FF2]/90 text-white font-bold rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50"
      >
        {connecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.3L19.5 8 12 11.7 4.5 8 12 4.3z"/>
          </svg>
        )}
        {compact ? '' : 'Connect Phantom'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 bg-card border border-[#AB9FF2]/30 rounded-2xl px-3 py-2 text-sm transition-colors hover:border-[#AB9FF2]/50"
      >
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="font-bold text-foreground">{shortenedAddress}</span>
        {balance !== null && (
          <span className="text-xs text-muted-foreground">{balance.toFixed(3)} SOL</span>
        )}
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-2xl p-2 shadow-xl z-50 min-w-[160px]">
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm text-destructive font-semibold hover:bg-secondary rounded-xl"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}