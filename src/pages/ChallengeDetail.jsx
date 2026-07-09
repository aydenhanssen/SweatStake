import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Clock, Wallet } from "lucide-react";
import toast from "react-hot-toast";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { connected, address } = usePhantomWallet();
  const { stakeOnChallenge, loading: staking } = useSolanaStake();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (id) fetchChallenge();
  }, [id]);

  const handleJoinAndStake = async (amount = 0.5) => {
    if (!connected) {
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
      await fetchChallenge();
    } catch (error) {
      toast.error(error.message || "Staking failed", { id: toastId });
    }
  };

  if (loading) return <div className="text-center py-20">Loading challenge...</div>;
  if (!challenge) return <div>Challenge not found</div>;

  const progress = Math.round(
    ((challenge.daysCompleted || 0) / (challenge.duration_days || 1)) * 100
  ) || 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{challenge.title}</CardTitle>
              {challenge.description && (
                <CardDescription className="mt-2 text-lg">
                  {challenge.description}
                </CardDescription>
              )}
            </div>
            <Badge variant={challenge.is_public ? "default" : "secondary"}>
              {challenge.is_public ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <Wallet className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{challenge.sol_total_pot || 0} SOL</p>
                <p className="text-sm text-muted-foreground">Total Pot</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{challenge.participant_count || 0}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{challenge.duration_days || 0}</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Trophy className="w-8 h-8 mb-2" />
                <p className="text-3xl font-bold">{progress}%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Join / Stake Button */}
          <Button
            size="lg"
            className="w-full text-lg py-7"
            onClick={() => handleJoinAndStake(challenge.stake_amount || 0.5)}
            disabled={staking}
          >
            {staking ? "Staking SOL..." : `Join & Stake ${challenge.stake_amount || 0.5} SOL`}
          </Button>

          {/* Proofs / Activity Feed (placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Check-in proofs will appear here
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}