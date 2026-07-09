import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stakeAmount, setStakeAmount] = useState("0.5");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    console.log("CreateChallenge: handleCreate fired", { title, description, stakeAmount });

    if (!title.trim()) {
      toast.error("Please enter a challenge title");
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    if (!wallet.connected) {
      toast.error("Connect your Phantom wallet first");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      // 1. Create the Challenge entity in Base44
      console.log("CreateChallenge: creating entity in Base44...");
      const challenge = await base44.entities.Challenge.create({
        title: title.trim(),
        description: description.trim(),
        stake_amount: amount,
        tier: "bronze",
        status: "active",
        is_public: true,
        sol_total_pot: 0,
        participant_count: 0,
        frequency: "3x_week",
        proof_requirement: "camera-only",
        creator: wallet.address,
        week_start: new Date().toISOString().split("T")[0],
        week_end: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        duration_days: 7,
        end_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      });

      console.log("CreateChallenge: entity created", challenge);

      toast.loading("Staking SOL...", { id: toastId });

      // 2. Call stakeOnChallenge from the hook
      console.log("CreateChallenge: staking SOL...", { challengeId: challenge.id, amount });
      const stakeResult = await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: amount,
      });

      console.log("CreateChallenge: stake result", stakeResult);

      toast.success("Challenge created and SOL staked!", { id: toastId });

      // 3. Navigate to the new challenge detail page
      navigate(`/challenge/${challenge.id}`);
    } catch (error) {
      console.error("CreateChallenge: error", error);
      toast.error(error.message || "Something went wrong", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-3xl font-heading flex items-center gap-3">
            <Trophy className="w-7 h-7 text-primary" />
            Create New SweatStake
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Wallet balance */}
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Wallet Balance</Label>
              <p className="text-xl font-bold font-heading">
                {wallet.connected ? `${wallet.balance || 0} SOL` : "Not connected"}
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Challenge Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 7-Day Push-Up Challenge"
              className="mt-1.5"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the challenge rules and goals..."
              className="mt-1.5"
              rows={3}
            />
          </div>

          {/* Stake amount */}
          <div>
            <Label htmlFor="stake">Stake Amount (SOL)</Label>
            <Input
              id="stake"
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              step="0.01"
              min="0.01"
              className="mt-1.5"
            />
          </div>

          <Button
            onClick={handleCreate}
            className="w-full py-7 text-lg font-bold font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30"
            disabled={isCreating}
          >
            {isCreating ? "Processing..." : `Stake ${stakeAmount} SOL & Create Challenge`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}