import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import TierBadge from '@/components/shared/TierBadge';
import { Trophy, Flame, Coins, Medal } from 'lucide-react';

const tabs = [
  { key: 'weekly', label: 'Weekly', icon: Flame },
  { key: 'challenge', label: 'Challenge', icon: Trophy },
  { key: 'alltime', label: 'All Time', icon: Coins },
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
        if (tab === 'alltime') sortField = '-total_points_won';
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

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-black mb-4">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-2xl p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
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
        <div className="space-y-2">
          {profiles.map((p, idx) => {
            const isMe = p.user_id === profile?.user_id;
            const value = tab === 'alltime' ? `${p.total_points_won?.toLocaleString()} pts` : `${p.total_workouts} workouts`;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  isMe ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border'
                }`}
              >
                <div className="w-8 text-center">
                  {idx < 3 ? (
                    <Medal className={`w-5 h-5 mx-auto ${rankColors[idx]}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex-shrink-0">
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
                    {p.username} {isMe && '(You)'}
                  </p>
                </div>
                <p className="text-sm font-bold text-muted-foreground">{value}</p>
              </div>
            );
          })}
          {profiles.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No data yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}