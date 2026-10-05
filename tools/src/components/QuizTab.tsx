import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  HelpCircle,
  Sparkles,
  ArrowRightLeft,
  PenTool
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Book, Flashcard } from '../types';
import { SpeechService } from '../services/tts';
import { FormattedText, getPlainText } from '../utils/textParser';
import { DatabaseService } from '../services/db';

interface QuizTabProps {
  book: Book;
  allBooks: Book[];
  lang: 'fa' | 'en';
}

type QuizMode = 'choice_en_to_fa' | 'choice_fa_to_en' | 'spelling';

interface Question {
  card: Flashcard;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

export const QuizTab: React.FC<QuizTabProps> = ({
  book,
  allBooks,
  lang
}) => {
  const isFa = lang === 'fa';
  const [mode, setMode] = useState<QuizMode>('choice_en_to_fa');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [spellingInput, setSpellingInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState<Question[]>([]);

  const pool = book.flashcards.length >= 4 
    ? book.flashcards 
    : allBooks.flatMap(b => b.flashcards);

  const initQuiz = () => {
    if (book.flashcards.length < 2) return;

    const shuffledCards = [...book.flashcards].sort(() => Math.random() - 0.5).slice(0, 20);
    const distractorsPool = pool.length >= 4 ? pool : book.flashcards;

    const generated: Question[] = shuffledCards.map(card => {
      const plainWord = getPlainText(card.word);
      const plainMeaning = getPlainText(card.meaning);

      if (mode === 'choice_en_to_fa') {
        const others = distractorsPool
          .filter(c => c.id !== card.id && getPlainText(c.meaning) !== plainMeaning)
          .map(c => getPlainText(c.meaning))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        while (others.length < 3) {
          others.push(`تعریف ${others.length + 1}`);
        }

        const options = [...others, plainMeaning].sort(() => Math.random() - 0.5);
        return {
          card,
          prompt: plainWord,
          correctAnswer: plainMeaning,
          options
        };
      } else if (mode === 'choice_fa_to_en') {
        const others = distractorsPool
          .filter(c => c.id !== card.id && getPlainText(c.word) !== plainWord)
          .map(c => getPlainText(c.word))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        while (others.length < 3) {
          others.push(`Word ${others.length + 1}`);
        }

        const options = [...others, plainWord].sort(() => Math.random() - 0.5);
        return {
          card,
          prompt: plainMeaning,
          correctAnswer: plainWord,
          options
        };
      } else {
        // Spelling mode
        return {
          card,
          prompt: plainMeaning,
          correctAnswer: plainWord.trim().toLowerCase(),
          options: []
        };
      }
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedOption(null);
    setSpellingInput('');
    setHasAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setMissedQuestions([]);
  };

  useEffect(() => {
    initQuiz();
  }, [book.id, mode]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (hasAnswered || !currentQ) return;
    setSelectedOption(opt);
    setHasAnswered(true);

    const isCorrect = opt === currentQ.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      // Play audio on correct
      SpeechService.speak(currentQ.card.word);
    } else {
      setMissedQuestions(prev => [...prev, currentQ]);
    }

    // Record study log
    DatabaseService.recordStudyLog({
      cardId: currentQ.card.id,
      bookId: currentQ.card.bookId,
      rating: isCorrect ? 'good' : 'again',
      quizType: 'quiz_choice'
    });
  };

  const handleCheckSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasAnswered || !currentQ) return;
    setHasAnswered(true);

    const userAns = spellingInput.trim().toLowerCase();
    const isCorrect = userAns === currentQ.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      SpeechService.speak(currentQ.card.word);
    } else {
      setMissedQuestions(prev => [...prev, currentQ]);
    }

    DatabaseService.recordStudyLog({
      cardId: currentQ.card.id,
      bookId: currentQ.card.bookId,
      rating: isCorrect ? 'good' : 'again',
      quizType: 'quiz_spell'
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setSpellingInput('');
      setHasAnswered(false);
    } else {
      setIsCompleted(true);
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch {
        // ignore
      }
    }
  };

  if (book.flashcards.length < 2) {
    return (
      <div 
        className="py-16 text-center rounded-3xl border p-8 max-w-lg mx-auto space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <Trophy className="w-12 h-12 mx-auto text-amber-500 opacity-60" />
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {isFa ? 'تعداد کارت‌های این کتاب کافی نیست' : 'Not enough cards for quiz'}
        </h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isFa ? 'برای شروع کوئیز حداقل به ۲ کارت نیاز دارید.' : 'You need at least 2 cards in this book to test.'}
        </p>
      </div>
    );
  }

