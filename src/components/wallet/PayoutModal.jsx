import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PayoutModal({ open, amount, onClose }) {
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
            className="bg-card border border-primary/30 rounded-3xl p-6 w-full max-w-sm text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-3">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-black text-foreground">Payout Sent!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {amount} SOL has been sent to your Phantom wallet for completing your goal.
            </p>
            <Button onClick={onClose} className="w-full mt-5 font-bold rounded-2xl">
              Done
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}