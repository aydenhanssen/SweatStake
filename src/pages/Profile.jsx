import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import StatCard from '@/components/shared/StatCard';
import TierBadge from '@/components/shared/TierBadge';
import { Settings, Dumbbell, Trophy, Coins, Flame, Target, Award, ChevronRight, Wallet, Star } from 'lucide-react';
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
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black">Profile</h1>
        <Link to="/settings" className="p-2 rounded-xl bg-card border border-border">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-3xl p-6 mb-6 text-center">
        <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-secondary overflow-hidden border-2 border-primary/20">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-black text-muted-foreground">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className="text-lg font-black text-foreground">{profile.username}</h2>
        <p className="text-sm text-muted-foreground capitalize">{profile.fitness_level} · {profile.primary_goal?.replace('_', ' ')}</p>
        {profile.is_premium && (
          <span className="inline-block mt-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">⭐ Premium</span>
        )}
        {isAdmin(user?.email) && (
          <Button
            onClick={togglePremium}
            disabled={togglingPremium}
            variant={profile.is_premium ? 'outline' : 'default'}
            className="mt-3 rounded-2xl font-bold"
          >
            <Star className={`w-4 h-4 ${profile.is_premium ? 'fill-current' : ''}`} />
            {profile.is_premium ? 'Remove Premium' : 'Grant Premium'}
          </Button>
        )}
      </div>

      {/* Points Balance */}
      <Link to="/wallet" className="block mb-6">
        <div className="bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center justify-between transition-all hover:border-primary/40">
          <div>
            <p className="text-xs text-primary/70 font-semibold uppercase tracking-wider">Points Balance</p>
            <p className="text-3xl font-black text-primary">{profile.points_balance?.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary/60" />
            <ChevronRight className="w-5 h-5 text-primary/40" />
          </div>
        </div>
      </Link>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Workouts" value={profile.total_workouts} icon={Dumbbell} />
        <StatCard label="Win Rate" value={`${winRate}%`} icon={Trophy} />
        <StatCard label="Points Won" value={profile.total_points_won?.toLocaleString()} icon={Coins} accent />
        <StatCard label="Best Streak" value={`${profile.longest_streak}d`} icon={Flame} />
      </div>

      {/* Active Challenges */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Active Challenges</h3>
        {activeEntries.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">No active challenges</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeEntries.map(entry => (
              <div key={entry.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TierBadge tier={entry.tier} />
                  <span className="text-sm font-semibold">{entry.checkins_completed}/{entry.checkins_required}</span>
                </div>
                <span className="text-sm font-bold text-primary">{entry.stake_amount} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Badges</h3>
        {(!profile.badges || profile.badges.length === 0) ? (
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className="text-sm text-muted-foreground">No badges earned yet</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.badges.map(badge => {
              const b = BADGE_LABELS[badge];
              if (!b) return null;
              return (
                <div key={badge} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
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