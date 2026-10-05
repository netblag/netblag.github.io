import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  Flame, 
  Calendar, 
  Download, 
  Upload, 
  Sparkles, 
  Volume2, 
  Sun, 
  Moon, 
  Coffee, 
  Check, 
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Trash2,
  PackageCheck
} from 'lucide-react';
import { Book, ThemeMode, AppSettings, StudyLog } from '../types';
import { DatabaseService } from '../services/db';
import { parseAnkiApkg, parseAnkiTextExport } from '../services/ankiParser';

interface AnalyticsTabProps {
  books: Book[];
  activeBook: Book | null;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onImportSuccess: (importedBook: Book) => void;
  onExportCurrentBook: () => void;
  onExportAnki?: () => void;
  onResetAllData?: () => void;
  lang: 'fa' | 'en';
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  books,
  activeBook,
  settings,
  onUpdateSettings,
  onImportSuccess,
  onExportCurrentBook,
  onExportAnki,
  onResetAllData,
  lang
}) => {
  const isFa = lang === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ankiInputRef = useRef<HTMLInputElement>(null);

  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [jsonInputText, setJsonInputText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    DatabaseService.getStudyLogs().then(setStudyLogs);
  }, []);

  // Compute Heatmap for last 90 days (12 weeks)
  const heatmapData = useMemo(() => {
    const countsByDate = new Map<string, number>();
    studyLogs.forEach(log => {
      countsByDate.set(log.dateKey, (countsByDate.get(log.dateKey) || 0) + 1);
    });

    const days: { dateKey: string; count: number; dayOfWeek: number }[] = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        dateKey: key,
        count: countsByDate.get(key) || 0,
        dayOfWeek: d.getDay()
      });
    }

    return days;
  }, [studyLogs]);

  // Compute Streak
  const currentStreak = useMemo(() => {
    const today = new Date();
    let streak = 0;
    const dateSet = new Set(studyLogs.map(l => l.dateKey));

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dateSet.has(key)) {
        streak++;
      } else if (i === 0) {
        // Today not logged yet, continue check from yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  }, [studyLogs]);

  // Overall Statistics
  const totalCards = books.reduce((acc, b) => acc + b.flashcards.length, 0);
  const masteredCards = books.reduce((acc, b) => acc + b.flashcards.filter(c => c.mastered).length, 0);
  const learningCards = totalCards - masteredCards;
  const masteryPercent = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  // Import JSON File / Text
  const handleImportJson = async (textToParse: string) => {
    setImportError(null);
    setImportStatus(null);
    try {
      const parsed = JSON.parse(textToParse);
      const newBook = DatabaseService.parseJsonToBook(parsed);
      await DatabaseService.saveBook(newBook);
      onImportSuccess(newBook);
      setJsonInputText('');
      setImportStatus(isFa ? `کتاب «${newBook.name}» با ${newBook.flashcards.length} کارت وارد شد.` : `Book "${newBook.name}" imported!`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportError(isFa ? 'فرمت JSON نامعتبر است.' : 'Invalid JSON file.');
    }
  };

  // Import Anki (.apkg) / CSV
  const handleImportAnkiOrCsv = async (file: File) => {
    setImportError(null);
    try {
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.endsWith('.apkg') || fileNameLower.endsWith('.colpkg')) {
        const buffer = await file.arrayBuffer();
        const ankiDeck = await parseAnkiApkg(buffer);
        const bookId = 'book_' + Date.now();
        const newBook: Book = {
          id: bookId,
          name: ankiDeck.deckName,
          createdAt: Date.now(),
          folders: ankiDeck.folders.map((f, i) => ({
            id: 'f_' + Date.now() + '_' + i,
            bookId,
            name: f.name,
            order: i,
            createdAt: Date.now()
          })),
          flashcards: ankiDeck.cards.map((c, i) => ({
            id: 'c_' + Math.random().toString(36).substring(2, 9),
            bookId,
            word: c.word,
            meaning: c.meaning,
            phonetic: c.phonetic,
            type: c.type,
            example: c.example,
            notes: c.notes,
            audioUrl: c.audioUrl,
            tags: c.tags,
            order: i,
            createdAt: Date.now(),
            srsLevel: c.srsLevel || 0,
            intervalDays: c.intervalDays || 0,
            easeFactor: c.easeFactor || 2.5,
            reviewCount: c.reviewCount || 0
          }))
        };
        await DatabaseService.saveBook(newBook);
        onImportSuccess(newBook);
        setImportStatus(isFa ? `پکیج آنکی «${newBook.name}» با ${newBook.flashcards.length} کارت وارد شد.` : `Anki deck "${newBook.name}" imported!`);
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }

      // Text / CSV
      const text = await file.text();
      const ankiDeck = parseAnkiTextExport(text, file.name);
      const bookId = 'book_' + Date.now();
      const newBook: Book = {
        id: bookId,
        name: ankiDeck.deckName,
        createdAt: Date.now(),
        folders: [],
        flashcards: ankiDeck.cards.map((c, i) => ({
          id: 'c_' + Math.random().toString(36).substring(2, 9),
          bookId,
          word: c.word,
          meaning: c.meaning,
          phonetic: c.phonetic,
          example: c.example,
          tags: c.tags,
          order: i,
          createdAt: Date.now()
        }))
      };

      await DatabaseService.saveBook(newBook);
      onImportSuccess(newBook);
      setImportStatus(isFa ? `${newBook.flashcards.length} کارت از فایل وارد کتابخانه شد.` : `${newBook.flashcards.length} cards imported!`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportError(err.message || 'Error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-12">
      
      {/* Header Banner */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border flex items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <span className="text-xs font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--accent)' }}>
            {isFa ? 'داشبورد هوشمند' : 'Smart Analytics'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            {isFa ? 'آمار مطالعه، ابزارها و تنظیمات' : 'Activity, Tools & Settings'}
          </h2>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <div>
            <div className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>{isFa ? 'زنجیره استمرار' : 'Streak'}</div>
            <div className="text-lg font-black font-mono" style={{ color: 'var(--text-primary)' }}>
              {currentStreak} {isFa ? 'روز' : 'days'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Learning Heatmap (GitHub-style 12 weeks) */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border space-y-3"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {isFa ? 'تقویم حرارتی مطالعه (۱۲ هفته گذشته)' : 'Study Activity Heatmap (12 Weeks)'}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>
            {studyLogs.length} {isFa ? 'مرور ثبت‌شده' : 'reviews logged'}
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="pt-2 overflow-x-auto pb-1">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[500px]">
            {heatmapData.map((d, i) => {
              let bg = 'var(--bg-subtle)';
              if (d.count >= 15) bg = '#15803D';
              else if (d.count >= 8) bg = '#22C55E';
              else if (d.count >= 3) bg = '#86EFAC';
              else if (d.count > 0) bg = '#BBF7D0';

              return (
                <div
                  key={i}
                  className="w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: bg }}
                  title={`${d.dateKey}: ${d.count} ${isFa ? 'کارت مرور شده' : 'cards'}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-[10px] pt-1" style={{ color: 'var(--text-secondary)' }}>
          <span>{isFa ? 'کمتر' : 'Less'}</span>
          <div className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: 'var(--bg-subtle)' }} />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#BBF7D0]" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#86EFAC]" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#22C55E]" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#15803D]" />
          <span>{isFa ? 'بیشتر' : 'More'}</span>
        </div>
      </div>

      {/* 2. Mastery Distribution Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isFa ? 'کل فلش‌کارت‌ها' : 'Total Flashcards'}</span>
          <div className="text-2xl font-black mt-1" style={{ color: 'var(--text-primary)' }}>{totalCards}</div>
        </div>

        <div className="p-4 rounded-3xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isFa ? 'یادگرفته‌شده (Mastered)' : 'Mastered'}</span>
          <div className="text-2xl font-black text-emerald-500 mt-1">{masteredCards} ({masteryPercent}%)</div>
        </div>

        <div className="p-4 rounded-3xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isFa ? 'در حال یادگیری' : 'In Progress'}</span>
          <div className="text-2xl font-black text-orange-500 mt-1">{learningCards}</div>
        </div>
      </div>

      {/* 3. Theme & Voice Settings */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border space-y-5"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
          {isFa ? 'تنظیمات تم و صدا' : 'Theme & Speech Settings'}
        </h3>

        {/* 3 Themes */}
        <div>
          <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>
            {isFa ? 'تم رنگی برنامه' : 'Color Palette Theme'}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                settings.theme === 'light' ? 'ring-2 ring-orange-500 shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
            >
              <Sun className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{isFa ? 'روشن مدرن' : 'Light'}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                settings.theme === 'dark' ? 'ring-2 ring-orange-500 shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
            >
              <Moon className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{isFa ? 'تیره نیمه‌شب' : 'Midnight Dark'}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ theme: 'warm' })}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                settings.theme === 'warm' ? 'ring-2 ring-orange-500 shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
            >
              <Coffee className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{isFa ? 'خاکستری مات' : 'Warm Gray'}</span>
            </button>
          </div>
        </div>

        {/* TTS Speed */}
        <div className="pt-2">
          <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>
            {isFa ? 'سرعت پخش تلفظ صوتی (TTS)' : 'TTS Speech Speed'}
          </label>
          <div className="flex items-center gap-2">
            {[0.75, 1.0, 1.25].map(rate => (
              <button
                key={rate}
                onClick={() => onUpdateSettings({ ttsSpeed: rate })}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  settings.ttsSpeed === rate ? 'text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: settings.ttsSpeed === rate ? 'var(--accent)' : 'transparent',
                  borderColor: 'var(--border-color)',
                  color: settings.ttsSpeed === rate ? '#FFFFFF' : 'var(--text-primary)'
                }}
              >
                {rate}x {rate === 1.0 ? (isFa ? '(عادی)' : '(Normal)') : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Import & Export Hub */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border space-y-4"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
              {isFa ? 'ورود و خروج اطلاعات و تبدیل فایل‌ها' : 'Import / Export & Converter'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {isFa ? 'پشتیبانی از فرمت‌های لکسی‌بوک، فایل‌های Anki و CSV' : 'Compatible with Lexi Book JSON, Anki (.apkg/txt), and CSV'}
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {importStatus && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{importStatus}</span>
          </div>
        )}
        {importError && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{importError}</span>
          </div>
        )}

        {/* Actions & Export */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Export Anki .txt */}
          {onExportAnki && (
            <button
              onClick={onExportAnki}
              disabled={!activeBook}
              className="flex items-center gap-2.5 p-3 rounded-2xl border text-start hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
            >
              <PackageCheck className="w-5 h-5 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                  {isFa ? 'خروجی بسته آنکی (.txt)' : 'Export for Anki'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  {isFa ? 'قابل ورود به نرم‌افزار Anki' : 'Anki ready text format'}
                </span>
              </div>
            </button>
          )}

          {/* Export Active Book JSON */}
          <button
            onClick={onExportCurrentBook}
            disabled={!activeBook}
            className="flex items-center gap-2.5 p-3 rounded-2xl border text-start hover:bg-black/5 dark:hover:bg-white/5 transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
          >
            <Download className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                {isFa ? 'خروجی JSON کتاب جاری' : 'Export Active Book JSON'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'فایل استاندارد لکسی‌بوک' : 'Standard Lexi Book JSON'}
              </span>
            </div>
          </button>

          {/* Reset / Clean Slate */}
          {onResetAllData && (
            <button
              onClick={() => {
                if (window.confirm(isFa ? 'آیا از پاک‌سازی کامل تمام کتاب‌ها و شروع مجدد با سایت خام اطمینان دارید؟' : 'Are you sure you want to delete all books and reset to a clean slate?')) {
                  onResetAllData();
                }
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl border text-start hover:bg-red-500/10 transition-all border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400"
              style={{ backgroundColor: 'var(--bg-subtle)' }}
            >
              <Trash2 className="w-5 h-5 text-red-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block">
                  {isFa ? 'شروع مجدد با سایت خام' : 'Reset to Clean Slate'}
                </span>
                <span className="text-[10px] opacity-80">
                  {isFa ? 'حذف تمام داده‌ها و خام‌سازی' : 'Wipe all database & start blank'}
                </span>
              </div>
            </button>
          )}

          {/* Import Anki / CSV */}
          <button
            onClick={() => ankiInputRef.current?.click()}
            className="flex items-center gap-2.5 p-3 rounded-2xl border text-start hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
          >
            <FileSpreadsheet className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                {isFa ? 'ورود فایل آنکی / CSV' : 'Import Anki / CSV'}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'تبدیل خودکار به لکسی‌بوک' : '.txt, .tsv, .csv'}
              </span>
            </div>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input 
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              file.text().then(handleImportJson);
            }
          }}
        />

        <input 
          ref={ankiInputRef}
          type="file"
          accept=".txt,.tsv,.csv,.apkg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImportAnkiOrCsv(file);
            }
          }}
        />

        {/* JSON Paste Text Area */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold block" style={{ color: 'var(--text-secondary)' }}>
            {isFa ? 'یا متن خام JSON را در این کادر جای‌گذاری کنید:' : 'Or paste raw Lexi Book JSON below:'}
          </label>
          <textarea
            dir="ltr"
            rows={4}
            value={jsonInputText}
            onChange={(e) => setJsonInputText(e.target.value)}
            placeholder='{ "bookName": "My Words", "rootFlashcards": [ ... ] }'
            className="w-full p-3 font-mono text-xs rounded-2xl border focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {isFa ? 'انتخاب فایل JSON از کامپیوتر' : 'Browse JSON File'}
            </button>

            <button
              onClick={() => handleImportJson(jsonInputText)}
              disabled={!jsonInputText.trim()}
              className="px-4 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isFa ? 'وارد کردن متن JSON' : 'Import Text'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
