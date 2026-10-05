import React, { useState, useEffect } from 'react';
import { X, BookOpen, FolderPlus, Save } from 'lucide-react';
import { Book } from '../types';

interface BookEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create_book' | 'create_folder';
  targetBook?: Book | null;
  parentId?: string | null;
  onSubmitBook: (name: string) => void;
  onSubmitFolder: (bookId: string, folderName: string, parentId?: string | null) => void;
  lang: 'fa' | 'en';
}

export const BookEditModal: React.FC<BookEditModalProps> = ({
  isOpen,
  onClose,
  mode,
  targetBook,
  parentId,
  onSubmitBook,
  onSubmitFolder,
  lang
}) => {
  const isFa = lang === 'fa';
  const [name, setName] = useState('');

  useEffect(() => {
    setName('');
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'create_book') {
      onSubmitBook(name.trim());
    } else if (targetBook) {
      onSubmitFolder(targetBook.id, name.trim(), parentId);
    }
    onClose();
  };

  const isFolder = mode === 'create_folder';
  const parentFolderObj = isFolder && targetBook && parentId 
    ? targetBook.folders.find(f => f.id === parentId) 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isFolder ? <FolderPlus className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                {isFolder 
                  ? (parentFolderObj ? (isFa ? `افزودن زیرپوشه در ${parentFolderObj.name}` : `Add Subfolder in ${parentFolderObj.name}`) : (isFa ? 'افزودن پوشه جدید' : 'New Folder'))
                  : (isFa ? 'ایجاد کتاب یا مجموعه جدید' : 'Create New Book')}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {isFolder && targetBook ? targetBook.name : (isFa ? 'برای دسته‌بندی لغات و فلش‌کارت‌ها' : 'Organize your study cards')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
              {isFolder ? (isFa ? 'نام پوشه یا جلسه' : 'Folder / Session Name') : (isFa ? 'نام کتاب' : 'Book Name')}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={isFolder ? (isFa ? 'مثلاً: جلسه اول، درس ۳، یا افعال کاربردی' : 'e.g. Session 1, Lesson 2') : (isFa ? 'مثلاً: واژگان ضروری آیلتس' : 'e.g. 1100 Essential Words')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border hover:bg-black/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Save className="w-4 h-4" />
              <span>{isFolder ? (isFa ? 'ایجاد پوشه' : 'Create Folder') : (isFa ? 'ایجاد کتاب' : 'Create Book')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
