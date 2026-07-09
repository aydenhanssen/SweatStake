import { useState, useCallback } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { base44 } from '@/api/base44Client';
import { usePhantomWallet } from '@/lib/phantomWallet';

// ─── Network Configuration ──────────────────────────────────────
// Default to 'devnet' for safety during development.
// Switch to mainnet before launch — set DEFAULT_NETWORK to 'mainnet'
// or always pass network: 'mainnet' from the caller.
const DEFAULT_NETWORK = 'devnet' as 'devnet' | 'mainnet';

const RPC_ENDPOINTS = {
  // Devnet for testing — free, rate-limited
  devnet: 'https://api.devnet.solana.com',
  // Mainnet uses the Helius RPC configured via env, matching phantomWallet.jsx
  mainnet: import.meta.env.VITE_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
};

// TODO: Replace this hardcoded treasury with a Program Derived Address (PDA)
// once the on-chain escrow program is deployed. Each challenge should derive
// its own PDA from the challenge ID so stakes are held trustlessly and
// auto-distributed to verified winners — no manual treasury management.
const TREASURY_WALLET = '5ZWjBo9ooooYoeZzB7ko3C7aQ4mrqgFAj1mh3w7hqLxJ';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export type SolanaNetwork = 'devnet' | 'mainnet';

export interface StakeParams {
  challengeId: string;
  amountInSOL: number;
  /** Override the default network. Defaults to 'devnet' for dev safety. */
  network?: SolanaNetwork;
}

export interface StakeResult {
  signature: string;
  explorerUrl: string;
  network: SolanaNetwork;
}

export interface UseSolanaStakeReturn {
  loading: boolean;
  error: string | null;
  stakeOnChallenge: (params: StakeParams) => Promise<StakeResult>;
}

/**
 * useSolanaStake — stakes SOL on a challenge via Phantom, confirms the
 * transaction on-chain, then updates the Base44 Challenge entity.
 *
 * Network: defaults to devnet; pass network: 'mainnet' or change
 * DEFAULT_NETWORK for production.
 *
 * Upgrade path:
 *   1. Replace SystemProgram.transfer → escrow program instruction (PDA)
 *   2. Switch DEFAULT_NETWORK → 'mainnet'
 *   3. Store challenge ID in the on-chain instruction data for provenance
 */
export function useSolanaStake(): UseSolanaStakeReturn {
  const { connected, address } = usePhantomWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const stakeOnChallenge = useCallback(
    async ({ challengeId, amountInSOL, network = DEFAULT_NETWORK }: StakeParams): Promise<StakeResult> => {
      setError(null);

      if (!connected || !address) {
        const msg = 'Phantom wallet not connected.';
        setError(msg);
        throw new Error(msg);
      }

      if (amountInSOL <= 0) {
        const msg = 'Stake amount must be greater than 0.';
        setError(msg);
        throw new Error(msg);
      }

      setLoading(true);

      // Use the same RPC endpoint as the wallet provider for mainnet,
      // or the public devnet endpoint for testing.
      const rpcUrl = RPC_ENDPOINTS[network];
      const connection = new Connection(rpcUrl, 'confirmed');
      const fromPubkey = new PublicKey(address);
      const toPubkey = new PublicKey(TREASURY_WALLET);
      const lamports = Math.round(amountInSOL * LAMPORTS_PER_SOL);

      let signature: string | null = null;

      // ─── Retry loop: handles transient RPC / blockhash errors ──────
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const provider = window.solana;

          // Build the transfer instruction
          // TODO: Replace with escrow program deposit instruction (PDA-based)
          const instruction = SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports,
          });

          const transaction = new Transaction().add(instruction);
          transaction.feePayer = fromPubkey;

          // Fresh blockhash each attempt (expires ~60s)
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;

          // Sign + broadcast via Phantom
          const { signature: sig } = await provider.signAndSendTransaction(transaction);

          // Confirm on-chain
          await connection.confirmTransaction(sig, 'confirmed');
          signature = sig;
          break;
        } catch (err: any) {
          if (attempt < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
          }
          const msg = err?.message || 'Transaction failed after multiple retries.';
          setError(msg);
          setLoading(false);
          throw new Error(msg);
        }
      }

      if (!signature) {
        const msg = 'No transaction signature returned.';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      const explorerUrl = `https://solscan.io/tx/${signature}?cluster=${network}`;

      // ─── Update Base44: add participant + increase pot ────────────
      try {
        const challenge = await base44.entities.Challenge.get(challengeId);

        await base44.entities.Challenge.update(challengeId, {
          sol_total_pot: (challenge.sol_total_pot || 0) + amountInSOL,
          participant_count: (challenge.participant_count || 0) + 1,
        });
      } catch (err: any) {
        // Transaction succeeded on-chain but DB update failed —
        // user should keep the explorer link for manual reconciliation.
        setError(`Stake confirmed but DB update failed: ${err.message}`);
        setLoading(false);
        return { signature, explorerUrl, network };
      }

      setLoading(false);
      return { signature, explorerUrl, network };
    },
    [connected, address]
  );

  return { loading, error, stakeOnChallenge };
}