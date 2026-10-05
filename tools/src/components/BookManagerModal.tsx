import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  FolderPlus, 
  Edit3, 
  Trash2, 
  Download, 
  Check, 
  Plus, 
  Folder as FolderIcon,
  AlertTriangle,
  Sparkles,
  Layers
} from 'lucide-react';
import { Book, Folder as FolderType } from '../types';

interface BookManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  allBooks: Book[];
  onRenameBook: (bookId: string, newName: string) => void;
  onDeleteBook: (bookId: string) => void;
  onCreateFolder: (bookId: string, name: string, parentId?: string | null) => void;
  onRenameFolder: (bookId: string, folderId: string, newName: string) => void;
  onDeleteFolder: (bookId: string, folderId: string) => void;
  onExportBook: (book: Book) => void;
  onExportAnki?: (book: Book) => void;
  lang: 'fa' | 'en';
}

export const BookManagerModal: React.FC<BookManagerModalProps> = ({
  isOpen,
  onClose,
  book,
  allBooks,
  onRenameBook,
  onDeleteBook,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onExportBook,
  onExportAnki,
  lang
}) => {
  const isFa = lang === 'fa';

  const [bookName, setBookName] = useState(book.name);
  const [isEditingName, setIsEditingName] = useState(false);

  // New Folder creation
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);

  // Folder renaming state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Confirm delete states
  const [confirmDeleteBook, setConfirmDeleteBook] = useState(false);
  const [confirmDeleteFolderId, setConfirmDeleteFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveBookName = () => {
    if (bookName.trim() && bookName.trim() !== book.name) {
      onRenameBook(book.id, bookName.trim());
    }
    setIsEditingName(false);
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(book.id, newFolderName.trim(), newFolderParentId);
    setNewFolderName('');
    setShowAddFolder(false);
  };

  const handleStartRenameFolder = (f: FolderType) => {
    setEditingFolderId(f.id);
    setEditingFolderName(f.name);
  };

  const handleSaveRenameFolder = (folderId: string) => {
    if (editingFolderName.trim()) {
      onRenameFolder(book.id, folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
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
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                {isFa ? 'مدیریت و ویرایش کتاب' : 'Manage Book & Lessons'}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {book.flashcards.length} {isFa ? 'کارت' : 'cards'} · {book.folders.length} {isFa ? 'پوشه/درس' : 'folders'}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Section 1: Book Name Editing */}
          <div 
            className="p-4 rounded-2xl border space-y-2"
            style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
          >
            <label className="text-xs font-bold block" style={{ color: 'var(--text-secondary)' }}>
              {isFa ? 'نام کتاب در کتابخانه:' : 'Book Name:'}
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={bookName}
                onChange={(e) => {
                  setBookName(e.target.value);
                  setIsEditingName(true);
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-black focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: isEditingName ? 'var(--accent)' : 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />

              {isEditingName && (
                <button
                  onClick={handleSaveBookName}
                  className="px-3.5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Actions for this book */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <button
                onClick={() => onExportBook(book)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isFa ? 'دانلود نسخه JSON' : 'Export JSON'}</span>
              </button>

              {onExportAnki && (
                <button
                  onClick={() => onExportAnki(book)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isFa ? 'خروجی بسته آنکی (.txt)' : 'Export Anki (.txt)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Folders & Lessons Management */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                {isFa ? 'پوشه‌ها و جلسات مطالعه' : 'Folders & Lessons'}
              </span>

              <button
                onClick={() => {
                  setShowAddFolder(!showAddFolder);
                  setNewFolderParentId(null);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors"
                style={{ 
                  borderColor: 'var(--accent)', 
                  color: 'var(--accent)',
                  backgroundColor: showAddFolder ? 'var(--accent-light)' : 'transparent'
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFa ? 'افزودن پوشه' : 'Add Folder'}</span>
              </button>
            </div>

            {/* Add Folder Inline Form */}
            {showAddFolder && (
              <form onSubmit={handleCreateNewFolder} className="p-3.5 rounded-2xl border space-y-2.5 animate-in fade-in duration-150" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--accent)' }}>
                <h5 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {newFolderParentId 
                    ? (isFa ? 'افزودن زیرپوشه / جلسه جدید' : 'Add Subfolder')
                    : (isFa ? 'افزودن پوشه اصلی جدید' : 'Add Main Folder')}
                </h5>

                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={isFa ? 'نام پوشه (مثلاً: هفته اول، جلسه ۲...)' : 'Folder name...'}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-bold focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFolder(false)}
                    className="px-3 py-1.5 rounded-xl text-xs border"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    {isFa ? 'انصراف' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {isFa ? 'تأیید و ساخت' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {/* Folders List */}
            {book.folders.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border text-xs" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                {isFa ? 'این کتاب هنوز پوشه‌ای ندارد. کارت‌ها مستقیماً در کتاب ذخیره شده‌اند.' : 'No folders defined in this book yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {rootFolders.map(rf => {
                  const children = getSubfolders(rf.id);
                  const isEditingThis = editingFolderId === rf.id;
                  const isDeletingThis = confirmDeleteFolderId === rf.id;
                  const count = book.flashcards.filter(c => c.folderId === rf.id).length;

                  return (
                    <div 
                      key={rf.id}
                      className="p-3 rounded-2xl border space-y-2"
                      style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
                          
                          {isEditingThis ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                className="px-2 py-0.5 rounded text-xs border bg-white dark:bg-stone-900"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRenameFolder(rf.id)}
                                className="p-1 rounded bg-emerald-600 text-white"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                              {rf.name}
                            </span>
                          )}
                          <span className="text-[10px] opacity-75 font-mono">
                            ({count} {isFa ? 'کارت' : 'cards'})
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setNewFolderParentId(rf.id);
                              setShowAddFolder(true);
                            }}
                            className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5"
                            title={isFa ? 'افزودن زیرپوشه' : 'Add Subfolder'}
                          >
                            <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
                          </button>

                          {!isEditingThis && (
                            <button
                              onClick={() => handleStartRenameFolder(rf)}
                              className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5"
                              title={isFa ? 'ویرایش نام' : 'Rename'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isDeletingThis ? (
                            <div className="flex items-center gap-1 bg-red-100 dark:bg-red-950 p-0.5 rounded-lg">
                              <button
                                onClick={() => {
                                  onDeleteFolder(book.id, rf.id);
                                  setConfirmDeleteFolderId(null);
                                }}
                                className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]"
                              >
                                {isFa ? 'حذف' : 'Del'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteFolderId(null)}
                                className="px-1 text-[10px] text-stone-500"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteFolderId(rf.id)}
                              className="p-1.5 rounded-lg border hover:text-red-500"
                              title={isFa ? 'حذف پوشه' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subfolders */}
                      {children.length > 0 && (
                        <div className="ms-4 ps-2 border-s-2 space-y-1" style={{ borderColor: 'var(--accent)' }}>
                          {children.map(sub => {
                            const isEditingSub = editingFolderId === sub.id;
                            const isDeletingSub = confirmDeleteFolderId === sub.id;
                            const subCount = book.flashcards.filter(c => c.folderId === sub.id).length;

                            return (
                              <div key={sub.id} className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-amber-500">↳</span>
                                  {isEditingSub ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={editingFolderName}
                                        onChange={(e) => setEditingFolderName(e.target.value)}
                                        className="px-2 py-0.5 rounded text-xs border"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveRenameFolder(sub.id)}
                                        className="p-0.5 rounded bg-emerald-600 text-white"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                      {sub.name}
                                    </span>
                                  )}
                                  <span className="text-[10px] opacity-75 font-mono">({subCount})</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {!isEditingSub && (
                                    <button
                                      onClick={() => handleStartRenameFolder(sub)}
                                      className="p-1 text-stone-400 hover:text-stone-700"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onDeleteFolder(book.id, sub.id)}
                                    className="p-1 text-stone-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
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

          {/* Section 3: Delete Book (Safe Danger Zone) */}
          {allBooks.length > 1 && (
            <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              {confirmDeleteBook ? (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 space-y-2">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{isFa ? `آیا از حذف کامل کتاب «${book.name}» اطمینان دارید؟` : `Delete "${book.name}"?`}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setConfirmDeleteBook(false)}
                      className="px-3 py-1 rounded-xl text-xs font-bold border bg-white dark:bg-stone-900"
                    >
                      {isFa ? 'انصراف' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteBook(book.id);
                        onClose();
                      }}
                      className="px-4 py-1 rounded-xl bg-red-600 text-white font-bold text-xs"
                    >
                      {isFa ? 'بله، حذف کن' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteBook(true)}
                  className="w-full py-2.5 rounded-2xl border text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center justify-center gap-1.5"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isFa ? 'حذف این کتاب از کتابخانه' : 'Delete this book'}</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            {isFa ? 'بستن' : 'Done'}
          </button>
        </div>

      </div>
    </div>
  );
};
