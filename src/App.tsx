import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { LessonReader } from './components/LessonReader/LessonReader';
import { Bookshelf } from './components/Bookshelf/Bookshelf';
import { AddBookModal } from './components/Bookshelf/AddBookModal';
import { CourseManagerModal } from './components/CourseManager/CourseManagerModal';
import { ExportBookModal } from './components/ExportBookModal/ExportBookModal';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { useCourseStore } from './hooks/useCourseStore';
import { loadBookContent } from './storage/libraryStorage';
import type { Book } from './types/course';
import styles from './App.module.css';

export const App: React.FC = () => {
  const {
    manifest,
    activeBook,
    activeBookId,
    lessons,
    activeLessonId,
    scrollPositions,
    mediaProgress,
    sidebarCollapsed,
    theme,
    isLoaded,
    isLoadingBook,
    selectBook,
    selectLesson,
    saveScrollPosition,
    saveMediaTime,
    toggleSidebar,
    changeTheme,
    toggleBookmark,
    toggleComplete,
    updateActiveBookLessons,
    addBook,
    deleteBook
  } = useCourseStore();

  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [exportingBook, setExportingBook] = useState<Book | null>(null);

  // Sync theme attribute to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Command Palette shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  // Keyboard navigation: Alt + Left / Alt + Right when inside a book
  useEffect(() => {
    if (!activeBookId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const currentIndex = lessons.findIndex(l => l.id === activeLessonId);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowLeft' && currentIndex > 0) {
          selectLesson(lessons[currentIndex - 1].id);
        } else if (e.key === 'ArrowRight' && currentIndex < lessons.length - 1) {
          selectLesson(lessons[currentIndex + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBookId, lessons, activeLessonId, selectLesson]);

  if (!isLoaded) return null;

  const currentIndex = lessons.findIndex(l => l.id === activeLessonId);
  const activeLesson = currentIndex !== -1 ? lessons[currentIndex] : lessons[0];
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : undefined;

  const handleOpenExport = async (bookOrId?: Book | string | null) => {
    if (!bookOrId && activeBook) {
      setExportingBook(activeBook);
      return;
    }

    if (typeof bookOrId === 'object' && bookOrId !== null) {
      setExportingBook(bookOrId);
      return;
    }

    const targetId = typeof bookOrId === 'string' ? bookOrId : activeBookId;
    if (!targetId) return;

    if (activeBook && activeBook.id === targetId) {
      setExportingBook(activeBook);
      return;
    }

    try {
      const loaded = await loadBookContent(targetId);
      if (loaded) {
        setExportingBook(loaded);
      }
    } catch (e) {
      console.error('Failed to load book for export:', e);
    }
  };

  // If no book is selected: render the high-speed Bookshelf with IndexedDB manifest
  if (!activeBookId) {
    return (
      <div className={styles.appContainer}>
        <Bookshelf
          books={manifest}
          theme={theme}
          onSelectBook={selectBook}
          onOpenAddModal={() => setIsAddBookModalOpen(true)}
          onDeleteBook={deleteBook}
          onExportBook={bookId => handleOpenExport(bookId)}
          onChangeTheme={changeTheme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {isAddBookModalOpen && (
          <AddBookModal
            onClose={() => setIsAddBookModalOpen(false)}
            onAddBook={newBook => {
              addBook(newBook);
            }}
          />
        )}

        {exportingBook && (
          <ExportBookModal
            book={exportingBook}
            onClose={() => setExportingBook(null)}
          />
        )}

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          books={manifest}
          activeBookId={null}
          lessons={[]}
          theme={theme}
          onSelectBook={selectBook}
          onSelectLesson={selectLesson}
          onChangeTheme={changeTheme}
          onOpenManager={() => setIsManagerOpen(true)}
          onOpenAddBook={() => setIsAddBookModalOpen(true)}
          onExportBook={() => handleOpenExport(activeBook)}
        />
      </div>
    );
  }

  // If currently reading/opening a book but content is being fetched
  if (isLoadingBook && !activeBook) {
    return (
      <div className={styles.appContainer} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--primary-text)', fontSize: 16 }}>
          Loading book curriculum...
        </div>
      </div>
    );
  }

  // When a book is selected: Render the Course Reader View with left sidebar and right reader
  return (
    <div className={styles.appContainer}>
      <Sidebar
        bookTitle={activeBook?.title || 'Course Reader'}
        lessons={lessons}
        activeLessonId={activeLesson?.id || null}
        collapsed={sidebarCollapsed}
        theme={theme}
        onSelectLesson={selectLesson}
        onOpenManager={() => setIsManagerOpen(true)}
        onExportBook={() => handleOpenExport(activeBook)}
        onChangeTheme={changeTheme}
        onToggleSidebar={toggleSidebar}
        onBackToBookshelf={() => selectBook(null)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {activeLesson ? (
        <LessonReader
          bookTitle={activeBook?.title || 'Course'}
          lesson={activeLesson}
          prevLesson={prevLesson}
          nextLesson={nextLesson}
          sidebarCollapsed={sidebarCollapsed}
          initialScrollPosition={scrollPositions[activeLesson.id] || 0}
          mediaProgress={mediaProgress}
          onToggleSidebar={toggleSidebar}
          onToggleBookmark={toggleBookmark}
          onToggleComplete={toggleComplete}
          onSelectLesson={selectLesson}
          onSaveScrollPosition={saveScrollPosition}
          onSaveMediaTime={saveMediaTime}
          onBackToBookshelf={() => selectBook(null)}
        />
      ) : (
        <div className={styles.emptyPlaceholder}>
          <h2 style={{ fontSize: 20, color: 'var(--primary-text)' }}>No Lessons in This Book</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--code-bg)',
                color: 'var(--primary-text)',
                border: '1px solid var(--sidebar-border)',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
              onClick={() => selectBook(null)}
            >
              ← Back to Bookshelf
            </button>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600
              }}
              onClick={() => setIsManagerOpen(true)}
            >
              Import Lessons
            </button>
          </div>
        </div>
      )}

      {isManagerOpen && (
        <CourseManagerModal
          currentLessons={lessons}
          onClose={() => setIsManagerOpen(false)}
          onUpdateLessons={newLessons => {
            updateActiveBookLessons(newLessons);
          }}
          onExportMarkdown={() => handleOpenExport(activeBook)}
        />
      )}

      {exportingBook && (
        <ExportBookModal
          book={exportingBook}
          onClose={() => setExportingBook(null)}
        />
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        books={manifest}
        activeBookId={activeBookId}
        lessons={lessons}
        theme={theme}
        onSelectBook={selectBook}
        onSelectLesson={selectLesson}
        onChangeTheme={changeTheme}
        onOpenManager={() => setIsManagerOpen(true)}
        onOpenAddBook={() => setIsAddBookModalOpen(true)}
        onExportBook={() => handleOpenExport(activeBook)}
      />
    </div>
  );
};

export default App;
