import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";

const TREASURY_WALLET = "8rPBSaGka2NiHpDdgufVoVvnPzEcnVwN49i5yf3pnk5h";

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stakeAmount, setStakeAmount] = useState(0.5);
  const [submitting, setSubmitting] = useState(false);

  const balance = wallet.balance ?? 0;
  const estimatedPot = (stakeAmount || 0) * 10;

  const handleCreateAndStake = async (e) => {
    e.preventDefault();

    if (!wallet.connected) {
      toast.error("Please connect your Phantom wallet first");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a challenge title");
      return;
    }

    if (stakeAmount <= 0) {
      toast.error("Stake amount must be greater than 0");
      return;
    }

    if (stakeAmount > balance) {
      toast.error(`Insufficient balance. You have ${balance} SOL`);
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      console.log("Staking started");
      const challenge = await base44.entities.Challenge.create({
        title: title.trim(),
        description: description.trim(),
        duration_days: 30,
        stake_amount: stakeAmount,
        is_public: true,
        creator: wallet.address,
        status: "active",
      });

      toast.loading("Staking SOL on Solana...", { id: toastId });

      const result = await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: stakeAmount,
      });

      console.log("Challenge created", challenge);
      toast.success(`Challenge created & ${stakeAmount} SOL staked!`, { id: toastId });
      navigate(`/challenge/${challenge.id}`);
    } catch (error) {
      console.error("Create & stake error:", error);
      toast.error(error.message || "Something went wrong", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl glass-card hover:border-primary/30 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-black font-heading text-gradient-gold">Create Challenge</h1>
      </div>

      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <CardTitle className="font-heading">New SweatStake Challenge</CardTitle>
          </div>
        </CardHeader>

        <CardContent>
          {/* Wallet balance */}
          <div className="flex items-center gap-3 glass-card rounded-2xl p-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet Balance</p>
              <p className="text-lg font-bold text-gradient-gold">{balance.toFixed(4)} SOL</p>
            </div>
            {!wallet.connected && (
              <Button
                size="sm"
                onClick={wallet.connect}
                className="ml-auto font-bold rounded-xl"
              >
                Connect
              </Button>
            )}
          </div>

          <form onSubmit={handleCreateAndStake} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-bold">Challenge Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 30-Day Iron Challenge"
                className="bg-secondary border-border rounded-xl h-11"
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the rules and goals..."
                className="bg-secondary border-border rounded-xl resize-none"
                rows={3}
                disabled={submitting}
              />
            </div>

            {/* Stake amount */}
            <div className="space-y-2">
              <Label htmlFor="stake" className="text-sm font-bold">Stake Amount (SOL)</Label>
              <Input
                id="stake"
                type="number"
                step="0.01"
                min="0.01"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 0)}
                className="bg-secondary border-border rounded-xl h-11"
                disabled={submitting}
              />
            </div>

            {/* Treasury note */}
            <div className="text-xs text-muted-foreground glass-card rounded-xl p-3">
              <span className="font-bold text-foreground">Treasury:</span>{" "}
              {TREASURY_WALLET.slice(0, 8)}...{TREASURY_WALLET.slice(-8)}
            </div>

            {/* Pot preview */}
            <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated Pot (10 participants)</p>
                <p className="text-2xl font-black text-gradient-gold">{estimatedPot.toFixed(2)} SOL</p>
              </div>
              <Trophy className="w-8 h-8 text-primary/50" />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              disabled={submitting || !wallet.connected}
              className="w-full py-7 text-lg font-bold font-heading rounded-2xl bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 shadow-lg shadow-primary/30 disabled:opacity-50"
            >
              {submitting
                ? "Creating & Staking..."
                : `Stake ${stakeAmount} SOL & Create Challenge`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}