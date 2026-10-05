import React, { useState, useEffect } from 'react';
import { X, Volume2, Save, Plus, Tag, Folder as FolderIcon, Sparkles } from 'lucide-react';
import { Book, Flashcard } from '../types';
import { SpeechService } from '../services/tts';
import { getPlainText } from '../utils/textParser';

interface CardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Flashcard | null;
  book: Book;
  currentFolderId: string | null;
  onSave: (cardData: Omit<Flashcard, 'id' | 'bookId' | 'createdAt' | 'order'>, stayOpen?: boolean) => void;
  lang: 'fa' | 'en';
}

const COMMON_TYPES = [
  'Noun', 
  'Verb', 
  'Adjective', 
  'Adverb', 
  'Idiom', 
  'Phrase', 
  'Phrasal Verb', 
  'Preposition', 
  'Other'
];

export const CardEditModal: React.FC<CardEditModalProps> = ({
  isOpen,
  onClose,
  card,
  book,
  currentFolderId,
  onSave,
  lang
}) => {
  const isFa = lang === 'fa';

  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [type, setType] = useState('Noun');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      // Clean plain text extraction so raw JSON spans never leak into the input!
      setWord(getPlainText(card.word) || '');
      setPhonetic(card.phonetic || '');
      setType(card.type || 'Noun');
      setMeaning(getPlainText(card.meaning) || '');
      setExample(getPlainText(card.example) || '');
      setSelectedFolderId(card.folderId || null);
    } else {
      setWord('');
      setPhonetic('');
      setType('Noun');
      setMeaning('');
      setExample('');
      setSelectedFolderId(currentFolderId || null);
    }
  }, [card, currentFolderId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (stayOpen = false) => {
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();
    if (!cleanWord || !cleanMeaning) return;

    onSave({
      word: cleanWord,
      phonetic: phonetic.trim() || undefined,
      type: type.trim() || undefined,
      meaning: cleanMeaning,
      example: example.trim() || undefined,
      folderId: selectedFolderId
    }, stayOpen);

    if (stayOpen) {
      setWord('');
      setPhonetic('');
      setMeaning('');
      setExample('');
    } else {
      onClose();
    }
  };

  const handleTestSpeak = () => {
    if (word.trim()) {
      SpeechService.speak(word.trim());
    }
  };

  const rootFolders = book.folders.filter(f => !f.parentId);
  const getSubfolders = (pId: string) => book.folders.filter(f => f.parentId === pId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                {card ? (isFa ? 'ویرایش فلش‌کارت' : 'Edit Flashcard') : (isFa ? 'افزودن فلش‌کارت جدید' : 'New Flashcard')}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {book.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
          
          {/* Word / Front */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {isFa ? 'واژه یا عبارت انگلیسی (روی کارت) *' : 'English Word / Phrase (Front) *'}
              </label>
              <button
                type="button"
                onClick={handleTestSpeak}
                disabled={!word.trim()}
                className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all disabled:opacity-40"
                style={{ 
                  borderColor: 'var(--border-color)', 
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--accent)' 
                }}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isFa ? 'تست تلفظ' : 'Test Audio'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              autoFocus
              dir="ltr"
              placeholder="e.g. abandon, keen, tactile..."
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border text-base font-bold focus:outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Phonetic & Type Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'تلفظ / فونتیک (اختیاری)' : 'IPA Phonetic (Optional)'}
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="/əˈbændən/"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'نوع کلمه' : 'Part of Speech'}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                {COMMON_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Meaning / Back */}
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
              {isFa ? 'ترجمه و تعریف فارسی (پشت کارت) *' : 'Persian Meaning / Translation (Back) *'}
            </label>
            <textarea
              required
              rows={2}
              placeholder={isFa ? 'ترک کردن، رها کردن...' : 'Definition, translation...'}
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Example Sentence */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'جمله نمونه یا مثال کاربردی (اختیاری)' : 'Example Sentence (Optional)'}
              </label>
              {example.trim() && (
                <button
                  type="button"
                  onClick={() => SpeechService.speak(example.trim())}
                  className="text-[10px] text-orange-600 dark:text-orange-400 font-bold hover:underline"
                >
                  {isFa ? 'شنیدن مثال' : 'Listen'}
                </button>
              )}
            </div>
            <textarea
              dir="ltr"
              rows={2}
              placeholder="e.g. They had to abandon the sinking ship."
              value={example}
              onChange={(e) => setExample(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border text-xs font-medium focus:outline-none leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Folder / Session Assignment */}
          {book.folders.length > 0 && (
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isFa ? 'دسته‌بندی در پوشه یا جلسه:' : 'Folder / Session:'}
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? e.target.value : null)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">{isFa ? 'بدون پوشه (مستقیماً در کتاب)' : 'Root of Book'}</option>
                {rootFolders.map(rf => {
                  const children = getSubfolders(rf.id);
                  return (
                    <React.Fragment key={rf.id}>
                      <option value={rf.id}>📁 {rf.name}</option>
                      {children.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          &nbsp;&nbsp;↳ 📄 {sub.name}
                        </option>
                      ))}
                    </React.Fragment>
                  );
                })}
              </select>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2">
            {!card && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={!word.trim() || !meaning.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition-all"
                style={{ 
                  borderColor: 'var(--accent)', 
                  color: 'var(--accent)' 
                }}
              >
                {isFa ? 'ذخیره و کارت بعدی' : 'Save & Next'}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={!word.trim() || !meaning.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Save className="w-4 h-4" />
              <span>{isFa ? 'ذخیره کارت' : 'Save Card'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
