import { useState, useEffect, useCallback } from 'react';
import type { Book, BookMetadata, Lesson, UserPreferences } from '../types/course';
import {
  loadLibraryManifest,
  loadBookContent,
  saveBookToStorage,
  deleteBookFromStorage,
  loadPreferencesFromStorage,
  savePreferencesToStorage,
  extractMetadata
} from '../storage/libraryStorage';

export function useCourseStore() {
  const [manifest, setManifest] = useState<BookMetadata[]>([]);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});
  const [mediaProgress, setMediaProgress] = useState<Record<string, number>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingBook, setIsLoadingBook] = useState(false);

  // 1. Initial Load: Load manifest and preferences via IndexedDB (fast two-tier load)
  useEffect(() => {
    async function init() {
      try {
        const [loadedManifest, savedPrefs] = await Promise.all([
          loadLibraryManifest(),
          loadPreferencesFromStorage()
        ]);

        setManifest(loadedManifest);

        if (savedPrefs) {
          setTheme(savedPrefs.theme || 'dark');
          setSidebarCollapsed(savedPrefs.sidebarCollapsed || false);
          if (savedPrefs.mediaProgress) {
            setMediaProgress(savedPrefs.mediaProgress);
          }
        }
      } catch (err) {
        console.error('Error during library initialization:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    init();
  }, []);

  // 2. Select Book (lazy-loads book lessons into memory on demand)
  const selectBook = useCallback(async (bookId: string | null) => {
    if (!bookId) {
      setActiveBookId(null);
      setActiveBook(null);
      setActiveLessonId(null);
      savePreferencesToStorage({
        activeBookId: null,
        lastLessonId: null,
        scrollPositions: {},
        mediaProgress,
        sidebarCollapsed,
        theme
      });
      return;
    }

    setIsLoadingBook(true);
    try {
      const fullBook = await loadBookContent(bookId);
      if (fullBook) {
        setActiveBookId(bookId);
        setActiveBook(fullBook);
        setScrollPositions(fullBook.scrollPositions || {});
        setMediaProgress(prev => ({ ...prev, ...(fullBook.mediaProgress || {}) }));

        const nextLessonId = fullBook.lastReadLessonId || fullBook.lessons[0]?.id || null;
        setActiveLessonId(nextLessonId);

        savePreferencesToStorage({
          activeBookId: bookId,
          lastLessonId: nextLessonId,
          scrollPositions: fullBook.scrollPositions || {},
          mediaProgress: { ...mediaProgress, ...(fullBook.mediaProgress || {}) },
          sidebarCollapsed,
          theme
        });
      }
    } catch (err) {
      console.error(`Failed to load book ${bookId}:`, err);
    } finally {
      setIsLoadingBook(false);
    }
  }, [sidebarCollapsed, theme, mediaProgress]);

  const selectLesson = (id: string) => {
    setActiveLessonId(id);
    setActiveBook(prev => {
      if (!prev) return null;
      const updatedBook: Book = {
        ...prev,
        lastReadLessonId: id
      };
      saveBookToStorage(updatedBook);

      // Update manifest metadata
      setManifest(mPrev =>
        mPrev.map(m => (m.id === prev.id ? { ...m, lastReadLessonId: id } : m))
      );

      return updatedBook;
    });

    savePreferencesToStorage({
      activeBookId,
      lastLessonId: id,
      scrollPositions,
      mediaProgress,
      sidebarCollapsed,
      theme
    });
  };

  const saveScrollPosition = (lessonId: string, pos: number) => {
    setScrollPositions(prev => ({ ...prev, [lessonId]: pos }));

    setActiveBook(prev => {
      if (!prev) return null;
      const updatedScroll = { ...prev.scrollPositions, [lessonId]: pos };
      const updatedBook: Book = {
        ...prev,
        scrollPositions: updatedScroll
      };
      saveBookToStorage(updatedBook);
      return updatedBook;
    });
  };

  const saveMediaTime = (mediaKey: string, time: number) => {
    setMediaProgress(prev => ({ ...prev, [mediaKey]: time }));

    setActiveBook(prev => {
      if (!prev) return null;
      const updatedMedia = { ...prev.mediaProgress, [mediaKey]: time };
      const updatedBook: Book = {
        ...prev,
        mediaProgress: updatedMedia
      };
      saveBookToStorage(updatedBook);
      return updatedBook;
    });
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    savePreferencesToStorage({
      activeBookId,
      lastLessonId: activeLessonId,
      scrollPositions,
      mediaProgress,
      sidebarCollapsed: next,
      theme
    });
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    savePreferencesToStorage({
      activeBookId,
      lastLessonId: activeLessonId,
      scrollPositions,
      mediaProgress,
      sidebarCollapsed,
      theme: next
    });
  };

  const toggleBookmark = (lessonId: string) => {
    setActiveBook(prev => {
      if (!prev) return null;
      const nextLessons = prev.lessons.map(l =>
        l.id === lessonId ? { ...l, bookmarked: !l.bookmarked } : l
      );
      const updatedBook: Book = { ...prev, lessons: nextLessons };
      saveBookToStorage(updatedBook);
      return updatedBook;
    });
  };

  const toggleComplete = (lessonId: string) => {
    setActiveBook(prev => {
      if (!prev) return null;
      const nextLessons = prev.lessons.map(l =>
        l.id === lessonId ? { ...l, completed: !l.completed } : l
      );
      const completedCount = nextLessons.filter(l => l.completed).length;

      const updatedBook: Book = {
        ...prev,
        lessons: nextLessons,
        completedLessons: completedCount
      };
      saveBookToStorage(updatedBook);

      // Sync to manifest
      setManifest(mPrev =>
        mPrev.map(m => (m.id === prev.id ? { ...m, completedLessons: completedCount } : m))
      );

      return updatedBook;
    });
  };

  const updateActiveBookLessons = (newLessons: Lesson[]) => {
    const completedCount = newLessons.filter(l => l.completed).length;

    setActiveBook(prev => {
      if (!prev) return null;

      // Preserve the currently active lesson if it still exists in the updated curriculum
      const currentLessonStillExists = Boolean(activeLessonId && newLessons.some(l => l.id === activeLessonId));
      const targetLessonId: string | undefined = currentLessonStillExists
        ? (activeLessonId || undefined)
        : newLessons[0]?.id;

      const updatedBook: Book = {
        ...prev,
        lessons: newLessons,
        totalLessons: newLessons.length,
        completedLessons: completedCount,
        lastReadLessonId: targetLessonId
      };

      saveBookToStorage(updatedBook);

      // Update manifest
      const meta = extractMetadata(updatedBook);
      setManifest(mPrev => mPrev.map(m => (m.id === prev.id ? meta : m)));

      if (targetLessonId && targetLessonId !== activeLessonId) {
        setActiveLessonId(targetLessonId);
      }

      return updatedBook;
    });
  };

  const addBook = async (newBook: Book) => {
    await saveBookToStorage(newBook);
    const meta = extractMetadata(newBook);
    setManifest(prev => [...prev, meta]);
    // Switch to newly created book
    await selectBook(newBook.id);
  };

  const deleteBook = async (bookId: string) => {
    await deleteBookFromStorage(bookId);
    setManifest(prev => prev.filter(m => m.id !== bookId));
    if (activeBookId === bookId) {
      selectBook(null);
    }
  };

  const lessons = activeBook ? activeBook.lessons : [];

  return {
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
    toggleTheme,
    toggleBookmark,
    toggleComplete,
    updateActiveBookLessons,
    addBook,
    deleteBook
  };
}
