import React from 'react';
import { motion } from 'framer-motion';

interface StepProgressProps {
  steps: string[];
  current: number;
}

export function SignupV2StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((label, index) =>
          <span key={label} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200">
            <motion.span
              initial={false}
              animate={{ scaleX: index <= current ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              style={{ originX: 0 }}
              className="block h-full w-full rounded-full bg-gradient-to-r from-[#164E5F] to-[#E8756E]"
            />
          </span>
        )}
      </div>
      <p className="mt-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-sea-600">
        {steps[current]}
      </p>
    </div>
  );
}
