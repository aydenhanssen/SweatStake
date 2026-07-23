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
    console.log("Button clicked", { title, description, stakeAmount, connected: wallet.connected });

    if (!title.trim()) {
      toast.error("Enter a challenge title");
      return;
    }
    if (!stakeAmount || stakeAmount <= 0) {
      toast.error("Enter a stake amount");
      return;
    }

    // 1. Check wallet
    if (!wallet.connected) {
      console.log("Wallet not connected, connecting…");
      toast("Connecting Phantom…");
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
      // 2. Create the Challenge entity in Base44
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

      console.log("✅ Challenge created in Base44:", challenge.id);

      // 3. Immediately call stakeOnChallenge — opens Phantom for real SOL transfer
      console.log("Calling stakeOnChallenge", { challengeId: challenge.id, amountInSOL: Number(stakeAmount) });
      toast.loading("Opening Phantom to confirm stake…", { id: loadingId });

      const stakeResult = await stakeOnChallenge({
        challengeId: challenge.id,
        amountInSOL: Number(stakeAmount),
      });

      console.log("✅ Stake result:", stakeResult);
      toast.success("Challenge created & SOL staked!", { id: loadingId });

      // 5. Navigate to challenge detail
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
      <div className="flex items-center gap-3 glass-card rounded-2xl p-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Wallet Balance</p>
          <p className="text-lg font-bold text-gradient-gold">{balanceLabel}</p>
        </div>
        {!wallet.connected && (
          <Button size="sm" onClick={() => wallet.connect()} disabled={wallet.connecting} className="rounded-xl">
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

      {/* Main button — large & obvious */}
      <Button
        onClick={handleCreate}
        disabled={submitting}
        size="lg"
        className="w-full h-16 text-lg font-bold rounded-3xl glow-primary-strong"
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