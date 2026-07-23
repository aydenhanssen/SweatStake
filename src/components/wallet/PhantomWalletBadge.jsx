import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePhantomWallet } from "@/lib/phantomWallet";

const PHANTOM_LOGO = "https://phantom.app/img/phantom-icon-purple.png";

const shorten = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "");

export default function PhantomWalletBadge() {
  const wallet = usePhantomWallet();

  const balanceLabel = wallet.balanceLoading
    ? "Loading…"
    : wallet.balance !== null
    ? `${wallet.balance.toFixed(4)} SOL`
    : wallet.connected
    ? "—"
    : "Not connected";

  return (
    <div className="flex items-center gap-3 glass-card rounded-2xl p-4">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
        <img src={PHANTOM_LOGO} alt="Phantom" className="w-7 h-7 object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Phantom Wallet</p>
        {wallet.connected ? (
          <p className="text-sm font-semibold text-foreground truncate">{shorten(wallet.address)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Not connected</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
        <p className="text-sm font-bold text-gradient-gold">{balanceLabel}</p>
      </div>
      {!wallet.connected && (
        <Button size="sm" onClick={() => wallet.connect()} disabled={wallet.connecting} className="rounded-xl ml-1">
          {wallet.connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
        </Button>
      )}
    </div>
  );
}