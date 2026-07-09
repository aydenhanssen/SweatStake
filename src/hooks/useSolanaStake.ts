// src/hooks/useSolanaStake.ts
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";

const TREASURY_WALLET = "8rPBSaGka2NiHpDdgufVoVvnPzEcnVwN49i5yf3pnk5h";

export const useSolanaStake = () => {
  const stakeOnChallenge = async ({ challengeId, amountInSOL }) => {
    // This is a placeholder until we integrate your actual wallet sendTransaction
    console.log(`Staking ${amountInSOL} SOL for challenge ${challengeId}`);

    try {
      toast.loading(`Staking ${amountInSOL} SOL...`);

      // TODO: Connect to your real sendTransaction from usePhantomWallet
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulate delay

      toast.success(`${amountInSOL} SOL staked successfully!`);

      return { success: true };

    } catch (error) {
      toast.error("Staking failed");
      throw error;
    }
  };

  return { stakeOnChallenge };
};
