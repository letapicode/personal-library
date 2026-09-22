import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Sun,
  Moon,
  Library,
  Settings,
  Plus,
  ArrowRight,
  Download
} from 'lucide-react';
import type { Book, BookMetadata, Lesson } from '../../types/course';
import styles from './CommandPalette.module.css';

interface CommandItem {
  id: string;
  category: 'Lessons' | 'Books' | 'Actions';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  books: (Book | BookMetadata)[];
  activeBookId: string | null;
  lessons: Lesson[];
  theme: 'dark' | 'light';
  onSelectBook: (bookId: string | null) => void;
  onSelectLesson: (lessonId: string) => void;
  onToggleTheme: () => void;
  onOpenManager: () => void;
  onOpenAddBook: () => void;
  onExportBook?: () => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  books,
  activeBookId,
  lessons,
  theme,
  onSelectBook,
  onSelectLesson,
  onToggleTheme,
  onOpenManager,
  onOpenAddBook,
  onExportBook
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build unified search items
  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];
    const q = query.trim().toLowerCase();

    // 1. Lessons in active book
    if (activeBookId && lessons.length > 0) {
      for (const l of lessons) {
        if (
          !q ||
          l.title.toLowerCase().includes(q) ||
          `lesson ${l.number}`.includes(q) ||
          (l.section && l.section.toLowerCase().includes(q))
        ) {
          list.push({
            id: `lesson-${l.id}`,
            category: 'Lessons',
            title: `Lesson ${l.number} — ${l.title}`,
            subtitle: l.section || 'Course Lesson',
            icon: <FileText size={15} />,
            onSelect: () => {
              onSelectLesson(l.id);
              onClose();
            }
          });
        }
      }
    }

    // 2. Books in Library
    for (const b of books) {
      if (
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.subtitle?.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      ) {
        list.push({
          id: `book-${b.id}`,
          category: 'Books',
          title: b.title,
          subtitle: `${b.category} • ${b.author}`,
          icon: <BookOpen size={15} />,
          onSelect: () => {
            onSelectBook(b.id);
            onClose();
          }
        });
      }
    }

    // 3. Quick Actions
    const actions: CommandItem[] = [
      {
        id: 'action-theme',
        category: 'Actions',
        title: theme === 'dark' ? 'Switch to Light Paper Theme' : 'Switch to Dark Obsidian Theme',
        subtitle: 'Toggle reader appearance',
        icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
        onSelect: () => {
          onToggleTheme();
          onClose();
        }
      },
      {
        id: 'action-library',
        category: 'Actions',
        title: 'Go to Library Bookshelf',
        subtitle: 'View and explore all courses',
        icon: <Library size={15} />,
        onSelect: () => {
          onSelectBook(null);
          onClose();
        }
      },
      {
        id: 'action-add-book',
        category: 'Actions',
        title: 'Add New Book',
        subtitle: 'Create a custom course curriculum',
        icon: <Plus size={15} />,
        onSelect: () => {
          onOpenAddBook();
          onClose();
        }
      },
      {
        id: 'action-manager',
        category: 'Actions',
        title: 'Course Manager & Importer',
        subtitle: 'Export course or import JSON/Markdown',
        icon: <Settings size={15} />,
        onSelect: () => {
          onOpenManager();
          onClose();
        }
      },
      ...(activeBookId && onExportBook ? [{
        id: 'action-export-book',
        category: 'Actions' as const,
        title: 'Export Current Book',
        subtitle: 'Download book as Markdown (.md) or JSON (.json)',
        icon: <Download size={15} />,
        onSelect: () => {
          onExportBook();
          onClose();
        }
      }] : [])
    ];

    for (const act of actions) {
      if (!q || act.title.toLowerCase().includes(q) || act.subtitle?.toLowerCase().includes(q)) {
        list.push(act);
      }
    }

    return list;
  }, [query, activeBookId, lessons, books, theme, onSelectBook, onSelectLesson, onToggleTheme, onOpenManager, onOpenAddBook, onExportBook, onClose]);

  // Adjust selection bounds if query shrinks list
  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.paletteOverlay} onClick={onClose}>
      <div
        className={styles.paletteModal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Command Palette"
      >
        <div className={styles.searchHeader}>
          <Search size={17} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search lessons, books, or actions..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className={styles.escBadge}>ESC</span>
        </div>

        <div className={styles.resultsList}>
          {items.length === 0 ? (
            <div className={styles.noResults}>No matches for "{query}"</div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`${styles.resultItem} ${isSelected ? styles.resultItemSelected : ''}`}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.itemIcon}>{item.icon}</div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    {item.subtitle && <div className={styles.itemSubtitle}>{item.subtitle}</div>}
                  </div>
                  {isSelected && (
                    <div className={styles.enterHint}>
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerShortcuts}>
            <div className={styles.shortcutItem}>
              <span className={styles.kbd}>↑</span>
              <span className={styles.kbd}>↓</span>
              <span>Navigate</span>
            </div>
            <div className={styles.shortcutItem}>
              <span className={styles.kbd}>↵</span>
              <span>Select</span>
            </div>
            <div className={styles.shortcutItem}>
              <span className={styles.kbd}>esc</span>
              <span>Close</span>
            </div>
          </div>
          <span>Engineering Reader</span>
        </div>
      </div>
    </div>
  );
};
