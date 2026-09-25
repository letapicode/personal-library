import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Layers,
  ArrowRight,
  Trash2,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Volume2,
  Video,
  Download,
  X
} from 'lucide-react';
import type { Book, BookMetadata, ReaderTheme } from '../../types/course';
import { ThemePicker } from '../ThemePicker/ThemePicker';
import styles from './Bookshelf.module.css';

interface BookshelfProps {
  books: (Book | BookMetadata)[];
  theme: ReaderTheme;
  onSelectBook: (bookId: string) => void;
  onOpenAddModal: () => void;
  onDeleteBook: (bookId: string) => void;
  onExportBook: (bookId: string) => void;
  onChangeTheme: (theme: ReaderTheme) => void;
  onOpenCommandPalette?: () => void;
}

export const Bookshelf: React.FC<BookshelfProps> = ({
  books,
  theme,
  onSelectBook,
  onOpenAddModal,
  onDeleteBook,
  onExportBook,
  onChangeTheme,
  onOpenCommandPalette
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(
      b =>
        b.title.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [books, searchQuery]);

  const totalLessons = useMemo(() => {
    return books.reduce((sum, b) => {
      const count = 'totalLessons' in b && typeof b.totalLessons === 'number'
        ? b.totalLessons
        : ('lessons' in b && Array.isArray(b.lessons) ? b.lessons.length : 0);
      return sum + count;
    }, 0);
  }, [books]);

  return (
    <div className={styles.bookshelfContainer}>
      <header className={styles.topNavigation}>
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon}>
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className={styles.brandTitle}>Personal Library</h1>
            <p className={styles.brandSubtitle}>
              {books.length === 0
                ? 'Import books from ChatGPT, Claude, or Markdown files'
                : (() => {
                    const categories = [...new Set(books.map(b => b.category).filter(Boolean))];
                    return categories.length <= 3
                      ? categories.join(', ')
                      : `${categories.slice(0, 2).join(', ')} & ${categories.length - 2} more`;
                  })()
              }
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search books & topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {onOpenCommandPalette && (
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
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: onOpenCommandPalette ? 38 : 10,
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button className={styles.addBookBtn} onClick={onOpenAddModal}>
            <Plus size={16} />
            <span>Add Book</span>
          </button>

          <ThemePicker theme={theme} onChange={onChangeTheme} buttonClassName={styles.themeToggleBtn} />
        </div>
      </header>

      <main className={styles.shelfMain}>
        <div className={styles.shelfHeaderRow}>
          <div>
            <h2 className={styles.shelfHeading}>Your Collection</h2>
            <p className={styles.shelfSubheading}>
              Select a book below to start reading with syntax highlighting and instant navigation.
            </p>
          </div>

          <div className={styles.shelfMeta}>
            {books.length} {books.length === 1 ? 'Book' : 'Books'} • {totalLessons} {totalLessons === 1 ? 'Chapter' : 'Chapters'}
          </div>
        </div>

        {/* Spotlight Hero Card — shows when a book has reading progress or when only 1 book */}
        {!searchQuery && books.length > 0 && (() => {
          const heroBook = books.find(b =>
            ('completedLessons' in b && typeof b.completedLessons === 'number' && b.completedLessons > 0) ||
            ('lastReadLessonId' in b && b.lastReadLessonId)
          ) || (books.length <= 2 ? books[0] : null);

          if (!heroBook) return null;

          const heroLessons = 'totalLessons' in heroBook && typeof heroBook.totalLessons === 'number'
            ? heroBook.totalLessons
            : ('lessons' in heroBook && Array.isArray(heroBook.lessons) ? heroBook.lessons.length : 0);
          const heroCompleted = 'completedLessons' in heroBook && typeof heroBook.completedLessons === 'number'
            ? heroBook.completedLessons
            : ('lessons' in heroBook && Array.isArray(heroBook.lessons) ? heroBook.lessons.filter(l => l.completed).length : 0);
          const heroProgress = heroLessons > 0 ? Math.round((heroCompleted / heroLessons) * 100) : 0;
          const hasStarted = heroCompleted > 0 || ('lastReadLessonId' in heroBook && heroBook.lastReadLessonId);

          return (
            <div
              className={styles.spotlightHero}
              onClick={() => onSelectBook(heroBook.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onSelectBook(heroBook.id);
              }}
            >
              <div
                className={styles.spotlightCover}
                style={{ background: heroBook.coverGradient }}
              >
                <div className={styles.spotlightCoverOverlay} />
                <div className={styles.spotlightBookInfo}>
                  <span className={styles.categoryBadge}>{heroBook.category}</span>
                  <h3 className={styles.spotlightTitle}>{heroBook.title}</h3>
                  <p className={styles.spotlightSubtitle}>{heroBook.subtitle}</p>
                </div>
              </div>
              <div className={styles.spotlightBody}>
                <div className={styles.spotlightMeta}>
                  <span className={styles.spotlightAuthor}>By {heroBook.author}</span>
                  <span className={styles.spotlightChapters}>
                    {heroLessons} {heroLessons === 1 ? 'Chapter' : 'Chapters'}
                  </span>
                </div>
                {heroLessons > 0 && (
                  <div className={styles.spotlightProgress}>
                    <div className={styles.spotlightProgressTrack}>
                      <div
                        className={styles.spotlightProgressFill}
                        style={{ width: `${heroProgress}%` }}
                      />
                    </div>
                    <span className={styles.spotlightProgressText}>
                      {heroCompleted}/{heroLessons} read ({heroProgress}%)
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className={styles.spotlightCta}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectBook(heroBook.id);
                  }}
                >
                  {hasStarted ? 'Continue Reading →' : 'Start Reading →'}
                </button>
              </div>
            </div>
          );
        })()}

        <div className={styles.booksGrid}>
          {filteredBooks.map(book => {
            const lessonCount = 'totalLessons' in book && typeof book.totalLessons === 'number'
              ? book.totalLessons
              : ('lessons' in book && Array.isArray(book.lessons) ? book.lessons.length : 0);

            const completedLessons = 'completedLessons' in book && typeof book.completedLessons === 'number'
              ? book.completedLessons
              : ('lessons' in book && Array.isArray(book.lessons) ? book.lessons.filter(l => l.completed).length : 0);

            const progressPercent =
              lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;

            return (
              <article
                key={book.id}
                className={styles.bookCard}
                onClick={e => {
                  // Only open book if click did not originate inside action buttons
                  if ((e.target as HTMLElement).closest('button')) return;
                  onSelectBook(book.id);
                }}
                tabIndex={0}
                onKeyDown={e => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectBook(book.id);
                  }
                }}
              >
                <div
                  className={styles.bookCoverHeader}
                  style={{ background: book.coverGradient }}
                >
                  <div className={styles.bookSpineBinding} />
                  <div className={styles.bookCoverOverlay} />
                  <span className={styles.categoryBadge}>{book.category}</span>
                  <div className={styles.bookCoverMeta}>
                    <span>{lessonCount} {lessonCount === 1 ? 'Chapter' : 'Chapters'}</span>
                    {book.isCustom && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={12} /> Custom
                      </span>
                    )}
                    {book.hasAudio && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Contains Audio">
                        <Volume2 size={12} /> Audio
                      </span>
                    )}
                    {book.hasVideo && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Contains Video">
                        <Video size={12} /> Video
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.bookCardBody}>
                  <h3 className={styles.bookTitle}>{book.title}</h3>
                  <p className={styles.bookSubtitle}>{book.subtitle}</p>
                  <span className={styles.bookAuthor}>By {book.author}</span>

                  {book.tags && (
                    <div className={styles.bookTags}>
                      {book.tags.map(tag => (
                        <span key={tag} className={styles.tagChip}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.bookFooter}>
                  <div className={styles.progressInfo}>
                    {completedLessons > 0 ? (
                      <>
                        <CheckCircle2 size={13} color="var(--accent-pink)" />
                        <span>{completedLessons}/{lessonCount} read ({progressPercent}%)</span>
                      </>
                    ) : (
                      <span>Ready to read</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className={styles.exportCardBtn}
                      onClick={e => {
                        e.stopPropagation();
                        onExportBook(book.id);
                      }}
                      title="Export Book (.md / .json)"
                      aria-label="Export Book"
                    >
                      <Download size={13} />
                    </button>
                    {book.isCustom && (
                      confirmDeleteId === book.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            style={{
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteBook(book.id);
                              setConfirmDeleteId(null);
                            }}
                          >
                            Delete?
                          </button>
                          <button
                            type="button"
                            style={{
                              background: 'transparent',
                              color: 'var(--muted-text)',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '3px 6px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              setConfirmDeleteId(null);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className={styles.deleteBtn}
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDeleteId(book.id);
                          }}
                          title="Delete custom book"
                          aria-label="Delete book"
                        >
                          <Trash2 size={14} />
                        </button>
                      )
                    )}

                    <div className={styles.openArrow}>
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Ghost "Add Book" card */}
          {!searchQuery && (
            <div
              className={styles.ghostAddCard}
              onClick={onOpenAddModal}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onOpenAddModal();
              }}
            >
              <Plus size={32} strokeWidth={1.5} />
              <span>Add a Book</span>
              <span className={styles.ghostAddHint}>Import from ChatGPT, Claude, or Markdown</span>
            </div>
          )}
        </div>

        {filteredBooks.length === 0 && (
          <div className={styles.noResultsBox}>
            <p>No books match your search "{searchQuery}"</p>
            <button className={styles.clearSearchBtnText} onClick={() => setSearchQuery('')}>
              Clear search filter
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
