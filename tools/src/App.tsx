import React, { useState, useEffect } from 'react';
import { BookMarked, Upload, Plus } from 'lucide-react';
import { Book, Flashcard, Folder, ThemeMode, AppSettings } from './types';
import { DatabaseService } from './services/db';
import { generateAnkiExportText } from './services/ankiParser';
import { Navigation, ActiveTab } from './components/Navigation';
import { Header } from './components/Header';
import { LibraryTab } from './components/LibraryTab';
import { CardsTab } from './components/CardsTab';
import { TextReaderTab } from './components/TextReaderTab';
import { StudyTab } from './components/StudyTab';
import { QuizTab } from './components/QuizTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { CardEditModal } from './components/CardEditModal';
import { BookEditModal } from './components/BookEditModal';
import { BookManagerModal } from './components/BookManagerModal';
import { ImportBookModal } from './components/ImportBookModal';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookId, setActiveBookId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [studyCardsOverride, setStudyCardsOverride] = useState<Flashcard[] | undefined>(undefined);

  // Settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    lang: 'fa',
    ttsSpeed: 1.0,
    ttsPitch: 1.0,
    autoPlayAudio: true,
    dailyGoal: 20
  });

  // Modal states
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewBookModalOpen, setIsNewBookModalOpen] = useState(false);
  const [isManageBookModalOpen, setIsManageBookModalOpen] = useState(false);
  const [managingBook, setManagingBook] = useState<Book | null>(null);

  // Load from IndexedDB on startup
  useEffect(() => {
    DatabaseService.init().then(({ books, activeBookId, settings }) => {
      setBooks(books);
      setActiveBookId(activeBookId);
      setSettings(settings);
    });
  }, []);

  // Theme & Language HTML attribute synchronization
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-warm');
    root.classList.add(`theme-${settings.theme}`);

    root.setAttribute('lang', settings.lang);
    root.setAttribute('dir', settings.lang === 'fa' ? 'rtl' : 'ltr');

    DatabaseService.saveSettings(settings);
  }, [settings]);

  const activeBook = books.find(b => b.id === activeBookId) || books[0] || null;

  // Persist Active Book
  const handleSelectBook = (id: string) => {
    setActiveBookId(id);
    setSelectedFolderId(null);
    localStorage.setItem('lexibook_active_book_id', id);
  };

  // Theme cycle toggle (light -> dark -> warm -> light)
  const handleToggleTheme = () => {
    const cycle: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'warm',
      warm: 'light'
    };
    setSettings(prev => ({ ...prev, theme: cycle[prev.theme] }));
  };

  const handleToggleLang = () => {
    setSettings(prev => ({ ...prev, lang: prev.lang === 'fa' ? 'en' : 'fa' }));
  };

  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
  };

  // --- Book Operations ---
  const handleCreateBook = async (name: string) => {
    const newBook: Book = {
      id: 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name,
      createdAt: Date.now(),
      folders: [],
      flashcards: []
    };
    await DatabaseService.saveBook(newBook);
    setBooks(prev => [newBook, ...prev]);
    setActiveBookId(newBook.id);
  };

  const handleRenameBook = async (bookId: string, newName: string) => {
    const updatedBooks = books.map(b => b.id === bookId ? { ...b, name: newName } : b);
    setBooks(updatedBooks);
    const target = updatedBooks.find(b => b.id === bookId);
    if (target) await DatabaseService.saveBook(target);
  };

  const handleDeleteBook = async (bookId: string) => {
    await DatabaseService.deleteBook(bookId);
    const remaining = books.filter(b => b.id !== bookId);
    setBooks(remaining);
    if (activeBookId === bookId && remaining.length > 0) {
      setActiveBookId(remaining[0].id);
    }
  };

  // --- Folder Operations ---
  const handleCreateFolder = async (bookId: string, folderName: string, parentId?: string | null) => {
    const targetBook = books.find(b => b.id === bookId);
    if (!targetBook) return;

    const newFolder: Folder = {
      id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      bookId,
      name: folderName,
      parentId: parentId || null,
      order: targetBook.folders.length,
      createdAt: Date.now()
    };

    const updatedBook: Book = {
      ...targetBook,
      folders: [...targetBook.folders, newFolder]
    };

    await DatabaseService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
  };

  const handleRenameFolder = async (bookId: string, folderId: string, newName: string) => {
    const targetBook = books.find(b => b.id === bookId);
    if (!targetBook) return;

    const updatedBook: Book = {
      ...targetBook,
      folders: targetBook.folders.map(f => f.id === folderId ? { ...f, name: newName } : f)
    };

    await DatabaseService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
  };

  const handleDeleteFolder = async (bookId: string, folderId: string) => {
    const targetBook = books.find(b => b.id === bookId);
    if (!targetBook) return;

    const subIds = new Set(targetBook.folders.filter(f => f.parentId === folderId).map(f => f.id));
    const toRemove = new Set([folderId, ...subIds]);

    const updatedBook: Book = {
      ...targetBook,
      folders: targetBook.folders.filter(f => !toRemove.has(f.id)),
      flashcards: targetBook.flashcards.map(c => c.folderId && toRemove.has(c.folderId) ? { ...c, folderId: null } : c)
    };

    await DatabaseService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === bookId ? updatedBook : b));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  // --- Flashcard Operations ---
  const handleSaveCard = async (
    cardData: Omit<Flashcard, 'id' | 'bookId' | 'createdAt' | 'order'>, 
    stayOpen = false
  ) => {
    if (!activeBook) return;

    let updatedBook: Book;
    if (editingCard) {
      updatedBook = {
        ...activeBook,
        flashcards: activeBook.flashcards.map(c => 
          c.id === editingCard.id ? { ...c, ...cardData } : c
        )
      };
    } else {
      const newCard: Flashcard = {
        ...cardData,
        id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        bookId: activeBook.id,
        order: activeBook.flashcards.length,
        createdAt: Date.now()
      };
      updatedBook = {
        ...activeBook,
        flashcards: [newCard, ...activeBook.flashcards]
      };
    }

    await DatabaseService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));

    if (!stayOpen) {
      setIsCardModalOpen(false);
      setEditingCard(null);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!activeBook) return;
    const updatedBook: Book = {
      ...activeBook,
      flashcards: activeBook.flashcards.filter(c => c.id !== cardId)
    };
    await DatabaseService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));
  };

  const handleToggleMastered = async (cardId: string) => {
    if (!activeBook) return;
    const updatedBook: Book = {
      ...activeBook,
      flashcards: activeBook.flashcards.map(c => 
        c.id === cardId ? { ...c, mastered: !c.mastered } : c
      )
    };
    await DatabaseService.saveBook(updatedBook);
    setBooks(prev => prev.map(b => b.id === activeBook.id ? updatedBook : b));
  };

  // --- Anki (.txt) Export ---
  const handleExportAnki = (targetBook: Book) => {
    const text = generateAnkiExportText(targetBook.name, targetBook.flashcards);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${targetBook.name.replace(/\s+/g, '_')}_anki.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Reset All Data to Clean Slate ---
  const handleResetAllData = async () => {
    await DatabaseService.clearAllData();
    setBooks([]);
    setActiveBookId('');
    setSelectedFolderId(null);
    setStudyCardsOverride(undefined);
    setActiveTab('library');
  };

  // --- JSON Export of Active Book ---
  const handleExportBook = (targetBook: Book) => {
    const exportJson = DatabaseService.exportBookToJson(targetBook);
    const jsonString = JSON.stringify(exportJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${targetBook.name.replace(/\s+/g, '_')}_lexibook.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportSuccess = (newBook: Book) => {
    setBooks(prev => {
      const exists = prev.some(b => b.id === newBook.id);
      if (exists) {
        return prev.map(b => b.id === newBook.id ? newBook : b);
      }
      return [newBook, ...prev];
    });
    setActiveBookId(newBook.id);
    setSelectedFolderId(null);
  };

  const totalCardsCount = activeBook ? activeBook.flashcards.length : 0;
  const dueCardsCount = activeBook ? activeBook.flashcards.filter(c => !c.mastered).length : 0;

  return (
    <div className="min-h-screen flex flex-col font-['Vazirmatn',system-ui,sans-serif] transition-colors" style={{ backgroundColor: 'var(--bg-main)' }}>
      
      {/* Top Header */}
      <Header
        books={books}
        activeBook={activeBook}
        onSelectBook={handleSelectBook}
        onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenManageBookModal={() => {
          if (activeBook) {
            setManagingBook(activeBook);
            setIsManageBookModalOpen(true);
          }
        }}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        lang={settings.lang}
        onToggleLang={handleToggleLang}
      />

      {/* Main Expansive View Router */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          
          {/* Tab 1: Library & Folders */}
          {activeTab === 'library' && (
            <LibraryTab
              books={books}
              activeBookId={activeBookId}
              onSelectBook={handleSelectBook}
              onOpenNewBookModal={() => setIsNewBookModalOpen(true)}
              onOpenManageBookModal={(b) => {
                setManagingBook(b);
                setIsManageBookModalOpen(true);
              }}
              onNavigateToCards={(folderId) => {
                setSelectedFolderId(folderId || null);
                setActiveTab('cards');
              }}
              onNavigateToStudy={(cards) => {
                setStudyCardsOverride(cards);
                setActiveTab('study');
              }}
              onNavigateToReading={(folderId) => {
                setSelectedFolderId(folderId || null);
                setActiveTab('reading');
              }}
              onOpenImport={() => setIsImportModalOpen(true)}
              lang={settings.lang}
            />
          )}

          {/* Tab 2: Flashcards Explorer */}
          {activeTab === 'cards' && activeBook && (
            <CardsTab
              book={activeBook}
              activeFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onAddCard={() => {
                setEditingCard(null);
                setIsCardModalOpen(true);
              }}
              onEditCard={(c) => {
                setEditingCard(c);
                setIsCardModalOpen(true);
              }}
              onDeleteCard={handleDeleteCard}
              onToggleMastered={handleToggleMastered}
              onStartStudy={(cards) => {
                setStudyCardsOverride(cards);
                setActiveTab('study');
              }}
              lang={settings.lang}
            />
          )}

          {/* Tab 3: Text Reader & Audio Player ("گزینه خواندن متن") */}
          {activeTab === 'reading' && activeBook && (
            <TextReaderTab
              book={activeBook}
              lang={settings.lang}
            />
          )}

          {/* Tab 4: Leitner / SRS 3D Flip Study Session */}
          {activeTab === 'study' && activeBook && (
            <StudyTab
              book={activeBook}
              customCards={studyCardsOverride}
              lang={settings.lang}
            />
          )}

          {/* Tab 5: Interactive Quiz & Analytics */}
          {activeTab === 'quiz' && activeBook && (
            <div className="space-y-4">
              <QuizTab
                book={activeBook}
                allBooks={books}
                lang={settings.lang}
              />

              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <AnalyticsTab
                  books={books}
                  activeBook={activeBook}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onImportSuccess={handleImportSuccess}
                  onExportCurrentBook={() => activeBook && handleExportBook(activeBook)}
                  onExportAnki={() => activeBook && handleExportAnki(activeBook)}
                  onResetAllData={handleResetAllData}
                  lang={settings.lang}
                />
              </div>
            </div>
          )}

          {/* Empty Slate Prompt when no active book is selected */}
          {activeTab !== 'library' && !activeBook && (
            <div 
              className="rounded-3xl p-8 sm:p-12 border text-center space-y-4 max-w-lg mx-auto my-12"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              <div 
                className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white shadow-md text-2xl font-black"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <BookMarked className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  {settings.lang === 'fa' ? 'هیچ کتاب فعالی وجود ندارد (پلتفرم خام)' : 'No Active Book'}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  {settings.lang === 'fa'
                    ? 'برای دسترسی به این بخش، ابتدا یک کتاب جدید بسازید یا پکیج آنکی (.apkg) خود را وارد نمایید.'
                    : 'Please create a new book or import your Anki (.apkg) deck to get started.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Upload className="w-4 h-4" />
                  <span>{settings.lang === 'fa' ? 'وارد کردن پکیج آنکی (.apkg)' : 'Import Anki (.apkg)'}</span>
                </button>

                <button
                  onClick={() => setIsNewBookModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border font-bold text-xs sm:text-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <Plus className="w-4 h-4" />
                  <span>{settings.lang === 'fa' ? 'ایجاد کتاب جدید' : 'New Book'}</span>
                </button>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Navigation Bar */}
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setStudyCardsOverride(undefined);
          }}
          cardsCount={totalCardsCount}
          dueCardsCount={dueCardsCount}
          lang={settings.lang}
        />

      {/* Modals */}
      {activeBook && (
        <CardEditModal
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setEditingCard(null);
          }}
          card={editingCard}
          book={activeBook}
          currentFolderId={selectedFolderId}
          onSave={handleSaveCard}
          lang={settings.lang}
        />
      )}

      {/* New Book Modal */}
      <BookEditModal
        isOpen={isNewBookModalOpen}
        onClose={() => setIsNewBookModalOpen(false)}
        mode="create_book"
        targetBook={activeBook}
        onSubmitBook={handleCreateBook}
        onSubmitFolder={handleCreateFolder}
        lang={settings.lang}
      />

      {/* Book & Folders Manager Modal */}
      {managingBook && (
        <BookManagerModal
          isOpen={isManageBookModalOpen}
          onClose={() => {
            setIsManageBookModalOpen(false);
            setManagingBook(null);
          }}
          book={managingBook}
          allBooks={books}
          onRenameBook={handleRenameBook}
          onDeleteBook={handleDeleteBook}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onExportBook={handleExportBook}
          onExportAnki={handleExportAnki}
          lang={settings.lang}
        />
      )}

      {/* Clean Import Modal */}
      <ImportBookModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(newBook) => {
          handleImportSuccess(newBook);
          setActiveTab('cards');
        }}
        lang={settings.lang}
      />

    </div>
  );
}
