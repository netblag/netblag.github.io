import { Book, Folder, Flashcard, StudyLog, AppSettings, LexiBookExportJson } from '../types';

const DB_NAME = 'LexiBookDB_v1';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  lang: 'fa',
  ttsSpeed: 1.0,
  ttsPitch: 1.0,
  autoPlayAudio: true,
  dailyGoal: 20
};

export class DatabaseService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('studyLogs')) {
          const logStore = db.createObjectStore('studyLogs', { keyPath: 'id' });
          logStore.createIndex('dateKey', 'dateKey', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Initializes database. Starts completely blank (raw) for the user.
   * Cleans any previous default pre-seeded books if present.
   */
  static async init(): Promise<{ books: Book[]; activeBookId: string; settings: AppSettings }> {
    try {
      let books = await this.getAllBooks();
      const settings = await this.getSettings();

      // Check if existing data is solely the old pre-seeded default book (e.g. 504)
      // Clean it up so the user gets the completely raw, blank environment they requested
      const isOnlyOldSeededBook = books.length === 1 && (
        books[0].id === 'book_504_essential_words' || 
        (books[0].name.includes('504') && books[0].flashcards.length === 504)
      );

      if (isOnlyOldSeededBook) {
        await this.deleteBook(books[0].id);
        localStorage.removeItem('lexibook_books_backup');
        localStorage.removeItem('lexibook_active_book_id');
        books = [];
      }

      let activeId = localStorage.getItem('lexibook_active_book_id') || '';
      if (!activeId || !books.some(b => b.id === activeId)) {
        activeId = books.length > 0 ? books[0].id : '';
        if (activeId) {
          localStorage.setItem('lexibook_active_book_id', activeId);
        } else {
          localStorage.removeItem('lexibook_active_book_id');
        }
      }

      return { books, activeBookId: activeId, settings };
    } catch (e) {
      console.warn('Falling back to local storage for database:', e);
      return { 
        books: [], 
        activeBookId: '', 
        settings: DEFAULT_SETTINGS 
      };
    }
  }

  /**
   * Completely clears all books and study logs (Clean Slate / Reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['books', 'studyLogs'], 'readwrite');
        tx.objectStore('books').clear();
        tx.objectStore('studyLogs').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('lexibook_books_backup');
      localStorage.removeItem('lexibook_active_book_id');
      localStorage.removeItem('lexibook_studylogs');
    } catch {
      // ignore
    }
  }

  // --- Books ---
  static async getAllBooks(): Promise<Book[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('books', 'readonly');
        const store = tx.objectStore('books');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const local = localStorage.getItem('lexibook_books_backup');
      return local ? JSON.parse(local) : [];
    }
  }

  static async saveBook(book: Book): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        const req = store.put(book);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
    // Mirror in localStorage for fast emergency sync
    try {
      const books = await this.getAllBooks();
      localStorage.setItem('lexibook_books_backup', JSON.stringify(books));
    } catch {
      // ignore
    }
  }

  static async deleteBook(bookId: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        const req = store.delete(bookId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // ignore
    }
  }

  // --- Study Logs & Analytics ---
  /**
   * Applies the SM-2 Leitner spaced repetition algorithm and updates the card in database
   */
  static async updateCardSrs(
    bookId: string, 
    cardId: string, 
    rating: 'again' | 'hard' | 'good' | 'easy'
  ): Promise<Flashcard | null> {
    const books = await this.getAllBooks();
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex === -1) return null;

    const book = books[bookIndex];
    const cardIndex = book.flashcards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return null;

    const card = book.flashcards[cardIndex];
    const now = Date.now();
    let srsLevel = card.srsLevel || 0;
    let intervalDays = card.intervalDays || 0;
    let easeFactor = card.easeFactor || 2.5;
    let reviewCount = (card.reviewCount || 0) + 1;
    let nextReviewDate = now;
    let mastered = card.mastered || false;

    switch (rating) {
      case 'again':
        // Reset to learning phase
        srsLevel = 1;
        intervalDays = 0;
        easeFactor = Math.max(1.3, easeFactor - 0.2);
        // Review in 10 minutes
        nextReviewDate = now + 10 * 60 * 1000;
        mastered = false;
        break;

      case 'hard':
        srsLevel = Math.max(1, srsLevel);
        intervalDays = Math.max(1, Math.round((intervalDays || 1) * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;
        mastered = false;
        break;

      case 'good':
        srsLevel = Math.min(4, srsLevel + 1);
        if (intervalDays === 0) intervalDays = 1;
        else if (intervalDays === 1) intervalDays = 3;
        else intervalDays = Math.round(intervalDays * easeFactor);
        
        nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;
        mastered = srsLevel >= 3;
        break;

      case 'easy':
        srsLevel = 4;
        if (intervalDays === 0) intervalDays = 4;
        else intervalDays = Math.round(intervalDays * easeFactor * 1.3);
        
        easeFactor = easeFactor + 0.15;
        nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;
        mastered = true;
        break;
    }

    const updatedCard: Flashcard = {
      ...card,
      srsLevel,
      intervalDays,
      easeFactor,
      nextReviewDate,
      lastReviewed: now,
      reviewCount,
      mastered
    };

    book.flashcards[cardIndex] = updatedCard;
    await this.saveBook(book);
    await this.recordStudyLog({ cardId, bookId, rating });

    return updatedCard;
  }

  static async recordStudyLog(log: Omit<StudyLog, 'id' | 'timestamp' | 'dateKey'>): Promise<void> {
    const now = new Date();
    const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const entry: StudyLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      dateKey
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('studyLogs', 'readwrite');
        const store = tx.objectStore('studyLogs');
        const req = store.add(entry);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const logs = JSON.parse(localStorage.getItem('lexibook_studylogs') || '[]');
      logs.push(entry);
      localStorage.setItem('lexibook_studylogs', JSON.stringify(logs.slice(-500)));
    }
  }

  static async getStudyLogs(): Promise<StudyLog[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('studyLogs', 'readonly');
        const store = tx.objectStore('studyLogs');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return JSON.parse(localStorage.getItem('lexibook_studylogs') || '[]');
    }
  }

