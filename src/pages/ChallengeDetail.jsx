import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Clock, Wallet, Home } from "lucide-react";
import TierBadge from "@/components/shared/TierBadge";
import PageHeader from "@/components/shared/PageHeader";
import toast from "react-hot-toast";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const wallet = usePhantomWallet();
  const { stakeOnChallenge, loading: staking } = useSolanaStake();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const data = await base44.entities.Challenge.get(id);
        setChallenge(data);
      } catch (err) {
        toast.error("Failed to load challenge");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchChallenge();
  }, [id]);

  const handleJoinAndStake = async (amount = 0.5) => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Staking SOL...");

    try {
      await stakeOnChallenge({
        challengeId: id,
        amountInSOL: amount,
      });

      toast.success(`Successfully staked ${amount} SOL!`, { id: toastId });

      const updated = await base44.entities.Challenge.get(id);
      setChallenge(updated);
    } catch (error) {
      toast.error(error.message || "Staking failed", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!challenge) return <div className="text-center py-20 text-muted-foreground">Challenge not found</div>;

  const progress = Math.round(((challenge.checkins_completed || 0) / (challenge.duration_days || 1)) * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <PageHeader title="Challenge Details" backTo="/challenges" />

      <Card className="premium-card">
        <CardHeader>
          <div className="flex justify-between items-start gap-3">
            <div>
              <CardTitle className="text-3xl font-heading">{challenge.title}</CardTitle>
              {challenge.description && (
                <CardDescription className="mt-2 text-base">
                  {challenge.description}
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {challenge.tier && <TierBadge tier={challenge.tier} size="md" />}
              <Badge variant={challenge.is_public ? "default" : "secondary"}>
                {challenge.is_public ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{(challenge.sol_total_pot || 0).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Pot (SOL)</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{challenge.participant_count || 0}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{challenge.duration_days || 0}</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{progress}%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Stake Button */}
          <Button
            size="lg"
            className="w-full text-lg py-7 font-bold font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30"
            onClick={() => handleJoinAndStake(challenge.stake_amount || 0.5)}
            disabled={staking}
          >
            {staking ? "Staking on Solana..." : `Join & Stake ${(challenge.stake_amount || 0.5)} SOL`}
          </Button>

          {/* Recent Proofs */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Recent Proofs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-12">
                Check-in proofs will appear here
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}