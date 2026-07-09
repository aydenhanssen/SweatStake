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

import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";

const formSchema = z.object({
  title: z.string().min(5, "Title is too short"),
  description: z.string().min(10, "Description is too short"),
  durationDays: z.number().min(7).max(90),
  frequency: z.enum(["daily", "3x/week", "5x/week", "custom"]),
  stakeAmount: z.number().min(0.01, "Stake must be at least 0.01 SOL"),
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
    console.log("Form submitted with data:", data); // ← Debug line

    if (!wallet.connected) {
      toast.error("Please connect your Phantom wallet");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      // TODO: Replace with your actual Base44 create call
      const challenge = await /* YOUR CREATE METHOD */ ("Challenge", {
        title: data.title,
        description: data.description,
        duration_days: data.durationDays,
        end_date: data.endDate.toISOString(),
        stake_amount: data.stakeAmount,
        frequency: data.frequency,
        is_public: data.isPublic,
      });

      toast.loading("Staking SOL...", { id: toastId });

      await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: data.stakeAmount,
      });

      toast.success("Challenge created successfully!", { id: toastId });
      navigate(`/challenge/${challenge.id}`);

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create challenge", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
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
            {/* Form fields - keep your original ones here */}
            <div>
              <Label htmlFor="title">Challenge Title</Label>
              <Input id="title" placeholder="Gym 5x a week for 30 days" {...form.register("title")} />
            </div>

            <div>
              <Label htmlFor="description">Describe your goal</Label>
              <Textarea id="description" placeholder="I will..." rows={4} {...form.register("description")} />
            </div>

            <div>
              <Label>Duration ({form.watch("durationDays")} days)</Label>
              <Slider
                min={7}
                max={90}
                value={[form.watch("durationDays")]}
                onValueChange={(v) => form.setValue("durationDays", v[0])}
                className="mt-3"
              />
            </div>

            <div>
              <Label>Stake Amount (SOL)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("stakeAmount", { valueAsNumber: true })}
                className="text-3xl font-bold"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Public Challenge</Label>
              <Switch checked={isPublic} onCheckedChange={(v) => form.setValue("isPublic", v)} />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full py-7 text-lg"
              disabled={isCreating}
            >
              {isCreating ? "Creating Challenge..." : `Stake ${stakeAmount} SOL & Create Challenge`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
