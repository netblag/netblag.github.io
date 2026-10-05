import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  FastForward, 
  Rewind, 
  Eye, 
  EyeOff, 
  Repeat, 
  Sparkles, 
  BookOpen, 
  Folder as FolderIcon,
  Settings2,
  FileText
} from 'lucide-react';
import { Book, Flashcard } from '../types';
import { SpeechService } from '../services/tts';
import { FormattedText, getPlainText } from '../utils/textParser';

interface TextReaderTabProps {
  book: Book;
  lang: 'fa' | 'en';
}

export const TextReaderTab: React.FC<TextReaderTabProps> = ({ book, lang }) => {
  const isFa = lang === 'fa';

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'examples' | 'words' | 'custom'>('examples');
  const [showTranslations, setShowTranslations] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customText, setCustomText] = useState(
    'Start your daily vocabulary practice with Lexi Book.\nThey had to abandon the sinking ship.\nThe detective has a keen eye for details.\nShe was jealous of her friend\'s new car.\nHe showed great tact in handling the difficult customer.\nThe witness took an oath to tell the truth.'
  );

  const activeSentenceRef = useRef<HTMLDivElement>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Filter cards by folder
  const activeCards = React.useMemo(() => {
    if (!selectedFolderId) return book.flashcards;
    const subIds = new Set([
      selectedFolderId,
      ...book.folders.filter(f => f.parentId === selectedFolderId).map(f => f.id)
    ]);
    return book.flashcards.filter(c => c.folderId && subIds.has(c.folderId));
  }, [book.flashcards, book.folders, selectedFolderId]);

  // Build sentences pool
  const sentences = React.useMemo(() => {
    if (sourceMode === 'custom') {
      const lines = customText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
      return lines.map((text, idx) => ({
        id: `custom_${idx}`,
        english: text,
        persian: isFa ? 'متن آزاد سفارشی' : 'Custom Text',
        word: '',
        phonetic: undefined as string | undefined
      }));
    }

    if (sourceMode === 'words') {
      return activeCards.map((c, idx) => ({
        id: c.id,
        english: c.word,
        persian: c.meaning,
        word: c.word,
        phonetic: c.phonetic,
        type: c.type
      }));
    }

    // Default: Example Sentences
    const list: { id: string; english: string; persian: string; word: string; phonetic?: string }[] = [];
    activeCards.forEach(c => {
      if (c.example && getPlainText(c.example).trim()) {
        list.push({
          id: c.id,
          english: c.example,
          persian: c.meaning,
          word: c.word,
          phonetic: c.phonetic
        });
      }
    });

    // If no examples found, fall back to words
    if (list.length === 0) {
      return activeCards.map(c => ({
        id: c.id,
        english: c.word,
        persian: c.meaning,
        word: c.word,
        phonetic: c.phonetic
      }));
    }

    return list;
  }, [sourceMode, activeCards, customText, isFa]);

  // Scroll active item into view
  useEffect(() => {
    if (isPlaying && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentIndex, isPlaying]);

  // Playback execution loop
  useEffect(() => {
    if (!isPlaying) {
      SpeechService.stop();
      return;
    }

    if (sentences.length === 0) {
      setIsPlaying(false);
      return;
    }

    let isCurrentEffectActive = true;

    const playSentenceAtIndex = async (index: number) => {
      if (!isCurrentEffectActive || !isPlayingRef.current) return;
      if (index >= sentences.length) {
        if (repeatMode === 'all') {
          setCurrentIndex(0);
          playSentenceAtIndex(0);
        } else {
          setIsPlaying(false);
        }
        return;
      }

      const item = sentences[index];
      const textToSpeak = getPlainText(item.english);

      await SpeechService.speak(textToSpeak, {
        rate: playbackSpeed,
        onEnd: () => {
          if (!isCurrentEffectActive || !isPlayingRef.current) return;

          if (repeatMode === 'one') {
            // Repeat same
            setTimeout(() => {
              if (isPlayingRef.current) playSentenceAtIndex(index);
            }, 600);
          } else {
            // Next
            setTimeout(() => {
              if (!isPlayingRef.current) return;
              if (index < sentences.length - 1) {
                setCurrentIndex(index + 1);
                playSentenceAtIndex(index + 1);
              } else if (repeatMode === 'all') {
                setCurrentIndex(0);
                playSentenceAtIndex(0);
              } else {
                setIsPlaying(false);
              }
            }, 600);
          }
        }
      });
    };

    playSentenceAtIndex(currentIndex);

    return () => {
      isCurrentEffectActive = false;
      SpeechService.stop();
    };
  }, [isPlaying, currentIndex, playbackSpeed, repeatMode, sentences]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      SpeechService.stop();
    } else {
      if (currentIndex >= sentences.length) {
        setCurrentIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    SpeechService.stop();
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    SpeechService.stop();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(sentences.length - 1);
    }
  };

  const handleSelectSentence = (idx: number) => {
    SpeechService.stop();
    setCurrentIndex(idx);
    setIsPlaying(true);
  };

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const cycleRepeat = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
  };

  const rootFolders = book.folders.filter(f => !f.parentId);

  return (
    <div className="space-y-4 pb-28 md:pb-16 max-w-5xl mx-auto w-full">
      
      {/* Top Header Card */}
      <div 
        className="rounded-3xl p-4 sm:p-5 border transition-all space-y-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  {isFa ? 'خواندن و پخش هوشمند متن' : 'Smart Text-to-Speech Reader'}
                </h2>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--accent)'
                  }}
                >
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  <span>{isFa ? 'صوت هوشمند گوگل ترنسلیت' : 'Google Translate Voice'}</span>
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {book.name} · {sentences.length} {isFa ? 'جمله و عبارت آماده خواندن با تلفظ طبیعی' : 'sentences with natural Google pronunciation'}
              </p>
            </div>
          </div>

          {/* Quick Visibility & Repeat buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTranslations(!showTranslations)}
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: showTranslations ? 'var(--accent)' : 'var(--text-secondary)' }}
              title={isFa ? 'نمایش/مخفی‌سازی ترجمه' : 'Toggle Translations'}
            >
              {showTranslations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-2 rounded-xl border transition-colors ${
                repeatMode !== 'none' ? 'text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{
                backgroundColor: repeatMode !== 'none' ? 'var(--accent)' : 'transparent',
                borderColor: 'var(--border-color)',
                color: repeatMode !== 'none' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
              title={isFa ? `حالت تکرار: ${repeatMode}` : `Repeat: ${repeatMode}`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Mode Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t text-xs font-bold" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => { setSourceMode('examples'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              sourceMode === 'examples' ? 'text-white shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: sourceMode === 'examples' ? 'var(--accent)' : 'var(--bg-subtle)',
              color: sourceMode === 'examples' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            {isFa ? 'جملات مثال درس‌ها' : 'Example Sentences'}
          </button>

          <button
            onClick={() => { setSourceMode('words'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              sourceMode === 'words' ? 'text-white shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: sourceMode === 'words' ? 'var(--accent)' : 'var(--bg-subtle)',
              color: sourceMode === 'words' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            {isFa ? 'لغات و تلفظ‌ها' : 'Words & Definitions'}
          </button>

          <button
            onClick={() => { setSourceMode('custom'); setCurrentIndex(0); }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              sourceMode === 'custom' ? 'text-white shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: sourceMode === 'custom' ? 'var(--accent)' : 'var(--bg-subtle)',
              color: sourceMode === 'custom' ? '#FFFFFF' : 'var(--text-primary)'
            }}
          >
            {isFa ? 'متن آزاد / داستان' : 'Custom Story'}
          </button>
        </div>

        {/* Folder Filter Chips if applicable */}
        {book.folders.length > 0 && sourceMode !== 'custom' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
            <button
              onClick={() => { setSelectedFolderId(null); setCurrentIndex(0); }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedFolderId === null ? 'text-white' : 'border'
              }`}
              style={{
                backgroundColor: selectedFolderId === null ? 'var(--accent)' : 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: selectedFolderId === null ? '#FFFFFF' : 'var(--text-primary)'
              }}
            >
              {isFa ? 'همه درس‌ها' : 'All Lessons'}
            </button>

            {rootFolders.map(rf => {
              const isSelected = selectedFolderId === rf.id;
              return (
                <button
                  key={rf.id}
                  onClick={() => { setSelectedFolderId(rf.id); setCurrentIndex(0); }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isSelected ? 'text-white' : 'border'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-primary)'
                  }}
                >
                  <FolderIcon className="w-3 h-3" />
                  <span>{rf.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Textarea Editor if in custom mode */}
      {sourceMode === 'custom' && (
        <div 
          className="p-4 rounded-3xl border space-y-2"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <label className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
            {isFa ? 'متن یا داستان انگلیسی خود را اینجا وارد کنید (هر خط یک جمله):' : 'Enter your English text (one sentence per line):'}
          </label>
          <textarea
            dir="ltr"
            rows={4}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full p-3 rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      )}

      {/* Sentences Interactive List */}
      <div className="space-y-2.5">
        {sentences.length === 0 ? (
          <div 
            className="py-16 text-center rounded-3xl border p-6 space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {isFa ? 'متنی برای خواندن در این بخش یافت نشد.' : 'No reading text found in this section.'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {isFa ? 'لطفاً درس دیگری را انتخاب کنید یا به بخش فلش‌کارت‌ها بروید.' : 'Please select another lesson or switch mode.'}
            </p>
          </div>
        ) : (
          sentences.map((item, idx) => {
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={item.id + '_' + idx}
                ref={isCurrent ? activeSentenceRef : null}
                onClick={() => {
                  const sel = window.getSelection()?.toString();
                  if (sel && sel.trim().length > 0) return;
                  handleSelectSentence(idx);
                }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer select-text ${
                  isCurrent 
                    ? 'ring-2 shadow-md transform scale-[1.01]' 
                    : 'hover:border-orange-400/50'
                }`}
                style={{
                  backgroundColor: isCurrent ? 'var(--bg-surface)' : 'var(--bg-surface)',
                  borderColor: isCurrent ? 'var(--accent)' : 'var(--border-color)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    
                    {/* Index & Header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span 
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isCurrent ? 'text-white' : ''
                        }`}
                        style={{
                          backgroundColor: isCurrent ? 'var(--accent)' : 'var(--bg-subtle)',
                          color: isCurrent ? '#FFFFFF' : 'var(--text-secondary)'
                        }}
                      >
                        #{idx + 1}
                      </span>

                      {item.word && (
                        <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                          {getPlainText(item.word)}
                        </span>
                      )}

                      {item.phonetic && (
                        <span className="font-mono text-[10px] italic opacity-75" style={{ color: 'var(--text-secondary)' }}>
                          {item.phonetic}
                        </span>
                      )}
                    </div>

                    {/* English sentence / reading text */}
                    <p 
                      dir="ltr" 
                      className={`text-base sm:text-lg leading-relaxed font-semibold transition-colors ${
                        isCurrent ? 'text-orange-600 dark:text-orange-400' : ''
                      }`}
                      style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}
                    >
                      <FormattedText content={item.english} />
                    </p>

                    {/* Persian translation */}
                    {showTranslations && item.persian && (
                      <p 
                        className="text-xs sm:text-sm mt-2 pt-2 border-t leading-relaxed font-medium"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <FormattedText content={item.persian} />
                      </p>
                    )}
                  </div>

                  {/* Individual Audio Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSentence(idx);
                    }}
                    className={`p-2.5 rounded-2xl transition-transform shrink-0 ${
                      isCurrent && isPlaying 
                        ? 'text-white animate-pulse' 
                        : 'hover:scale-105 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: isCurrent && isPlaying ? 'var(--accent)' : 'var(--bg-subtle)',
                      color: isCurrent && isPlaying ? '#FFFFFF' : 'var(--accent-text)'
                    }}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Audio Player Bar */}
      <div 
        className="fixed bottom-16 md:bottom-4 left-4 right-4 max-w-lg mx-auto z-40 p-3 sm:p-4 rounded-3xl border shadow-2xl backdrop-blur-md transition-all flex items-center justify-between gap-3"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--accent)'
        }}
      >
        {/* Speed button */}
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1.5 rounded-xl border text-[11px] font-black font-mono transition-colors shrink-0"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          title={isFa ? 'سرعت پخش صدا' : 'Playback Speed'}
        >
          {playbackSpeed}x
        </button>

        {/* Prev / Play / Next Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <Rewind className="w-5 h-5 rtl:rotate-180" />
          </button>

          <button
            onClick={handleTogglePlay}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ms-0.5" />}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <FastForward className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>

        {/* Status text */}
        <div className="text-end min-w-[60px]">
          <span className="text-[11px] font-mono font-bold block" style={{ color: 'var(--accent)' }}>
            {currentIndex + 1} / {sentences.length}
          </span>
          <span className="text-[9px] opacity-75 block truncate" style={{ color: 'var(--text-secondary)' }}>
            {isPlaying ? (isFa ? 'در حال خواندن' : 'Reading...') : (isFa ? 'آماده پخش' : 'Paused')}
          </span>
        </div>
      </div>

    </div>
  );
};
