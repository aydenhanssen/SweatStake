import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import StatCard from '@/components/shared/StatCard';
import TierBadge from '@/components/shared/TierBadge';
import { Settings, Dumbbell, Trophy, Flame, Target, Award, ChevronRight, Wallet, Star, TrendingUp } from 'lucide-react';
import { isAdmin } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const BADGE_LABELS = {
  first_workout: { label: 'First Workout', icon: Dumbbell },
  five_streak: { label: '5 Day Streak', icon: Flame },
  ten_streak: { label: '10 Day Streak', icon: Flame },
  first_win: { label: 'First Win', icon: Trophy },
  five_wins: { label: '5 Wins', icon: Trophy },
  hundred_workouts: { label: '100 Workouts', icon: Target },
};

export default function Profile() {
  const { profile, loading, user, refetch } = useProfile();
  const [activeEntries, setActiveEntries] = useState([]);
  const [togglingPremium, setTogglingPremium] = useState(false);
  const { toast } = useToast();

  const togglePremium = async () => {
    if (!profile) return;
    setTogglingPremium(true);
    try {
      await base44.entities.UserProfile.update(profile.id, { is_premium: !profile.is_premium });
      await refetch();
      toast({ title: `${!profile.is_premium ? 'Premium granted' : 'Premium removed'}` });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    } finally {
      setTogglingPremium(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const entries = await base44.entities.ChallengeEntry.filter({ user_id: profile.user_id, status: 'active' });
      setActiveEntries(entries);
    }
    load();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const winRate = (profile.challenges_won + profile.challenges_lost) > 0
    ? Math.round((profile.challenges_won / (profile.challenges_won + profile.challenges_lost)) * 100)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-black font-heading text-gradient-gold">Profile</h1>
        <Link to="/settings" className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all">
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="premium-card rounded-3xl p-8 mb-6 text-center">
        <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-secondary overflow-hidden border-2 border-primary/30 glow-primary">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-muted-foreground">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-xl font-black font-heading text-foreground">{profile.username}</h2>
        <p className="text-sm text-muted-foreground capitalize">{profile.fitness_level} · {profile.primary_goal?.replace('_', ' ')}</p>
        {profile.is_premium && (
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            <Star className="w-3 h-3 fill-current" /> Premium
          </span>
        )}
        {isAdmin(user?.email) && (
          <Button
            onClick={togglePremium}
            disabled={togglingPremium}
            variant={profile.is_premium ? 'ghost' : 'default'}
            className="mt-4 rounded-2xl font-bold font-heading"
          >
            <Star className={`w-4 h-4 ${profile.is_premium ? 'fill-current' : ''}`} />
            {profile.is_premium ? 'Remove Premium' : 'Grant Premium'}
          </Button>
        )}
      </div>

      {/* SOL Won */}
      <Link to="/wallet" className="block mb-6">
        <div className="relative overflow-hidden premium-border-glow rounded-3xl p-6 flex items-center justify-between transition-all hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-violet/5" />
          <div className="relative">
            <p className="text-xs text-primary/80 font-bold uppercase tracking-widest font-heading">Total SOL Won</p>
            <p className="text-3xl font-black font-heading text-gradient-gold mt-1">{(profile.total_sol_won || 0).toFixed(4)}</p>
          </div>
          <div className="relative flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary/60" />
            <ChevronRight className="w-5 h-5 text-primary/40" />
          </div>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Workouts" value={profile.total_workouts} icon={Dumbbell} />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Trophy} />
        <StatCard label="SOL Staked" value={(profile.total_sol_staked || 0).toFixed(2)} icon={TrendingUp} accent />
        <StatCard label="Best Streak" value={`${profile.longest_streak}d`} icon={Flame} />
      </div>

      {/* Active Challenges */}
      <div className="mb-6">
        <h3 className="text-sm font-bold font-heading text-foreground mb-3 uppercase tracking-wider">Active Challenges</h3>
        {activeEntries.length === 0 ? (
          <div className="premium-card rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">No active challenges</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeEntries.map(entry => (
              <div key={entry.id} className="premium-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TierBadge tier={entry.tier} />
                  <span className="text-sm font-semibold">{entry.checkins_completed}/{entry.checkins_required}</span>
                </div>
                <span className="text-sm font-bold text-gradient-gold">{(entry.sol_stake_amount || 0).toFixed(2)} SOL</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-sm font-bold font-heading text-foreground mb-3 uppercase tracking-wider">Badges</h3>
        {(!profile.badges || profile.badges.length === 0) ? (
          <div className="premium-card rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">No badges earned yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map(badge => {
              const b = BADGE_LABELS[badge];
              if (!b) return null;
              return (
                <div key={badge} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 glow-primary">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">{b.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}