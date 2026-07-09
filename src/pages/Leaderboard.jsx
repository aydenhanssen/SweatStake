import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { Trophy, Flame, TrendingUp, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { key: 'weekly', label: 'Weekly', icon: Flame },
  { key: 'challenge', label: 'Challenge', icon: Trophy },
  { key: 'alltime', label: 'All Time', icon: TrendingUp },
];

const filterOptions = [
  { key: 'global', label: 'Global' },
  { key: 'friends', label: 'Friends' },
  { key: 'challenge', label: 'Your Challenge' },
];

export default function Leaderboard() {
  const { profile } = useProfile();
  const [tab, setTab] = useState('weekly');
  const [filter, setFilter] = useState('global');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let sortField = '-total_workouts';
        if (tab === 'alltime') sortField = '-total_sol_won';
        const data = await base44.entities.UserProfile.list(sortField, 50);
        setProfiles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab]);

  const rankColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
  const rankGlows = ['glow-primary', '', ''];

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      <h1 className="text-xl font-black font-heading text-gradient-gold mb-6">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 glass-card rounded-2xl p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {filterOptions.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.key ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {profiles.map((p, idx) => {
            const isMe = p.user_id === profile?.user_id;
            const value = tab === 'alltime' ? `${(p.total_sol_won || 0).toFixed(2)} SOL` : `${p.total_workouts} workouts`;
            const isTop3 = idx < 3;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${
                  isMe ? 'bg-primary/10 border border-primary/30 glow-primary' : isTop3 ? 'premium-card' : 'glass-card'
                } ${isTop3 ? rankGlows[idx] : ''}`}
              >
                <div className="w-8 text-center">
                  {isTop3 ? (
                    <Medal className={`w-5 h-5 mx-auto ${rankColors[idx]}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0 border border-border">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {p.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                    <span className="break-all">{p.username}</span> {isMe && '(You)'}
                  </p>
                </div>
                <p className={`text-sm font-bold ${isTop3 ? 'text-gradient-gold' : 'text-muted-foreground'}`}>{value}</p>
              </motion.div>
            );
          })}
          {profiles.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No data yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}