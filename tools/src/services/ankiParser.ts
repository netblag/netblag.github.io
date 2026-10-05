import JSZip from 'jszip';
// @ts-ignore
import initSqlJs from 'sql.js/dist/sql-asm.js';

export interface ParsedAnkiCard {
  word: string;
  meaning: string;
  phonetic?: string;
  type?: string;
  example?: string;
  notes?: string;
  audioUrl?: string;
  tags?: string[];
  deckName?: string;
  folderName?: string;
  isCloze?: boolean;
  srsLevel?: number;
  intervalDays?: number;
  easeFactor?: number;
  reviewCount?: number;
  lapses?: number;
  nextReviewDate?: number;
  mastered?: boolean;
}

export interface ParsedAnkiFolder {
  id: string;
  name: string;
  parentName?: string;
}

export interface ParsedAnkiDeck {
  deckName: string;
  folders: ParsedAnkiFolder[];
  cards: ParsedAnkiCard[];
  mediaFilesCount?: number;
}

/**
 * Cleans HTML formatting commonly found in Anki exports
 */
export function cleanAnkiHtml(htmlStr: string | null | undefined, isClozeQuestion = false): string {
  if (!htmlStr) return '';
  
  let text = String(htmlStr);
  
  // Cloze deletion format: {{c1::answer::hint}} or {{c1::answer}}
  if (isClozeQuestion) {
    // On the question side: show [hint] or [...]
    text = text.replace(/\{\{c\d+::([^:}]+)(?:::([^}]+))?\}\}/g, (_, _answer, hint) => {
      return hint ? `[${hint}]` : '[...]';
    });
  } else {
    // On the answer/general side: show the answered text
    text = text.replace(/\{\{c\d+::([^:}]+)(?:::([^}]+))?\}\}/g, '$1');
  }
  
  // Remove sound tags from text: [sound:filename.mp3]
  text = text.replace(/\[sound:[^\]]+\]/gi, '');
  
  // Replace <br>, <div>, <p> with newlines
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  
  // Remove script and style tags and their contents
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&zwnj;/gi, '‌')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');
    
  return text.trim();
}

/**
 * Extracts sound file name from an Anki field if present: [sound:filename.mp3]
 */
export function extractSoundFilename(rawStr: string | null | undefined): string | undefined {
  if (!rawStr) return undefined;
  const match = rawStr.match(/\[sound:([^\]]+)\]/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Helper to get MIME type for audio files
 */
function getAudioMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3': return 'audio/mpeg';
    case 'ogg': return 'audio/ogg';
    case 'wav': return 'audio/wav';
    case 'm4a': return 'audio/mp4';
    case 'aac': return 'audio/aac';
    case 'webm': return 'audio/webm';
    default: return 'audio/mpeg';
  }
}

/**
 * Parses Anki .apkg or .colpkg package
 * Reads collection.anki2 / collection.anki21, decks, models, notes, cards, and media files.
 */
