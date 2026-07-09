import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { usePhantomWallet } from "@/lib/phantomWallet";

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();

  const testStake = async () => {
    toast("Button clicked - testing...");

    if (!wallet.connected) {
      toast.error("Wallet not connected");
      return;
    }

    toast.success("Wallet is connected! (Test passed)");
    // TODO: Add real staking later
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New SweatStake</CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <p className="text-2xl mb-6">Balance: {wallet.balance || "0"} SOL</p>

          <Button onClick={testStake} className="w-full py-8 text-xl">
            Test Button - Click Me
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
