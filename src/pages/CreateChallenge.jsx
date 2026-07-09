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
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  durationDays: z.number().min(7).max(90),
  stakeAmount: z.number().min(0.01),
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
      title: "Gym 5x a week",
      description: "I will go to the gym 5 times per week for 30 days",
      durationDays: 30,
      stakeAmount: 0.5,
      isPublic: true,
      endDate: new Date(Date.now() + 30 * 86400000),
    },
  });

  const stakeAmount = form.watch("stakeAmount");

  const onSubmit = async (data) => {
    console.log("Button clicked - Form data:", data); // This should always print

    if (!wallet.connected) {
      toast.error("Connect your Phantom wallet");
      return;
    }

    setIsCreating(true);
    const toastId = toast.loading("Creating challenge...");

    try {
      // Replace this with your actual Base44 create call
      const challenge = await base44.entities.Challenge.create({
        title: data.title,
        description: data.description,
        duration_days: data.durationDays,
        end_date: data.endDate.toISOString(),
        stake_amount: data.stakeAmount,
        is_public: data.isPublic,
      });

      toast.loading("Staking SOL...", { id: toastId });

      await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: data.stakeAmount,
      });

      toast.success("Success! Challenge created.", { id: toastId });
      navigate(`/challenge/${challenge.id}`);

    } catch (error) {
      console.error(error);
      toast.error("Error: " + (error.message || "Failed"), { id: toastId });
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
          <CardTitle className="text-3xl">Create New SweatStake</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea {...form.register("description")} rows={4} />
            </div>

            <div>
              <Label>Stake Amount (SOL)</Label>
              <Input type="number" step="0.01" {...form.register("stakeAmount", { valueAsNumber: true })} />
            </div>

            <Button type="submit" className="w-full py-7 text-lg" disabled={isCreating}>
              {isCreating ? "Creating..." : `Stake ${stakeAmount} SOL & Create`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