  // Quiz Completed View
  if (isCompleted) {
    const totalQ = questions.length;
    const percent = Math.round((score / totalQ) * 100);

    return (
      <div 
        className="p-8 sm:p-10 rounded-3xl border max-w-lg mx-auto text-center space-y-6 shadow-xl"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div 
          className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center font-bold text-amber-500 shadow-md"
          style={{ backgroundColor: 'var(--accent-light)' }}
        >
          <Trophy className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {isFa ? 'پایان آزمون' : 'Quiz Completed!'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {isFa ? 'نتیجه عملکرد شما در این دوره:' : 'Here is your final score:'}
          </p>
        </div>

        <div className="p-6 rounded-2xl border max-w-xs mx-auto space-y-2" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
          <div className="text-4xl font-black font-mono text-emerald-500">
            {score} / {totalQ}
          </div>
          <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
            {percent}% {isFa ? 'پاسخ صحیح' : 'Accuracy'}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={initQuiz}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isFa ? 'آزمون مجدد' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 md:pb-8">
      
      {/* Quiz Mode Selector Bar */}
      <div 
        className="p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <span className="font-bold hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
          {isFa ? 'حالت آزمون:' : 'Mode:'}
        </span>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setMode('choice_en_to_fa')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'choice_en_to_fa' ? 'text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: mode === 'choice_en_to_fa' ? 'var(--accent)' : 'transparent',
              color: mode === 'choice_en_to_fa' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            {isFa ? 'انگلیسی ➔ فارسی' : 'EN ➔ FA'}
          </button>

          <button
            onClick={() => setMode('choice_fa_to_en')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'choice_fa_to_en' ? 'text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: mode === 'choice_fa_to_en' ? 'var(--accent)' : 'transparent',
              color: mode === 'choice_fa_to_en' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            {isFa ? 'فارسی ➔ انگلیسی' : 'FA ➔ EN'}
          </button>

          <button
            onClick={() => setMode('spelling')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === 'spelling' ? 'text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{
              backgroundColor: mode === 'spelling' ? 'var(--accent)' : 'transparent',
              color: mode === 'spelling' ? '#FFFFFF' : 'var(--text-secondary)'
            }}
          >
            <PenTool className="w-3.5 h-3.5 inline me-1" />
            <span>{isFa ? 'املا' : 'Spelling'}</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/5 dark:bg-white/5">
        <div 
          className="h-full transition-all duration-300"
          style={{ width: `${progressPercent}%`, backgroundColor: 'var(--accent)' }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <div 
          className="p-6 sm:p-8 rounded-3xl border text-center space-y-4 shadow-sm"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-mono">#{currentIndex + 1} / {questions.length}</span>
            <span className="font-bold text-emerald-500">{isFa ? 'امتیاز:' : 'Score:'} {score}</span>
          </div>

          <div className="space-y-1 py-4">
            <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {mode === 'choice_en_to_fa' 
                ? (isFa ? 'معنی فارسی واژه کدام است؟' : 'Meaning of this word?') 
                : (isFa ? 'واژه معادل این معنی چیست؟' : 'Which word matches this?')}
            </span>

            <h3 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {currentQ.prompt}
            </h3>

            {currentQ.card.phonetic && mode === 'choice_en_to_fa' && (
              <p className="font-mono text-xs opacity-75 italic" style={{ color: 'var(--text-secondary)' }}>
                {currentQ.card.phonetic}
              </p>
            )}
          </div>

          {/* Multiple Choice Mode */}
          {mode !== 'spelling' ? (
            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === currentQ.correctAnswer;

                let btnBg = 'var(--bg-subtle)';
                let btnBorder = 'var(--border-color)';
                let btnText = 'var(--text-primary)';

                if (hasAnswered) {
                  if (isCorrect) {
                    btnBg = '#DCFCE7';
                    btnBorder = '#22C55E';
                    btnText = '#15803D';
                  } else if (isSelected) {
                    btnBg = '#FEE2E2';
                    btnBorder = '#EF4444';
                    btnText = '#B91C1C';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full p-4 rounded-2xl border text-start flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      backgroundColor: btnBg,
                      borderColor: btnBorder,
                      color: btnText
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs bg-black/5 dark:bg-white/10 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>

                    {hasAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    {hasAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Spelling Mode Form */
            <form onSubmit={handleCheckSpelling} className="space-y-4 pt-2">
              <input
                type="text"
                dir="ltr"
                placeholder="Type English spelling..."
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                disabled={hasAnswered}
                autoFocus
                className="w-full p-4 rounded-2xl border text-center text-lg font-bold font-mono focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: hasAnswered 
                    ? (spellingInput.trim().toLowerCase() === currentQ.correctAnswer ? '#22C55E' : '#EF4444')
                    : 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />

              {!hasAnswered ? (
                <button
                  type="submit"
                  disabled={!spellingInput.trim()}
                  className="w-full py-3 rounded-2xl text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {isFa ? 'بررسی املا' : 'Check Spelling'}
                </button>
              ) : (
                <div className="p-3 rounded-xl border text-xs font-bold" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <span>{isFa ? 'پاسخ صحیح:' : 'Correct:'} </span>
                  <span className="font-mono text-emerald-600 text-sm">{currentQ.correctAnswer}</span>
                </div>
              )}
            </form>
          )}

          {/* Next Button after answering */}
          {hasAnswered && (
            <div className="pt-4 flex justify-end">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {currentIndex === questions.length - 1 
                  ? (isFa ? 'مشاهده نتیجه' : 'Show Results') 
                  : (isFa ? 'سوال بعدی' : 'Next Question')}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
