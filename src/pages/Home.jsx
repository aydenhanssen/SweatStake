import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { Link, useNavigate } from 'react-router-dom';
import { TIERS } from '@/lib/constants';
import TierBadge from '@/components/shared/TierBadge';
import StatCard from '@/components/shared/StatCard';
import { Flame, Trophy, TrendingUp, Dumbbell, Clock, Plus, Bell, Users, Shield } from 'lucide-react';
import { isAdmin } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import PhantomWalletButton from '@/components/wallet/PhantomWalletButton';
import { usePhantomWallet } from '@/lib/phantomWallet';

export default function Home() {
  const { profile, loading, user } = useProfile();
  const [activeEntry, setActiveEntry] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { connected, balance } = usePhantomWallet();

  useEffect(() => {
    if (!loading && !profile) {
      navigate('/onboarding', { replace: true });
    }
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (!profile) return;
    async function loadData() {
      try {
        const entries = await base44.entities.ChallengeEntry.filter({ user_id: profile.user_id, status: 'active' });
        if (entries.length > 0) {
          setActiveEntry(entries[0]);
          const challenges = await base44.entities.Challenge.filter({ id: entries[0].challenge_id });
          if (challenges.length > 0) setChallenge(challenges[0]);
        }
        const notifs = await base44.entities.Notification.filter({ user_id: profile.user_id, read: false });
        setUnreadCount(notifs.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChallenge(false);
      }
    }
    loadData();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const daysRemaining = challenge
    ? Math.max(0, Math.ceil((new Date(challenge.week_end) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const winRate = (profile.challenges_won + profile.challenges_lost) > 0
    ? Math.round((profile.challenges_won / (profile.challenges_won + profile.challenges_lost)) * 100)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-6 pt-8 pb-8">
      {/* Header */}
      <div className="grid grid-cols-3 items-center mb-12">
        <div className="flex items-center">
          <h1 className="text-lg font-black font-heading tracking-[0.18em] text-gradient-gold">SWEATSTAKE</h1>
        </div>
        <div className="flex items-center justify-center">
          <PhantomWalletButton />
        </div>
        <div className="flex items-center justify-end gap-2.5">
          {isAdmin(user?.email) && (
            <Link to="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all">
              <Shield className="w-4 h-4 text-primary" />
            </Link>
          )}
          <Link to="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center text-white ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to="/profile">
            <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border border-border hover:border-primary/40 transition-all">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* SOL Balance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] p-8 mb-6 premium-border-glow glow-primary"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-violet/8 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-violet/5 via-transparent to-primary/10 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs text-primary/80 font-bold uppercase tracking-[0.2em] font-heading">Your SOL Balance</p>
          <p className="text-5xl font-black text-gradient-gold mt-2 font-heading drop-shadow-[0_0_20px_hsl(43_96%_56%_/_0.3)]">
            {connected ? (balance?.toFixed(4) || '0.0000') : '—'}
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            {connected ? 'SOL' : 'Connect Phantom to stake SOL'}
          </p>
        </div>
      </motion.div>

      {/* Active Challenge */}
      {activeEntry && challenge ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden premium-card rounded-[1.75rem] p-6 mb-6"
        >
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/8 rounded-full blur-3xl" />
          <div className="relative flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold font-heading text-foreground">Active Challenge</h3>
              <TierBadge tier={activeEntry.tier} />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{daysRemaining}d left</span>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Check-ins</span>
              <span className="font-bold text-foreground">{activeEntry.checkins_completed}/{activeEntry.checkins_required}</span>
            </div>
            <div className="h-3 bg-secondary/60 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-yellow-300 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (activeEntry.checkins_completed / activeEntry.checkins_required) * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/40 rounded-2xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Your Stake</p>
              <p className="text-lg font-black font-heading text-foreground">{(activeEntry.sol_stake_amount || 0).toFixed(2)} SOL</p>
            </div>
            <div className="bg-primary/5 rounded-2xl p-3 text-center border border-primary/10">
              <p className="text-xs text-muted-foreground">Total Pot</p>
              <p className="text-lg font-black font-heading text-gradient-gold">{(challenge.sol_total_pot || 0).toFixed(2)} SOL</p>
            </div>
          </div>

          <Link to="/checkin">
            <Button className="w-full mt-4 h-14 text-base font-black font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]">
              <Dumbbell className="w-5 h-5 mr-2" /> CHECK IN
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden premium-card rounded-[1.75rem] p-8 mb-6 text-center"
        >
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-orange-500/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/8 rounded-full blur-3xl" />
          <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/15 to-primary/10 flex items-center justify-center mx-auto mb-4 glow-primary">
            <Flame className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="font-extrabold font-heading text-lg text-foreground mb-1">No Active Challenge</h3>
          <p className="text-sm text-muted-foreground mb-6">Create or join a challenge and put your SOL on the line</p>
          <div className="flex flex-col gap-3">
            <Link to="/create-challenge">
              <Button className="w-full h-16 text-lg font-black font-heading rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-yellow-500 hover:brightness-110 text-primary-foreground shadow-[0_0_36px_hsl(43_96%_56%_/_0.45)] ring-2 ring-primary/30 ring-offset-2 ring-offset-background animate-glow-pulse transition-all hover:scale-[1.02]">
                <Plus className="w-5 h-5 mr-2" /> Create a Challenge
              </Button>
            </Link>
            <Link to="/challenges">
              <Button variant="ghost" className="w-full font-bold font-heading rounded-2xl glass-card hover:border-primary/30 text-muted-foreground hover:text-foreground h-12">
                <Users className="w-4 h-4 mr-1.5" /> Join a Challenge
              </Button>
            </Link>
          </div>
          </div>
        </motion.div>
      )}

      {/* Streak */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="relative overflow-hidden flex items-center gap-4 premium-card rounded-[1.75rem] p-5 mb-6"
      >
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-orange-500/8 rounded-full blur-3xl" />
        <div className="relative w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <div className="relative flex-1">
          <p className="text-sm text-muted-foreground font-medium">Current Streak</p>
          <p className="text-2xl font-black font-heading text-foreground">{profile.current_streak} <span className="text-sm font-medium text-muted-foreground">days</span></p>
        </div>
        <p className="relative text-xs text-muted-foreground font-semibold">Best: {profile.longest_streak}</p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-3"
      >
        <StatCard label="Workouts" value={profile.total_workouts} icon={Dumbbell} />
        <StatCard label="SOL Won" value={(profile.total_sol_won || 0).toFixed(2)} icon={TrendingUp} accent />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Trophy} />
      </motion.div>
    </div>
  );
}