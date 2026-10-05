import React from 'react';
import { BookMarked, Sun, Moon, Coffee, Globe, Plus, ChevronDown, Upload, Settings } from 'lucide-react';
import { Book, ThemeMode } from '../types';

interface HeaderProps {
  books: Book[];
  activeBook: Book | null;
  onSelectBook: (id: string) => void;
  onOpenNewBookModal: () => void;
  onOpenImportModal: () => void;
  onOpenManageBookModal: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  lang: 'fa' | 'en';
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  books,
  activeBook,
  onSelectBook,
  onOpenNewBookModal,
  onOpenImportModal,
  onOpenManageBookModal,
  theme,
  onToggleTheme,
  lang,
  onToggleLang
}) => {
  const isFa = lang === 'fa';

  const themeIcon = theme === 'light' 
    ? <Sun className="w-4 h-4 text-amber-500" /> 
    : theme === 'dark' 
    ? <Moon className="w-4 h-4 text-blue-400" /> 
    : <Coffee className="w-4 h-4 text-amber-400" />;

  const themeTitle = theme === 'light'
    ? (isFa ? 'روشن' : 'Light')
    : theme === 'dark'
    ? (isFa ? 'تاریک' : 'Dark')
    : (isFa ? 'گرم' : 'Warm');

  return (
    <header 
      className="sticky top-0 z-30 border-b backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-3">
        
        {/* Active Book Selector & Manager */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <BookMarked className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative inline-flex items-center w-full max-w-[200px] sm:max-w-[280px]">
              <select
                value={activeBook?.id || ''}
                onChange={(e) => onSelectBook(e.target.value)}
                className="appearance-none bg-transparent font-black text-xs sm:text-sm cursor-pointer pe-4 focus:outline-none w-full truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {books.length === 0 ? (
                  <option value="" disabled style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                    {isFa ? 'کتابخانه‌ی خام (بدون کتاب)' : 'Library Empty'}
                  </option>
                ) : (
                  books.map(b => (
                    <option 
                      key={b.id} 
                      value={b.id} 
                      style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                      {b.name} ({b.flashcards.length})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute end-0 pointer-events-none opacity-60" style={{ color: 'var(--text-primary)' }} />
            </div>
          </div>

          {/* Quick Edit Book Settings button */}
          {activeBook && (
            <button
              onClick={onOpenManageBookModal}
              className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              title={isFa ? 'مدیریت و ویرایش کتاب' : 'Edit Book & Lessons'}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Import Book button */}
          <button
            onClick={onOpenImportModal}
            className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}
            title={isFa ? 'وارد کردن کتاب جدید' : 'Import Book'}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right side tools: Theme toggle, Language toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ 
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
            title={isFa ? 'تغییر تم رنگی' : 'Toggle Theme'}
          >
            {themeIcon}
            <span className="text-[11px] font-semibold">{themeTitle}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2 py-1.5 rounded-xl border text-[11px] font-black uppercase hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ 
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)'
            }}
            title={isFa ? 'تغییر زبان به انگلیسی' : 'Switch to Persian'}
          >
            {lang === 'fa' ? 'EN' : 'فا'}
          </button>
        </div>

      </div>
    </header>
  );
};
