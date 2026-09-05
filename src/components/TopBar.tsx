import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface TopBarProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
  dark?: boolean;
  fallbackPath?: string;
  onBack?: () => void;
}
export function TopBar({
  title,
  showBack = true,
  rightElement,
  className = '',
  dark = false,
  fallbackPath = '/',
  onBack
}: TopBarProps) {
  const navigate = useNavigate();
  const colorClass = dark ? 'text-white' : 'text-text-primary';
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onBack) {
      onBack();
      return;
    }
    const before = window.location.pathname + window.location.hash;
    try {
      navigate(-1);
    } catch {
      navigate(fallbackPath, {
        replace: true
      });
      return;
    }
    window.setTimeout(() => {
      const after = window.location.pathname + window.location.hash;
      if (after === before) {
        navigate(fallbackPath, {
          replace: true
        });
      }
    }, 80);
  };
  return (
    <div className={`ui-topbar ${dark ? 'bg-transparent border-transparent shadow-none' : ''} ${className}`}>
      
      {showBack &&
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-2 ui-touch w-11 h-11 flex items-center justify-center rounded-full glass-btn-ghost ${colorClass}`}>
        
          <ChevronLeft className="w-5 h-5 pointer-events-none" strokeWidth={2.25} />
        </button>
      }
      <h1
        className={`w-full text-center text-[17px] font-semibold tracking-tight pointer-events-none ${colorClass}`}>
        
        {title}
      </h1>
      {rightElement &&
      <div className="absolute right-3 z-10">{rightElement}</div>
      }
    </div>);

}
