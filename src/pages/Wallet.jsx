import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePhantomWallet } from '@/lib/phantomWallet';
import PhantomWalletButton from '@/components/wallet/PhantomWalletButton';

const TYPE_META = {
  stake: { icon: Lock, color: 'text-orange-400', sign: '-' },
  win: { icon: TrendingUp, color: 'text-primary', sign: '+' },
  loss: { icon: ArrowUpRight, color: 'text-destructive', sign: '-' },
};

export default function Wallet() {
  const { profile, refetch } = useProfile();
  const [transactions, setTransactions] = useState([]);
  const [pendingStakes, setPendingStakes] = useState(0);
  const [loading, setLoading] = useState(true);
  const { connected, balance } = usePhantomWallet();

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [txns, activeEntries] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: profile.user_id }, '-created_date', 100),
        base44.entities.ChallengeEntry.filter({ user_id: profile.user_id, status: 'active' }),
      ]);
      setTransactions(txns);
      setPendingStakes(activeEntries.reduce((sum, e) => sum + (e.sol_stake_amount || 0), 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/profile" className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black">Wallet</h1>
        <div className="ml-auto">
          <PhantomWalletButton />
        </div>
      </div>

      {/* SOL Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden glass-balance premium-border-glow rounded-[2rem] p-8 mb-5"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-violet/10 to-transparent" />
        <div className="absolute top-0 right-0 w-44 h-44 bg-primary/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-violet/15 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary">
                  <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.3L19.5 8 12 11.7 4.5 8 12 4.3z"/>
                </svg>
              </div>
              <p className="text-xs text-primary/80 font-bold uppercase tracking-[0.2em] font-heading">SOL Balance</p>
            </div>
            <p className="text-6xl font-black text-gradient-gold drop-shadow-[0_0_24px_hsl(43_96%_56%_/_0.4)]">
              {connected ? (balance?.toFixed(4) || '0.0000') : '—'}
            </p>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {connected ? 'SOL' : 'Connect your Phantom wallet'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pending & Winnings */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="neumorphic-card rounded-2xl p-4 border border-border/40">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-xl font-black text-foreground">{pendingStakes.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground">SOL locked in stakes</p>
        </div>
        <div className="neumorphic-card rounded-2xl p-4 border border-primary/15">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Winnings</span>
          </div>
          <p className="text-xl font-black text-gradient-gold">{(profile.total_sol_won || 0).toFixed(4)}</p>
          <p className="text-xs text-muted-foreground">SOL all-time won</p>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const meta = TYPE_META[tx.type] || TYPE_META.stake;
              const Icon = meta.icon;
              return (
                <div key={tx.id} className="neumorphic-card border border-border/40 rounded-2xl p-3.5 flex items-center justify-between transition-all hover:border-primary/20 hover:scale-[1.01]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">{tx.description || tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
                        {new Date(tx.created_date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${meta.color}`}>
                    {meta.sign}{tx.amount?.toFixed(4)} SOL
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}