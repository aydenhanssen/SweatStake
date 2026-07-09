import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy } from "lucide-react";
import toast from "react-hot-toast";

import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!wallet.connected) {
      toast.error("Connect Phantom wallet");
      return;
    }

    setIsCreating(true);
    toast.loading("Creating challenge...");

    try {
      // Simple test - replace with your real Base44 call
      const challenge = { id: "test123" }; // temporary

      await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: 0.5,
      });

      toast.success("Challenge created!");
      navigate("/challenges"); // or / 

    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-3">
            <Trophy /> Create New SweatStake
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div>
            <Label>Wallet Balance</Label>
            <p className="text-2xl font-bold">{wallet.balance || "0"} SOL</p>
          </div>

          <div>
            <Label>Stake Amount (SOL)</Label>
            <Input type="number" defaultValue="0.5" step="0.01" />
          </div>

          <Button 
            onClick={handleCreate}
            className="w-full py-8 text-xl"
            disabled={isCreating}
          >
            {isCreating ? "Processing..." : "Stake SOL & Create Challenge"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
