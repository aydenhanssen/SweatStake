import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trophy, Users, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import TierBadge from '@/components/shared/TierBadge';
import PageHeader from '@/components/shared/PageHeader';

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.Challenge.filter({
          status: 'active',
          is_public: true,
        });
        setChallenges(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return challenges.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [challenges, searchQuery, tierFilter]);

  const tiers = ['all', 'bronze', 'silver', 'gold', 'elite'];

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-8">
      {/* Header */}
      <PageHeader title="Challenges">
        <Button
          onClick={() => navigate('/create-challenge')}
          className="font-bold font-heading rounded-xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search challenges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 bg-secondary border-border rounded-2xl"
        />
      </div>

      {/* Tier filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all ${
              tierFilter === t
                ? 'bg-primary text-primary-foreground'
                : 'glass-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-3xl p-10 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-bold text-foreground mb-1">No challenges found</p>
          <p className="text-sm text-muted-foreground mb-6">
            {searchQuery || tierFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Be the first to create one and start staking!'}
          </p>
          <Button
            onClick={() => navigate('/create-challenge')}
            className="font-bold font-heading rounded-xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create New Challenge
          </Button>
        </div>
      )}

      {/* Challenge grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4">
          {filtered.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onClick={() => navigate(`/challenge/${challenge.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge, onClick }) {
  const endDate = challenge.end_date ? new Date(challenge.end_date) : null;
  const isPast = endDate && endDate < new Date();
  const progress = Math.min(
    Math.round(((challenge.daysCompleted || 0) / (challenge.duration_days || 1)) * 100),
    100
  );

  return (
    <div
      onClick={onClick}
      className="premium-card rounded-3xl p-5 cursor-pointer hover:border-primary/40 hover:glow-primary transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-heading text-foreground text-lg leading-tight truncate">
            {challenge.title}
          </h3>
          {challenge.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {challenge.description}
            </p>
          )}
        </div>
        {challenge.tier && <TierBadge tier={challenge.tier} size="md" />}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex flex-col">
          <span className="text-lg font-black text-gradient-gold">
            {(challenge.sol_total_pot || 0).toFixed(2)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">SOL Pot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{challenge.participant_count || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{challenge.duration_days || 0}d</span>
        </div>
      </div>

      {endDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3 h-3" />
          <span>Ends {format(endDate, 'MMM d, yyyy')}</span>
          {isPast && <Badge variant="destructive" className="ml-1 text-[9px] px-1.5 py-0">Ended</Badge>}
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && (
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}