import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  Sparkles, 
  Trophy, 
  Repeat, 
  VolumeX, 
  Layers,
  Calendar,
  Clock,
  Flame,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book, Flashcard } from '../types';
import { SpeechService } from '../services/tts';
import { FormattedText, getPlainText } from '../utils/textParser';
import { DatabaseService } from '../services/db';

interface StudyTabProps {
  book: Book;
  customCards?: Flashcard[];
  onFinishSession?: () => void;
  lang: 'fa' | 'en';
}

export const StudyTab: React.FC<StudyTabProps> = ({
  book,
  customCards,
  onFinishSession,
  lang
}) => {
  const isFa = lang === 'fa';
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'new' | 'learning'>('all');

  // Compute study pool based on SRS schedule or custom selection
  const studyPool = useMemo(() => {
    const base = customCards && customCards.length > 0 ? customCards : book.flashcards;
    const now = Date.now();

    if (filterMode === 'due') {
      const due = base.filter(c => !c.nextReviewDate || c.nextReviewDate <= now);
      return due.length > 0 ? due : base;
    }
    if (filterMode === 'new') {
      const newCards = base.filter(c => !c.reviewCount || c.reviewCount === 0);
      return newCards.length > 0 ? newCards : base;
    }
    if (filterMode === 'learning') {
      const unmastered = base.filter(c => !c.mastered);
      return unmastered.length > 0 ? unmastered : base;
    }
    return base;
  }, [book.flashcards, customCards, filterMode]);

  const [cards, setCards] = useState<Flashcard[]>(studyPool);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [ratingsCount, setRatingsCount] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    setCards(studyPool);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setRatingsCount({ again: 0, hard: 0, good: 0, easy: 0 });
  }, [studyPool]);

  // Current Card
  const currentCard = cards[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || !currentCard) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSpeakWord();
      } else if (isFlipped) {
        if (e.key === '1') handleRate('again');
        else if (e.key === '2') handleRate('hard');
        else if (e.key === '3') handleRate('good');
        else if (e.key === '4') handleRate('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, sessionCompleted, currentCard]);

  const handleSpeakWord = async () => {
    if (!currentCard) return;
    setIsSpeaking(true);
    if (currentCard.audioUrl) {
      try {
        const audio = new Audio(currentCard.audioUrl);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          SpeechService.speak(currentCard.word, { onEnd: () => setIsSpeaking(false) });
        };
        await audio.play();
        return;
      } catch {
        // Fallback
      }
    }
    await SpeechService.speak(currentCard.word, {
      onEnd: () => setIsSpeaking(false)
    });
    setIsSpeaking(false);
  };

  const handleSpeakExample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard?.example) return;
    setIsSpeaking(true);
    await SpeechService.speak(currentCard.example, {
      onEnd: () => setIsSpeaking(false)
    });
    setIsSpeaking(false);
  };

  // Real Leitner / SM-2 spaced repetition rating
  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    // Persist real SM-2 calculation directly to database
    await DatabaseService.updateCardSrs(currentCard.bookId, currentCard.id, rating);

    setRatingsCount(prev => ({
      ...prev,
      [rating]: prev[rating] + 1
    }));

    // If rated 'again', push to end of active study queue so user re-practices it before finishing
    if (rating === 'again') {
      setCards(prev => [...prev, currentCard]);
    }

    // Advance to next card
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setRatingsCount({ again: 0, hard: 0, good: 0, easy: 0 });
    setCards(studyPool);
  };

  // Dynamic interval preview calculations based on SM-2
  const intervalPreview = useMemo(() => {
    if (!currentCard) return { again: '۱۰ دقیقه', hard: '۱ روز', good: '۳ روز', easy: '۷ روز' };
    const curInterval = currentCard.intervalDays || 0;
    const ease = currentCard.easeFactor || 2.5;

    const hardDays = Math.max(1, Math.round((curInterval || 1) * 1.2));
    const goodDays = curInterval === 0 ? 1 : curInterval === 1 ? 3 : Math.round(curInterval * ease);
    const easyDays = curInterval === 0 ? 4 : Math.round(curInterval * ease * 1.3);

    return {
      again: isFa ? '۱۰ دقیقه' : '10 min',
      hard: isFa ? `${hardDays} روز` : `${hardDays}d`,
      good: isFa ? `${goodDays} روز` : `${goodDays}d`,
      easy: isFa ? `${easyDays} روز` : `${easyDays}d`
    };
  }, [currentCard, isFa]);

  if (!cards || cards.length === 0) {
    return (
      <div 
        className="py-20 text-center rounded-3xl border p-8 space-y-4 max-w-xl mx-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div 
          className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center font-bold"
          style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-text)' }}
        >
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
          {isFa ? 'کارتی برای مطالعه یافت نشد' : 'No cards available for study'}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isFa ? 'ابتدا چند فلش‌کارت به کتاب اضافه کنید یا یک فایل دک آنکی/JSON بارگذاری نمایید.' : 'Add cards to this book or import an Anki/JSON deck.'}
        </p>
      </div>
    );
  }

  // Session Completed Screen
  if (sessionCompleted) {
    const totalReviewed = cards.length;
    const accuracy = Math.round(((ratingsCount.good + ratingsCount.easy) / totalReviewed) * 100);

    return (
      <div 
        className="p-8 sm:p-10 rounded-3xl border max-w-lg mx-auto text-center space-y-6 shadow-xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div 
          className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center font-bold text-amber-500 shadow-md"
          style={{ backgroundColor: 'var(--accent-light)' }}
        >
          <Trophy className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            {book.name}
          </span>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {isFa ? 'آفرین! جلسه لایتنر به پایان رسید' : 'Session Completed!'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {isFa ? 'تمامی کارت‌ها و فواصل تکرار فاصله‌دار در پایگاه داده ذخیره شدند.' : 'All spaced repetition intervals have been saved.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-2 text-start">
          <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
            <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>{isFa ? 'کارت‌های مطالعه‌شده' : 'Cards Reviewed'}</span>
            <span className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>{totalReviewed}</span>
          </div>

          <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
            <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>{isFa ? 'نرخ تسلط جلسه' : 'Retention Rate'}</span>
            <span className="text-2xl font-black font-mono text-emerald-500">{accuracy}%</span>
          </div>
        </div>

        {/* SRS breakdown chips */}
        <div className="flex items-center justify-center gap-2 text-xs flex-wrap font-bold">
          <span className="px-3 py-1 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
            {isFa ? 'دوباره:' : 'Again:'} {ratingsCount.again}
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            {isFa ? 'سخت:' : 'Hard:'} {ratingsCount.hard}
          </span>
          <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {isFa ? 'خوب:' : 'Good:'} {ratingsCount.good}
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            {isFa ? 'آسان:' : 'Easy:'} {ratingsCount.easy}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Repeat className="w-4 h-4" />
            <span>{isFa ? 'مرور مجدد همین مجموعه' : 'Review Again'}</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-28 md:pb-16 w-full">
      
      {/* Top Filter Chips & Controls */}
      <div 
        className="p-3.5 rounded-3xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span 
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span className="text-xs font-black truncate" style={{ color: 'var(--text-primary)' }}>
            {book.name}
          </span>
          <span className="text-[11px] font-mono opacity-70" style={{ color: 'var(--text-secondary)' }}>
            ({currentIndex + 1}/{cards.length})
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                filterMode === 'all' ? 'text-white' : 'border'
              }`}
              style={{
                backgroundColor: filterMode === 'all' ? 'var(--accent)' : 'transparent',
                borderColor: 'var(--border-color)',
                color: filterMode === 'all' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'همه' : 'All'}
            </button>

            <button
              onClick={() => setFilterMode('due')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                filterMode === 'due' ? 'text-white' : 'border'
              }`}
              style={{
                backgroundColor: filterMode === 'due' ? 'var(--accent)' : 'transparent',
                borderColor: 'var(--border-color)',
                color: filterMode === 'due' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'موعد امروز' : 'Due'}
            </button>

            <button
              onClick={() => setFilterMode('new')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                filterMode === 'new' ? 'text-white' : 'border'
              }`}
              style={{
                backgroundColor: filterMode === 'new' ? 'var(--accent)' : 'transparent',
                borderColor: 'var(--border-color)',
                color: filterMode === 'new' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'جدید' : 'New'}
            </button>

            <button
              onClick={() => setFilterMode('learning')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                filterMode === 'learning' ? 'text-white' : 'border'
              }`}
              style={{
                backgroundColor: filterMode === 'learning' ? 'var(--accent)' : 'transparent',
                borderColor: 'var(--border-color)',
                color: filterMode === 'learning' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              {isFa ? 'یادگیری' : 'Learn'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Speak Active Word Button */}
            <button
              onClick={handleSpeakWord}
              className={`p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                isSpeaking ? 'bg-red-500 text-white' : ''
              }`}
              style={{ 
                borderColor: 'var(--border-color)',
                color: isSpeaking ? '#FFFFFF' : 'var(--text-secondary)'
              }}
              title={isFa ? 'تلفظ صوتی واژه' : 'Speak Word'}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Reset */}
            <button
              onClick={handleRestart}
              className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              title={isFa ? 'شروع از ابتدا' : 'Restart'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
        <div 
          className="h-full transition-all duration-300 rounded-full"
          style={{ 
            width: `${progressPercent}%`,
            backgroundColor: 'var(--accent)'
          }}
        />
      </div>

      {/* 3D Flippable Flashcard */}
      <div className="perspective-1000 w-full min-h-[360px] sm:min-h-[400px]">
        <div 
          onClick={() => {
            // If user has highlighted or selected text to copy, do not flip!
            const selection = window.getSelection()?.toString();
            if (selection && selection.trim().length > 0) return;
            setIsFlipped(!isFlipped);
          }}
          className={`w-full h-full min-h-[360px] sm:min-h-[400px] relative rounded-3xl cursor-pointer transition-transform duration-500 transform-style-3d shadow-xl select-text ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT SIDE OF CARD */}
          <div 
            className="absolute inset-0 backface-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between border shadow-lg"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)'
            }}
          >
            {/* Front Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: 'var(--accent)' }}
                >
                  {isFa ? 'روی کارت (واژه)' : 'Front (Word)'}
                </span>

                {currentCard.srsLevel !== undefined && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                    SRS L{currentCard.srsLevel}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeakWord();
                }}
                className={`p-2 rounded-xl transition-all ${
                  isSpeaking ? 'bg-red-500 text-white' : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  backgroundColor: isSpeaking ? '#EF4444' : 'var(--accent-light)',
                  color: isSpeaking ? '#FFFFFF' : 'var(--accent-text)'
                }}
                title={isFa ? 'تلفظ با گوگل' : 'Pronounce with Google'}
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Front Center: Word & Phonetic */}
            <div className="text-center my-auto py-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
                <FormattedText content={currentCard.word} />
              </h2>

              {currentCard.phonetic && (
                <p className="font-mono text-sm sm:text-base italic mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {currentCard.phonetic}
                </p>
              )}

              {currentCard.type && (
                <span 
                  className="inline-block px-3 py-1 rounded-xl text-xs font-bold border"
                  style={{
                    backgroundColor: 'var(--accent-light)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--accent-text)'
                  }}
                >
                  {currentCard.type}
                </span>
              )}
            </div>

            {/* Front Footer: Hint */}
            <div 
              className="pt-4 border-t flex items-center justify-between text-xs font-semibold"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <div className="flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFa ? 'کلیک کنید یا Space بزنید تا پشت کارت را ببینید' : 'Tap or press Space to flip'}</span>
              </div>
              <span className="hidden sm:inline-block font-mono text-[11px] opacity-75">
                Space
              </span>
            </div>
          </div>

          {/* BACK SIDE OF CARD */}
          <div 
            className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border shadow-lg overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--accent)'
            }}
          >
            {/* Back Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  <FormattedText content={currentCard.word} />
                </span>
                {currentCard.type && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    {currentCard.type}
                  </span>
                )}
              </div>

              <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <RotateCcw className="w-3 h-3" />
                <span>{isFa ? 'چرخش' : 'Flip'}</span>
              </span>
            </div>

            {/* Back Center: Meaning & Example */}
            <div className="my-auto py-4 space-y-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--accent)' }}>
                  {isFa ? 'معنی و مفهوم فارسی' : 'Persian Meaning & Definition'}
                </span>
                <div className="text-xl sm:text-2xl font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  <FormattedText content={currentCard.meaning} />
                </div>
              </div>

              {currentCard.example && (
                <div 
                  className="p-3.5 rounded-2xl border text-xs sm:text-sm"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                    <span>{isFa ? 'جمله نمونه' : 'Example'}</span>
                    <button
                      onClick={handleSpeakExample}
                      className="flex items-center gap-1 text-orange-600 hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isFa ? 'شنیدن' : 'Listen'}</span>
                    </button>
                  </div>
                  <div dir="ltr" className="font-medium italic leading-relaxed">
                    <FormattedText content={currentCard.example} />
                  </div>
                </div>
              )}
            </div>

            {/* Back Footer */}
            <div 
              className="pt-3 border-t text-[11px] text-center"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {isFa ? 'میزان تسلط خود را در پایین انتخاب کنید (کلیدهای ۱ تا ۴):' : 'Rate your recall below (Keys 1-4):'}
            </div>
          </div>

        </div>
      </div>

      {/* Leitner SM-2 Spaced Repetition Rating Buttons */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        {/* Again */}
        <button
          onClick={() => handleRate('again')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-200 dark:border-red-900/60 font-bold transition-all active:scale-95 shadow-xs"
        >
          <span className="text-xs sm:text-sm">{isFa ? 'دوباره' : 'Again'}</span>
          <span className="text-[10px] opacity-80 font-mono mt-0.5">{intervalPreview.again}</span>
          <span className="text-[9px] opacity-50 font-mono mt-0.5">1</span>
        </button>

        {/* Hard */}
        <button
          onClick={() => handleRate('hard')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border-amber-200 dark:border-amber-900/60 font-bold transition-all active:scale-95 shadow-xs"
        >
          <span className="text-xs sm:text-sm">{isFa ? 'سخت' : 'Hard'}</span>
          <span className="text-[10px] opacity-80 font-mono mt-0.5">{intervalPreview.hard}</span>
          <span className="text-[9px] opacity-50 font-mono mt-0.5">2</span>
        </button>

        {/* Good */}
        <button
          onClick={() => handleRate('good')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-blue-200 dark:border-blue-900/60 font-bold transition-all active:scale-95 shadow-xs"
        >
          <span className="text-xs sm:text-sm">{isFa ? 'خوب' : 'Good'}</span>
          <span className="text-[10px] opacity-80 font-mono mt-0.5">{intervalPreview.good}</span>
          <span className="text-[9px] opacity-50 font-mono mt-0.5">3</span>
        </button>

        {/* Easy */}
        <button
          onClick={() => handleRate('easy')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border-emerald-200 dark:border-emerald-900/60 font-bold transition-all active:scale-95 shadow-xs"
        >
          <span className="text-xs sm:text-sm">{isFa ? 'آسان' : 'Easy'}</span>
          <span className="text-[10px] opacity-80 font-mono mt-0.5">{intervalPreview.easy}</span>
          <span className="text-[9px] opacity-50 font-mono mt-0.5">4</span>
        </button>
      </div>

    </div>
  );
};
