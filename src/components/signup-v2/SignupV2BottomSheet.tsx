import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function SignupV2BottomSheet({
  open,
  onClose,
  children,
  height = '88vh'
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
}) {
  return (
    <AnimatePresence>
      {open ?
        <>
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(event) => event.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-[81] mx-auto flex w-full max-w-[480px] flex-col rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.12)] pb-safe"
            style={{ maxHeight: height }}>
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-9 rounded-full bg-sand-200" />
            </div>
            {children}
          </motion.div>
        </> :
        null}
    </AnimatePresence>
  );
}
