import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { MIN_SOL_STAKE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Trophy, Globe, Lock, Loader2, Check, Target, Wallet, Flame, Users, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import PhantomWalletButton from '@/components/wallet/PhantomWalletButton';
import StakeSolModal from '@/components/wallet/StakeSolModal';
import { usePhantomWallet } from '@/lib/phantomWallet';

// ─── Validation Schema ────────────────────────────────────────────
const challengeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  durationDays: z.number().min(7, 'Minimum 7 days').max(90, 'Maximum 90 days'),
  endDate: z.date({ required_error: 'Pick an end date' }),
  stakeAmount: z.number().min(0.01, 'Minimum 0.01 SOL').max(10, 'Maximum 10 SOL'),
  frequency: z.enum(['daily', '3x_week', '5x_week', 'custom']),
  isPublic: z.boolean(),
  targetMetric: z.string().optional(),
});

// ─── Frequency → check-in config ──────────────────────────────────
// Maps frequency choice to workouts-per-week and a legacy tier
// (ChallengeEntry entity requires a tier field for compatibility).
const FREQ_CONFIG = {
  daily:     { label: 'Daily',     perWeek: 7, tier: 'elite' },
  '3x_week': { label: '3× / Week', perWeek: 3, tier: 'bronze' },
  '5x_week': { label: '5× / Week', perWeek: 5, tier: 'gold' },
  custom:    { label: 'Custom',    perWeek: 5, tier: 'gold' },
};

const PLATFORM_FEE_RATE = 0.05; // 5% platform fee on the pot

