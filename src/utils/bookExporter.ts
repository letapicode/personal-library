import type { Book } from '../types/course';

export interface ExportOptions {
  includeToc?: boolean;
  includeMeta?: boolean;
}

/**
 * Generates a clean, consolidated Markdown document for an entire book.
 */
export function generateBookMarkdown(book: Book, options: ExportOptions = {}): string {
  const { includeToc = true, includeMeta = true } = options;
  const lines: string[] = [];

  // 1. Metadata Header
  if (includeMeta) {
    lines.push(`# ${book.title}`);
    if (book.subtitle) {
      lines.push(`> ${book.subtitle}\n`);
    }
    const metaDetails: string[] = [];
    if (book.author) metaDetails.push(`**Author:** ${book.author}`);
    if (book.category) metaDetails.push(`**Category:** ${book.category}`);
    if (book.createdAt) metaDetails.push(`**Date:** ${book.createdAt}`);
    if (book.totalLessons || (book.lessons && book.lessons.length)) {
      metaDetails.push(`**Total Chapters:** ${book.lessons?.length || book.totalLessons}`);
    }

    if (metaDetails.length > 0) {
      lines.push(metaDetails.join(' | '));
    }

    if (book.description) {
      lines.push(`\n${book.description}`);
    }

    lines.push('\n---\n');
  }

  // 2. Table of Contents
  const lessons = book.lessons || [];
  if (includeToc && lessons.length > 0) {
    lines.push('## Table of Contents\n');

    // Group chapters by section
    const sections = Array.from(new Set(lessons.map(l => l.section || 'Chapters')));

    for (const section of sections) {
      const sectionLessons = lessons.filter(l => (l.section || 'Chapters') === section);
      if (sections.length > 1) {
        lines.push(`### ${section}\n`);
      }

      for (const lesson of sectionLessons) {
        const slug = `chapter-${lesson.number}`;
        lines.push(`- [Chapter ${lesson.number}: ${lesson.title}](#${slug})`);
      }
      lines.push('');
    }

    lines.push('---\n');
  }

  // 3. Chapters Content
  for (const lesson of lessons) {
    const slug = `chapter-${lesson.number}`;
    lines.push(`<a id="${slug}"></a>\n`);

    const trimmed = (lesson.markdown || '').trim();
    // Check if the lesson markdown already begins with a chapter/lesson header
    const hasLeadingHeading = /^(?:#{1,4}\s+)?(?:\*{1,2})?(?:Lesson|Chapter|Module|Part|UNIT|अध्याय|पाठ)\s+[0-9०-९]+/i.test(trimmed);

    if (!hasLeadingHeading) {
      lines.push(`# Chapter ${lesson.number} — ${lesson.title}\n`);
      if (lesson.section) {
        lines.push(`> Section: ${lesson.section}\n`);
      }
    }

    lines.push(trimmed);
    lines.push('\n\n---\n');
  }

  return lines.join('\n');
}

/**
 * Generates a clean JSON representation of the entire book.
 */
export function generateBookJson(book: Book): string {
  return JSON.stringify(book, null, 2);
}

/**
 * Sanitizes a title into a safe filename.
 */
export function getSafeFilename(title: string, extension: 'md' | 'json'): string {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return `${clean || 'book_export'}.${extension}`;
}

/**
 * Triggers a download in the browser (or Electron dialog if running in Electron).
 */
export async function downloadFile(filename: string, content: string, mimeType: string): Promise<void> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    await window.electronAPI.saveFileDialog(filename, content);
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
