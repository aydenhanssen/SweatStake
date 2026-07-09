// src/hooks/useSolanaStake.ts
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";
import { base44 } from "@/api/base44Client";

const TREASURY_WALLET = "8rPBSaGka2NiHpDdgufVoVvnPzEcnVwN49i5yf3pnk5h";
const RPC_URL = import.meta.env.VITE_HELIUS_RPC_URL || "https://api.devnet.solana.com";

export const useSolanaStake = () => {
  const stakeOnChallenge = async ({ challengeId, amountInSOL }) => {
    const provider = window.solana;

    if (!provider?.isPhantom) {
      throw new Error("Phantom wallet not found. Please install the Phantom extension.");
    }

    if (!provider.isConnected) {
      throw new Error("Phantom wallet not connected");
    }

    const toastId = toast.loading(`Staking ${amountInSOL} SOL...`);

    try {
      const connection = new Connection(RPC_URL, "confirmed");

      const fromPubkey = new PublicKey(provider.publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(amountInSOL * 1_000_000_000);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      transaction.feePayer = fromPubkey;
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;

      console.log("Staking started", { from: fromPubkey.toString(), to: TREASURY_WALLET, lamports });

      const { signature } = await provider.signAndSendTransaction(transaction);

      await connection.confirmTransaction(signature, "confirmed");

      console.log("✅ Real SOL staked! Signature:", signature);

      // Update the challenge pot in Base44
      try {
        await base44.entities.Challenge.update(challengeId, {
          sol_total_pot: amountInSOL,
          participant_count: 1,
        });
      } catch (dbErr) {
        console.warn("DB update failed (tx still confirmed):", dbErr);
      }

      toast.success(`${amountInSOL} SOL staked successfully!`, { id: toastId });

      return { success: true, signature };
    } catch (error) {
      console.error("Staking error:", error);
      toast.error("Transaction failed: " + (error.message || "Unknown error"), { id: toastId });
      throw error;
    }
  };

  return { stakeOnChallenge };
};