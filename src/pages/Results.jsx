import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import TierBadge from '@/components/shared/TierBadge';
import { Trophy, TrendingDown, Share2, Dumbbell, Flame, Percent, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function Results() {
  const { profile } = useProfile();
  const [entry, setEntry] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      try {
        const data = await base44.entities.ChallengeEntry.filter(
          { user_id: profile.user_id, status: { $in: ['won', 'lost'] } },
          '-updated_date',
          1
        );
        if (data.length > 0) {
          setEntry(data[0]);
          const challenges = await base44.entities.Challenge.filter({ id: data[0].challenge_id });
          if (challenges.length > 0) setChallenge(challenges[0]);

          if (data[0].status === 'won') {
            setTimeout(() => fireGoldConfetti(), 300);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  const fireGoldConfetti = () => {
    const goldColors = ['#EAB308', '#FDE047', '#FACC15', '#FFD700', '#F59E0B'];
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: goldColors });
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors: goldColors }), 400);
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.4 }, colors: goldColors }), 800);
  };

  const shareToX = () => {
    if (!entry) return;
    const text = entry.status === 'won'
      ? `I just won my SweatStake challenge and earned ${entry.points_won} points 🔥🏆 #SweatStake #FitnessAccountability`
      : `I just lost my SweatStake challenge. Back stronger next week 💪 #SweatStake`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 text-center py-16">
        <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No completed challenges yet</p>
        <Link to="/challenges">
          <Button className="mt-4 font-bold rounded-2xl">Join a Challenge</Button>
        </Link>
      </div>
    );
  }

  const isWin = entry.status === 'won';
  const pointsDiff = isWin ? entry.points_won : (entry.points_lost || entry.stake_amount);
  const winRate = (profile.challenges_won + profile.challenges_lost) > 0
    ? Math.round((profile.challenges_won / (profile.challenges_won + profile.challenges_lost)) * 100)
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8 min-h-screen flex flex-col">
      {/* Large Win/Loss Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`rounded-3xl border p-8 text-center mb-5 ${
          isWin
            ? 'bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/30'
            : 'bg-gradient-to-br from-destructive/15 via-destructive/5 to-transparent border-destructive/30'
        }`}
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isWin ? 'bg-primary/20' : 'bg-destructive/15'
          }`}
        >
          {isWin ? (
            <Trophy className="w-10 h-10 text-primary" strokeWidth={2.5} />
          ) : (
            <TrendingDown className="w-10 h-10 text-destructive" strokeWidth={2.5} />
          )}
        </motion.div>

        <h1 className={`text-4xl font-black mb-2 ${isWin ? 'text-primary' : 'text-destructive'}`}>
          {isWin ? 'YOU WON' : 'YOU LOST'}
        </h1>

        <div className="flex items-center justify-center gap-2 mb-3">
          <TierBadge tier={entry.tier} size="md" />
        </div>

        <p className={`text-3xl font-black ${isWin ? 'text-primary' : 'text-destructive'}`}>
          {isWin ? '+' : '-'}{pointsDiff?.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{isWin ? 'points won' : 'points lost'}</p>

        {/* Message */}
        <div className={`mt-5 py-3 px-4 rounded-2xl ${isWin ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          <p className={`text-sm font-bold ${isWin ? 'text-primary' : 'text-destructive'}`}>
            {isWin ? 'SOL incoming' : 'Someone who showed up took your stake'}
          </p>
        </div>
      </motion.div>

      {/* Challenge Stats */}
      <div className="bg-card border border-border rounded-3xl p-5 mb-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Challenge Stats</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-2xl p-3 text-center">
            <Dumbbell className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Workouts</p>
            <p className="text-lg font-black text-foreground">{entry.checkins_completed}/{entry.checkins_required}</p>
          </div>
          <div className="bg-secondary/50 rounded-2xl p-3 text-center">
            <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-lg font-black text-foreground">{profile.current_streak}</p>
          </div>
          <div className="bg-secondary/50 rounded-2xl p-3 text-center">
            <Percent className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-lg font-black text-foreground">{winRate}%</p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-3">
        <Button
          onClick={shareToX}
          variant="outline"
          className="w-full h-14 text-base font-black rounded-2xl border-border"
        >
          <Share2 className="w-5 h-5 mr-2" /> Share to X
        </Button>
        <Link to="/challenges" className="block">
          <Button className="w-full h-14 text-base font-black rounded-2xl">
            Join Next Challenge <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}