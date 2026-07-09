import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users, Clock, Wallet } from "lucide-react";
import toast from "react-hot-toast";

// Use your actual hooks (updated to match your project)
import { usePhantomWallet } from "@/lib/phantomWallet";   // ← Change if your hook is named differently
import { useSolanaStake } from "@/hooks/useSolanaStake";

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();        // Navigation hook

  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);

  // Fetch challenge (replace with your actual Base44 call if different)
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        // Update this line to match your Base44 setup
        const data = await /* your base44 get method */("Challenge", id);
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

      toast.success(`Staked ${amount} SOL successfully!`, { id: toastId });
      
      // Refresh data
      const updated = await /* your base44 get method */("Challenge", id);
      setChallenge(updated);
    } catch (error) {
      toast.error(error.message || "Failed to stake", { id: toastId });
    } finally {
      setStaking(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading challenge...</div>;
  if (!challenge) return <div className="text-center py-20">Challenge not found</div>;

  const progress = Math.round(((challenge.daysCompleted || 0) / challenge.duration_days) * 100) || 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>

        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
        >
          🏠 Home
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
            <Badge variant={challenge.is_public ? "default" : "secondary"}>
              {challenge.is_public ? "Public" : "Private"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{challenge.sol_total_pot || 0}</p>
                <p className="text-sm text-muted-foreground">Total Pot</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{challenge.participant_count || 0}</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <p className="text-3xl font-bold">{challenge.duration_days}</p>
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

          {!challenge.participants?.includes(wallet.publicKey?.toString()) && (
            <Button 
              size="lg" 
              className="w-full text-lg py-7"
              onClick={() => handleJoinAndStake(0.5)}
              disabled={staking}
            >
              {staking ? "Staking on Solana..." : `Join & Stake 0.5 SOL`}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
