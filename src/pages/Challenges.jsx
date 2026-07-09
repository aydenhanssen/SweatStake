import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useProfile } from '@/hooks/useProfile';
import { TIERS, MIN_SOL_STAKE } from '@/lib/constants';
import TierBadge from '@/components/shared/TierBadge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Lock, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PhantomWalletButton from '@/components/wallet/PhantomWalletButton';
import StakeSolModal from '@/components/wallet/StakeSolModal';
import { usePhantomWallet } from '@/lib/phantomWallet';

export default function Challenges() {
  const { profile, refetch } = useProfile();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [solStakeAmount, setSolStakeAmount] = useState(0.1);
  const [joining, setJoining] = useState(false);
  const [showSolModal, setShowSolModal] = useState(false);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connected: walletConnected, address: walletAddress } = usePhantomWallet();

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
    if (!walletConnected) {
      toast({ title: 'Wallet required', description: 'Connect your Phantom wallet to join.', variant: 'destructive' });
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
    setPendingChallenge(challenge);
    setShowSolModal(true);
  };

  const handleSolSuccess = async (txSig, solAmount) => {
    if (!pendingChallenge) return;
    const challenge = pendingChallenge;
    const tier = TIERS[challenge.tier];
    setJoining(true);
    try {
      await base44.entities.ChallengeEntry.create({
        challenge_id: challenge.id,
        user_id: profile.user_id,
        username: profile.username,
        tier: challenge.tier,
        sol_stake_amount: solAmount,
        sol_tx_signature: txSig,
        checkins_required: tier.workouts,
      });
      await base44.entities.Challenge.update(challenge.id, {
        sol_total_pot: (challenge.sol_total_pot || 0) + solAmount,
        participant_count: challenge.participant_count + 1,
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
        tx_signature: txSig,
      });
      toast({ title: 'You\'re in! 🔥', description: `Staked ${solAmount} SOL on the ${tier.label} challenge.` });
      navigate('/');
    } catch (err) {
      toast({ title: 'Error', description: 'Could not join challenge.', variant: 'destructive' });
    } finally {
      setJoining(false);
      setPendingChallenge(null);
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
    <div className="max-w-lg mx-auto px-5 pt-8 pb-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-black font-heading text-gradient-gold">Join a Challenge</h1>
        <div className="ml-auto">
          <PhantomWalletButton />
        </div>
      </div>

      {!walletConnected && (
        <div className="glass-card border-violet/30 rounded-2xl p-4 mb-6 text-center glow-violet">
          <p className="text-sm text-foreground font-semibold">Connect your Phantom wallet to join and stake SOL</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(TIERS).map(([key, tier]) => {
          const ch = challenges.find(c => c.tier === key);
          const isLocked = !isPremium && key !== 'bronze';
          const isSelected = selectedTier === key;

          return (
            <div
              key={key}
              className={`premium-card rounded-3xl p-5 transition-all cursor-pointer ${
                isSelected ? 'border-primary/50 glow-primary' : ''
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
                  <span>Up to {tier.maxSolStake} SOL</span>
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
                  <div className="mb-4">
                    <label className="text-sm font-bold text-foreground mb-2 block">SOL Stake</label>
                    <Input
                      type="number"
                      value={solStakeAmount}
                      onChange={(e) => setSolStakeAmount(parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min={MIN_SOL_STAKE}
                      max={tier.maxSolStake}
                      className="bg-secondary border-border rounded-2xl h-11 font-bold"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Min {MIN_SOL_STAKE} SOL · Max {tier.maxSolStake} SOL</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Current pot: <span className="font-semibold text-gradient-gold">{(ch.sol_total_pot || 0).toFixed(2)} SOL</span>
                  </p>
                  <Button
                    onClick={() => handleJoin(ch)}
                    disabled={joining || !walletConnected}
                    className="w-full h-12 font-black font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30"
                  >
                    {joining ? 'Joining...' : `Stake ${solStakeAmount} SOL`}
                  </Button>
                  {!walletConnected && (
                    <p className="text-xs text-destructive text-center mt-2 font-semibold">Connect Phantom to join</p>
                  )}
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

      <StakeSolModal
        open={showSolModal}
        amount={solStakeAmount}
        onClose={() => { setShowSolModal(false); setPendingChallenge(null); }}
        onSuccess={handleSolSuccess}
      />
    </div>
  );
}