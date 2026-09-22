import React, { useMemo, useState, useEffect, useRef } from 'react';
import styles from './LessonTableOfContents.module.css';

export function generateHeadingId(text: string): string {
  if (!text || typeof text !== 'string') return 'cr-sec-heading';

  // Strip markdown formatting tokens first: links, bold, italics, code, strikethrough
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim();

  // Unicode-aware slugification (\p{L} for letters in any language, \p{N} for numerals)
  const clean = plain
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

  if (clean) {
    return 'cr-sec-' + clean;
  }

  // Deterministic 32-bit hash fallback for headings composed of symbols or unsupported scripts
  let hash = 0;
  for (let i = 0; i < plain.length; i++) {
    hash = ((hash << 5) - hash) + plain.charCodeAt(i);
    hash |= 0;
  }
  return 'cr-sec-h' + Math.abs(hash).toString(36);
}

interface TOCItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

interface Props {
  markdown: string;
}

export const LessonTableOfContents: React.FC<Props> = ({ markdown }) => {
  const [activeId, setActiveId] = useState<string>('');
  const rafPendingRef = useRef<boolean>(false);

  const items = useMemo(() => {
    const list: TOCItem[] = [];
    const lines = markdown.split(/\r?\n/);
    let inCodeFence = false;
    const idCounts = new Map<string, number>();

    const getUniqueId = (text: string): string => {
      const baseId = generateHeadingId(text);
      const count = idCounts.get(baseId) || 0;
      idCounts.set(baseId, count + 1);
      return count === 0 ? baseId : `${baseId}-${count + 1}`;
    };

    // Pattern matching document/chapter title to exclude from internal TOC
    const chapterTitlePattern = /^(?:#{1,4}\s+)?(?:\*{1,2})?(?:LESSON|Lesson|MODULE|Module|CHAPTER|Chapter|UNIT|Unit|ACT|Act|PART|Part|SECTION|Section|अध्याय|पाठ|खण्ड|भाग|इकाई)\s+(?:[0-9०-९]+|[IVXLCDM]+)[\s*]*[:—–\-|\.]/iu;
    const numberedPattern = /^(?:#{1,3}\s+)[0-9०-९]+[\.\-–—\s]+/u;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
        inCodeFence = !inCodeFence;
        continue;
      }

      if (!inCodeFence) {
        if (line.startsWith('# ')) {
          const rawHeading = line.replace(/^#\s+/, '').trim();
          const cleanText = rawHeading.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_~]/g, '').trim();
          const isDocTitle = i < 15 && (chapterTitlePattern.test(line) || numberedPattern.test(line));
          if (cleanText && !isDocTitle) {
            list.push({ id: getUniqueId(cleanText), text: cleanText, level: 1 });
          }
        } else if (line.startsWith('## ')) {
          const rawHeading = line.replace(/^##\s+/, '').trim();
          const cleanText = rawHeading.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_~]/g, '').trim();
          if (cleanText) {
            list.push({ id: getUniqueId(cleanText), text: cleanText, level: 2 });
          }
        } else if (line.startsWith('### ')) {
          const rawHeading = line.replace(/^###\s+/, '').trim();
          const cleanText = rawHeading.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_~]/g, '').trim();
          if (cleanText) {
            list.push({ id: getUniqueId(cleanText), text: cleanText, level: 3 });
          }
        }
      }
    }
    return list;
  }, [markdown]);

  // Scrollspy observer on container
  useEffect(() => {
    if (items.length === 0) return;

    const scrollContainer = document.getElementById('main-reader');
    if (!scrollContainer) return;

    let rafId: number | null = null;

    const checkActiveHeading = () => {
      if (rafPendingRef.current) return;
      rafPendingRef.current = true;

      rafId = requestAnimationFrame(() => {
        rafPendingRef.current = false;

        const headingElements = items
          .map(item => document.getElementById(item.id))
          .filter((el): el is HTMLElement => el !== null);

        if (headingElements.length === 0) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        const topOffset = containerRect.top + 90;

        // Find the heading that is closest to or just above topOffset
        let currentActive = headingElements[0].id;

        for (const el of headingElements) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= topOffset) {
            currentActive = el.id;
          } else {
            break;
          }
        }

        setActiveId(currentActive);
      });
    };

    checkActiveHeading();
    scrollContainer.addEventListener('scroll', checkActiveHeading, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', checkActiveHeading);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafPendingRef.current = false;
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className={styles.tocContainer} aria-label="Lesson outline">
      <div className={styles.tocTitle}>On this page</div>
      <ul className={styles.tocList}>
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={index}
              className={`${styles.tocItem} ${item.level === 3 ? styles.tocItemH3 : ''} ${
                isActive ? styles.tocItemActive : ''
              }`}
              onClick={() => {
                const target = document.getElementById(item.id);
                const scrollContainer = document.getElementById('main-reader');
                if (target && scrollContainer) {
                  const containerRect = scrollContainer.getBoundingClientRect();
                  const targetRect = target.getBoundingClientRect();
                  const targetOffset = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 36;
                  scrollContainer.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });
                  setActiveId(item.id);
                } else if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveId(item.id);
                }
              }}
            >
              {item.text}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
