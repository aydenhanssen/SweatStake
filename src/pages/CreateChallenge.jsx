import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { CalendarIcon, Trophy, Users } from "lucide-react";
import { useBase44 } from "@base44/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaStake } from "@/hooks/useSolanaStake";
import toast from "react-hot-toast";

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
  const { createEntity } = useBase44();
  const wallet = useWallet();
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
      toast.error("Please connect your Phantom wallet first");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      // 1. Create challenge record in Base44
      const challenge = await createEntity("Challenge", {
        title: data.title,
        description: data.description,
        durationDays: data.durationDays,
        endDate: data.endDate.toISOString(),
        stakeAmount: data.stakeAmount,
        frequency: data.frequency,
        isPublic: data.isPublic,
        creator: wallet.publicKey.toString(),
        status: "active",
        proofRequirement: "camera-only",
        totalStaked: 0,
        participants: [],
      });

      toast.loading("Staking SOL on Solana...", { id: toastId });

      // 2. Stake SOL
      const stakeResult = await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: data.stakeAmount,
        // network: "mainnet"   // ← Uncomment when ready for mainnet
      });

      toast.success(`Challenge created successfully! ${data.stakeAmount} SOL staked.`, { 
        id: toastId,
        duration: 6000 
      });

      // Optional: redirect to challenge page
      // navigate(`/challenge/${challenge.id}`);

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
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
            {/* Title */}
            <div>
              <Label htmlFor="title">Challenge Title</Label>
              <Input
                id="title"
                placeholder="e.g. Gym 5x a week for 30 days"
                {...form.register("title")}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Describe your goal</Label>
              <Textarea
                id="description"
                placeholder="I will go to the gym 5 times per week..."
                rows={4}
                {...form.register("description")}
              />
            </div>

            {/* Duration */}
            <div>
              <Label>Duration ({form.watch("durationDays")} days)</Label>
              <Slider
                min={7}
                max={90}
                step={1}
                value={[form.watch("durationDays")]}
                onValueChange={(v) => form.setValue("durationDays", v[0])}
                className="mt-3"
              />
            </div>

            {/* End Date */}
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-2">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.watch("endDate"), "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={form.watch("endDate")}
                    onSelect={(date) => form.setValue("endDate", date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Stake Amount */}
            <div>
              <Label>Your Stake (SOL)</Label>
              <div className="flex items-center gap-3 mt-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="text-3xl font-bold h-14"
                  {...form.register("stakeAmount", { valueAsNumber: true })}
                />
                <span className="text-2xl font-mono">SOL</span>
              </div>
            </div>

            {/* Pot Preview */}
            <Card className="bg-gradient-to-r from-purple-950 to-blue-950 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Pot</p>
                    <p className="text-4xl font-bold">{totalPot} SOL</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{estimatedParticipants} participants • 5% fee
                </p>
              </CardContent>
            </Card>

            {/* Public Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Public Challenge</Label>
                <p className="text-sm text-muted-foreground">Anyone can join and stake</p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={(checked) => form.setValue("isPublic", checked)}
              />
            </div>

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
