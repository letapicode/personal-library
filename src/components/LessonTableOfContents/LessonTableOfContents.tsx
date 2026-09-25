import React, { useEffect, useRef, useState } from 'react';
import type { LessonHeading } from '../../utils/lessonHeadings';
import styles from './LessonTableOfContents.module.css';

interface Props {
  headings: readonly LessonHeading[];
}

/** Pixels between a navigated heading and the top of #main-reader's viewport. */
export const OUTLINE_LANDING_OFFSET = 36;

function destinationForHeading(scroller: HTMLElement, target: HTMLElement): number {
  const distance = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  const desired = scroller.scrollTop + distance - OUTLINE_LANDING_OFFSET;
  const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  return Math.min(maxScroll, Math.max(0, desired));
}

export const LessonTableOfContents: React.FC<Props> = ({ headings }) => {
  const [activeId, setActiveId] = useState('');
  const rafPendingRef = useRef(false);
  const requestedLandingRef = useRef<{ id: string; top: number } | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const scrollContainer = document.getElementById('main-reader');
    if (!scrollContainer) return;
    requestedLandingRef.current = null;

    let rafId: number | null = null;
    const checkActiveHeading = () => {
      if (rafPendingRef.current) return;
      rafPendingRef.current = true;
      rafId = requestAnimationFrame(() => {
        rafPendingRef.current = false;
        const elements = headings
          .map(heading => document.getElementById(heading.id))
          .filter((element): element is HTMLElement => element !== null);
        if (elements.length === 0) return;

        const requested = requestedLandingRef.current;
        if (requested && Math.abs(scrollContainer.scrollTop - requested.top) <= 2) {
          setActiveId(requested.id);
          return;
        }
        requestedLandingRef.current = null;

        const topOffset = scrollContainer.getBoundingClientRect().top + OUTLINE_LANDING_OFFSET + 1;
        let current = elements[0].id;
        for (const element of elements) {
          if (element.getBoundingClientRect().top <= topOffset) current = element.id;
          else break;
        }
        // At the bottom, a late heading cannot always reach the landing offset.
        const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
        if (maxScroll > 0 && scrollContainer.scrollTop >= maxScroll - 2) {
          current = elements[elements.length - 1].id;
        }
        setActiveId(current);
      });
    };

    checkActiveHeading();
    scrollContainer.addEventListener('scroll', checkActiveHeading, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', checkActiveHeading);
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafPendingRef.current = false;
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    const scrollContainer = document.getElementById('main-reader');
    if (!target || !scrollContainer) return;

    const top = destinationForHeading(scrollContainer, target);
    requestedLandingRef.current = { id, top };
    // Cancel any earlier smooth scroll before measuring a new destination.
    const previousBehavior = scrollContainer.style.scrollBehavior;
    scrollContainer.style.scrollBehavior = 'auto';
    scrollContainer.scrollTo({ top, behavior: 'auto' });
    scrollContainer.style.scrollBehavior = previousBehavior;
    target.focus({ preventScroll: true });
    setActiveId(id);
  };

  return (
    <nav className={styles.tocContainer} aria-label="Lesson outline">
      <div className={styles.tocTitle}>On this page</div>
      <ul className={styles.tocList}>
        {headings.map(heading => {
          const isActive = activeId === heading.id;
          return (
            <li key={heading.id}>
              <button
                type="button"
                className={`${styles.tocItem} ${heading.level === 3 ? styles.tocItemH3 : ''} ${
                  isActive ? styles.tocItemActive : ''
                }`}
                aria-current={isActive ? 'location' : undefined}
                onClick={() => scrollToHeading(heading.id)}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
