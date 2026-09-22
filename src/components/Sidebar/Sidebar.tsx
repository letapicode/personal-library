import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Settings,
  Bookmark,
  CheckCircle2,
  Moon,
  Sun,
  PanelLeftClose,
  ChevronLeft,
  Download,
  X
} from 'lucide-react';
import type { Lesson } from '../../types/course';
import { CANONICAL_SECTION_ORDER } from '../../parser/sectionClassifier';
import styles from './Sidebar.module.css';

interface SidebarProps {
  bookTitle?: string;
  lessons: Lesson[];
  activeLessonId: string | null;
  collapsed: boolean;
  theme: 'dark' | 'light';
  onSelectLesson: (id: string) => void;
  onOpenManager: () => void;
  onExportBook?: () => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onBackToBookshelf: () => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  bookTitle = 'Design Patterns',
  lessons,
  activeLessonId,
  collapsed,
  theme,
  onSelectLesson,
  onOpenManager,
  onExportBook,
  onToggleTheme,
  onToggleSidebar,
  onBackToBookshelf,
  onOpenCommandPalette
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredLessons = useMemo(() => {
    if (!debouncedQuery) return lessons;
    return lessons.filter(l => {
      const matchTitle = l.title.toLowerCase().includes(debouncedQuery);
      if (matchTitle) return true;

      const matchNumber = `lesson ${l.number}`.includes(debouncedQuery) || `${l.number}` === debouncedQuery;
      if (matchNumber) return true;

      const matchSection = l.section && l.section.toLowerCase().includes(debouncedQuery);
      if (matchSection) return true;

      // Only search heavy markdown if query is 3+ characters to avoid lag
      if (debouncedQuery.length >= 3) {
        return l.markdown.toLowerCase().includes(debouncedQuery);
      }
      return false;
    });
  }, [lessons, debouncedQuery]);

  // Group lessons by section
  const grouped = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of filteredLessons) {
      const section = l.section || 'COURSE CONTENT';
      if (!map.has(section)) {
        map.set(section, []);
      }
      map.get(section)!.push(l);
    }

    for (const [_, secLessons] of map.entries()) {
      secLessons.sort((a, b) => a.number - b.number);
    }

    return Array.from(map.entries()).sort(([secA, lessonsA], [secB, lessonsB]) => {
      // Primary sort: chronological order by the earliest lesson number in the section
      const minA = lessonsA.length > 0 ? Math.min(...lessonsA.map(l => l.number)) : 9999;
      const minB = lessonsB.length > 0 ? Math.min(...lessonsB.map(l => l.number)) : 9999;
      if (minA !== minB) {
        return minA - minB;
      }

      // Secondary fallback: canonical section order (case-insensitive)
      const idxA = CANONICAL_SECTION_ORDER.findIndex(s => s.toUpperCase() === secA.toUpperCase());
      const idxB = CANONICAL_SECTION_ORDER.findIndex(s => s.toUpperCase() === secB.toUpperCase());
      const posA = idxA !== -1 ? idxA : 9999;
      const posB = idxB !== -1 ? idxB : 9999;
      return posA - posB;
    });
  }, [filteredLessons]);

  const completedCount = lessons.filter(l => l.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll sidebar list to keep active lesson in view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [activeLessonId]);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.brandArea}>
          <button
            className={styles.libraryBackBtn}
            onClick={onBackToBookshelf}
            title="Return to Bookshelf"
          >
            <ChevronLeft size={14} />
            <span>Books</span>
          </button>
          <span className={styles.bookTitleLabel} title={bookTitle}>
            {bookTitle}
          </span>
        </div>

        {/* Merged header actions: Theme, Export, Settings, and Hide Sidebar button */}
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={onToggleTheme} title="Toggle Theme" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {onExportBook && (
            <button className={styles.iconBtn} onClick={onExportBook} title="Export Book (.md / .json)" aria-label="Export Book">
              <Download size={15} />
            </button>
          )}
          <button className={styles.iconBtn} onClick={onOpenManager} title="Manage Course / Import" aria-label="Manage Course">
            <Settings size={15} />
          </button>
          <button
            className={styles.iconBtn}
            onClick={onToggleSidebar}
            title="Hide Sidebar"
            aria-label="Hide Sidebar"
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>

      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search lessons & code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {onOpenCommandPalette && !searchQuery && (
            <button
              type="button"
              className={styles.cmdKBadge}
              onClick={onOpenCommandPalette}
              title="Open Command Palette (⌘K / Ctrl+K)"
            >
              ⌘K
            </button>
          )}
          {searchQuery && (
            <button
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.lessonList}>
        {grouped.map(([sectionName, sectionLessons]) => (
          <div key={sectionName} className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>{sectionName}</div>
            {sectionLessons.map((lesson) => {
              const isSelected = lesson.id === activeLessonId;
              return (
                <div
                  key={lesson.id}
                  ref={isSelected ? activeItemRef : null}
                  className={`${styles.lessonRow} ${isSelected ? styles.lessonRowSelected : ''}`}
                  onClick={() => onSelectLesson(lesson.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectLesson(lesson.id);
                    }
                  }}
                >
                  <span className={styles.lessonNumber}>{lesson.number}</span>
                  <span className={styles.lessonTitle}>{lesson.title}</span>
                  <div className={styles.lessonBadges}>
                    {lesson.bookmarked && (
                      <Bookmark size={12} className={styles.badgeBookmark} fill="currentColor" />
                    )}
                    {lesson.completed && (
                      <CheckCircle2 size={12} className={styles.badgeCompleted} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.sidebarFooter}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{completedCount} of {lessons.length} completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
};
