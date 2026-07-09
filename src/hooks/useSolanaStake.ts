// src/hooks/useSolanaStake.ts
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import toast from "react-hot-toast";

const TREASURY_WALLET = "8rPBSaGka2NiHpDdgufVoVvnPzEcnVwN49i5yf3pnk5h"; // Your SweatStake Treasury

export const useSolanaStake = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const stakeOnChallenge = async ({ 
    challengeId, 
    amountInSOL, 
    network = "devnet" 
  }) => {
    if (!publicKey) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }

    const toastId = toast.loading(`Staking ${amountInSOL} SOL...`);

    try {
      const lamports = Math.floor(amountInSOL * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: lamports,
        })
      );

      console.log(`Sending ${amountInSOL} SOL to treasury: ${TREASURY_WALLET}`);

      const signature = await sendTransaction(transaction, connection);
      
      toast.loading("Confirming transaction...", { id: toastId });

      await connection.confirmTransaction({
        signature,
        blockhash: (await connection.getLatestBlockhash()).blockhash,
      }, "confirmed");

      console.log("✅ Staking successful! Signature:", signature);

      toast.success(`${amountInSOL} SOL staked successfully!`, { id: toastId });

      return { 
        success: true, 
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=${network}`
      };

    } catch (error) {
      console.error("Staking error:", error);
      toast.error("Transaction failed: " + error.message, { id: toastId });
      throw error;
    }
  };

  return { stakeOnChallenge };
};
