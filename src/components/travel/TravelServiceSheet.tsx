import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Shield,
  Globe,
  HeartPulse,
  Luggage,
  FileText,
  BadgeCheck } from
'lucide-react';
import { KTA } from './ethioTravelData';
import { toast } from 'sonner';
interface ServiceContent {
  title: string;
  subtitle: string;
  icon: typeof Shield;
  features: {
    icon: typeof Check;
    text: string;
  }[];
  pricing: {
    tier: string;
    price: string;
    features: string[];
  }[];
  ctaLabel: string;
  ctaToast: string;
}
const SERVICE_CONTENT: Record<'insurance' | 'visa', ServiceContent> = {
  insurance: {
    title: 'Travel Insurance',
    subtitle: 'Comprehensive coverage for your journey',
    icon: Shield,
    features: [
    {
      icon: HeartPulse,
      text: 'Medical emergencies & hospitalization'
    },
    {
      icon: Luggage,
      text: 'Lost or delayed baggage protection'
    },
    {
      icon: FileText,
      text: 'Trip cancellation & interruption'
    },
    {
      icon: BadgeCheck,
      text: 'COVID-19 coverage included'
    }],

    pricing: [
    {
      tier: 'Basic',
      price: 'ETB 450',
      features: ['Medical up to $25,000', 'Baggage up to $1,000']
    },
    {
      tier: 'Premium',
      price: 'ETB 850',
      features: [
      'Medical up to $100,000',
      'Baggage up to $3,000',
      'Trip cancellation']

    }],

    ctaLabel: 'Get a Quote',
    ctaToast: "Insurance quote request sent! We'll contact you shortly."
  },
  visa: {
    title: 'Visa Services',
    subtitle: 'Fast & hassle-free visa assistance',
    icon: Globe,
    features: [
    {
      icon: FileText,
      text: 'eVisa application support'
    },
    {
      icon: BadgeCheck,
      text: 'Document preparation & review'
    },
    {
      icon: Check,
      text: 'Application tracking & updates'
    },
    {
      icon: HeartPulse,
      text: 'Priority processing available'
    }],

    pricing: [
    {
      tier: 'Standard',
      price: 'ETB 1,200',
      features: ['eVisa processing', '5-7 business days']
    },
    {
      tier: 'Express',
      price: 'ETB 2,400',
      features: [
      'Priority processing',
      '2-3 business days',
      'Document review']

    }],

    ctaLabel: 'Start Application',
    ctaToast: 'Visa application started! Check your email for next steps.'
  }
};
interface Props {
  open: boolean;
  service: 'insurance' | 'visa' | null;
  onClose: () => void;
}
export function TravelServiceSheet({ open, service, onClose }: Props) {
  if (!service) return null;
  const content = SERVICE_CONTENT[service];
  const Icon = content.icon;
  const handleCTA = () => {
    toast.success(content.ctaToast);
    onClose();
  };
  return createPortal(
    <AnimatePresence>
      {open &&
      <>
          {/* Backdrop */}
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="fixed inset-0 glass-overlay z-[100]" />
        

          {/* Sheet */}
          <motion.div
          initial={{
            y: '100%'
          }}
          animate={{
            y: 0
          }}
          exit={{
            y: '100%'
          }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300
          }}
          drag="y"
          dragConstraints={{
            top: 0,
            bottom: 0
          }}
          dragElastic={{
            top: 0,
            bottom: 0.3
          }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120) onClose();
          }}
          className="fixed bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-[100] max-h-[85vh] flex flex-col pb-safe">
          
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div
            className="px-5 pb-4 border-b"
            style={{
              borderColor: KTA.border
            }}>
            
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                  className="w-12 h-12 rounded-full glass-icon-wrap">
                  
                    <Icon
                    className="w-6 h-6"
                    style={{
                      color: KTA.blue
                    }} />
                  
                  </div>
                  <div>
                    <h2
                    className="text-[18px] font-bold"
                    style={{
                      color: KTA.textPrimary
                    }}>
                    
                      {content.title}
                    </h2>
                    <p
                    className="text-[13px]"
                    style={{
                      color: KTA.textSecondary
                    }}>
                    
                      {content.subtitle}
                    </p>
                  </div>
                </div>
                <button
                onClick={onClose}
                className="w-8 h-8 rounded-full glass-btn-ghost flex items-center justify-center"
                aria-label="Close">
                
                  <X
                  className="w-4 h-4"
                  style={{
                    color: KTA.textSecondary
                  }} />
                
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Features */}
              <div className="space-y-3 mb-5">
                {content.features.map((f, i) => {
                const FeatureIcon = f.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                      <div
                      className="w-8 h-8 rounded-full glass-icon-wrap shrink-0">
                      
                        <FeatureIcon
                        className="w-4 h-4"
                        style={{
                          color: KTA.blue
                        }} />
                      
                      </div>
                      <p
                      className="text-[14px]"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                        {f.text}
                      </p>
                    </div>);

              })}
              </div>

              {/* Pricing tiers */}
              <div>
                <h3
                className="text-[15px] font-bold mb-3"
                style={{
                  color: KTA.textPrimary
                }}>
                
                  Plans & Pricing
                </h3>
                <div className="space-y-3">
                  {content.pricing.map((p, i) =>
                <div
                  key={i}
                  className="glass-pricing p-4">
                  
                      <div className="flex items-baseline justify-between mb-2">
                        <span
                      className="text-[14px] font-bold"
                      style={{
                        color: KTA.textPrimary
                      }}>
                      
                          {p.tier}
                        </span>
                        <span
                      className="text-[18px] font-bold"
                      style={{
                        color: KTA.blue
                      }}>
                      
                          {p.price}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {p.features.map((feat, j) =>
                    <li key={j} className="flex items-start gap-2">
                            <Check
                        className="w-4 h-4 shrink-0 mt-0.5"
                        style={{
                          color: KTA.blue
                        }} />
                      
                            <span
                        className="text-[12px]"
                        style={{
                          color: KTA.textSecondary
                        }}>
                        
                              {feat}
                            </span>
                          </li>
                    )}
                      </ul>
                    </div>
                )}
                </div>
              </div>
            </div>

            {/* Sticky CTA */}
            <div
            className="p-5 border-t"
            style={{
              borderColor: KTA.border
            }}>
            
              <button
              onClick={handleCTA}
              className="ui-btn-primary h-12 text-[15px] active:scale-[0.98]"
              style={{
                backgroundColor: KTA.blue
              }}>
              
                {content.ctaLabel}
              </button>
            </div>
          </motion.div>
        </>
      }
    </AnimatePresence>,
    document.body
  );

}