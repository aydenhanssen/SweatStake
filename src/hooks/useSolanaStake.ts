// src/hooks/useSolanaStake.ts
import { useState } from "react";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { base44 } from "@/api/base44Client";

const TREASURY_WALLET = "8rPBSaGka2NiHpDdgufVoVwN49i5yf3pnk5h";

export const useSolanaStake = () => {
  const [loading, setLoading] = useState(false);

  const getProvider = () => {
    const provider = window.solana || window.phantom?.solana;
    if (!provider?.isPhantom || !provider?.isConnected) {
      throw new Error("Phantom wallet not connected");
    }
    return provider;
  };

  const stakeOnChallenge = async ({ challengeId, amountInSOL }) => {
    console.log("useSolanaStake: stakeOnChallenge called", { challengeId, amountInSOL });

    const provider = getProvider();
    setLoading(true);

    try {
      const connection = new Connection("https://api.devnet.solana.com", "confirmed");

      const fromPubkey = new PublicKey(provider.publicKey);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.floor(amountInSOL * 1_000_000_000);

      console.log("useSolanaStake: building transaction", { fromPubkey: fromPubkey.toString(), lamports });

      const transaction = new Transaction().add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
      );

      // Phantom needs a recent blockhash + fee payer before it can sign
      transaction.feePayer = fromPubkey;
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;

      console.log("useSolanaStake: requesting Phantom signature...");

      // This call opens the Phantom popup for the user to approve
      const { signature } = await provider.signAndSendTransaction(transaction);

      console.log("useSolanaStake: signature received", signature);

      await connection.confirmTransaction(signature, "confirmed");

      console.log("useSolanaStake: confirmed on-chain ✅");

      // Update the challenge pot in Base44
      try {
        const challenge = await base44.entities.Challenge.get(challengeId);
        await base44.entities.Challenge.update(challengeId, {
          sol_total_pot: (challenge.sol_total_pot || 0) + amountInSOL,
          participant_count: (challenge.participant_count || 0) + 1,
        });
      } catch (dbErr) {
        console.warn("useSolanaStake: DB update failed (tx still confirmed)", dbErr);
      }

      return { success: true, signature };
    } catch (error) {
      console.error("useSolanaStake: error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { stakeOnChallenge, loading };
};