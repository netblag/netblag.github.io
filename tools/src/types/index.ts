export type ThemeMode = 'light' | 'dark' | 'warm';

export interface TextSpan {
  start: number;
  end: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface StructuredText {
  text: string;
  spans: TextSpan[];
}

export interface Flashcard {
  id: string;
  bookId: string;
  folderId?: string | null;
  word: string; // Plain string or serialized JSON with spans
  meaning: string;
  phonetic?: string;
  type?: string; // Noun, Verb, Adjective, etc.
  example?: string;
  notes?: string;
  audioUrl?: string;
  tags?: string[];
  order: number;
  createdAt: number;
  mastered?: boolean;
  srsLevel?: number; // 0 = New, 1 = Learning, 2 = Review, 3 = Mastered, 4 = Burned
  intervalDays?: number;
  nextReviewDate?: number;
  lastReviewed?: number;
  reviewCount?: number;
  easeFactor?: number;
  lapses?: number;
  deckName?: string;
  isCloze?: boolean;
}

export interface Folder {
  id: string;
  bookId: string;
  name: string;
  parentId?: string | null;
  order: number;
  createdAt: number;
}

export interface Book {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  folders: Folder[];
  flashcards: Flashcard[];
}

export interface StudyLog {
  id: string;
  timestamp: number; // Date.now()
  dateKey: string; // YYYY-MM-DD for heatmap
  cardId: string;
  bookId: string;
  rating: 'again' | 'hard' | 'good' | 'easy';
  quizType?: 'srs' | 'quiz_choice' | 'quiz_spell';
}

export interface AppSettings {
  theme: ThemeMode;
  lang: 'fa' | 'en';
  ttsSpeed: number; // 0.75, 1.0, 1.25
  ttsPitch: number; // 1.0
  autoPlayAudio: boolean;
  dailyGoal: number; // e.g. 20 cards
}

// Android Lexi Book Import/Export formats
export interface FlashcardJson {
  word: string;
  phonetic?: string;
  type?: string;
  meaning: string;
  example?: string;
  notes?: string;
  order?: number;
}

export interface FolderJson {
  name: string;
  flashcards?: FlashcardJson[];
  subfolders?: FolderJson[];
}

export interface LexiBookExportJson {
  bookName: string;
  rootFlashcards?: FlashcardJson[];
  folders?: FolderJson[];
  createdAt?: number;
}
