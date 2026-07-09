// src/hooks/useSolanaStake.ts
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";

const TREASURY_WALLET = "8rPBSaGka2NiHpDdgufVoVvnPzEcnVwN49i5yf3pnk5h";

export const useSolanaStake = () => {
  const stakeOnChallenge = async ({ challengeId, amountInSOL }) => {
    const wallet = window.phantom?.solana; // Access Phantom directly

    if (!wallet?.isConnected) {
      toast.error("Phantom wallet not connected");
      throw new Error("Wallet not connected");
    }

    const toastId = toast.loading(`Staking ${amountInSOL} SOL...`);

    try {
      const connection = new Connection("https://api.devnet.solana.com");

      const lamports = Math.floor(amountInSOL * 1_000_000_000);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.publicKey),
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports,
        })
      );

      const { signature } = await wallet.signAndSendTransaction(transaction);

      await connection.confirmTransaction(signature, "confirmed");

      console.log("✅ Real SOL staked! Signature:", signature);

      toast.success(`${amountInSOL} SOL staked successfully!`, { id: toastId });

      return { success: true, signature };

    } catch (error) {
      console.error(error);
      toast.error("Transaction failed: " + error.message, { id: toastId });
      throw error;
    }
  };

  return { stakeOnChallenge };
};
