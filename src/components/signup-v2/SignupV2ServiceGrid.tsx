import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { signupV2Services } from '../../data/signupV2Services';

interface ServiceGridProps {
  selected?: string[];
  onToggle?: (id: string) => void;
}

export function SignupV2ServiceGrid({ selected, onToggle }: ServiceGridProps) {
  const selectable = Boolean(onToggle);

  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {signupV2Services.map((service, index) => {
        const Icon = service.icon;
        const isSelected = selected?.includes(service.id) ?? false;

        return (
          <motion.li
            key={service.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1], delay: index * 0.04 }}>
            {selectable ?
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.12 }}
                onClick={() => onToggle?.(service.id)}
                aria-pressed={isSelected}
                className={`flex h-full w-full items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors duration-150 ease-swift ${
                  isSelected ? 'border-sea-500 bg-sea-50' : 'border-line bg-white'
                }`}>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${service.tile}`}>
                  {isSelected ?
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}>
                      <Check className="h-5 w-5" aria-hidden="true" />
                    </motion.span> :
                    <Icon className="h-5 w-5" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold leading-tight text-ink">
                    {service.label}
                  </span>
                  <span className="block truncate text-[11px] leading-tight text-ink-muted">
                    {service.blurb}
                  </span>
                </span>
              </motion.button> :
              <div className="flex h-full items-center gap-2.5 rounded-2xl border border-line bg-white p-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${service.tile}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold leading-tight text-ink">
                    {service.label}
                  </span>
                  <span className="block truncate text-[11px] leading-tight text-ink-muted">
                    {service.blurb}
                  </span>
                </span>
              </div>}
          </motion.li>
        );
      })}
    </ul>
  );
}
