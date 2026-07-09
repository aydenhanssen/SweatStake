import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { TIERS, PLATFORM_FEE, MIN_SOL_STAKE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Lock, Crown, Globe, Check, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import PhantomWalletButton from '@/components/wallet/PhantomWalletButton';
import StakeSolModal from '@/components/wallet/StakeSolModal';
import { usePhantomWallet } from '@/lib/phantomWallet';

const DURATIONS = [
  { key: '1w', label: '1 Week', weeks: 1 },
  { key: '2w', label: '2 Weeks', weeks: 2 },
  { key: '1m', label: '1 Month', weeks: 4 },
];

export default function CreateChallenge() {
  const { profile, refetch } = useProfile();
  const [name, setName] = useState('');
  const [selectedTier, setSelectedTier] = useState('bronze');
  const [duration, setDuration] = useState('1w');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [solStakeAmount, setSolStakeAmount] = useState(0.1);
  const [showSolModal, setShowSolModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connected: walletConnected, address: walletAddress } = usePhantomWallet();

  const tier = TIERS[selectedTier];
  const dur = DURATIONS.find(d => d.key === duration);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Name required', description: 'Give your challenge a name.', variant: 'destructive' });
      return;
    }
    if (solStakeAmount < MIN_SOL_STAKE) {
      toast({ title: 'Stake too low', description: `Minimum stake is ${MIN_SOL_STAKE} SOL.`, variant: 'destructive' });
      return;
    }
    if (solStakeAmount > tier.maxSolStake) {
      toast({ title: 'Stake too high', description: `Maximum stake for ${tier.label} is ${tier.maxSolStake} SOL.`, variant: 'destructive' });
      return;
    }
    if (!walletConnected) {
      toast({ title: 'Wallet required', description: 'Connect your Phantom wallet to create a challenge.', variant: 'destructive' });
      return;
    }
    setShowSolModal(true);
  };

  const handleSolSuccess = async (txSig, solAmount) => {
    await createChallenge(txSig, solAmount);
  };

  const createChallenge = async (solTxSig, solAmount) => {
    setSubmitting(true);
    try {
      const now = new Date();
      const weekStart = new Date(now);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + dur.weeks * 7);

      const challenge = await base44.entities.Challenge.create({
        tier: selectedTier,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        status: 'active',
        sol_total_pot: solAmount,
        participant_count: 1,
      });

      await base44.entities.ChallengeEntry.create({
        challenge_id: challenge.id,
        user_id: profile.user_id,
        username: profile.username,
        tier: selectedTier,
        sol_stake_amount: solAmount,
        sol_tx_signature: solTxSig,
        checkins_required: tier.workouts,
        checkins_completed: 0,
        status: 'active',
      });

      await base44.entities.UserProfile.update(profile.id, {
        total_sol_staked: (profile.total_sol_staked || 0) + solAmount,
        wallet_address: walletAddress,
      });

      await base44.entities.Transaction.create({
        user_id: profile.user_id,
        type: 'stake',
        amount: solAmount,
        description: `Staked on ${tier.label} challenge`,
        tx_signature: solTxSig,
      });

      await refetch();
      setSuccess(true);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not create challenge. Try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
          <h2 className="text-2xl font-black font-heading text-gradient-gold">Challenge Created!</h2>
          <p className="text-muted-foreground mt-2">You staked {solStakeAmount} SOL. Time to sweat.</p>
        </div>
        <Button onClick={() => navigate('/')} className="font-bold font-heading rounded-2xl px-8 bg-gradient-to-r from-primary to-yellow-500 shadow-lg shadow-primary/30">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isPremium = profile.is_premium;

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-black font-heading text-gradient-gold">Create Challenge</h1>
        <div className="ml-auto">
          <PhantomWalletButton />
        </div>
      </div>

      {/* Challenge Name */}
      <div className="mb-5">
        <label className="text-sm font-bold font-heading text-foreground mb-2 block">Challenge Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Monday Mayhem"
          className="bg-card border-border rounded-2xl h-12"
          maxLength={40}
        />
      </div>

      {/* Tier Selection */}
      <div className="mb-5">
        <label className="text-sm font-bold font-heading text-foreground mb-3 block">Difficulty Tier</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(TIERS).map(([key, t]) => {
            const isLocked = !isPremium && key !== 'bronze';
            const isSelected = selectedTier === key;
            return (
              <button
                key={key}
                onClick={() => !isLocked && setSelectedTier(key)}
                disabled={isLocked}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-primary/50 bg-primary/10 glow-primary'
                    : 'glass-card hover:border-primary/30'
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
                <p className={`font-black font-heading text-base ${t.color}`}>{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.workouts}x / week</p>
                <p className="text-xs text-muted-foreground mt-2">Up to {t.maxSolStake} SOL</p>
                {isLocked && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                    <Crown className="w-3 h-3" />
                    <span className="font-semibold">Premium</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">You'll only compete against others in the {tier.label} tier.</p>
      </div>

      {/* Duration */}
      <div className="mb-5">
        <label className="text-sm font-bold font-heading text-foreground mb-3 block">Duration</label>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDuration(d.key)}
              className={`rounded-2xl border py-3 text-sm font-bold font-heading transition-all ${
                duration === d.key
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'glass-card text-muted-foreground hover:border-primary/30'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* SOL Stake Amount */}
      <div className="mb-5">
        <label className="text-sm font-bold font-heading text-foreground mb-2 block">Stake SOL (via Phantom)</label>
        <div className="relative">
          <Input
            type="number"
            value={solStakeAmount}
            onChange={(e) => setSolStakeAmount(parseFloat(e.target.value) || 0)}
            step="0.01"
            min={MIN_SOL_STAKE}
            max={tier.maxSolStake}
            className="bg-card border-border rounded-2xl h-12 pr-16 text-lg font-bold"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-violet">SOL</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">Min: {MIN_SOL_STAKE} SOL</span>
          <span className="text-xs text-muted-foreground">Max for {tier.label}: {tier.maxSolStake} SOL</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {walletConnected
            ? 'You\'ll confirm this transaction in Phantom before your challenge goes live.'
            : 'Connect your Phantom wallet to stake SOL.'}
        </p>
      </div>

      {/* Privacy Toggle */}
      <div className="mb-6">
        <label className="text-sm font-bold font-heading text-foreground mb-3 block">Visibility</label>
        <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Globe className="w-5 h-5 text-primary" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-bold text-foreground">{isPublic ? 'Public' : 'Private'}</p>
              <p className="text-xs text-muted-foreground">{isPublic ? 'Anyone can join' : 'Invite only'}</p>
            </div>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>
      </div>

      {/* Summary */}
      <div className="glass-card rounded-2xl p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Workouts required</span>
          <span className="font-bold text-foreground">{tier.workouts}x / week</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-bold text-foreground">{dur.label}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Your stake</span>
          <span className="font-bold text-gradient-gold">{solStakeAmount} SOL</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform fee on loss</span>
          <span className="font-bold text-muted-foreground">{PLATFORM_FEE * 100}%</span>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={submitting || !name.trim() || solStakeAmount < MIN_SOL_STAKE || !walletConnected}
        className="w-full h-14 text-base font-black font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...
          </>
        ) : (
          <>Confirm & Stake {solStakeAmount} SOL</>
        )}
      </Button>
      {!walletConnected && (
        <p className="text-xs text-destructive text-center mt-2 font-semibold">Connect Phantom wallet to continue</p>
      )}

      <StakeSolModal
        open={showSolModal}
        amount={solStakeAmount}
        onClose={() => setShowSolModal(false)}
        onSuccess={handleSolSuccess}
      />
    </div>
  );
}