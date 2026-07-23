import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { base44 } from "@/api/base44Client";
import { usePhantomWallet } from "@/lib/phantomWallet";
import { useSolanaStake } from "@/hooks/useSolanaStake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Wallet, Zap } from "lucide-react";

export default function CreateChallenge() {
  const navigate = useNavigate();
  const wallet = usePhantomWallet();
  const { stakeOnChallenge } = useSolanaStake();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stakeAmount, setStakeAmount] = useState(0.1);
  const [submitting, setSubmitting] = useState(false);

  const balance = wallet.balance;
  const balanceLabel = wallet.balanceLoading
    ? "Loading…"
    : balance !== null
    ? `${balance.toFixed(4)} SOL`
    : wallet.connected
    ? "—"
    : "Not connected";

  const handleCreate = async () => {
    console.log("Starting creation", { title, description, stakeAmount, connected: wallet.connected });

    if (!title.trim()) {
      toast.error("Enter a challenge title");
      return;
    }
    if (!stakeAmount || stakeAmount <= 0) {
      toast.error("Enter a stake amount");
      return;
    }

    // Ensure wallet is connected
    if (!wallet.connected) {
      console.log("Wallet not connected, connecting…");
      try {
        await wallet.connect();
      } catch (err) {
        console.error("Wallet connect failed:", err);
        toast.error("Could not connect Phantom wallet");
        return;
      }
    }

    setSubmitting(true);
    const loadingId = toast.loading("Creating challenge…");

    try {
      // 1. Create the Challenge entity in Base44 first (need its id for staking)
      console.log("Creating in Base44");
      const today = new Date();
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);

      const challenge = await base44.entities.Challenge.create({
        title: title.trim(),
        description: description.trim(),
        tier: "bronze",
        week_start: today.toISOString().slice(0, 10),
        week_end: weekEnd.toISOString().slice(0, 10),
        status: "active",
        stake_amount: Number(stakeAmount),
        sol_total_pot: 0,
        participant_count: 0,
        is_public: true,
        frequency: "3x_week",
        duration_days: 7,
        end_date: weekEnd.toISOString().slice(0, 10),
        proof_requirement: "camera-only",
        creator: wallet.address || "",
      });

      console.log("Challenge created with ID:", challenge.id);

      // 2. Stake — opens Phantom for real SOL transfer to treasury
      console.log("Calling stakeOnChallenge", { challengeId: challenge.id, amountInSOL: Number(stakeAmount) });
      toast.loading("Opening Phantom to confirm stake…", { id: loadingId });

      const stakeResult = await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: Number(stakeAmount),
      });

      console.log("Staking completed", stakeResult);

      // 3. Success + navigate
      toast.success("Challenge created & SOL staked!", { id: loadingId });
      console.log("Navigating to detail page", `/challenge/${challenge.id}`);
      navigate(`/challenge/${challenge.id}`);
    } catch (err) {
      console.error("❌ Create/stake failed:", err);
      toast.error(err?.message || "Something went wrong", { id: loadingId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 max-w-lg mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-heading font-bold mb-1">Create a Challenge</h1>
      <p className="text-sm text-muted-foreground mb-6">Stake SOL, commit, and compete for the pot.</p>

      {/* Wallet balance */}
      <div className="relative overflow-hidden flex items-center gap-4 glass-balance premium-border-glow rounded-[1.75rem] p-5 mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-violet/15 rounded-full blur-3xl" />
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/25 to-violet/25 flex items-center justify-center border border-primary/20">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div className="relative flex-1">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Wallet Balance</p>
          <p className="text-2xl font-black text-gradient-gold font-heading drop-shadow-[0_0_16px_hsl(43_96%_56%_/_0.3)]">{balanceLabel}</p>
        </div>
        {!wallet.connected && (
          <Button size="sm" onClick={() => wallet.connect()} disabled={wallet.connecting} className="rounded-xl glow-violet">
            {wallet.connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
          </Button>
        )}
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1.5 block">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 5K Run Challenge"
          className="rounded-xl"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1.5 block">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's the goal? Rules? Rewards?"
          rows={3}
          className="rounded-xl"
        />
      </div>

      {/* Stake amount */}
      <div className="mb-8">
        <label className="text-sm font-medium mb-1.5 block">Stake Amount (SOL)</label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          className="rounded-xl"
        />
      </div>

      {/* Main button */}
      <Button
        onClick={handleCreate}
        disabled={submitting}
        size="lg"
        className="w-full h-16 text-lg font-black font-heading rounded-3xl bg-gradient-to-r from-primary via-yellow-400 to-yellow-500 hover:brightness-110 text-primary-foreground btn-glow-gold ring-2 ring-primary/30 ring-offset-2 ring-offset-background animate-glow-pulse transition-all hover:scale-[1.02]"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Working…
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" /> Create & Stake {stakeAmount || 0} SOL
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Clicking creates your challenge and opens Phantom to confirm the SOL transfer.
      </p>
    </div>
  );
}