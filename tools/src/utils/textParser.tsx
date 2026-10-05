import React from 'react';
import { StructuredText, TextSpan, Flashcard } from '../types';

/**
 * Extracts plain text from either simple string or Lexi Book structured JSON string
 */
export function getPlainText(content: string | undefined | null): string {
  if (!content) return '';
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.text === 'string') {
        return parsed.text;
      }
    } catch {
      // Return as-is
    }
  }
  return content;
}

/**
 * Parses raw text or structured JSON into structured text object
 */
export function parseStructuredText(content: string | undefined | null): StructuredText {
  if (!content) {
    return { text: '', spans: [] };
  }
  const trimmed = content.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.text === 'string') {
        return {
          text: parsed.text,
          spans: Array.isArray(parsed.spans) ? parsed.spans : []
        };
      }
    } catch {
      // Fallback
    }
  }
  return { text: content, spans: [] };
}

/**
 * React Component to render structured text with exact Lexi Book color spans
 */
export const FormattedText: React.FC<{ 
  content: string | undefined | null;
  className?: string;
}> = ({ content, className = '' }) => {
  const { text, spans } = parseStructuredText(content);

  if (!text) return null;
  if (!spans || spans.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Segment text into spans
  const boundaries = new Set<number>([0, text.length]);
  spans.forEach(s => {
    boundaries.add(Math.max(0, Math.min(text.length, s.start)));
    boundaries.add(Math.max(0, Math.min(text.length, s.end)));
  });

  const sortedPoints = Array.from(boundaries).sort((a, b) => a - b);
  const segments: React.ReactNode[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    if (start >= end) continue;

    const slice = text.slice(start, end);
    // Find active spans for this range
    const activeSpans = spans.filter(s => s.start <= start && s.end >= end);

    let color: string | undefined;
    let bold = false;
    let italic = false;
    let underline = false;

    activeSpans.forEach(s => {
      if (s.color) color = s.color;
      if (s.bold) bold = true;
      if (s.italic) italic = true;
      if (s.underline) underline = true;
    });

    const style: React.CSSProperties = {};
    if (color) style.color = color;

    let segmentClass = '';
    if (bold) segmentClass += ' font-bold';
    if (italic) segmentClass += ' italic';
    if (underline) segmentClass += ' underline';

    segments.push(
      <span key={`${start}-${end}`} style={style} className={segmentClass.trim() || undefined}>
        {slice}
      </span>
    );
  }

  return <span className={className}>{segments}</span>;
};

/**
 * Anki & CSV importer helper
 * Parses tab-separated (.txt, .tsv) or comma-separated CSV into flashcard items
 */
export function parseAnkiOrCsv(
  rawContent: string, 
  delimiter: 'tab' | 'comma' | 'auto' = 'auto'
): { word: string; meaning: string; phonetic?: string; example?: string; tags?: string[] }[] {
  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (lines.length === 0) return [];

  // Detect delimiter
  let actualSep = '\t';
  if (delimiter === 'comma') {
    actualSep = ',';
  } else if (delimiter === 'auto') {
    const firstLine = lines[0];
    if (firstLine.includes('\t')) actualSep = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) actualSep = ';';
    else actualSep = ',';
  }

  const result: { word: string; meaning: string; phonetic?: string; example?: string; tags?: string[] }[] = [];

  for (const line of lines) {
    const parts = line.split(actualSep).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length >= 2) {
      const word = parts[0];
      const meaning = parts[1];
      const phonetic = parts[2] && parts[2].includes('/') ? parts[2] : undefined;
      const example = parts[3] || (parts[2] && !parts[2].includes('/') ? parts[2] : undefined);
      const tags = parts[4] ? parts[4].split(/\s+/).filter(Boolean) : undefined;

      if (word && meaning) {
        result.push({
          word,
          meaning,
          phonetic,
          example,
          tags
        });
      }
    }
  }

  return result;
}