export default function CreateChallenge() {
  const { profile, refetch } = useProfile();
  const { connected: walletConnected, address: walletAddress } = usePhantomWallet();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [challengeCreated, setChallengeCreated] = useState(false);
  const [showSolModal, setShowSolModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdEntryId, setCreatedEntryId] = useState(null);
  const [createdTxId, setCreatedTxId] = useState(null);
  const userChangedDate = useRef(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      title: '',
      description: '',
      durationDays: 7,
      endDate: addDays(new Date(), 7),
      stakeAmount: 0.1,
      frequency: '3x_week',
      isPublic: true,
      targetMetric: '',
    },
  });

  // Auto-sync endDate with duration slider until the user manually picks a date
  const durationDays = watch('durationDays');
  useEffect(() => {
    if (!userChangedDate.current) {
      setValue('endDate', addDays(new Date(), durationDays));
    }
  }, [durationDays, setValue]);

  // ─── Live pot preview values ────────────────────────────────────
  const stakeAmount = watch('stakeAmount') || 0;
  const isPublic = watch('isPublic');
  const estimatedParticipants = isPublic ? 8 : 3;
  const totalPot = stakeAmount * estimatedParticipants;
  const platformFee = totalPot * PLATFORM_FEE_RATE;
  const potAfterFee = totalPot - platformFee;
  const maxWin = potAfterFee; // sole winner takes the entire pot after fee

  // ─── Submit: create entity → toast → open staking modal ─────────
  const onSubmit = async (data) => {
    if (!walletConnected) {
      toast({ title: 'Wallet required', description: 'Connect your Phantom wallet to continue.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const freq = FREQ_CONFIG[data.frequency];
      const now = new Date();
      const endDateStr = data.endDate.toISOString().split('T')[0];
      const checkinsRequired = Math.round(freq.perWeek * (data.durationDays / 7));

      // 1. Create the Challenge entity
      const challenge = await base44.entities.Challenge.create({
        title: data.title,
        description: data.description,
        duration_days: data.durationDays,
        end_date: endDateStr,
        stake_amount: data.stakeAmount,
        frequency: data.frequency,
        is_public: data.isPublic,
        creator: walletAddress,
        status: 'active',
        proof_requirement: 'camera-only',
        target_metric: data.targetMetric || '',
        // Legacy fields for backward compatibility with Challenges page & ChallengeEntry
        tier: freq.tier,
        week_start: now.toISOString().split('T')[0],
        week_end: endDateStr,
        sol_total_pot: data.stakeAmount,
        participant_count: 1,
      });

      // 2. Create ChallengeEntry linking the creator to their challenge
      const entry = await base44.entities.ChallengeEntry.create({
        challenge_id: challenge.id,
        user_id: profile.user_id,
        username: profile.username,
        tier: freq.tier,
        sol_stake_amount: data.stakeAmount,
        checkins_required: checkinsRequired,
        checkins_completed: 0,
        status: 'active',
      });
      setCreatedEntryId(entry.id);

      // 3. Update user profile totals
      await base44.entities.UserProfile.update(profile.id, {
        total_sol_staked: (profile.total_sol_staked || 0) + data.stakeAmount,
        wallet_address: walletAddress,
      });

      // 4. Record the stake transaction (tx signature filled after SOL confirm)
      const tx = await base44.entities.Transaction.create({
        user_id: profile.user_id,
        type: 'stake',
        amount: data.stakeAmount,
        description: `Staked on "${data.title}"`,
        tx_signature: '',
      });
      setCreatedTxId(tx.id);

      await refetch();
      setChallengeCreated(true);

      toast({ title: 'Challenge Created! 🏆', description: 'Now confirm your SOL stake to go live.' });

      // TODO: Replace direct treasury transfer with an on-chain escrow program
      // (Solana smart contract) that holds staked SOL trustlessly and
      // auto-distributes to winners based on verified check-in data.
      setShowSolModal(true);
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Could not create challenge.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── SOL stake confirmed → save tx signature → success screen ──
  const handleSolSuccess = async (txSig) => {
    try {
      if (createdEntryId) {
        await base44.entities.ChallengeEntry.update(createdEntryId, { sol_tx_signature: txSig });
      }
      if (createdTxId) {
        await base44.entities.Transaction.update(createdTxId, { tx_signature: txSig });
      }
    } catch (err) {
      console.error('Could not save tx signature', err);
    }
    setSuccess(true);
  };

  // ─── Loading state ──────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Success screen ─────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-8 min-h-screen flex flex-col items-center justify-center text-center gap-6">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="relative w-28 h-28 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 border-2 border-primary/40 glow-primary" />
          <Check className="w-14 h-14 text-primary" strokeWidth={3} />
        </motion.div>
        <div>
          <h2 className="text-2xl font-black font-heading text-gradient-gold">Challenge Live!</h2>
          <p className="text-muted-foreground mt-2">Your SOL is staked. Time to sweat. 🔥</p>
        </div>
        <Button onClick={() => navigate('/')} className="font-bold font-heading rounded-2xl px-8 bg-gradient-to-r from-primary to-yellow-500 shadow-lg shadow-primary/30">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // ─── Pending stake (modal closed without confirming) ────────────
  if (challengeCreated && !showSolModal) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-8 min-h-screen flex flex-col items-center justify-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center">
          <Wallet className="w-10 h-10 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl font-black font-heading text-gradient-gold">Stake Pending</h2>
          <p className="text-muted-foreground mt-2 max-w-xs">Your challenge is created but not yet funded. Confirm your SOL stake to activate it.</p>
        </div>
        <Button onClick={() => setShowSolModal(true)} className="font-bold font-heading rounded-2xl px-8 bg-gradient-to-r from-primary to-yellow-500 shadow-lg shadow-primary/30">
          Stake {stakeAmount} SOL Now
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">Do it later</Button>
      </div>
    );
  }

  // ─── Main form ──────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-black font-heading text-gradient-gold">Create Challenge</h1>
        <div className="ml-auto">
          <PhantomWalletButton />
        </div>
      </div>

      {/* Hero */}
      <Card className="glass-card rounded-3xl p-6 mb-6 text-center relative overflow-hidden border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet/5 pointer-events-none" />
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3 glow-primary"
          >
            <Trophy className="w-7 h-7 text-primary" />
          </motion.div>
          <h2 className="text-lg font-black font-heading text-foreground">Put Your SOL Where Your Sweat Is</h2>
          <p className="text-sm text-muted-foreground mt-1">Stake real SOL, hit your goals, claim the pot. Miss out? You lose your stake.</p>
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">Challenge Title</Label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g. Summer Shred Showdown"
                className="bg-card border-border rounded-2xl h-12"
                maxLength={50}
              />
            )}
          />
          {errors.title && <p className="text-xs text-destructive mt-1 font-medium">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="What's the challenge? Rules, goals, motivation..."
                className="bg-card border-border rounded-2xl min-h-[100px] resize-none"
                maxLength={300}
              />
            )}
          />
          {errors.description && <p className="text-xs text-destructive mt-1 font-medium">{errors.description.message}</p>}
        </div>

        {/* Duration Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-bold font-heading text-foreground">Duration</Label>
            <span className="text-sm font-black text-primary">{durationDays} days</span>
          </div>
          <Controller
            name="durationDays"
            control={control}
            render={({ field }) => (
              <Slider
                value={[field.value]}
                onValueChange={(vals) => field.onChange(vals[0])}
                min={7}
                max={90}
                step={1}
                className="py-2"
              />
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1 week</span>
            <span>3 months</span>
          </div>
          {errors.durationDays && <p className="text-xs text-destructive mt-1 font-medium">{errors.durationDays.message}</p>}
        </div>

        {/* End Date */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">End Date</Label>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-card border-border rounded-2xl h-12 justify-start font-semibold text-foreground"
                  >
                    <Target className="w-4 h-4 mr-2 text-primary" />
                    {field.value ? format(field.value, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        userChangedDate.current = true;
                        field.onChange(date);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.endDate && <p className="text-xs text-destructive mt-1 font-medium">{errors.endDate.message}</p>}
        </div>

        {/* Stake Amount */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">Stake Amount (SOL)</Label>
          <div className="relative">
            <Controller
              name="stakeAmount"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  className="bg-card border-border rounded-2xl h-12 pr-16 text-lg font-bold"
                />
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet">SOL</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Min: 0.01 SOL</span>
            <span className="text-xs text-muted-foreground">Max: 10 SOL</span>
          </div>
          {errors.stakeAmount && <p className="text-xs text-destructive mt-1 font-medium">{errors.stakeAmount.message}</p>}
        </div>

        {/* Frequency */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">Check-in Frequency</Label>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-card border-border rounded-2xl h-12 font-semibold">
                  <Flame className="w-4 h-4 mr-2 text-primary" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(FREQ_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="font-medium">
                      {cfg.label} ({cfg.perWeek}× per week)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.frequency && <p className="text-xs text-destructive mt-1 font-medium">{errors.frequency.message}</p>}
        </div>

        {/* Target Metric (optional) */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">Target Metric <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Controller
            name="targetMetric"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g. gym sessions, miles run, weight lifted"
                className="bg-card border-border rounded-2xl h-12"
                maxLength={60}
              />
            )}
          />
        </div>

        {/* Privacy Switch */}
        <div>
          <Label className="text-sm font-bold font-heading text-foreground mb-2 block">Visibility</Label>
          <Card className="glass-card rounded-2xl p-4 flex items-center justify-between border-0">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-primary" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{isPublic ? 'Public' : 'Private'}</p>
                <p className="text-xs text-muted-foreground">{isPublic ? 'Anyone can join the pot' : 'Invite-only challenge'}</p>
              </div>
            </div>
            <Controller
              name="isPublic"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </Card>
        </div>

        {/* ─── Live Pot Preview ─────────────────────────────────── */}
        <Card className="premium-card premium-border-glow rounded-3xl p-5 border-0 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black font-heading text-foreground uppercase tracking-wide">Live Pot Preview</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-secondary/40 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  Est. Participants
                </div>
                <p className="text-lg font-black text-foreground">{estimatedParticipants}</p>
              </div>
              <div className="bg-secondary/40 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Wallet className="w-3 h-3" />
                  Your Stake
                </div>
                <p className="text-lg font-black text-foreground">{stakeAmount.toFixed(2)} <span className="text-violet text-sm">SOL</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Pot</span>
                <span className="font-bold text-foreground">{totalPot.toFixed(2)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee (5%)</span>
                <span className="font-bold text-muted-foreground">−{platformFee.toFixed(2)} SOL</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Pot After Fee</span>
                <span className="font-black text-gradient-gold text-base">{potAfterFee.toFixed(2)} SOL</span>
              </div>
            </div>

            <div className="mt-4 bg-gradient-to-r from-primary/10 to-violet/10 rounded-2xl p-3 border border-primary/20">
              <p className="text-xs text-muted-foreground">🏆 You could win up to</p>
              <p className="text-2xl font-black text-gradient-gold">{maxWin.toFixed(2)} SOL</p>
              <p className="text-xs text-muted-foreground mt-0.5">if you're the sole winner</p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          disabled={submitting || !walletConnected}
          className="w-full h-14 text-base font-black font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5 mr-2" /> Create & Stake {stakeAmount.toFixed(2)} SOL
            </>
          )}
        </Button>

        {!walletConnected && (
          <p className="text-xs text-destructive text-center font-semibold flex items-center justify-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Connect your Phantom wallet to continue
          </p>
        )}
      </form>

      {/* SOL Staking Modal */}
      <StakeSolModal
        open={showSolModal}
        amount={stakeAmount}
        onClose={() => setShowSolModal(false)}
        onSuccess={handleSolSuccess}
      />
    </div>
  );
}