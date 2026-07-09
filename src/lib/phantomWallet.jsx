import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
// Replace with your real treasury wallet address
const TREASURY_WALLET = '5ZWjBo9ooooYoeZzB2ko3C7aQ4mrqgFAj1mh3w7hqLxJ';

const PhantomWalletContext = createContext(null);

export function PhantomWalletProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connection] = useState(() => new Connection(SOLANA_RPC, 'confirmed'));

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const refreshBalance = useCallback(async (pubkey) => {
    if (!pubkey) return;
    try {
      const bal = await connection.getBalance(new PublicKey(pubkey));
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [connection]);

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
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const { signature } = await provider.signAndSendTransaction(transaction);
    await connection.confirmTransaction(signature, 'confirmed');
    await refreshBalance(fromPubkey.toString());
    return signature;
  }, [connection, refreshBalance]);

  const value = {
    connected,
    address,
    shortenedAddress: shortenAddress(address),
    balance,
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