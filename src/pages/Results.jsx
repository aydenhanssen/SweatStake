import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import TierBadge from '@/components/shared/TierBadge';
import { Trophy, TrendingDown, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function Results() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      try {
        const data = await base44.entities.ChallengeEntry.filter(
          { user_id: profile.user_id, status: { $in: ['won', 'lost'] } },
          '-updated_date',
          10
        );
        setEntries(data);
        // Confetti for latest win
        if (data.length > 0 && data[0].status === 'won') {
          setTimeout(() => {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#EAB308', '#FDE047', '#FACC15'] });
          }, 300);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  const shareToX = (entry) => {
    const text = entry.status === 'won'
      ? `🏆 Won ${entry.points_won} points on SweatStake! ${entry.checkins_completed}/${entry.checkins_required} workouts this week. #SweatStake #FitnessAccountability`
      : `💪 Completed ${entry.checkins_completed}/${entry.checkins_required} workouts on SweatStake this week. Back stronger next time! #SweatStake`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-black mb-6">Challenge Results</h1>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No completed challenges yet</p>
          <Link to="/challenges">
            <Button className="mt-4 font-bold rounded-2xl">Join a Challenge</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, idx) => {
            const isWin = entry.status === 'won';
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-3xl border p-6 text-center ${
                  isWin
                    ? 'bg-gradient-to-br from-yellow-500/10 via-primary/5 to-transparent border-primary/30'
                    : 'bg-card border-border'
                }`}
              >
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  isWin ? 'bg-primary/20' : 'bg-destructive/10'
                }`}>
                  {isWin ? (
                    <Trophy className="w-8 h-8 text-primary" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-destructive" />
                  )}
                </div>

                <h2 className={`text-2xl font-black mb-1 ${isWin ? 'text-primary' : 'text-destructive'}`}>
                  {isWin ? 'YOU WON!' : 'Challenge Lost'}
                </h2>

                <TierBadge tier={entry.tier} size="md" />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">Check-ins</p>
                    <p className="text-lg font-black">{entry.checkins_completed}/{entry.checkins_required}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{isWin ? 'Points Won' : 'Points Lost'}</p>
                    <p className={`text-lg font-black ${isWin ? 'text-primary' : 'text-destructive'}`}>
                      {isWin ? `+${entry.points_won}` : `-${entry.points_lost || entry.stake_amount}`}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => shareToX(entry)}
                  variant="outline"
                  className="mt-4 rounded-2xl font-bold border-border"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share to X
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link to="/challenges">
          <Button className="font-black rounded-2xl px-8 h-12">Join Next Challenge</Button>
        </Link>
      </div>
    </div>
  );
}