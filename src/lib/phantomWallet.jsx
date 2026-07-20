import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

// Reliable RPC endpoints — Helius first (if configured), then public mainnet, then devnet
const RPC_ENDPOINTS = [
  import.meta.env.VITE_HELIUS_RPC_URL,
  'https://api.mainnet-beta.solana.com',
  'https://solana-rpc.publicnode.com',
  'https://api.devnet.solana.com',
].filter(Boolean);
// Replace with your real treasury wallet address
const TREASURY_WALLET = '5ZWjBo9ooooYoeZzB2ko3C7aQ4mrqgFAj1mh3w7hqLxJ';

const PhantomWalletContext = createContext(null);

export function PhantomWalletProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceError, setBalanceError] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connections] = useState(() => RPC_ENDPOINTS.map((url) => new Connection(url, 'confirmed')));

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const fetchBalanceWithRetry = useCallback(async (pk, attempts = 3) => {
    for (let i = 0; i < attempts; i++) {
      for (const conn of connections) {
        try {
          const bal = await conn.getBalance(pk);
          return bal / LAMPORTS_PER_SOL;
        } catch (err) {
          console.warn(`Balance fetch failed (attempt ${i + 1}/${attempts}):`, err.message);
        }
      }
      // exponential backoff: 1s, 2s
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
    return null;
  }, [connections]);

  const refreshBalance = useCallback(async (pubkey) => {
    if (!pubkey) return;
    setBalanceLoading(true);
    setBalanceError(null);
    const pk = new PublicKey(pubkey);
    try {
      const result = await fetchBalanceWithRetry(pk);
      if (result !== null) {
        setBalance(result);
      } else {
        setBalance(null);
        setBalanceError('Unable to fetch SOL balance after multiple retries. Try refreshing manually.');
        console.error('SOL balance fetch failed after all retries for address:', pubkey);
      }
    } catch (err) {
      setBalance(null);
      setBalanceError(err.message || 'Failed to fetch balance');
      console.error('SOL balance fetch error:', err);
    } finally {
      setBalanceLoading(false);
    }
  }, [fetchBalanceWithRetry]);

  useEffect(() => {
    const provider = window.solana;
    if (!provider?.isPhantom) return;

    const onConnect = (pk) => {
      setConnected(true);
      setAddress(pk.toString());
      refreshBalance(pk.toString());
    };
    const onDisconnect = () => {
      setConnected(false);
      setAddress(null);
      setBalance(null);
    };
    const onAccountChanged = (pk) => {
      if (pk) {
        setAddress(pk.toString());
        refreshBalance(pk.toString());
      } else {
        onDisconnect();
      }
    };

    if (provider.isConnected && provider.publicKey) {
      setConnected(true);
      setAddress(provider.publicKey.toString());
      refreshBalance(provider.publicKey.toString());
    }

    provider.on('connect', onConnect);
    provider.on('disconnect', onDisconnect);
    provider.on('accountChanged', onAccountChanged);

    return () => {
      provider.off('connect', onConnect);
      provider.off('disconnect', onDisconnect);
      provider.off('accountChanged', onAccountChanged);
    };
  }, [refreshBalance]);

  const connect = useCallback(async () => {
    const provider = window.solana;
    if (!provider?.isPhantom) {
      window.open('https://phantom.app/download', '_blank');
      throw new Error('Phantom wallet not found. Install Phantom to continue.');
    }
    setConnecting(true);
    try {
      const resp = await provider.connect();
      setConnected(true);
      setAddress(resp.publicKey.toString());
      await refreshBalance(resp.publicKey.toString());
      return resp.publicKey.toString();
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(async () => {
    const provider = window.solana;
    if (provider?.isPhantom && provider.isConnected) {
      try { await provider.disconnect(); } catch {}
    }
    setConnected(false);
    setAddress(null);
    setBalance(null);
  }, []);

  const sendSol = useCallback(async (destination, solAmount) => {
    const provider = window.solana;
    if (!provider?.isPhantom || !provider.isConnected) {
      throw new Error('Phantom wallet not connected');
    }
    const fromPubkey = provider.publicKey;
    const toPubkey = new PublicKey(destination);
    const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
    );
    transaction.feePayer = fromPubkey;
    const { blockhash } = await connections[0].getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const { signature } = await provider.signAndSendTransaction(transaction);
    await connections[0].confirmTransaction(signature, 'confirmed');
    await refreshBalance(fromPubkey.toString());
    return signature;
  }, [connections, refreshBalance]);

  const value = {
    connected,
    address,
    shortenedAddress: shortenAddress(address),
    balance,
    balanceError,
    balanceLoading,
    connecting,
    connect,
    disconnect,
    sendSol,
    refreshBalance: () => address && refreshBalance(address),
    treasuryAddress: TREASURY_WALLET,
  };

  return (
    <PhantomWalletContext.Provider value={value}>
      {children}
    </PhantomWalletContext.Provider>
  );
}

export function usePhantomWallet() {
  const ctx = useContext(PhantomWalletContext);
  if (!ctx) throw new Error('usePhantomWallet must be used within PhantomWalletProvider');
  return ctx;
}