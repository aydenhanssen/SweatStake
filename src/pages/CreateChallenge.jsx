import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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

// Use your actual hooks
import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Describe your goal"),
  durationDays: z.number().min(7).max(90),
  frequency: z.enum(["daily", "3x/week", "5x/week", "custom"]),
  stakeAmount: z.number().min(0.01).max(10),
  isPublic: z.boolean(),
  endDate: z.date(),
});

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [isCreating, setIsCreating] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      durationDays: 30,
      frequency: "5x/week",
      stakeAmount: 0.5,
      isPublic: true,
      endDate: new Date(Date.now() + 30 * 86400000),
    },
  });

  const stakeAmount = form.watch("stakeAmount");
  const isPublic = form.watch("isPublic");

  const estimatedParticipants = isPublic ? 8 : 3;
  const totalPot = (stakeAmount * estimatedParticipants * 0.95).toFixed(2);

  const onSubmit = async (data) => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      // Create entity using your actual Base44 method
      const challenge = await /* your create method */("Challenge", {
        title: data.title,
        description: data.description,
        duration_days: data.durationDays,
        end_date: data.endDate.toISOString(),
        stake_amount: data.stakeAmount,
        frequency: data.frequency,
        is_public: data.isPublic,
        creator: wallet.publicKey?.toString(),
        status: "active",
        total_pot: 0,
      });

      toast.loading("Staking SOL...", { id: toastId });

      await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: data.stakeAmount,
      });

      toast.success("Challenge created and SOL staked!", { id: toastId });

      // Go to the new challenge
      navigate(`/challenge/${challenge.id}`);

    } catch (error) {
      toast.error(error.message || "Failed to create challenge", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-8 border-b pb-4">
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
          🏠 Home
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <Trophy className="w-8 h-8 text-yellow-400" /> 
            Create New SweatStake
          </CardTitle>
          <CardDescription>Skin in the game. Real accountability.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Your existing form fields remain the same */}
            {/* ... (title, description, duration, stake, etc.) ... */}

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg py-7 font-semibold"
              disabled={isCreating || !wallet.connected}
            >
              {isCreating 
                ? "Creating + Staking on Solana..." 
                : `Stake ${stakeAmount} SOL & Create Challenge`
              }
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
