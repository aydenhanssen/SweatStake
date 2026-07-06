import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { TIERS } from '@/lib/constants';
import TierBadge from '@/components/shared/TierBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Coins, Lock, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

export default function Challenges() {
  const { profile, refetch } = useProfile();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [stakeAmount, setStakeAmount] = useState(50);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const c = await base44.entities.Challenge.filter({ status: 'active' });
        setChallenges(c);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleJoin = async (challenge) => {
    if (!profile) return;
    const tier = TIERS[challenge.tier];
    if (stakeAmount > profile.points_balance) {
      toast({ title: 'Insufficient points', description: "You don't have enough points for this stake.", variant: 'destructive' });
      return;
    }
    setJoining(true);
    try {
      await base44.entities.ChallengeEntry.create({
        challenge_id: challenge.id,
        user_id: profile.user_id,
        username: profile.username,
        tier: challenge.tier,
        stake_amount: stakeAmount,
        checkins_required: tier.workouts,
      });
      await base44.entities.Challenge.update(challenge.id, {
        total_pot: challenge.total_pot + stakeAmount,
        participant_count: challenge.participant_count + 1,
      });
      await base44.entities.UserProfile.update(profile.id, {
        points_balance: profile.points_balance - stakeAmount,
      });
      toast({ title: 'You\'re in! 🔥', description: `Staked ${stakeAmount} points on the ${tier.label} challenge.` });
      navigate('/');
    } catch (err) {
      toast({ title: 'Error', description: 'Could not join challenge.', variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  const isPremium = profile?.is_premium;

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 rounded-xl bg-card border border-border">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black">Join a Challenge</h1>
      </div>

      <div className="space-y-4">
        {Object.entries(TIERS).map(([key, tier]) => {
          const ch = challenges.find(c => c.tier === key);
          const isLocked = !isPremium && key !== 'bronze';
          const isSelected = selectedTier === key;

          return (
            <div
              key={key}
              className={`bg-card border rounded-3xl p-5 transition-all cursor-pointer ${
                isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
              } ${isLocked ? 'opacity-50' : ''}`}
              onClick={() => !isLocked && setSelectedTier(isSelected ? null : key)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TierBadge tier={key} size="md" />
                  {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>
                <span className="text-sm font-bold text-muted-foreground">{tier.workouts}x / week</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Up to {tier.maxStake.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{ch?.participant_count || 0} joined</span>
                </div>
              </div>

              {isLocked && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                  <Crown className="w-3.5 h-3.5" />
                  <span className="font-semibold">Premium required</span>
                </div>
              )}

              {isSelected && ch && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Stake amount: <span className="font-bold text-foreground">{stakeAmount} pts</span>
                  </p>
                  <Slider
                    value={[stakeAmount]}
                    onValueChange={(v) => setStakeAmount(v[0])}
                    min={10}
                    max={Math.min(tier.maxStake, profile.points_balance)}
                    step={10}
                    className="mb-4"
                  />
                  <p className="text-xs text-muted-foreground mb-4">
                    Current pot: <span className="font-semibold text-primary">{ch.total_pot?.toLocaleString()} pts</span>
                  </p>
                  <Button
                    onClick={() => handleJoin(ch)}
                    disabled={joining}
                    className="w-full h-12 font-black rounded-2xl text-base"
                  >
                    {joining ? 'Joining...' : `Stake ${stakeAmount} Points`}
                  </Button>
                </div>
              )}

              {isSelected && !ch && (
                <div className="mt-4 pt-4 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground">No active challenge for this tier right now.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}