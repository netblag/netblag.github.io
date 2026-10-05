import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Volume2, 
  Edit3, 
  Trash2, 
  Folder as FolderIcon, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  CornerDownRight
} from 'lucide-react';
import { Book, Flashcard } from '../types';
import { SpeechService } from '../services/tts';
import { FormattedText, getPlainText } from '../utils/textParser';

interface CardsTabProps {
  book: Book;
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onAddCard: () => void;
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onStartStudy: (cards: Flashcard[]) => void;
  lang: 'fa' | 'en';
}

export const CardsTab: React.FC<CardsTabProps> = ({
  book,
  activeFolderId,
  onSelectFolder,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onToggleMastered,
  onStartStudy,
  lang
}) => {
  const isFa = lang === 'fa';
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'learning' | 'mastered'>('all');
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Folders organization
  const rootFolders = book.folders.filter(f => !f.parentId);
  const activeFolder = book.folders.find(f => f.id === activeFolderId);
  const parentFolder = activeFolder?.parentId ? book.folders.find(f => f.id === activeFolder.parentId) : null;
  
  const currentSubfolders = useMemo(() => {
    if (!activeFolderId || activeFolderId === 'root') return [];
    const directChildren = book.folders.filter(f => f.parentId === activeFolderId);
    if (directChildren.length > 0) return directChildren;
    if (parentFolder) {
      return book.folders.filter(f => f.parentId === parentFolder.id);
    }
    return [];
  }, [book.folders, activeFolderId, parentFolder]);

  // Filter cards by folder
  const folderFilteredCards = useMemo(() => {
    if (activeFolderId === null) return book.flashcards;
    if (activeFolderId === 'root') return book.flashcards.filter(c => !c.folderId);
    const subIds = new Set([activeFolderId, ...book.folders.filter(f => f.parentId === activeFolderId).map(f => f.id)]);
    return book.flashcards.filter(c => c.folderId && subIds.has(c.folderId));
  }, [book.flashcards, book.folders, activeFolderId]);

  // Filter cards by search and mastery
  const filteredCards = useMemo(() => {
    return folderFilteredCards.filter(c => {
      // Mastery filter
      if (masteryFilter === 'mastered' && !c.mastered) return false;
      if (masteryFilter === 'learning' && c.mastered) return false;

      // Search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const plainWord = getPlainText(c.word).toLowerCase();
      const plainMeaning = getPlainText(c.meaning).toLowerCase();
      const plainExample = getPlainText(c.example).toLowerCase();
      const plainPhonetic = (c.phonetic || '').toLowerCase();
      return (
        plainWord.includes(q) ||
        plainMeaning.includes(q) ||
        plainExample.includes(q) ||
        plainPhonetic.includes(q) ||
        (c.type && c.type.toLowerCase().includes(q))
      );
    });
  }, [folderFilteredCards, masteryFilter, searchQuery]);

  // Audio Playback
  const handlePlayAudio = async (cardId: string, text: string, audioUrl?: string) => {
    setPlayingCardId(cardId);
    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingCardId(null);
        audio.onerror = () => {
          SpeechService.speak(text, { onEnd: () => setPlayingCardId(null) });
        };
        await audio.play();
        return;
      } catch {
        // Fallback
      }
    }
    await SpeechService.speak(text, {
      onEnd: () => {
        setPlayingCardId(null);
      }
    });
    setPlayingCardId(null);
  };

  return (
    <div className="space-y-4 pb-28 md:pb-16 w-full">
      
      {/* Search & Actions Bar */}
      <div 
        className="p-3 sm:p-4 rounded-3xl border transition-all space-y-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder={isFa ? 'جستجو در واژه‌ها، معانی و مثال‌ها...' : 'Search words, meanings, examples...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-8 py-2.5 rounded-2xl text-xs sm:text-sm border focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-2.5 my-auto text-xs text-stone-400 hover:text-stone-700 px-1 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {filteredCards.length > 0 && (
              <button
                onClick={() => onStartStudy(filteredCards)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all active:scale-95"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFa ? 'مرور ۳ بعدی' : 'Study'}</span>
                <span className="text-[11px] font-mono opacity-90">({filteredCards.length})</span>
              </button>
            )}

            <button
              onClick={onAddCard}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span>{isFa ? 'کارت جدید' : 'New Card'}</span>
            </button>
          </div>

        </div>

        {/* Filter controls row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-color)' }}>
          
          {/* Breadcrumb / current location */}
          <div className="flex items-center gap-1.5 text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            <button
              onClick={() => onSelectFolder(null)}
              className={`hover:underline truncate ${activeFolderId === null ? 'font-bold' : ''}`}
              style={{ color: activeFolderId === null ? 'var(--accent)' : 'inherit' }}
            >
              {book.name}
            </button>
            {parentFolder && (
              <>
                <span>/</span>
                <button
                  onClick={() => onSelectFolder(parentFolder.id)}
                  className="hover:underline truncate"
                >
                  {parentFolder.name}
                </button>
              </>
            )}
            {activeFolder && (
              <>
                <span>/</span>
                <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {activeFolder.name}
                </span>
              </>
            )}
            <span className="font-mono text-[11px] opacity-75 shrink-0">
              ({filteredCards.length})
            </span>
          </div>

          {/* Mastery status pills */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setMasteryFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                masteryFilter === 'all' ? 'text-white shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                backgroundColor: masteryFilter === 'all' ? 'var(--accent)' : 'transparent',
                color: masteryFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'همه' : 'All'}
            </button>
            <button
              onClick={() => setMasteryFilter('learning')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                masteryFilter === 'learning' ? 'text-white shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                backgroundColor: masteryFilter === 'learning' ? 'var(--accent)' : 'transparent',
                color: masteryFilter === 'learning' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'در حال یادگیری' : 'Learning'}
            </button>
            <button
              onClick={() => setMasteryFilter('mastered')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                masteryFilter === 'mastered' ? 'text-white shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                backgroundColor: masteryFilter === 'mastered' ? 'var(--accent)' : 'transparent',
                color: masteryFilter === 'mastered' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'یادگرفته‌شده' : 'Mastered'}
            </button>
          </div>

        </div>

      </div>

      {/* Folder Chips */}
      {book.folders.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => onSelectFolder(null)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                activeFolderId === null ? 'text-white shadow-xs' : 'border hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                backgroundColor: activeFolderId === null ? 'var(--accent)' : 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: activeFolderId === null ? '#FFFFFF' : 'var(--text-primary)'
              }}
            >
              {isFa ? 'همه کارت‌ها' : 'All'} ({book.flashcards.length})
            </button>

            {rootFolders.map(rf => {
              const subIds = new Set(book.folders.filter(f => f.parentId === rf.id).map(f => f.id));
              const count = book.flashcards.filter(c => c.folderId === rf.id || (c.folderId && subIds.has(c.folderId))).length;
              const isSelected = activeFolderId === rf.id || (parentFolder && parentFolder.id === rf.id);

              return (
                <button
                  key={rf.id}
                  onClick={() => onSelectFolder(rf.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                    isSelected ? 'text-white shadow-xs' : 'border hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)'
                  }}
                >
                  <FolderIcon className="w-3.5 h-3.5" style={{ color: isSelected ? '#FFFFFF' : '#F59E0B' }} />
                  <span>{rf.name}</span>
                  <span className="text-[10px] opacity-80 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Subfolders row if selected */}
          {currentSubfolders.length > 0 && (
            <div 
              className="flex items-center gap-1.5 overflow-x-auto p-2 rounded-2xl border no-scrollbar"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)'
              }}
            >
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 shrink-0 flex items-center gap-1">
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>{isFa ? 'جلسات:' : 'Sessions:'}</span>
              </span>

              {currentSubfolders.map(sub => {
                const subCount = book.flashcards.filter(c => c.folderId === sub.id).length;
                const isSubSelected = activeFolderId === sub.id;

                return (
                  <button
                    key={sub.id}
                    onClick={() => onSelectFolder(sub.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                      isSubSelected ? 'text-white shadow-2xs' : 'border'
                    }`}
                    style={{
                      backgroundColor: isSubSelected ? 'var(--accent)' : 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      color: isSubSelected ? '#FFFFFF' : 'var(--text-primary)'
                    }}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[10px] opacity-75 font-mono ms-1">({subCount})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Cards List */}
      {filteredCards.length === 0 ? (
        <div 
          className="py-16 text-center rounded-3xl border p-8 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div 
            className="w-14 h-14 mx-auto rounded-3xl flex items-center justify-center font-bold"
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }}
          >
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {searchQuery 
                ? (isFa ? 'کارتی با این عبارت یافت نشد' : 'No flashcards matched your query')
                : (isFa ? 'هنوز فلش‌کارتی در این بخش ثبت نشده است' : 'No flashcards in this section yet')}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isFa ? 'با کلیک بر روی دکمه زیر فلش‌کارت ایجاد کنید.' : 'Create your card with the button below.'}
            </p>
          </div>
          <button
            onClick={onAddCard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" />
            <span>{isFa ? 'افزودن کارت جدید' : 'Add Flashcard'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredCards.map((card, idx) => {
            const isPlaying = playingCardId === card.id;
            const folderObj = book.folders.find(f => f.id === card.folderId);
            const isDeleting = confirmDeleteId === card.id;

            return (
              <div
                key={card.id}
                className="rounded-3xl border p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div>
                  {/* Top: Word, Phonetic, Type badge & TTS Audio Button */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          <FormattedText content={card.word} />
                        </h3>

                        {card.type && (
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg border"
                            style={{ 
                              backgroundColor: 'var(--accent-light)', 
                              borderColor: 'var(--border-color)',
                              color: 'var(--accent-text)' 
                            }}
                          >
                            {card.type}
                          </span>
                        )}

                        {folderObj && (
                          <span 
                            className="text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1"
                            style={{ 
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <FolderIcon className="w-2.5 h-2.5 text-amber-500" />
                            <span>{folderObj.name}</span>
                          </span>
                        )}
                      </div>

                      {card.phonetic && (
                        <p className="font-mono text-xs mt-0.5 italic" style={{ color: 'var(--text-secondary)' }}>
                          {card.phonetic}
                        </p>
                      )}
                    </div>

                    {/* Prominent Audio TTS Button */}
                    <button
                      onClick={() => handlePlayAudio(card.id, card.word, card.audioUrl)}
                      className={`p-2.5 rounded-2xl transition-all shadow-xs shrink-0 ${
                        isPlaying 
                          ? 'animate-pulse text-white' 
                          : 'hover:scale-105 active:scale-95'
                      }`}
                      style={{
                        backgroundColor: isPlaying ? '#EF4444' : 'var(--accent-light)',
                        color: isPlaying ? '#FFFFFF' : 'var(--accent-text)'
                      }}
                      title={isFa ? 'پخش تلفظ صوتی واژه' : 'Pronounce word'}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Meaning (ترجمه و تعریف فارسی) */}
                  <div 
                    className="my-2.5 py-2 px-3 rounded-2xl border text-sm sm:text-base font-bold leading-relaxed whitespace-pre-line select-text"
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <FormattedText content={card.meaning} />
                  </div>

                  {/* Example Sentence */}
                  {card.example && (
                    <div 
                      className="p-3 rounded-2xl border text-xs italic flex items-start justify-between gap-2 select-text"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <p dir="ltr" className="leading-relaxed flex-1 font-medium whitespace-pre-line select-text">
                        <FormattedText content={card.example} />
                      </p>
                      <button
                        onClick={() => handlePlayAudio(card.id, card.example || '')}
                        className="p-1 rounded-lg text-stone-400 hover:text-orange-500 shrink-0"
                        title={isFa ? 'پخش صوتی مثال' : 'Pronounce example'}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Footer: Index, Mastered toggle, Edit, Delete */}
                <div 
                  className="mt-3.5 pt-3 border-t flex items-center justify-between text-xs"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] opacity-60" style={{ color: 'var(--text-secondary)' }}>
                      #{idx + 1}
                    </span>

                    {/* Mastered toggle */}
                    <button
                      onClick={() => onToggleMastered(card.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors"
                      style={{
                        backgroundColor: card.mastered ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-subtle)',
                        color: card.mastered ? '#22C55E' : 'var(--text-secondary)'
                      }}
                      title={isFa ? 'تغییر وضعیت تسلط' : 'Toggle mastery'}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${card.mastered ? 'fill-emerald-500 text-white' : ''}`} />
                      <span>{card.mastered ? (isFa ? 'تسلط دارم' : 'Mastered') : (isFa ? 'در حال یادگیری' : 'Learning')}</span>
                    </button>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditCard(card)}
                      className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                      title={isFa ? 'ویرایش کارت' : 'Edit'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950/60 p-1 rounded-xl">
                        <span className="text-[10px] text-red-600 font-bold px-1">{isFa ? 'حذف؟' : 'Del?'}</span>
                        <button
                          onClick={() => {
                            onDeleteCard(card.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-red-600 text-white font-bold text-[10px]"
                        >
                          {isFa ? 'بله' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1 text-[10px] text-stone-500"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(card.id)}
                        className="p-1.5 rounded-xl border hover:text-red-500 hover:border-red-300 transition-colors"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                        title={isFa ? 'حذف کارت' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