  // --- Settings ---
  static async getSettings(): Promise<AppSettings> {
    try {
      const local = localStorage.getItem('lexibook_settings');
      if (local) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem('lexibook_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  // --- JSON Parser for Lexi Book JSON structure ---
  static parseJsonToBook(parsed: any): Book {
    if (!parsed) {
      throw new Error('فایل یا متن وارد شده خالی است.');
    }

    const bookId = 'book_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const folders: Folder[] = [];
    const flashcards: Flashcard[] = [];

    // Case A: Direct Array of Cards e.g. [ { word, meaning }, ... ]
    if (Array.isArray(parsed)) {
      parsed.forEach((fc: any, idx: number) => {
        const word = fc.word || fc.front || fc.question || '';
        const meaning = fc.meaning || fc.back || fc.answer || '';
        if (word || meaning) {
          flashcards.push({
            id: 'c_' + Math.random().toString(36).substring(2, 9),
            bookId,
            folderId: null,
            word: String(word).trim(),
            meaning: String(meaning).trim(),
            phonetic: fc.phonetic ? String(fc.phonetic).trim() : undefined,
            type: fc.type ? String(fc.type).trim() : undefined,
            example: fc.example ? String(fc.example).trim() : undefined,
            notes: fc.notes ? String(fc.notes).trim() : undefined,
            order: typeof fc.order === 'number' ? fc.order : idx,
            createdAt: Date.now(),
            srsLevel: 0,
            intervalDays: 0,
            reviewCount: 0
          });
        }
      });

      return {
        id: bookId,
        name: 'کتاب وارد شده',
        createdAt: Date.now(),
        folders: [],
        flashcards
      };
    }

    // Case B: Standard Object with bookName / name
    const bookName = (parsed.bookName || parsed.name || parsed.title || 'کتاب وارد شده').trim();

    // 1. Root flashcards (could be rootFlashcards, flashcards, or cards)
    const rawRootCards = Array.isArray(parsed.rootFlashcards) 
      ? parsed.rootFlashcards 
      : Array.isArray(parsed.flashcards) 
      ? parsed.flashcards 
      : Array.isArray(parsed.cards)
      ? parsed.cards
      : [];

    rawRootCards.forEach((fc: any, idx: number) => {
      const word = fc.word || fc.front || fc.question || '';
      const meaning = fc.meaning || fc.back || fc.answer || '';
      if (word || meaning) {
        flashcards.push({
          id: 'c_' + Math.random().toString(36).substring(2, 9),
          bookId,
          folderId: null,
          word: String(word).trim(),
          meaning: String(meaning).trim(),
          phonetic: fc.phonetic ? String(fc.phonetic).trim() : undefined,
          type: fc.type ? String(fc.type).trim() : undefined,
          example: fc.example ? String(fc.example).trim() : undefined,
          notes: fc.notes ? String(fc.notes).trim() : undefined,
          order: typeof fc.order === 'number' ? fc.order : idx,
          createdAt: Date.now(),
          srsLevel: 0,
          intervalDays: 0,
          reviewCount: 0
        });
      }
    });

    // 2. Folders & Subfolders
    if (Array.isArray(parsed.folders)) {
      parsed.folders.forEach((f: any, fIdx: number) => {
        const folderId = 'f_' + Math.random().toString(36).substring(2, 9);
        folders.push({
          id: folderId,
          bookId,
          name: String(f.name || f.title || `پوشه ${fIdx + 1}`).trim(),
          parentId: null,
          order: fIdx,
          createdAt: Date.now()
        });

        // Flashcards in root folder
        const folderCards = Array.isArray(f.flashcards) ? f.flashcards : Array.isArray(f.cards) ? f.cards : [];
        folderCards.forEach((fc: any, fcIdx: number) => {
          const word = fc.word || fc.front || fc.question || '';
          const meaning = fc.meaning || fc.back || fc.answer || '';
          if (word || meaning) {
            flashcards.push({
              id: 'c_' + Math.random().toString(36).substring(2, 9),
              bookId,
              folderId,
              word: String(word).trim(),
              meaning: String(meaning).trim(),
              phonetic: fc.phonetic ? String(fc.phonetic).trim() : undefined,
              type: fc.type ? String(fc.type).trim() : undefined,
              example: fc.example ? String(fc.example).trim() : undefined,
              notes: fc.notes ? String(fc.notes).trim() : undefined,
              order: typeof fc.order === 'number' ? fc.order : fcIdx,
              createdAt: Date.now(),
              srsLevel: 0,
              intervalDays: 0,
              reviewCount: 0
            });
          }
        });

        // Subfolders (e.g. Session 1, Session 2)
        const subfoldersList = Array.isArray(f.subfolders) ? f.subfolders : Array.isArray(f.children) ? f.children : [];
        subfoldersList.forEach((sub: any, subIdx: number) => {
          const subId = 'f_sub_' + Math.random().toString(36).substring(2, 9);
          folders.push({
            id: subId,
            bookId,
            name: String(sub.name || sub.title || `جلسه ${subIdx + 1}`).trim(),
            parentId: folderId,
            order: subIdx,
            createdAt: Date.now()
          });

          const subCards = Array.isArray(sub.flashcards) ? sub.flashcards : Array.isArray(sub.cards) ? sub.cards : [];
          subCards.forEach((sfc: any, sIdx: number) => {
            const word = sfc.word || sfc.front || sfc.question || '';
            const meaning = sfc.meaning || sfc.back || sfc.answer || '';
            if (word || meaning) {
              flashcards.push({
                id: 'c_' + Math.random().toString(36).substring(2, 9),
                bookId,
                folderId: subId,
                word: String(word).trim(),
                meaning: String(meaning).trim(),
                phonetic: sfc.phonetic ? String(sfc.phonetic).trim() : undefined,
                type: sfc.type ? String(sfc.type).trim() : undefined,
                example: sfc.example ? String(sfc.example).trim() : undefined,
                notes: sfc.notes ? String(sfc.notes).trim() : undefined,
                order: typeof sfc.order === 'number' ? sfc.order : sIdx,
                createdAt: Date.now(),
                srsLevel: 0,
                intervalDays: 0,
                reviewCount: 0
              });
            }
          });
        });
      });
    }

    return {
      id: bookId,
      name: bookName,
      createdAt: Date.now(),
      folders,
      flashcards
    };
  }

  /**
   * Generates standard Lexi Book JSON export for a book
   */
  static exportBookToJson(book: Book): LexiBookExportJson {
    const rootCards = book.flashcards
      .filter(c => !c.folderId)
      .map(c => ({
        word: c.word,
        meaning: c.meaning,
        phonetic: c.phonetic,
        type: c.type,
        example: c.example,
        notes: c.notes,
        order: c.order
      }));

    const rootFolders = book.folders.filter(f => !f.parentId);
    const subFolders = book.folders.filter(f => f.parentId);

    const foldersExport = rootFolders.map(rf => {
      const rfCards = book.flashcards
        .filter(c => c.folderId === rf.id)
        .map(c => ({
          word: c.word,
          meaning: c.meaning,
          phonetic: c.phonetic,
          type: c.type,
          example: c.example,
          notes: c.notes,
          order: c.order
        }));

      const childFolders = subFolders
        .filter(sf => sf.parentId === rf.id)
        .map(sf => {
          const sfCards = book.flashcards
            .filter(c => c.folderId === sf.id)
            .map(c => ({
              word: c.word,
              meaning: c.meaning,
              phonetic: c.phonetic,
              type: c.type,
              example: c.example,
              notes: c.notes,
              order: c.order
            }));
          return {
            name: sf.name,
            flashcards: sfCards,
            subfolders: []
          };
        });

      return {
        name: rf.name,
        flashcards: rfCards,
        subfolders: childFolders
      };
    });

    return {
      bookName: book.name,
      createdAt: book.createdAt,
      rootFlashcards: rootCards,
      folders: foldersExport
    };
  }
}
