import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Folder, 
  Sparkles, 
  Layers, 
  Upload, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  FolderPlus,
  ArrowUpRight
} from 'lucide-react';
import { Book } from '../types';

interface LibraryTabProps {
  books: Book[];
  activeBookId: string;
  onSelectBook: (id: string) => void;
  onOpenNewBookModal: () => void;
  onOpenManageBookModal: (book: Book) => void;
  onNavigateToCards: (folderId?: string | null) => void;
  onNavigateToStudy: (cards?: any[]) => void;
  onNavigateToReading: (folderId?: string | null) => void;
  onOpenImport: () => void;
  lang: 'fa' | 'en';
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  books,
  activeBookId,
  onSelectBook,
  onOpenNewBookModal,
  onOpenManageBookModal,
  onNavigateToCards,
  onNavigateToStudy,
  onNavigateToReading,
  onOpenImport,
  lang
}) => {
  const isFa = lang === 'fa';
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set([activeBookId]));

  const toggleExpand = (bookId: string) => {
    setExpandedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  return (
    <div className="space-y-4 pb-28 md:pb-16 w-full">
      
      {/* Top Banner & Quick Actions */}
      <div 
        className="rounded-3xl p-4 sm:p-5 border transition-all"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <span 
              className="text-xs font-black uppercase tracking-wider block mb-0.5"
              style={{ color: 'var(--accent)' }}
            >
              {isFa ? 'کتابخانه لکسی‌بوک' : 'Lexi Book Library'}
            </span>
            <h2 className="text-lg sm:text-xl font-black" style={{ color: 'var(--text-primary)' }}>
              {isFa ? 'مجموعه کتاب‌ها و درس‌ها' : 'Books & Lessons'}
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {books.length} {isFa ? 'کتاب در حافظه محلی ذخیره است' : 'books stored offline'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewBookModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'کتاب جدید' : 'New Book'}</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all shrink-0"
              style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isFa ? 'ورود کتاب' : 'Import'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Books List or Clean Empty State */}
      {books.length === 0 ? (
        <div 
          className="rounded-3xl p-8 sm:p-12 border text-center space-y-4 max-w-xl mx-auto my-6"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div 
            className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-md text-2xl font-black"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <BookOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              {isFa ? 'کتابخانه‌ی شما خالی است (پلتفرم خام)' : 'Your Library is Empty'}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {isFa 
                ? 'هیچ کتاب یا کارت پیش‌فرضی قرار داده نشده است. می‌توانید با بارگذاری بسته‌های آنکی (.apkg)، فایل‌های جدول/متنی یا ساخت کتاب جدید شروع کنید.' 
                : 'No default books are present. You can start by importing Anki decks (.apkg), CSV/TSV files, or creating a new book.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenImport}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Upload className="w-4 h-4" />
              <span>{isFa ? 'وارد کردن پکیج آنکی (.apkg)' : 'Import Anki Package'}</span>
            </button>

            <button
              onClick={onOpenNewBookModal}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border font-bold text-xs sm:text-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <Plus className="w-4 h-4" />
              <span>{isFa ? 'ساخت کتاب جدید' : 'Create New Book'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {books.map((book) => {
          const isActive = book.id === activeBookId;
          const isExpanded = expandedBookIds.has(book.id);
          const totalCards = book.flashcards.length;
          const masteredCards = book.flashcards.filter(c => c.mastered).length;
          const percent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

          const rootFolders = book.folders.filter(f => !f.parentId);
          const getChildren = (pId: string) => book.folders.filter(f => f.parentId === pId);

          return (
            <div 
              key={book.id}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isActive ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: isActive ? 'var(--accent)' : 'var(--border-color)'
              }}
            >
              {/* Book Header Bar */}
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div 
                  className="flex items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => {
                    onSelectBook(book.id);
                    toggleExpand(book.id);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white font-black shadow-xs text-sm"
                      style={{ backgroundColor: isActive ? 'var(--accent)' : 'var(--border-color)' }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black truncate" style={{ color: 'var(--text-primary)' }}>
                          {book.name}
                        </h3>
                        {isActive && (
                          <span 
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }}
                          >
                            {isFa ? 'فعال' : 'Active'}
                          </span>
                        )}
                      </div>

                      {/* Progress Info */}
                      <div className="flex items-center gap-2 text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <span className="font-mono">{totalCards} {isFa ? 'کارت' : 'cards'}</span>
                        <span>·</span>
                        <span>{book.folders.length} {isFa ? 'درس/پوشه' : 'lessons'}</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-bold font-mono">{percent}% {isFa ? 'تسلط' : 'mastered'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenManageBookModal(book);
                      }}
                      className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      title={isFa ? 'ویرایش و مدیریت کتاب' : 'Edit Book & Lessons'}
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    <button
                      className="p-2 rounded-xl text-stone-400 hover:text-stone-700"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rtl:rotate-180" />}
                    </button>
                  </div>
                </div>

                {/* Mastery Progress Bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* Primary Action Buttons for Book */}
                <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  
                  {/* View Cards */}
                  <button
                    onClick={() => {
                      onSelectBook(book.id);
                      onNavigateToCards(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isFa ? 'کارت‌ها' : 'Cards'}</span>
                  </button>

                  {/* Read Text */}
                  <button
                    onClick={() => {
                      onSelectBook(book.id);
                      onNavigateToReading(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--accent)' }}
                  >
                    <span>{isFa ? 'خواندن متن' : 'Read'}</span>
                  </button>

                  {/* Study Leitner */}
                  {totalCards > 0 && (
                    <button
                      onClick={() => {
                        onSelectBook(book.id);
                        onNavigateToStudy(book.flashcards);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isFa ? 'مرور' : 'Study'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Folders Tree if Expanded */}
              {isExpanded && (
                <div 
                  className="p-3.5 sm:p-4 border-t space-y-2"
                  style={{ 
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    <span>{isFa ? 'درس‌ها و جلسات مطالعه:' : 'Lessons & Folders:'}</span>
                    <button
                      onClick={() => onOpenManageBookModal(book)}
                      className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isFa ? 'مدیریت درس‌ها' : 'Manage'}</span>
                    </button>
                  </div>

                  {book.folders.length === 0 ? (
                    <p className="text-[11px] py-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                      {isFa ? 'این کتاب هنوز پوشه‌ای ندارد. کارت‌ها مستقیماً در کتاب ذخیره شده‌اند.' : 'All cards are stored in the root of this book.'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {rootFolders.map(rf => {
                        const children = getChildren(rf.id);
                        const count = book.flashcards.filter(c => c.folderId === rf.id).length;

                        return (
                          <div 
                            key={rf.id}
                            className="p-2.5 rounded-2xl border space-y-1.5"
                            style={{ 
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-color)' 
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                  {rf.name}
                                </span>
                                <span className="text-[10px] font-mono opacity-75" style={{ color: 'var(--text-secondary)' }}>
                                  ({count} {isFa ? 'کارت' : 'cards'})
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    onSelectBook(book.id);
                                    onNavigateToCards(rf.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                                  style={{ color: 'var(--accent)' }}
                                >
                                  {isFa ? 'کارت‌ها' : 'Cards'}
                                </button>

                                <button
                                  onClick={() => {
                                    onSelectBook(book.id);
                                    onNavigateToReading(rf.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  {isFa ? 'خواندن' : 'Read'}
                                </button>
                              </div>
                            </div>

                            {/* Subfolders */}
                            {children.length > 0 && (
                              <div className="ms-3 ps-2 border-s-2 space-y-1" style={{ borderColor: 'var(--accent)' }}>
                                {children.map(sub => {
                                  const subCount = book.flashcards.filter(c => c.folderId === sub.id).length;
                                  return (
                                    <div key={sub.id} className="flex items-center justify-between text-xs py-0.5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-amber-500">↳</span>
                                        <span className="truncate" style={{ color: 'var(--text-primary)' }}>{sub.name}</span>
                                        <span className="text-[10px] opacity-75 font-mono">({subCount})</span>
                                      </div>

                                      <button
                                        onClick={() => {
                                          onSelectBook(book.id);
                                          onNavigateToCards(sub.id);
                                        }}
                                        className="text-[11px] font-bold text-orange-600 px-1"
                                      >
                                        {isFa ? 'مشاهده' : 'View'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

    </div>
  );
};
