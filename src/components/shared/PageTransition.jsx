import React from 'react';
import { motion } from 'framer-motion';

const transitionVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const transitionConfig = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1],
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={transitionVariants}
      transition={transitionConfig}
    >
      {children}
    </motion.div>
  );
}