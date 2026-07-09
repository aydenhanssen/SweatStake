import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBase44 } from "@base44/sdk"; 
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Clock, Wallet } from "lucide-react";
import toast from "react-hot-toast";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { getEntity } = useBase44();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const data = await getEntity("Challenge", id);
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

    setStaking(true);
    const toastId = toast.loading("Staking SOL...");

    try {
      await stakeOnChallenge({
        challengeId: id,
        amountInSOL: amount,
      });

      toast.success(`Successfully staked ${amount} SOL!`, { id: toastId });

      const updated = await getEntity("Challenge", id);
      setChallenge(updated);
    } catch (error) {
      toast.error(error.message || "Staking failed", { id: toastId });
    } finally {
      setStaking(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading challenge...</div>;
  if (!challenge) return <div>Challenge not found</div>;

  const progress = Math.round((challenge.daysCompleted || 0) / challenge.durationDays * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
        >
          Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{challenge.title}</CardTitle>
              <CardDescription className="mt-2 text-lg">
                {challenge.description}
              </CardDescription>
            </div>
            <Badge variant={challenge.isPublic ? "default" : "secondary"}>
              {challenge.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{challenge.totalStaked || 0}</p>
                <p className="text-sm text-muted-foreground">Total Pot (SOL)</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{challenge.participants?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{challenge.durationDays}</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{progress}%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </CardContent>
            </Card>
          </div>

          {/* Stake Button */}
          {!challenge.participants?.some(p => p === wallet.publicKey?.toString()) && (
            <Button 
              size="lg" 
              className="w-full text-lg py-7"
              onClick={() => handleJoinAndStake(0.5)}
              disabled={staking}
            >
              {staking ? "Staking on Solana..." : `Join & Stake 0.5 SOL`}
            </Button>
          )}

          {/* Future: Check-ins section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Proofs</CardTitle>
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
