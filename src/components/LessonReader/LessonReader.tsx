import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Bookmark, CheckCircle2, PanelLeftOpen, BookOpen, ChevronRight, Clock, Type } from 'lucide-react';
import type { Lesson } from '../../types/course';
import { MarkdownRenderer } from '../MarkdownRenderer/MarkdownRenderer';
import { LessonTableOfContents } from '../LessonTableOfContents/LessonTableOfContents';
import { PreviousNextNavigation } from '../Navigation/PreviousNextNavigation';
import { MediaPlayer } from '../MediaPlayer/MediaPlayer';
import { ReadingPreferences } from '../ReadingPreferences/ReadingPreferences';
import styles from './LessonReader.module.css';

interface Props {
  bookTitle?: string;
  lesson: Lesson;
  prevLesson?: Lesson;
  nextLesson?: Lesson;
  sidebarCollapsed: boolean;
  initialScrollPosition: number;
  mediaProgress?: Record<string, number>;
  onToggleSidebar: () => void;
  onToggleBookmark: (lessonId: string) => void;
  onToggleComplete: (lessonId: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onSaveScrollPosition: (lessonId: string, pos: number) => void;
  onSaveMediaTime?: (mediaKey: string, time: number) => void;
  onBackToBookshelf?: () => void;
}

export const LessonReader: React.FC<Props> = ({
  bookTitle = 'Design Patterns',
  lesson,
  prevLesson,
  nextLesson,
  sidebarCollapsed,
  initialScrollPosition,
  mediaProgress = {},
  onToggleSidebar,
  onToggleBookmark,
  onToggleComplete,
  onSelectLesson,
  onSaveScrollPosition,
  onSaveMediaTime,
  onBackToBookshelf
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRestoringScroll = useRef(true);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isReadingPrefsOpen, setIsReadingPrefsOpen] = useState(false);

  // Calculate word count & reading time
  const { wordCount, readingMinutes } = useMemo(() => {
    const text = (lesson.markdown || '').trim();
    if (!text) return { wordCount: 0, readingMinutes: 1 };
    const words = text.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, readingMinutes: minutes };
  }, [lesson.markdown]);

