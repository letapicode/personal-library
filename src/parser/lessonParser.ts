import type { Lesson } from '../types/course';
import { classifyLessonSection } from './sectionClassifier.ts';

/**
 * Resilient regex matching standalone Lesson headings.
 * Handles:
 *   # Lesson 5 — Interface Segregation Principle
 *   ## Lesson 5: Interface Segregation Principle
 *   ### **Lesson 5 — Interface Segregation Principle**
 *   Lesson 5 - Interface Segregation Principle
 *   Module 5: Interface Segregation
 *   Chapter 5: Interface Segregation
 */
/**
 * Resilient regex matching standalone Chapter/Lesson/Part headings.
 * Supports English (Lesson, Chapter, Module, Unit, Act) and Devanagari (अध्याय, पाठ, इकाई).
 * Supports Arabic numerals (0-9), Devanagari numerals (०-९), and Roman numerals (I, IV, X, L, C, D, M).
 */
const LESSON_HEADING_REGEX = /^(?:#{1,4}\s+)?(?:\*{1,2})?(?:LESSON|Lesson|MODULE|Module|CHAPTER|Chapter|UNIT|Unit|ACT|Act|अध्याय|पाठ|इकाई)\s+([0-9०-९]+|[IVXLCDM]+)[\s*]*[:—–\-|\.]\s*(.+?)(?:\*{1,2})?$/iu;

/**
 * Regex detecting standalone Part/Section headers (e.g. # Part 1: Foundations, # Part 1, # भाग १: सिद्धान्त, # खण्ड: जीव विज्ञान)
 */
const SECTION_HEADING_REGEX = /^(?:#{1,3}\s+)(PART|Part|SECTION|Section|भाग|खण्ड)\s*(?:([0-9०-९]+|[IVXLCDM]+)[\s:—–\-]*)?(?:[:—–\-]\s*)?([^\n#]*)$/iu;

/**
 * Fallback regex for numbered chapters or sections:
 *   # 1. Introduction
 *   # I. Introduction
 *   # १. भूमिका
 */
const NUMBERED_HEADING_REGEX = /^(?:#{1,3}\s+)([0-9०-९]+|[IVXLCDM]+)[\.\-–—\s]+(.+)$/u;

const MAX_COURSE_TEXT_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_REGEX_LINE_LENGTH = 10000;
const MAX_LESSONS_PER_BOOK = 500;

/**
 * Converts Roman numerals (I, II, III, IV, V, ... up to at least L=50) to integers.
 */
export function parseRomanNumeral(str: string): number {
  const romanMap: Record<string, number> = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000
  };
  const upper = str.toUpperCase().trim();
  let total = 0;
  for (let i = 0; i < upper.length; i++) {
    const current = romanMap[upper[i]] || 0;
    const next = romanMap[upper[i + 1]] || 0;
    if (current < next) {
      total -= current;
    } else {
      total += current;
    }
  }
  return total;
}

/**
 * Normalizes both Arabic (0-9) and Devanagari (०-९) digits into standard JavaScript integers.
 */
function parseFlexibleNumber(str: string): number {
  const devanagariDigits: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  const normalized = str.replace(/[०-९]/g, d => devanagariDigits[d] || d);
  return parseInt(normalized, 10);
}

/**
 * Checks the beginning of a chapter for explicit section tags:
 *   > Section: Genetics
 *   > भाग: मूलभूत सिद्धान्त
 */
function extractInlineSectionTag(lines: string[]): string | undefined {
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const l = lines[i].trim();
    const match = l.match(/^(?:>\s*|#{1,3}\s*|\*{1,2})?(?:Section|Part|Category|खण्ड|भाग)\s*[:—–\-]+\s*([^\*#\n\r]+?)(?:\*{1,2})?$/iu);
    if (match && match[1]?.trim()) {
      return match[1].trim().replace(/^[:—–\-|\.\s]+/, '');
    }
  }
  return undefined;
}

export function parseCourseMarkdown(fullText: string): Lesson[] {
  if (!fullText || typeof fullText !== 'string' || !fullText.trim()) {
    return [];
  }

  if (fullText.length > MAX_COURSE_TEXT_BYTES) {
    throw new Error('Course document exceeds maximum supported size (15MB)');
  }

  const lines = fullText.split(/\r?\n/);
  const lessons: Lesson[] = [];

  let currentNumber: number | null = null;
  let currentTitle = '';
  let currentLines: string[] = [];
  let currentExplicitSection: string | undefined = undefined;
  let activeSectionContext: string | undefined = undefined;
  let inCodeFence = false;

  function commitCurrent() {
    if (currentNumber !== null) {
      const markdownContent = currentLines.join('\n').trim();
      const inlineSection = extractInlineSectionTag(currentLines);
      const chosenSection = inlineSection || currentExplicitSection || activeSectionContext;

      lessons.push({
        id: `lesson-${currentNumber}`,
        number: currentNumber,
        title: currentTitle,
        section: classifyLessonSection(currentNumber, currentTitle, chosenSection),
        markdown: markdownContent,
        completed: false,
        bookmarked: false
      });
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Track code blocks to suppress false positives within code
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeFence = !inCodeFence;
      if (currentNumber !== null) {
        currentLines.push(rawLine);
      }
      continue;
    }

    // Guard against ReDoS on abnormally long lines
    if (trimmed.length > MAX_REGEX_LINE_LENGTH) {
      if (currentNumber !== null) {
        currentLines.push(rawLine);
      }
      continue;
    }

    // Check for standalone Part/Section headers outside code fences
    if (!inCodeFence) {
      const sectionMatch = trimmed.match(SECTION_HEADING_REGEX);
      if (sectionMatch) {
        const prefix = sectionMatch[1]?.trim() || '';
        const numPart = sectionMatch[2]?.trim() || '';
        const subtitle = sectionMatch[3]?.trim().replace(/\s*#+$/, '') || '';
        const derivedSection = subtitle || (numPart ? `${prefix} ${numPart}` : prefix);

        if (derivedSection) {
          commitCurrent();
          currentNumber = null;
          currentTitle = '';
          currentLines = [];
          currentExplicitSection = undefined;
          activeSectionContext = derivedSection;
          continue;
        }
      }
    }

    // Only look for lesson headers OUTSIDE of code fences
    const match = !inCodeFence ? trimmed.match(LESSON_HEADING_REGEX) : null;
    if (match) {
      const isRoman = /^[IVXLCDM]+$/i.test(match[1].trim());
      const num = isRoman ? parseRomanNumeral(match[1]) : parseFlexibleNumber(match[1]);
      let title = match[2].trim();

      // Strip trailing markdown header markers or bold markers
      title = title.replace(/\s+#+$/, '').replace(/^\*{1,2}|\*{1,2}$/g, '').trim();

      commitCurrent();

      currentNumber = num;
      currentTitle = title;
      currentLines = [];
      currentExplicitSection = undefined;
    } else {
      if (currentNumber !== null) {
        currentLines.push(rawLine);
      }
    }
  }

  // Commit trailing lesson
  commitCurrent();

  // FALLBACK 1: Try numbered headers (# 1. Title, # १. भूमिका) if 0 lessons found
  if (lessons.length === 0) {
    currentNumber = null;
    currentTitle = '';
    currentLines = [];
    inCodeFence = false;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
        inCodeFence = !inCodeFence;
        if (currentNumber !== null) currentLines.push(rawLine);
        continue;
      }

      const match = !inCodeFence ? trimmed.match(NUMBERED_HEADING_REGEX) : null;
      if (match) {
        const isRoman = /^[IVXLCDM]+$/i.test(match[1].trim());
        const num = isRoman ? parseRomanNumeral(match[1]) : parseFlexibleNumber(match[1]);
        const title = match[2].trim().replace(/\s+#+$/, '');
        commitCurrent();
        currentNumber = num;
        currentTitle = title;
        currentLines = [];
      } else {
        if (currentNumber !== null) {
          currentLines.push(rawLine);
        }
      }
    }
    commitCurrent();
  }

  // FALLBACK 2: If still 0 lessons, check for horizontal dividers (--- between conversation responses)
  if (lessons.length === 0) {
    const dividerChunks = fullText.split(/\n\s*---\s*\n/).map(c => c.trim()).filter(Boolean);
    if (dividerChunks.length > 1) {
      dividerChunks.forEach((chunk, idx) => {
        const num = idx + 1;
        const chunkLines = chunk.split('\n');
        const firstNonEmpty = chunkLines.find(l => l.trim().length > 0) || '';
        let cleanTitle = firstNonEmpty
          .replace(/^#+\s*/, '')
          .replace(/^\*{1,2}|\*{1,2}$/g, '')
          .trim();
        if (!cleanTitle || cleanTitle.length > 90) {
          cleanTitle = `Chapter ${num}`;
        }
        lessons.push({
          id: `lesson-${num}`,
          number: num,
          title: cleanTitle,
          section: 'Chapters',
          markdown: chunk,
          completed: false,
          bookmarked: false
        });
      });
    }
  }

  // FALLBACK 3: Single standalone article / document
  if (lessons.length === 0 && fullText.trim().length > 0) {
    const firstHeader = lines.find(l => l.trim().startsWith('# '));
    const title = firstHeader ? firstHeader.replace(/^#\s*/, '').trim() : 'Document Overview';
    lessons.push({
      id: 'lesson-1',
      number: 1,
      title,
      section: 'OVERVIEW',
      markdown: fullText.trim(),
      completed: false,
      bookmarked: false
    });
  }

  // Deduplicate and sort numerically ascending (Lesson 2 before Lesson 10)
  // Smart multi-part merge: if the same lesson number appears multiple times (e.g. continuations),
  // merge the markdown rather than discarding it!
  const lessonMap = new Map<number, Lesson>();
  let maxLessonNumber = lessons.reduce((max, l) => Math.max(max, l.number), 0);

  for (const l of lessons) {
    if (!lessonMap.has(l.number)) {
      lessonMap.set(l.number, l);
    } else {
      const existing = lessonMap.get(l.number)!;
      if (existing.section !== l.section) {
        maxLessonNumber = Math.max(maxLessonNumber, ...lessonMap.keys()) + 1;
        l.number = maxLessonNumber;
        l.id = `lesson-${maxLessonNumber}`;
        lessonMap.set(l.number, l);
      } else {
        existing.markdown = `${existing.markdown}\n\n---\n\n### Continuation: ${l.title}\n\n${l.markdown}`.trim();
        if (l.title && !existing.title.toLowerCase().includes(l.title.toLowerCase()) && l.title.toLowerCase() !== existing.title.toLowerCase()) {
          existing.title = `${existing.title} / ${l.title}`;
        }
      }
    }
  }

  return Array.from(lessonMap.values())
    .sort((a, b) => a.number - b.number)
    .slice(0, MAX_LESSONS_PER_BOOK);
}

/**
 * Conflict resolution strategy for appending lessons
 */
export function mergeLessons(
  existing: Lesson[],
  incoming: Lesson[],
  mode: 'replace-conflicts' | 'skip-conflicts' = 'replace-conflicts'
): Lesson[] {
  const map = new Map<number, Lesson>();

  for (const item of existing) {
    map.set(item.number, { ...item });
  }

  for (const item of incoming) {
    if (map.has(item.number)) {
      if (mode === 'replace-conflicts') {
        const prev = map.get(item.number)!;
        map.set(item.number, {
          ...item,
          completed: prev.completed,
          bookmarked: prev.bookmarked
        });
      }
    } else {
      map.set(item.number, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.number - b.number);
}
