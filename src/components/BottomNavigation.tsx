import React from 'react';
import { Home, Users, BarChart3, Trophy, Settings, FileText } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  videoCount?: number;
  artistCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  videoCount = 0,
  artistCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Beranda',
      icon: Home,
      badge: videoCount > 0 ? videoCount : undefined,
    },
    {
      id: 'artists' as TabType,
      label: 'Artis',
      icon: Users,
      badge: artistCount > 0 ? artistCount : undefined,
    },
    {
      id: 'gallery_notes' as TabType,
      label: 'Catatan',
      icon: FileText,
    },
    {
      id: 'rank_videos' as TabType,
      label: 'Rank Video',
      icon: BarChart3,
    },
    {
      id: 'rank_artists' as TabType,
      label: 'Rank Artis',
      icon: Trophy,
    },
    {
      id: 'settings' as TabType,
      label: 'Pengaturan',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Navigasi Utama Aplikasi"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 pb-[env(safe-area-inset-bottom,0px)] shadow-2xl"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[52px] py-1 transition-all select-none group ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:text-indigo-300'
              }`}
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-950/70 scale-110 shadow-inner' : 'group-hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-slate-950">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight line-clamp-1">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
