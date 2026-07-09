import { useState } from 'react';
import { usePhantomWallet } from '@/lib/phantomWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StakeSolModal({ open, amount, onClose, onSuccess }) {
  const { connected, balance, sendSol, connect, connecting, treasuryAddress } = usePhantomWallet();
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [signature, setSignature] = useState('');

  const handleStake = async () => {
    setStatus('confirming');
    setErrorMsg('');
    try {
      const sig = await sendSol(treasuryAddress, amount);
      setSignature(sig);
      setStatus('success');
      setTimeout(() => {
        onSuccess(sig, amount);
        setStatus('idle');
        setSignature('');
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black">Stake {amount} SOL</h3>
              {status === 'idle' && (
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!connected ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">Connect your Phantom wallet to stake SOL</p>
                <Button
                  onClick={connect}
                  disabled={connecting}
                  className="w-full font-bold rounded-2xl bg-[#AB9FF2] hover:bg-[#AB9FF2]/90 text-white"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Connect Phantom
                </Button>
              </div>
            ) : status === 'success' ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center mb-3">
                  <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
                </div>
                <p className="font-bold text-foreground">Transaction Confirmed</p>
                <p className="text-xs text-muted-foreground mt-1 break-all">{signature.slice(0, 24)}...</p>
              </div>
            ) : status === 'error' ? (
              <div className="text-center py-4">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                <p className="text-sm font-bold text-destructive">Transaction Failed</p>
                <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
                <Button onClick={() => setStatus('idle')} variant="outline" className="mt-4 w-full rounded-2xl">
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-secondary/50 rounded-2xl p-4 mb-4 text-center">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-2xl font-black text-foreground">{amount} SOL</p>
                  <p className="text-xs text-muted-foreground mt-1">Balance: {balance?.toFixed(4) || 0} SOL</p>
                </div>
                <Button
                  onClick={handleStake}
                  disabled={status === 'confirming'}
                  className="w-full h-12 font-black rounded-2xl bg-[#AB9FF2] hover:bg-[#AB9FF2]/90 text-white"
                >
                  {status === 'confirming' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Confirming...</>
                  ) : (
                    'Confirm in Phantom'
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Approve the transaction in your Phantom wallet
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}