  // Strip duplicate top-level title from markdown body since header already renders it
  const displayMarkdown = useMemo(() => {
    const raw = (lesson.markdown || '').trim();
    // Match any leading H1 heading (e.g. # Lesson 1, # Chapter 1, # Part 1, # अध्याय १, # 1. Introduction, or matching title)
    return raw
      .replace(/^\s*#\s+([^\r\n]+)\r?\n+/i, (match, headingText) => {
        const cleanHeading = headingText.replace(/[`*_~]/g, '').trim().toLowerCase();
        const cleanTitle = (lesson.title || '').replace(/[`*_~]/g, '').trim().toLowerCase();
        const isChapterPattern = /^(?:lesson|chapter|module|unit|act|part|section|अध्याय|पाठ|खण्ड|भाग|इकाई)\s+[0-9०-९ivxlcdm]+/i.test(cleanHeading);
        const isNumbered = /^[0-9०-९]+[\.\-–—\s]+/.test(cleanHeading);
        const matchesTitle = cleanTitle && (cleanHeading.includes(cleanTitle) || cleanTitle.includes(cleanHeading));

        if (isChapterPattern || isNumbered || matchesTitle) {
          return '';
        }
        return match;
      })
      .trim();
  }, [lesson.markdown, lesson.title]);

  // Keep track of initialScrollPosition for the current lesson without triggering resets during scrolling
  const initialScrollRef = useRef(initialScrollPosition);

  // Update ref when lesson changes so we restore the correct position for that lesson
  useEffect(() => {
    initialScrollRef.current = initialScrollPosition;
  }, [lesson.id]);

  // Layout-aware scroll restoration ONLY on lesson change with proper cancellation
  useEffect(() => {
    isRestoringScroll.current = true;
    const targetPos = initialScrollRef.current || 0;
    let restoreTimer: ReturnType<typeof setTimeout> | null = null;

    const frame = requestAnimationFrame(() => {
      if (containerRef.current) {
        const { scrollHeight, clientHeight } = containerRef.current;
        const maxScroll = Math.max(0, scrollHeight - clientHeight);
        const clampedPos = Math.min(maxScroll, Math.max(0, targetPos));

        containerRef.current.scrollTop = clampedPos;
        if (maxScroll > 0) {
          setScrollProgress(Math.min(100, Math.max(0, Math.round((clampedPos / maxScroll) * 100))));
        } else {
          setScrollProgress(0);
        }
      }
      restoreTimer = setTimeout(() => {
        isRestoringScroll.current = false;
      }, 120);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (restoreTimer) clearTimeout(restoreTimer);
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [lesson.id]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
      setScrollProgress(pct);
    } else {
      setScrollProgress(100);
    }

    if (isRestoringScroll.current) return;

    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }
    scrollDebounceRef.current = setTimeout(() => {
      onSaveScrollPosition(lesson.id, scrollTop);
    }, 150);
  };

  return (
    <main
      className={styles.readerContainer}
      ref={containerRef}
      onScroll={handleScroll}
      id="main-reader"
    >
      {/* Dynamic Reading Progress Bar */}
      <div className={styles.readingProgressBar} aria-hidden="true">
        <div
          className={styles.readingProgressFill}
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className={styles.readerLayout}>
        <div className={styles.readerColumn}>
          <div className={styles.topBar}>
            <div className={styles.topBarLeft}>
              {sidebarCollapsed && (
                <button
                  className={styles.toggleSidebarBtn}
                  onClick={onToggleSidebar}
                  title="Expand Sidebar"
                  aria-label="Expand Sidebar"
                >
                  <PanelLeftOpen size={15} />
                  <span>Curriculum</span>
                </button>
              )}

              {onBackToBookshelf && (
                <div className={styles.breadcrumbArea}>
                  <button
                    className={styles.breadcrumbLink}
                    onClick={onBackToBookshelf}
                    title="Return to Bookshelf"
                  >
                    <BookOpen size={13} />
                    <span>Library</span>
                  </button>
                  <ChevronRight size={12} className={styles.breadcrumbSep} />
                  <span className={styles.breadcrumbCurrent}>{bookTitle}</span>
                </div>
              )}
            </div>

            <div className={styles.actionButtonGroup}>
              {/* Reading Preferences Popover Toggle */}
              <button
                className={`${styles.actionBtn} ${styles.displayPrefsBtn}`}
                onClick={() => setIsReadingPrefsOpen(prev => !prev)}
                title="Reading preferences"
                aria-label="Typography and display settings"
              >
                <span>Aa</span>
              </button>

              <ReadingPreferences
                isOpen={isReadingPrefsOpen}
                onClose={() => setIsReadingPrefsOpen(false)}
              />

              <button
                className={`${styles.actionBtn} ${lesson.bookmarked ? styles.actionBtnActive : ''}`}
                onClick={() => onToggleBookmark(lesson.id)}
                title="Bookmark this lesson"
              >
                <Bookmark size={13} fill={lesson.bookmarked ? 'currentColor' : 'none'} />
                <span>{lesson.bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              <button
                className={`${styles.actionBtn} ${lesson.completed ? styles.actionBtnActive : ''}`}
                onClick={() => onToggleComplete(lesson.id)}
                title={lesson.completed ? 'Mark as incomplete' : 'Mark as completed'}
              >
                <CheckCircle2 size={13} />
                <span>{lesson.completed ? 'Completed' : 'Complete'}</span>
              </button>
            </div>
          </div>

          <header className={styles.lessonHeader}>
            <div className={styles.metadataRow}>
              {lesson.section && <div className={styles.sectionBadge}>{lesson.section}</div>}
              <div className={styles.readingTimeBadge}>
                <Clock size={12} />
                <span>{readingMinutes} min read</span>
                <span>•</span>
                <span>{wordCount.toLocaleString()} words</span>
              </div>
            </div>

            <h1 className={styles.lessonMainTitle}>
              Lesson {lesson.number} — {lesson.title}
            </h1>
          </header>

          {lesson.media && lesson.media.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              {lesson.media.map(media => {
                const mediaKey = `${lesson.id}_${media.id}`;
                return (
                  <MediaPlayer
                    key={media.id}
                    type={media.type}
                    src={media.url}
                    title={media.title}
                    initialTime={mediaProgress[mediaKey] || 0}
                    onTimeUpdate={currentTime => {
                      if (onSaveMediaTime) {
                        onSaveMediaTime(mediaKey, currentTime);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          <article className={styles.contentWrapper}>
            <MarkdownRenderer content={displayMarkdown} />
          </article>

          <PreviousNextNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onSelect={onSelectLesson}
          />
        </div>

        <aside className={styles.rightRail}>
          <LessonTableOfContents markdown={displayMarkdown} />
        </aside>
      </div>
    </main>
  );
};
