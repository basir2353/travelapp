import React from 'react';
import { Home, Compass, Briefcase, HelpCircle, User } from 'lucide-react';
import { KTA } from './ethioTravelData';
export type TravelTab = 'home' | 'explore' | 'trips' | 'help' | 'account';
interface Props {
  activeTab: TravelTab;
  onChangeTab: (tab: TravelTab) => void;
}
export function TravelBottomNav({ activeTab, onChangeTab }: Props) {
  const tabs: {
    id: TravelTab;
    label: string;
    icon: any;
  }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: Compass
  },
  {
    id: 'trips',
    label: 'My Trips',
    icon: Briefcase
  },
  {
    id: 'help',
    label: 'Help',
    icon: HelpCircle
  },
  {
    id: 'account',
    label: 'Account',
    icon: User
  }];

  return (
    <nav className="ui-tabbar" aria-label="Main navigation">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-0.5 min-h-[48px] transition-all duration-ios active:scale-95 touch-manipulation relative z-10">
            
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-ios pointer-events-none ${isActive ? 'bg-teal-100 shadow-sm shadow-teal-200/50' : ''}`}>
              
              <Icon
                className="w-[22px] h-[22px] transition-colors duration-ios shrink-0"
                style={{
                  color: isActive ? KTA.blue : KTA.textSecondary
                }}
                strokeWidth={isActive ? 2.5 : 1.75} />
              
            </div>
            <span
              className="text-[11px] font-semibold transition-colors duration-ios truncate max-w-full px-1 leading-none pointer-events-none"
              style={{
                color: isActive ? KTA.blue : KTA.textSecondary
              }}>
              
              {tab.label}
            </span>
          </button>);

      })}
    </nav>);

}