export async function parseAnkiApkg(fileBuffer: ArrayBuffer): Promise<ParsedAnkiDeck> {
  const zip = await JSZip.loadAsync(fileBuffer);

  // 1. Look for media file in ZIP
  // Maps numbers like "0": "audio.mp3", "256": "01_1842536142.mp3"
  const audioMap: Record<string, string> = {}; // filename (lowercase & raw) -> dataUrl
  let mediaCount = 0;
  
  const mediaFile = zip.file('media');
  if (mediaFile) {
    try {
      const mediaJsonStr = await mediaFile.async('text');
      const rawMediaMap = JSON.parse(mediaJsonStr) as Record<string, string>;
      
      // Invert mapping: original filename -> zip entry name
      const fnameToZip: Record<string, string> = {};
      for (const [zipKey, origName] of Object.entries(rawMediaMap)) {
        fnameToZip[origName] = zipKey;
        fnameToZip[origName.toLowerCase()] = zipKey;
        try {
          fnameToZip[decodeURIComponent(origName)] = zipKey;
        } catch {
          // ignore decode error
        }
      }

      // Extract all audio files referenced in media
      const entries = Object.entries(fnameToZip);
      for (const [origName, zipKey] of entries) {
        if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(origName)) {
          const contentFile = zip.file(zipKey);
          if (contentFile && !audioMap[origName]) {
            try {
              const base64Data = await contentFile.async('base64');
              const mime = getAudioMimeType(origName);
              const dataUrl = `data:${mime};base64,${base64Data}`;
              audioMap[origName] = dataUrl;
              audioMap[origName.toLowerCase()] = dataUrl;
              mediaCount++;
            } catch {
              // Ignore single file read errors
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse Anki media mapping:', e);
    }
  }

  // 2. Look for SQLite database in zip
  const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2');
  if (!dbFile) {
    throw new Error('فایل پایگاه داده collection.anki2 یا collection.anki21 در پکیج آنکی (.apkg) یافت نشد.');
  }

  const dbBytes = await dbFile.async('uint8array');

  // Parse with pure JS sql-asm engine (runs reliably in any environment without external wasm files)
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database(dbBytes);

    // A. Parse 'col' table for decks and models
    let rootDeckName = 'مجموعه کارت‌های آنکی';
    const deckIdToNameMap: Record<string, string> = {};
    const deckSubfolders: { id: string; name: string }[] = [];
    const modelFieldsMap: Record<string, {
      wordIdx: number;
      meaningIdx: number;
      phoneticIdx?: number;
      exampleIdx?: number;
      typeIdx?: number;
      notesIdx?: number;
      audioIdx?: number;
      isCloze?: boolean;
    }> = {};

    let colCreatedTime = Date.now();

    try {
      const colRes = db.exec('SELECT decks, models, crt FROM col LIMIT 1;');
      if (colRes.length > 0 && colRes[0].values.length > 0) {
        const [decksJson, modelsJson, crtVal] = colRes[0].values[0];
        
        if (crtVal && typeof crtVal === 'number') {
          colCreatedTime = crtVal * 1000;
        }

        // Parse Decks
        if (decksJson && typeof decksJson === 'string') {
          const decksObj = JSON.parse(decksJson);
          const allDeckKeys = Object.keys(decksObj);
          
          // First pass: look for root deck names
          for (const key of allDeckKeys) {
            const d = decksObj[key];
            if (d && d.name && key !== '1') {
              deckIdToNameMap[key] = d.name;
              if (!d.name.includes('::') && (!rootDeckName || rootDeckName === 'مجموعه کارت‌های آنکی')) {
                rootDeckName = d.name;
              }
            } else if (key === '1' && d?.name) {
              deckIdToNameMap[key] = d.name;
            }
          }

          // Second pass: handle Anki subdecks (e.g. "504 Words::Lesson 01")
          for (const key of allDeckKeys) {
            const d = decksObj[key];
            if (d && d.name && d.name.includes('::')) {
              const parts = d.name.split('::').map((s: string) => s.trim());
              if (!rootDeckName || rootDeckName === 'مجموعه کارت‌های آنکی') {
                rootDeckName = parts[0];
              }
              const subName = parts.slice(1).join(' - ');
              if (!deckSubfolders.some(f => f.name === subName)) {
                deckSubfolders.push({
                  id: 'f_' + key,
                  name: subName
                });
              }
            }
          }

          // Natural numerical sort for lesson folders (Lesson 01, Lesson 02, etc.)
          deckSubfolders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        }

        // Parse Models (Note Types)
        if (modelsJson && typeof modelsJson === 'string') {
          const modelsObj = JSON.parse(modelsJson);
          for (const mid of Object.keys(modelsObj)) {
            const m = modelsObj[mid];
            const flds = m.flds as Array<{ name: string; ord: number }>;
            const isCloze = m.type === 1 || String(m.name || '').toLowerCase().includes('cloze');

            let wordIdx = 0;
            let meaningIdx = 1;
            let phoneticIdx: number | undefined;
            let exampleIdx: number | undefined;
            let typeIdx: number | undefined;
            let notesIdx: number | undefined;
            let audioIdx: number | undefined;

            if (Array.isArray(flds)) {
              flds.forEach((f, idx) => {
                const n = f.name.toLowerCase().trim();
                if (/^(front|word|expression|term|vocab|english|question)$/i.test(n)) {
                  wordIdx = idx;
                } else if (/^(back|meaning|definition|translation|persian|farsi|fa|معنی|ترجمه|answer)$/i.test(n)) {
                  meaningIdx = idx;
                } else if (/^(phonetic|pronunciation|ipa|reading|تلفظ)$/i.test(n)) {
                  phoneticIdx = idx;
                } else if (/^(example|sentence|sample|usage|مثال|جمله)$/i.test(n)) {
                  exampleIdx = idx;
                } else if (/^(type|pos|part of speech|نقش|نوع)$/i.test(n)) {
                  typeIdx = idx;
                } else if (/^(audio|sound|pronunciationaudio|صدا)$/i.test(n)) {
                  audioIdx = idx;
                } else if (/^(notes|note|extra|hint|یادداشت|توضیحات)$/i.test(n)) {
                  notesIdx = idx;
                }
              });
            }

            modelFieldsMap[mid] = {
              wordIdx,
              meaningIdx,
              phoneticIdx,
              exampleIdx,
              typeIdx,
              notesIdx,
              audioIdx,
              isCloze
            };
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse Anki col schemas:', e);
    }

    // B. Parse Notes & Cards using JOIN
    let cardsQuery = `
      SELECT 
        n.id, 
        n.mid, 
        n.flds, 
        n.tags,
        c.did, 
        c.type, 
        c.queue, 
        c.due, 
        c.ivl, 
        c.factor, 
        c.reps, 
        c.lapses
      FROM notes n
      INNER JOIN cards c ON n.id = c.nid
      ORDER BY c.did, c.ord, n.id;
    `;

    let rows: any[] = [];
    try {
      const res = db.exec(cardsQuery);
      if (res.length > 0 && res[0].values) {
        rows = res[0].values;
      }
    } catch {
      // Fallback: query notes directly if cards table query fails
      try {
        const resNotes = db.exec('SELECT id, mid, flds, tags FROM notes;');
        if (resNotes.length > 0 && resNotes[0].values) {
          rows = resNotes[0].values.map(r => [...r, 1, 0, 0, 0, 0, 2500, 0, 0]);
        }
      } catch {
        rows = [];
      }
    }

    const cards: ParsedAnkiCard[] = [];
    const seenWords = new Set<string>();

    for (const row of rows) {
      const mid = String(row[1]);
      const rawFlds = (row[2] as string) || '';
      const rawTags = (row[3] as string) || '';
      const did = String(row[4] || '1');
      const cardType = Number(row[5] || 0); // 0=new, 1=learning, 2=review, 3=relearning
      const cardDue = Number(row[7] || 0);
      const cardIvl = Number(row[8] || 0);
      const cardFactor = Number(row[9] || 2500);
      const cardReps = Number(row[10] || 0);
      const cardLapses = Number(row[11] || 0);

      if (!rawFlds) continue;

      const rawFieldsList = rawFlds.split('\x1f');
      const schema = modelFieldsMap[mid];

      let rawWord = '';
      let rawMeaning = '';
      let rawPhonetic: string | undefined;
      let rawExample: string | undefined;
      let rawType: string | undefined;
      let rawNotes: string | undefined;
      let soundFile: string | undefined;

      // Extract sound tag from any field (especially Front where word is stored)
      for (const fieldStr of rawFieldsList) {
        const sound = extractSoundFilename(fieldStr);
        if (sound) {
          soundFile = sound;
          break;
        }
      }

      if (schema) {
        rawWord = rawFieldsList[schema.wordIdx] || rawFieldsList[0] || '';
        rawMeaning = rawFieldsList[schema.meaningIdx] || rawFieldsList[1] || '';
        if (schema.phoneticIdx !== undefined) rawPhonetic = rawFieldsList[schema.phoneticIdx];
        if (schema.exampleIdx !== undefined) rawExample = rawFieldsList[schema.exampleIdx];
        if (schema.typeIdx !== undefined) rawType = rawFieldsList[schema.typeIdx];
        if (schema.notesIdx !== undefined) rawNotes = rawFieldsList[schema.notesIdx];
      } else {
        rawWord = rawFieldsList[0] || '';
        rawMeaning = rawFieldsList[1] || '';
      }

      // Check remaining fields if phonetic or example not found
      if (!rawPhonetic || !rawExample) {
        for (let i = 2; i < rawFieldsList.length; i++) {
          const val = rawFieldsList[i];
          if (!val) continue;
          const cleanVal = cleanAnkiHtml(val);
          if (!rawPhonetic && (cleanVal.includes('/') || cleanVal.includes('[') || /^[a-zA-Zːˈˌɪeæɑɒɔʊʌuːəɜːpbtdkɡtʃdʒfvθðszʃʒhmnŋlrjw\s/\[\]]+$/.test(cleanVal))) {
            rawPhonetic = cleanVal;
          } else if (!rawExample && cleanVal.length > 8 && cleanVal.includes(' ')) {
            rawExample = cleanVal;
          }
        }
      }

      const word = cleanAnkiHtml(rawWord, schema?.isCloze);
      const meaning = cleanAnkiHtml(rawMeaning, false);

      if (!word || !meaning) continue;

      const key = `${word}:::${meaning}`;
      if (seenWords.has(key)) continue;
      seenWords.add(key);

      // Clean remaining fields
      const phonetic = rawPhonetic ? cleanAnkiHtml(rawPhonetic) : undefined;
      const example = rawExample ? cleanAnkiHtml(rawExample) : undefined;
      const type = rawType ? cleanAnkiHtml(rawType) : undefined;
      const notes = rawNotes ? cleanAnkiHtml(rawNotes) : undefined;
      const tags = rawTags.trim().split(/\s+/).filter(Boolean);

      // Deck / Subdeck identification
      const rawDeckName = deckIdToNameMap[did] || '';
      let folderName: string | undefined;
      if (rawDeckName.includes('::')) {
        folderName = rawDeckName.split('::').slice(1).join(' - ');
      } else if (rawDeckName && rawDeckName !== rootDeckName && rawDeckName !== 'Default') {
        folderName = rawDeckName;
      }

      // If deck has folders, ensure folder is registered
      if (folderName && !deckSubfolders.some(f => f.name === folderName)) {
        deckSubfolders.push({
          id: 'f_' + did,
          name: folderName
        });
      }

      // Calculate SRS intervals from Anki card data
      const intervalDays = cardIvl > 0 ? cardIvl : 0;
      const easeFactor = cardFactor > 0 ? Number((cardFactor / 1000).toFixed(2)) : 2.5;
      const reviewCount = cardReps;
      const lapses = cardLapses;
      
      // SRS Level: 0=New, 1=Learning, 2=Review, 3=Mastered
      let srsLevel = 0;
      if (cardType === 0) srsLevel = 0;
      else if (cardType === 1) srsLevel = 1;
      else if (cardType === 2) srsLevel = intervalDays >= 21 ? 3 : 2;

      const mastered = intervalDays >= 21;

      // Next review date
      let nextReviewDate = Date.now();
      if (intervalDays > 0) {
        nextReviewDate = Date.now() + intervalDays * 24 * 60 * 60 * 1000;
      } else if (cardDue > 0 && cardType === 2) {
        nextReviewDate = colCreatedTime + cardDue * 24 * 60 * 60 * 1000;
      }

      // Look up audio url with fallback to lowercase
      let audioUrl: string | undefined;
      if (soundFile) {
        audioUrl = audioMap[soundFile] || audioMap[soundFile.toLowerCase()];
      }

      cards.push({
        word,
        meaning,
        phonetic,
        type,
        example,
        notes,
        audioUrl,
        tags: tags.length ? tags : undefined,
        deckName: rawDeckName || rootDeckName,
        folderName,
        isCloze: schema?.isCloze,
        srsLevel,
        intervalDays,
        easeFactor,
        reviewCount,
        lapses,
        nextReviewDate,
        mastered
      });
    }

    db.close();

    if (cards.length > 0) {
      return {
        deckName: rootDeckName || 'مجموعه کارت‌های آنکی',
        folders: deckSubfolders,
        cards,
        mediaFilesCount: mediaCount
      };
    }
  } catch (sqlErr) {
    console.warn('sql-asm parse error:', sqlErr);
  }

  // Fallback to binary page scanner
  return fallbackBinaryScanner(dbBytes);
}

/**
 * Robust binary SQLite scanner that parses record payloads with \x1f
 */
function fallbackBinaryScanner(bytes: Uint8Array): ParsedAnkiDeck {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const text = decoder.decode(bytes);

  const chunks = text.split(/\x00+/);
  const cards: ParsedAnkiCard[] = [];
  const seenWords = new Set<string>();

  for (const chunk of chunks) {
    if (chunk.includes('\x1f')) {
      const parts = chunk.split('\x1f').map(p => cleanAnkiHtml(p));
      if (parts.length >= 2) {
        const word = parts[0];
        const meaning = parts[1];

        // Valid card check
        if (
          word && 
          meaning && 
          word.length < 150 && 
          meaning.length < 500 && 
          !seenWords.has(word) && 
          !word.includes('CREATE TABLE') &&
          !word.includes('PRAGMA') &&
          !word.includes('sqlite_')
        ) {
          seenWords.add(word);
          const phonetic = parts[2] && (parts[2].includes('/') || parts[2].includes('[')) ? parts[2] : undefined;
          const example = parts[3] || (parts[2] && !parts[2].includes('/') ? parts[2] : undefined);

          cards.push({
            word,
            meaning,
            phonetic,
            example,
            srsLevel: 0,
            intervalDays: 0,
            easeFactor: 2.5,
            reviewCount: 0
          });
        }
      }
    }
  }

  if (cards.length === 0) {
    throw new Error('کارت معتبری در این فایل آنکی استخراج نشد.');
  }

  return {
    deckName: 'مجموعه کارت‌های آنکی',
    folders: [],
    cards
  };
}

/**
 * Parses Anki exported text or CSV/TSV format (.txt, .tsv, .csv)
 * Handles Anki headers (#separator:tab, #html:true, #deck:..., #tags column:...)
 */
export function parseAnkiTextExport(content: string, fileName = 'Anki Deck'): ParsedAnkiDeck {
  const rawLines = content.split(/\r?\n/);
  
  let delimiter = '\t';
  let deckName = fileName.replace(/\.[^/.]+$/, '').trim();
  const subfolders: { id: string; name: string }[] = [];
  const contentLines: string[] = [];

  // Parse Anki headers
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#separator:')) {
      const sep = trimmed.replace('#separator:', '').trim().toLowerCase();
      if (sep === 'tab') delimiter = '\t';
      else if (sep === 'comma') delimiter = ',';
      else if (sep === 'semicolon') delimiter = ';';
      else if (sep.length === 1) delimiter = sep;
      continue;
    }

    if (trimmed.startsWith('#deck:')) {
      const d = trimmed.replace('#deck:', '').trim();
      if (d) deckName = d;
      continue;
    }

    if (trimmed.startsWith('#')) {
      // Other Anki metadata directives (#html:true, #tags:5, etc.)
      continue;
    }

    contentLines.push(line);
  }

  if (contentLines.length === 0) {
    throw new Error('فایل متن یا CSV خالی است.');
  }

  // Auto-detect delimiter if not specified
  if (delimiter === '\t' && !contentLines[0].includes('\t')) {
    if (contentLines[0].includes(';')) delimiter = ';';
    else if (contentLines[0].includes(',')) delimiter = ',';
  }

  // Handle deck hierarchy e.g. "English::Lesson 1"
  let rootName = deckName;
  if (deckName.includes('::')) {
    const parts = deckName.split('::').map(s => s.trim());
    rootName = parts[0];
    const subName = parts.slice(1).join(' - ');
    subfolders.push({ id: 'f_default', name: subName });
  }

  const cards: ParsedAnkiCard[] = [];
  const seen = new Set<string>();

  for (const line of contentLines) {
    const parts = parseCsvLine(line, delimiter).map(p => cleanAnkiHtml(p));
    if (parts.length >= 2) {
      const word = parts[0];
      const meaning = parts[1];
      if (!word || !meaning) continue;

      const key = `${word}:::${meaning}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const phonetic = parts[2] && (parts[2].includes('/') || parts[2].includes('[')) ? parts[2] : undefined;
      const example = parts[3] || (parts[2] && !parts[2].includes('/') ? parts[2] : undefined);
      const tags = parts[4] ? parts[4].split(/\s+/).filter(Boolean) : undefined;

      cards.push({
        word,
        meaning,
        phonetic,
        example,
        tags,
        srsLevel: 0,
        intervalDays: 0,
        easeFactor: 2.5,
        reviewCount: 0
      });
    }
  }

  if (cards.length === 0) {
    throw new Error('هیچ کارتی با فرمت معتبر در این فایل یافت نشد.');
  }

  return {
    deckName: rootName || 'مجموعه آنکی',
    folders: subfolders,
    cards
  };
}

/**
 * Splits a CSV/TSV line respecting quotes
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Generates standard Anki text format (.txt) for export
 * Compatible with Anki desktop and mobile 1-click import.
 */
export function generateAnkiExportText(
  deckName: string, 
  cards: { word: string; meaning: string; phonetic?: string; example?: string; tags?: string[] }[]
): string {
  const header = [
    `#separator:tab`,
    `#html:true`,
    `#tags column:5`,
    `#deck:${deckName}`
  ].join('\n');

  const rows = cards.map(c => {
    const w = (c.word || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    const m = (c.meaning || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    const p = (c.phonetic || '').replace(/\t/g, ' ');
    const ex = (c.example || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    const t = (c.tags || []).join(' ');
    return `${w}\t${m}\t${p}\t${ex}\t${t}`;
  });

  return `${header}\n${rows.join('\n')}`;
}
