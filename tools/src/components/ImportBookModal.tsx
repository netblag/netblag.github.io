import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileJson, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Layers, 
  FileSpreadsheet, 
  FileCheck,
  PackageCheck,
  Music,
  Folder as FolderIcon,
  FileText
} from 'lucide-react';
import { Book, Folder, Flashcard } from '../types';
import { DatabaseService } from '../services/db';
import { parseAnkiApkg, parseAnkiTextExport } from '../services/ankiParser';
import { getPlainText } from '../utils/textParser';

interface ImportBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedBook: Book) => void;
  lang: 'fa' | 'en';
}

export const ImportBookModal: React.FC<ImportBookModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  lang
}) => {
  const isFa = lang === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // File Preview state
  const [previewData, setPreviewData] = useState<{
    bookName: string;
    totalCards: number;
    totalFolders: number;
    mediaCount?: number;
    parsedBook: Book;
    sampleCards: { word: string; meaning: string; phonetic?: string; example?: string }[];
    sourceType?: 'lexibook' | 'anki_apkg' | 'anki_text';
  } | null>(null);

  // Direct Text Paste tab
  const [activeImportMode, setActiveImportMode] = useState<'file' | 'paste'>('file');
  const [rawText, setRawText] = useState('');
  const [deckNameInput, setDeckNameInput] = useState('');

  if (!isOpen) return null;

  const resetState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewData(null);
    setRawText('');
    setDeckNameInput('');
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Inspect JSON Content
  const processJsonString = (content: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const parsed = JSON.parse(content);
      const book = DatabaseService.parseJsonToBook(parsed);
      
      if (!book.flashcards || book.flashcards.length === 0) {
        throw new Error(isFa ? 'هیچ فلش‌کارتی در این فایل یافت نشد.' : 'No flashcards found in this file.');
      }

      setPreviewData({
        bookName: book.name,
        totalCards: book.flashcards.length,
        totalFolders: book.folders.length,
        parsedBook: book,
        sampleCards: book.flashcards.slice(0, 4).map(c => ({
          word: getPlainText(c.word),
          meaning: getPlainText(c.meaning),
          phonetic: c.phonetic,
          example: c.example
        })),
        sourceType: 'lexibook'
      });
    } catch (err: any) {
      setPreviewData(null);
      setErrorMsg(err.message || (isFa ? 'ساختار فایل JSON نامعتبر است.' : 'Invalid JSON file.'));
    }
  };

  // Unified File Handler supporting .apkg, .colpkg, .txt, .tsv, .csv, .json
  const handleFileSelected = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const fileNameLower = file.name.toLowerCase();

      // Case A: Real Anki Package (.apkg, .colpkg)
      if (fileNameLower.endsWith('.apkg') || fileNameLower.endsWith('.colpkg')) {
        const buffer = await file.arrayBuffer();
        const ankiDeck = await parseAnkiApkg(buffer);
        const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

        // Build folders from Anki subdecks
        const folderMap = new Map<string, string>();
        const folders: Folder[] = ankiDeck.folders.map((f, i) => {
          const folderId = 'f_' + Date.now() + '_' + i;
          folderMap.set(f.name, folderId);
          return {
            id: folderId,
            bookId,
            name: f.name,
            order: i,
            createdAt: Date.now()
          };
        });

        // Build flashcards mapping folderId and SRS info
        const flashcards: Flashcard[] = ankiDeck.cards.map((c, i) => {
          const folderId = c.folderName ? folderMap.get(c.folderName) || null : null;
          return {
            id: 'c_' + Math.random().toString(36).substring(2, 9),
            bookId,
            folderId,
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
            reviewCount: c.reviewCount || 0,
            lapses: c.lapses || 0,
            nextReviewDate: c.nextReviewDate,
            mastered: c.mastered,
            isCloze: c.isCloze
          };
        });

        const book: Book = {
          id: bookId,
          name: ankiDeck.deckName,
          createdAt: Date.now(),
          folders,
          flashcards
        };

        setPreviewData({
          bookName: book.name,
          totalCards: book.flashcards.length,
          totalFolders: book.folders.length,
          mediaCount: ankiDeck.mediaFilesCount,
          parsedBook: book,
          sampleCards: book.flashcards.slice(0, 4).map(c => ({
            word: c.word,
            meaning: c.meaning,
            phonetic: c.phonetic,
            example: c.example
          })),
          sourceType: 'anki_apkg'
        });
        setLoading(false);
        return;
      }

      // Case B: Anki exported text or CSV (.txt, .tsv, .csv)
      if (fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.tsv') || fileNameLower.endsWith('.csv')) {
        const text = await file.text();
        const ankiDeck = parseAnkiTextExport(text, file.name);
        const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

        const folderMap = new Map<string, string>();
        const folders: Folder[] = ankiDeck.folders.map((f, i) => {
          const folderId = 'f_' + Date.now() + '_' + i;
          folderMap.set(f.name, folderId);
          return {
            id: folderId,
            bookId,
            name: f.name,
            order: i,
            createdAt: Date.now()
          };
        });

        const flashcards: Flashcard[] = ankiDeck.cards.map((c, i) => ({
          id: 'c_' + Math.random().toString(36).substring(2, 9),
          bookId,
          folderId: c.folderName ? folderMap.get(c.folderName) || null : null,
          word: c.word,
          meaning: c.meaning,
          phonetic: c.phonetic,
          type: c.type,
          example: c.example,
          tags: c.tags,
          order: i,
          createdAt: Date.now(),
          srsLevel: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          reviewCount: 0
        }));

        const book: Book = {
          id: bookId,
          name: ankiDeck.deckName,
          createdAt: Date.now(),
          folders,
          flashcards
        };

        setPreviewData({
          bookName: book.name,
          totalCards: book.flashcards.length,
          totalFolders: book.folders.length,
          parsedBook: book,
          sampleCards: book.flashcards.slice(0, 4).map(c => ({
            word: c.word,
            meaning: c.meaning,
            phonetic: c.phonetic,
            example: c.example
          })),
          sourceType: 'anki_text'
        });
        setLoading(false);
        return;
      }

      // Case C: LexiBook JSON file (.json)
      if (fileNameLower.endsWith('.json') || file.type === 'application/json') {
        const text = await file.text();
        processJsonString(text);
        setLoading(false);
        return;
      }

      throw new Error(isFa 
        ? 'فرمت فایل معتبر نیست. لطفاً فایل‌های .apkg (آنکی)، .txt/.csv یا .json انتخاب کنید.' 
        : 'Unsupported file format. Please choose .apkg (Anki), .txt/.csv, or .json.');
    } catch (err: any) {
      setPreviewData(null);
      setErrorMsg(err.message || (isFa ? 'خطا در بارگذاری یا پردازش فایل.' : 'Failed to parse file.'));
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  // Direct paste handler
  const handleProcessPastedText = () => {
    if (!rawText.trim()) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      // Check if user pasted JSON
      if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
        processJsonString(rawText);
        setLoading(false);
        return;
      }

      // Treat as Anki text or TSV/CSV
      const ankiDeck = parseAnkiTextExport(rawText, deckNameInput.trim() || 'کتاب وارد شده');
      const bookId = 'book_' + Date.now();
      const book: Book = {
        id: bookId,
        name: deckNameInput.trim() || ankiDeck.deckName,
        createdAt: Date.now(),
        folders: [],
        flashcards: ankiDeck.cards.map((c, i) => ({
          id: 'c_' + Math.random().toString(36).substring(2, 9),
          bookId,
          folderId: null,
          word: c.word,
          meaning: c.meaning,
          phonetic: c.phonetic,
          example: c.example,
          order: i,
          createdAt: Date.now(),
          srsLevel: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          reviewCount: 0
        }))
      };

      setPreviewData({
        bookName: book.name,
        totalCards: book.flashcards.length,
        totalFolders: 0,
        parsedBook: book,
        sampleCards: book.flashcards.slice(0, 4).map(c => ({
          word: c.word,
          meaning: c.meaning,
          phonetic: c.phonetic,
          example: c.example
        })),
        sourceType: 'anki_text'
      });
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در پردازش متن');
      setLoading(false);
    }
  };

  // Confirm and Save
  const handleConfirmImport = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      await DatabaseService.saveBook(previewData.parsedBook);
      setSuccessMsg(isFa ? `کتاب «${previewData.bookName}» با موفقیت افزوده شد!` : `Imported ${previewData.bookName}!`);
      setTimeout(() => {
        onImportSuccess(previewData.parsedBook);
        handleClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving book');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                {isFa ? 'وارد کردن کارت‌ها و فایل آنکی' : 'Import Anki & Flashcards'}
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'پشتیبانی دقیق از پکیج‌های کامل آنکی (.apkg)، فایل‌های متنی/جدول و JSON' : 'Full support for Anki packages (.apkg), CSV/TSV & JSON'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: File Upload vs Paste Text */}
        <div className="px-5 pt-3 flex gap-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setActiveImportMode('file')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeImportMode === 'file' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            {isFa ? 'انتخاب فایل (Anki .apkg / JSON / CSV)' : 'Choose File'}
          </button>
          <button
            onClick={() => setActiveImportMode('paste')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeImportMode === 'paste' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            {isFa ? 'کپی و پیست متن / جدول' : 'Paste Text / TSV'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Mode 1: File Upload */}
          {activeImportMode === 'file' && !previewData && (
            <div className="space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]' 
                    : 'hover:border-indigo-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{ borderColor: dragActive ? 'var(--accent)' : 'var(--border-color)', backgroundColor: 'var(--bg-subtle)' }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40"
                >
                  <PackageCheck className="w-8 h-8" />
                </div>

                <h4 className="text-sm sm:text-base font-black mb-1" style={{ color: 'var(--text-primary)' }}>
                  {isFa ? 'فایل پکیج آنکی (.apkg) یا فایل دلخواه خود را اینجا بکشید' : 'Drop your Anki (.apkg) or data file here'}
                </h4>
                <p className="text-xs max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {isFa 
                    ? 'یا برای انتخاب فایل کلیک کنید (پشتیبانی از .apkg با زیرپوشه‌ها، تلفظ‌های صوتی، .txt، .csv و .json)' 
                    : 'Or click to browse (.apkg packages with subdecks and audio, .txt, .csv, .json)'}
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs" style={{ backgroundColor: 'var(--accent)' }}>
                  <Upload className="w-4 h-4" />
                  <span>{isFa ? 'انتخاب فایل از دستگاه' : 'Select File from Device'}</span>
                </div>

                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".apkg,.colpkg,.json,.txt,.tsv,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Supported formats pills */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <PackageCheck className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-primary)' }}>Anki .apkg</span>
                  <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>همراه با پوشه‌ها و صدا</span>
                </div>
                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <FileSpreadsheet className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-primary)' }}>متن / CSV / TSV</span>
                  <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>جدول کلمات و ترجمه</span>
                </div>
                <div className="p-2.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}>
                  <FileJson className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-primary)' }}>JSON Backup</span>
                  <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>پشتیبان لکسی‌بوک</span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Paste Raw Text */}
          {activeImportMode === 'paste' && !previewData && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                  {isFa ? 'نام کتاب جدید:' : 'Book Name:'}
                </label>
                <input
                  type="text"
                  value={deckNameInput}
                  onChange={(e) => setDeckNameInput(e.target.value)}
                  placeholder={isFa ? 'مثال: لغات انگلیسی من' : 'e.g., My Vocabulary'}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                  {isFa ? 'متن کارت‌ها (هر سطر یک کارت - جداکننده تب یا ویرگول یا خط عمودی | ):' : 'Cards text (one per line, tab/comma separated):'}
                </label>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`abandon\tترک کردن\t/əˈbændən/\tThey had to abandon the ship.\nkeen\tمشتاق و تیزبین\t/kiːn/\tHe has a keen eye.`}
                  className="w-full p-3 rounded-2xl border text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                onClick={handleProcessPastedText}
                disabled={loading || !rawText.trim()}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFa ? 'تحلیل و پیش‌نمایش کارت‌ها' : 'Parse & Preview'}</span>
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'در حال استخراج و تحلیل پایگاه داده و فایل‌ها...' : 'Extracting and parsing database & media...'}
              </p>
            </div>
          )}

          {/* PREVIEW OF PARSED DATA */}
          {previewData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div 
                className="p-4 rounded-2xl border flex items-center justify-between gap-3"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: 'var(--accent)' }}>
                    {isFa ? 'پیش‌نمایش کتاب آماده برای افزودن' : 'Ready to Import'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black" style={{ color: 'var(--text-primary)' }}>
                    {previewData.bookName}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {previewData.totalCards} کارت
                  </span>
                  {previewData.totalFolders > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <FolderIcon className="w-3.5 h-3.5" />
                      {previewData.totalFolders} زیرپوشه
                    </span>
                  )}
                  {previewData.mediaCount && previewData.mediaCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Music className="w-3.5 h-3.5" />
                      {previewData.mediaCount} صوت
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Sample Cards Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold block" style={{ color: 'var(--text-secondary)' }}>
                  {isFa ? 'نمونه کارت‌های استخراج شده:' : 'Sample extracted cards:'}
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {previewData.sampleCards.map((sc, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="min-w-0">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 block truncate">
                          {sc.word}
                        </span>
                        {sc.example && (
                          <span className="text-[10px] text-gray-400 truncate block mt-0.5">
                            {sc.example}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {sc.meaning}
                        </span>
                        {sc.phonetic && (
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {sc.phonetic}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm / Cancel Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleConfirmImport}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isFa ? 'تأیید و افزودن به کتابخانه' : 'Confirm & Add to Library'}</span>
                </button>

                <button
                  onClick={() => setPreviewData(null)}
                  className="px-4 py-3 rounded-2xl border font-bold text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  {isFa ? 'انتخاب فایل دیگر' : 'Change File'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
