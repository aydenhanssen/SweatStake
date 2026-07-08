import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coins, Lock, TrendingUp, Gift, Plus, ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const TYPE_META = {
  stake: { icon: Lock, color: 'text-orange-400', sign: '-' },
  win: { icon: TrendingUp, color: 'text-primary', sign: '+' },
  loss: { icon: ArrowUpRight, color: 'text-destructive', sign: '-' },
  daily_bonus: { icon: Gift, color: 'text-primary', sign: '+' },
  purchase: { icon: Plus, color: 'text-primary', sign: '+' },
  refund: { icon: ArrowDownLeft, color: 'text-primary', sign: '+' },
  signup_bonus: { icon: Gift, color: 'text-primary', sign: '+' },
};

const BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((ms % (1000 * 60)) / 1000);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function Wallet() {
  const { profile, refetch } = useProfile();
  const [transactions, setTransactions] = useState([]);
  const [pendingStakes, setPendingStakes] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [txns, activeEntries] = await Promise.all([
        base44.entities.Transaction.filter({ user_id: profile.user_id }, '-created_date', 100),
        base44.entities.ChallengeEntry.filter({ user_id: profile.user_id, status: 'active' }),
      ]);
      setTransactions(txns);
      setPendingStakes(activeEntries.reduce((sum, e) => sum + e.stake_amount, 0));
      setTotalWinnings(profile.total_points_won || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tick every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const lastClaimMs = profile?.last_bonus_claim ? new Date(profile.last_bonus_claim).getTime() : 0;
  const nextAvailable = lastClaimMs + BONUS_COOLDOWN_MS;
  const msRemaining = nextAvailable - now;
  const onCooldown = msRemaining > 0;

  const claimDailyBonus = async () => {
    if (!profile || claiming || onCooldown) return;
    setClaiming(true);
    try {
      const newBalance = profile.points_balance + 10;
      const claimTime = new Date().toISOString();
      await base44.entities.UserProfile.update(profile.id, {
        points_balance: newBalance,
        last_bonus_claim: claimTime,
      });
      await base44.entities.Transaction.create({
        user_id: profile.user_id,
        type: 'daily_bonus',
        amount: 10,
        description: 'Daily bonus reward',
        balance_after: newBalance,
      });
      await refetch();
      await loadData();
      toast({ title: '+10 points! 🎉', description: 'Daily bonus claimed.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not claim bonus.', variant: 'destructive' });
    } finally {
      setClaiming(false);
    }
  };

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
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 mb-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-primary/70 font-semibold uppercase tracking-widest">Total Balance</p>
        </div>
        <p className="text-5xl font-black text-primary">{profile.points_balance?.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">SweatStake Points</p>
      </motion.div>

      {/* Pending & Winnings */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-xl font-black text-foreground">{pendingStakes.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">locked in stakes</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Winnings</span>
          </div>
          <p className="text-xl font-black text-primary">{totalWinnings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">all-time earned</p>
        </div>
      </div>

      {/* Daily Bonus */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Daily Bonus</p>
            <p className="text-xs text-muted-foreground">
              {onCooldown ? 'Come back tomorrow' : 'Claim 10 free points'}
            </p>
          </div>
        </div>
        {onCooldown ? (
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">{formatCountdown(msRemaining)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">until reset</p>
          </div>
        ) : (
          <Button
            onClick={claimDailyBonus}
            disabled={claiming}
            size="sm"
            className="font-bold rounded-xl"
          >
            {claiming ? '...' : '+10'}
          </Button>
        )}
      </div>

      {/* Get More Points */}
      <Link to="/challenges" className="block mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Get More Points</p>
              <p className="text-xs text-muted-foreground">Win challenges to earn more</p>
            </div>
          </div>
          <Plus className="w-4 h-4 text-primary" />
        </div>
      </Link>

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
              const meta = TYPE_META[tx.type] || TYPE_META.purchase;
              const Icon = meta.icon;
              return (
                <div key={tx.id} className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between">
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
                    {meta.sign}{tx.amount}
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