import React from 'react';
import { BookOpen, Layers, Volume2, Sparkles, Trophy } from 'lucide-react';

export type ActiveTab = 'library' | 'cards' | 'reading' | 'study' | 'quiz';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cardsCount: number;
  dueCardsCount: number;
  lang: 'fa' | 'en';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  cardsCount,
  dueCardsCount,
  lang
}) => {
  const isFa = lang === 'fa';

  const tabs: { 
    id: ActiveTab; 
    label: string; 
    icon: React.ComponentType<{ className?: string }>; 
    badge?: number 
  }[] = [
    {
      id: 'library',
      label: isFa ? 'کتابخانه' : 'Library',
      icon: BookOpen
    },
    {
      id: 'cards',
      label: isFa ? 'کارت‌ها' : 'Cards',
      icon: Layers,
      badge: cardsCount > 0 ? cardsCount : undefined
    },
    {
      id: 'reading',
      label: isFa ? 'خواندن متن' : 'Read Text',
      icon: Volume2
    },
    {
      id: 'study',
      label: isFa ? 'مرور لایتنر' : 'Study',
      icon: Sparkles,
      badge: dueCardsCount > 0 ? dueCardsCount : undefined
    },
    {
      id: 'quiz',
      label: isFa ? 'آزمون و آمار' : 'Quiz & Stats',
      icon: Trophy
    }
  ];

  return (
    <>
      {/* Mobile-style Bottom Navigation Bar (Centered, sleek and tactile) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors py-1.5 px-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center justify-around max-w-2xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all select-none ${
                  isActive 
                    ? 'font-bold' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)'
                }}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span 
                      className="absolute -top-1.5 -right-2 min-w-[15px] h-3.5 px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white font-mono"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-1 font-semibold tracking-tight">
                  {tab.label}
                </span>

                {isActive && (
                  <span 
                    className="absolute -bottom-1 w-5 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
