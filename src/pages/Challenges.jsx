import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trophy, Users, Clock, Calendar, Sparkles, Flame, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import TierBadge from '@/components/shared/TierBadge';
import PageHeader from '@/components/shared/PageHeader';

const SAMPLE_CHALLENGES = [
  {
    id: 'sample-1',
    title: 'Morning 5K Crusher',
    description: 'Run 5K every morning before sunrise. Stake SOL, win the pot.',
    tier: 'bronze',
    sol_total_pot: 4.5,
    participant_count: 9,
    duration_days: 7,
    end_date: null,
  },
  {
    id: 'sample-2',
    title: 'Iron Core 30-Day',
    description: 'Plank, crunch, and sweat. Build a core of steel and earn your cut.',
    tier: 'gold',
    sol_total_pot: 32.0,
    participant_count: 14,
    duration_days: 30,
    end_date: null,
  },
  {
    id: 'sample-3',
    title: 'Elite Lift League',
    description: 'Hit the iron 6x a week. Only the relentless take the pot.',
    tier: 'elite',
    sol_total_pot: 120.0,
    participant_count: 6,
    duration_days: 7,
    end_date: null,
  },
];

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
  const showSamples = !loading && filtered.length === 0 && !searchQuery && tierFilter === 'all';

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
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-1 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide truncate transition-all ${
              tierFilter === t
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
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
      {!loading && filtered.length === 0 && !showSamples && (
        <div className="relative overflow-hidden glass-card rounded-3xl p-10 text-center">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-bold text-foreground mb-1">No challenges found</p>
            <p className="text-sm text-muted-foreground mb-6">
              Try adjusting your search or filters.
            </p>
            <Button
              onClick={() => navigate('/create-challenge')}
              className="font-bold font-heading rounded-xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create New Challenge
            </Button>
          </div>
        </div>
      )}

      {/* Sample challenges when none exist */}
      {showSamples && (
        <div>
          <div className="relative overflow-hidden premium-card rounded-[2rem] p-8 mb-6 text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-violet/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/25 to-violet/15 flex items-center justify-center mx-auto mb-5 glow-primary-strong animate-glow-pulse">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-black font-heading text-foreground mb-2">
                Be the First to Stake
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                No live challenges yet. Create one, put your SOL on the line, and rally the community to fill the pot.
              </p>
              <Button
                onClick={() => navigate('/create-challenge')}
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base font-black font-heading rounded-2xl bg-gradient-to-r from-primary via-yellow-400 to-yellow-500 hover:brightness-110 text-primary-foreground shadow-[0_0_36px_hsl(43_96%_56%_/_0.45)] ring-2 ring-primary/30 ring-offset-2 ring-offset-background animate-glow-pulse transition-all hover:scale-[1.02]"
              >
                <Zap className="w-5 h-5 mr-2" /> Create a Challenge
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold font-heading text-foreground uppercase tracking-wider">Featured Examples</h3>
          </div>
          <div className="grid gap-4">
            {SAMPLE_CHALLENGES.map((challenge) => (
              <SampleChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
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
      <div className="flex items-start justify-between mb-3 gap-3">
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
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-black text-gradient-gold truncate">
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

function SampleChallengeCard({ challenge }) {
  return (
    <div className="premium-card rounded-3xl p-5 opacity-90">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-heading text-foreground text-lg leading-tight truncate">
            {challenge.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{challenge.description}</p>
        </div>
        <TierBadge tier={challenge.tier} size="md" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-black text-gradient-gold truncate">
            {challenge.sol_total_pot.toFixed(2)}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">SOL Pot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{challenge.participant_count}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{challenge.duration_days}d</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Example</span>
        <Link to="/create-challenge">
          <Button variant="ghost" className="h-8 px-3 text-xs font-bold text-primary hover:text-primary">
            <Flame className="w-3.5 h-3.5 mr-1" /> Create like this
          </Button>
        </Link>
      </div>
    </div>
  );
}