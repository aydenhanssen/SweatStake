import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ArrowLeft, Trophy, Users, CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";

import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [stakeAmount, setStakeAmount] = useState(0.5);
  const [isPublic, setIsPublic] = useState(true);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 86400000));

  const estimatedParticipants = isPublic ? 8 : 3;
  const totalPot = (stakeAmount * estimatedParticipants * 0.95).toFixed(2);

  const handleCreate = async () => {
    console.log("Button clicked - starting creation");

    if (!wallet.connected) {
      toast.error("Please connect your Phantom wallet");
      return;
    }

    if (!title || !description) {
      toast.error("Title and description are required");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      console.log("Creating in Base44...");

      const challenge = await base44.entities.Challenge.create({
        title,
        description,
        duration_days: durationDays,
        end_date: endDate.toISOString(),
        stake_amount: stakeAmount,
        frequency: "5x/week",
        is_public: isPublic,
        creator: wallet.publicKey?.toString(),
        status: "active",
      });

      console.log("Challenge created:", challenge.id);

      toast.loading("Opening Phantom to stake SOL...", { id: toastId });

      await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: stakeAmount,
      });

      toast.success("Challenge created and SOL staked!", { id: toastId });
      navigate(`/challenge/${challenge.id}`);

    } catch (error) {
      console.error("Full error:", error);
      toast.error(error.message || "Failed to create challenge", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Trophy className="text-yellow-400" /> Create New SweatStake
          </CardTitle>
          <CardDescription>Skin in the game. Real accountability.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Wallet Balance */}
          <div className="bg-muted p-4 rounded-lg">
            <Label>Your Wallet Balance</Label>
            <p className="text-4xl font-bold mt-1">
              {wallet.balance ? wallet.balance.toFixed(4) : "0"} SOL
            </p>
          </div>

          <div>
            <Label>Challenge Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gym 5x a week for 30 days" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="I will go to the gym..." />
          </div>

          <div>
            <Label>Duration ({durationDays} days)</Label>
            <Slider min={7} max={90} value={[durationDays]} onValueChange={(v) => setDurationDays(v[0])} className="mt-3" />
          </div>

          <div>
            <Label>Stake Amount (SOL)</Label>
            <Input type="number" step="0.01" value={stakeAmount} onChange={(e) => setStakeAmount(parseFloat(e.target.value))} className="text-3xl font-bold" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Public Challenge</Label>
              <p className="text-sm text-muted-foreground">Anyone can join</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button onClick={handleCreate} className="w-full py-7 text-lg" disabled={isCreating}>
            {isCreating ? "Creating & Staking on Solana..." : `Stake ${stakeAmount} SOL & Create Challenge`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
