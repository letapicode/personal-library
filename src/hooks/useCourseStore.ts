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
    if (activeBook) {
      const updatedBook: Book = {
        ...activeBook,
        lastReadLessonId: id
      };
      setActiveBook(updatedBook);
      saveBookToStorage(updatedBook);

      // Update manifest metadata
      setManifest(prev =>
        prev.map(m => (m.id === activeBook.id ? { ...m, lastReadLessonId: id } : m))
      );
    }

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
    const updated = { ...scrollPositions, [lessonId]: pos };
    setScrollPositions(updated);

    if (activeBook) {
      const updatedBook: Book = {
        ...activeBook,
        scrollPositions: updated
      };
      setActiveBook(updatedBook);
      saveBookToStorage(updatedBook);
    }
  };

  const saveMediaTime = (mediaKey: string, time: number) => {
    const updated = { ...mediaProgress, [mediaKey]: time };
    setMediaProgress(updated);

    if (activeBook) {
      const updatedBook: Book = {
        ...activeBook,
        mediaProgress: updated
      };
      setActiveBook(updatedBook);
      saveBookToStorage(updatedBook);
    }
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
    if (!activeBook) return;
    const nextLessons = activeBook.lessons.map(l =>
      l.id === lessonId ? { ...l, bookmarked: !l.bookmarked } : l
    );
    const updatedBook: Book = { ...activeBook, lessons: nextLessons };
    setActiveBook(updatedBook);
    saveBookToStorage(updatedBook);
  };

  const toggleComplete = (lessonId: string) => {
    if (!activeBook) return;
    const nextLessons = activeBook.lessons.map(l =>
      l.id === lessonId ? { ...l, completed: !l.completed } : l
    );
    const completedCount = nextLessons.filter(l => l.completed).length;

    const updatedBook: Book = {
      ...activeBook,
      lessons: nextLessons,
      completedLessons: completedCount
    };
    setActiveBook(updatedBook);
    saveBookToStorage(updatedBook);

    // Sync to manifest
    setManifest(prev =>
      prev.map(m => (m.id === activeBook.id ? { ...m, completedLessons: completedCount } : m))
    );
  };

  const updateActiveBookLessons = (newLessons: Lesson[]) => {
    if (!activeBook) return;
    const completedCount = newLessons.filter(l => l.completed).length;

    // Preserve the currently active lesson if it still exists in the updated curriculum
    const currentLessonStillExists = Boolean(activeLessonId && newLessons.some(l => l.id === activeLessonId));
    const targetLessonId: string | undefined = currentLessonStillExists
      ? (activeLessonId || undefined)
      : newLessons[0]?.id;

    const updatedBook: Book = {
      ...activeBook,
      lessons: newLessons,
      totalLessons: newLessons.length,
      completedLessons: completedCount,
      lastReadLessonId: targetLessonId
    };

    setActiveBook(updatedBook);
    saveBookToStorage(updatedBook);

    // Update manifest
    const meta = extractMetadata(updatedBook);
    setManifest(prev => prev.map(m => (m.id === activeBook.id ? meta : m)));

    if (targetLessonId && targetLessonId !== activeLessonId) {
      setActiveLessonId(targetLessonId);
    }
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
