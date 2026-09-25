import type { Book, BookMetadata, UserPreferences } from '../types/course';
import { loadCourseAsBook } from './courseDataLoader';

const DB_NAME = 'CourseReaderDB_v4';
const DB_VERSION = 1;

const STORE_MANIFEST = 'manifest';
const STORE_BOOK_CONTENTS = 'book_contents';
const STORE_PREFERENCES = 'preferences';

const LEGACY_STORAGE_KEY = 'chatgpt_books_library_v4';
const LEGACY_PREFS_KEY = 'chatgpt_books_prefs_v4';

let cachedDb: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (cachedDb) {
    return Promise.resolve(cachedDb);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      dbInitPromise = null;
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onblocked = () => {
      console.warn('IndexedDB database upgrade was blocked by another open tab or window.');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_MANIFEST)) {
        db.createObjectStore(STORE_MANIFEST, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_BOOK_CONTENTS)) {
        db.createObjectStore(STORE_BOOK_CONTENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PREFERENCES)) {
        db.createObjectStore(STORE_PREFERENCES, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      cachedDb = request.result;
      cachedDb.onversionchange = () => {
        // Close database connection if another tab upgrades schema
        cachedDb?.close();
        cachedDb = null;
        dbInitPromise = null;
      };
      cachedDb.onclose = () => {
        cachedDb = null;
        dbInitPromise = null;
      };
      cachedDb.onerror = () => {
        cachedDb = null;
        dbInitPromise = null;
      };
      resolve(cachedDb);
    };

    request.onerror = () => {
      dbInitPromise = null;
      reject(request.error);
    };
  });

  return dbInitPromise;
}

/**
 * Extract lightweight metadata from a full Book object
 */
export function extractMetadata(book: Book): BookMetadata {
  const completedLessons = book.lessons ? book.lessons.filter(l => l.completed).length : 0;
  const hasAudio = book.lessons ? book.lessons.some(l => l.media && l.media.some(m => m.type === 'audio')) : false;
  const hasVideo = book.lessons ? book.lessons.some(l => l.media && l.media.some(m => m.type === 'video')) : false;

  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    author: book.author,
    description: book.description,
    category: book.category,
    coverGradient: book.coverGradient,
    accentColor: book.accentColor,
    totalLessons: book.lessons ? book.lessons.length : (book.totalLessons || 0),
    completedLessons,
    lastReadLessonId: book.lastReadLessonId,
    createdAt: book.createdAt,
    isCustom: book.isCustom,
    tags: book.tags,
    sourceUrl: book.sourceUrl,
    hasAudio,
    hasVideo,
    courseDataPath: book.courseDataPath
  };
}

/**
 * Merges freshly-loaded course-data lessons with user's saved state
 * (completed, bookmarked flags, scroll positions, media progress) so that
 * refreshing the page or restarting the app never wipes user progress.
 */
function mergeCourseWithSavedState(
  freshBook: Book,
  savedContent: { lessons?: any[]; scrollPositions?: Record<string, number>; mediaProgress?: Record<string, number> } | null
): Book {
  if (!savedContent || !savedContent.lessons || savedContent.lessons.length === 0) {
    return freshBook;
  }

  // Build a lookup of saved lesson state and content by id
  const savedLessonMap = new Map<string, { completed?: boolean; bookmarked?: boolean; markdown?: string }>();
  for (const sl of savedContent.lessons) {
    if (sl && sl.id) {
      savedLessonMap.set(sl.id, {
        completed: sl.completed,
        bookmarked: sl.bookmarked,
        markdown: typeof sl.markdown === 'string' ? sl.markdown : undefined
      });
    }
  }

  // Apply saved state onto fresh lessons
  const mergedLessons = freshBook.lessons.map(lesson => {
    const saved = savedLessonMap.get(lesson.id);
    if (saved) {
      // If fresh lesson markdown is empty or an error placeholder, preserve cached offline markdown
      const hasFailedMarkdown = !lesson.markdown || lesson.markdown.includes('Content could not be loaded.');
      const preservedMarkdown = (hasFailedMarkdown && saved.markdown) ? saved.markdown : lesson.markdown;

      return {
        ...lesson,
        markdown: preservedMarkdown,
        completed: saved.completed || false,
        bookmarked: saved.bookmarked || false
      };
    }
    return lesson;
  });

  return {
    ...freshBook,
    lessons: mergedLessons,
    completedLessons: mergedLessons.filter(l => l.completed).length,
    scrollPositions: savedContent.scrollPositions || freshBook.scrollPositions || {},
    mediaProgress: savedContent.mediaProgress || freshBook.mediaProgress || {}
  };
}

/**
 * Load lightweight library manifest for instant Bookshelf rendering.
 * Only the single real course book from course-data is loaded.
 * User progress (completed, bookmarked, scroll, media) is always preserved.
 */
export async function loadLibraryManifest(): Promise<BookMetadata[]> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_MANIFEST, STORE_BOOK_CONTENTS], 'readonly');
    const manifestStore = tx.objectStore(STORE_MANIFEST);
    const contentStore = tx.objectStore(STORE_BOOK_CONTENTS);
    const manifestReq = manifestStore.getAll();
    // Also fetch saved content for the bundled course book to preserve user state
    const savedCourseReq = contentStore.get('java-software-design');

    return new Promise((resolve) => {
      tx.oncomplete = async () => {
        let manifest: BookMetadata[] = manifestReq.result || [];
        const savedCourseContent = savedCourseReq.result || null;

        // Remove any unwanted dummy books
        const dummyIds = new Set(['book-system-design', 'book-clean-code', 'book-concurrency', 'book-design-patterns']);
        const filtered = manifest.filter(b => !dummyIds.has(b.id));

        if (filtered.length !== manifest.length) {
          try {
            const cleanupTx = db.transaction([STORE_MANIFEST, STORE_BOOK_CONTENTS], 'readwrite');
            for (const dId of dummyIds) {
              cleanupTx.objectStore(STORE_MANIFEST).delete(dId);
              cleanupTx.objectStore(STORE_BOOK_CONTENTS).delete(dId);
            }
          } catch {}
          manifest = filtered;
        }

        // Load fresh course structure from course-data, then merge with saved user state
        try {
          const courseBook = await loadCourseAsBook('/course-data');
          if (courseBook) {
            const merged = mergeCourseWithSavedState(courseBook, savedCourseContent);
            await saveBookToStorage(merged);
            const meta = extractMetadata(merged);
            const existingIdx = manifest.findIndex(b => b.id === merged.id);
            if (existingIdx >= 0) {
              // Preserve lastReadLessonId from existing manifest entry
              const existingLastRead = manifest[existingIdx].lastReadLessonId;
              manifest[existingIdx] = { ...meta, lastReadLessonId: existingLastRead || meta.lastReadLessonId };
            } else {
              manifest.unshift(meta);
            }
          }
        } catch (e) {
          console.warn('Failed to load course-data book:', e);
        }

        // Strictly keep only the course-data book and any user-created custom books
        manifest = manifest.filter(b => b.id === 'java-software-design' || b.isCustom);

        resolve(manifest);
      };
      tx.onerror = () => resolve(fallbackLoadManifestFromLocalStorage());
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to course-data direct load', err);
    return fallbackLoadManifestFromLocalStorage();
  }
}

/**
 * Load full book content (lessons, scroll, media) on demand when a book is opened
 */
export async function loadBookContent(bookId: string): Promise<Book | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_MANIFEST, STORE_BOOK_CONTENTS], 'readonly');
    const manifestStore = tx.objectStore(STORE_MANIFEST);
    const contentStore = tx.objectStore(STORE_BOOK_CONTENTS);

    const metaReq = manifestStore.get(bookId);
    const contentReq = contentStore.get(bookId);

    return new Promise((resolve) => {
      tx.oncomplete = async () => {
        const meta: BookMetadata | undefined = metaReq.result;
        let content = contentReq.result;

        // If this is the bundled course-data book, or if an explicit courseDataPath is defined
        if (bookId === 'java-software-design' || meta?.courseDataPath) {
          try {
            const loaded = await loadCourseAsBook(meta?.courseDataPath || '/course-data');
            if (loaded) {
              // Merge fresh course structure with saved user state to preserve progress
              const merged = mergeCourseWithSavedState(loaded, content);
              // Preserve lastReadLessonId from meta
              if (meta?.lastReadLessonId) {
                merged.lastReadLessonId = meta.lastReadLessonId;
              }
              await saveBookToStorage(merged);
              resolve(merged);
              return;
            }
          } catch (e) {
            console.warn('Failed to load book from course-data on demand:', e);
          }
        }

        if (!meta && !content) {
          resolve(null);
          return;
        }

        const fallbackMeta = meta || {
          id: bookId,
          title: 'Course Book',
          subtitle: '',
          author: 'Author',
          description: '',
          category: 'General',
          coverGradient: 'linear-gradient(145deg, #1b0c26 0%, #3a164c 50%, #200d2b 100%)',
          accentColor: '#e094b5',
          totalLessons: content?.lessons?.length || 0,
          createdAt: new Date().toISOString().split('T')[0]
        };

        const book: Book = {
          ...fallbackMeta,
          lessons: content?.lessons || [],
          scrollPositions: content?.scrollPositions || {},
          mediaProgress: content?.mediaProgress || {}
        };
        resolve(book);
      };
      tx.onerror = () => resolve(fallbackLoadBookFromLocalStorage(bookId));
    });
  } catch (err) {
    console.warn('Failed to load book content from IndexedDB', err);
    return fallbackLoadBookFromLocalStorage(bookId);
  }
}

/**
 * Persist a full book into both Manifest and Content stores
 */
export async function saveBookToStorage(book: Book): Promise<boolean> {
  const meta = extractMetadata(book);
  const content = {
    id: book.id,
    lessons: book.lessons || [],
    scrollPositions: book.scrollPositions || {},
    mediaProgress: book.mediaProgress || {}
  };

  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_MANIFEST, STORE_BOOK_CONTENTS], 'readwrite');
    tx.objectStore(STORE_MANIFEST).put(meta);
    tx.objectStore(STORE_BOOK_CONTENTS).put(content);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to save book to IndexedDB, fallback to localStorage', err);
    return fallbackSaveToLocalStorage(book);
  }
}

/**
 * Remove a book from storage
 */
export async function deleteBookFromStorage(bookId: string): Promise<boolean> {
  // Also clean up any localStorage fallback entries for this book
  try {
    localStorage.removeItem(`library_book_${bookId}`);
    const legacyManifestStr = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyManifestStr) {
      const legacyManifest: any[] = JSON.parse(legacyManifestStr);
      const filtered = legacyManifest.filter((b: any) => b.id !== bookId);
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {}

  try {
    const db = await openDatabase();
    const tx = db.transaction([STORE_MANIFEST, STORE_BOOK_CONTENTS], 'readwrite');
    tx.objectStore(STORE_MANIFEST).delete(bookId);
    tx.objectStore(STORE_BOOK_CONTENTS).delete(bookId);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to delete book from IndexedDB', err);
    return false;
  }
}

/**
 * Preferences Persistence
 */
export async function savePreferencesToStorage(prefs: UserPreferences): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_PREFERENCES, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error('Preference write aborted'));
      tx.onerror = () => reject(tx.error || new Error('Preference write failed'));
      tx.objectStore(STORE_PREFERENCES).put({ key: 'user_prefs', ...prefs });
    });
  } catch {
    try {
      localStorage.setItem(LEGACY_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }
}

export async function loadPreferencesFromStorage(): Promise<UserPreferences | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_PREFERENCES, 'readonly');
    const req = tx.objectStore(STORE_PREFERENCES).get('user_prefs');

    return new Promise((resolve) => {
      req.onsuccess = () => {
        if (req.result) {
          const { key, ...prefs } = req.result;
          resolve(prefs as UserPreferences);
        } else {
          resolve(fallbackLoadPrefsFromLocalStorage());
        }
      };
      req.onerror = () => resolve(fallbackLoadPrefsFromLocalStorage());
    });
  } catch {
    return fallbackLoadPrefsFromLocalStorage();
  }
}

/* Fallbacks & Migrations */
async function fallbackLoadManifestFromLocalStorage(): Promise<BookMetadata[]> {
  const courseBook = await loadCourseAsBook('/course-data');
  return courseBook ? [extractMetadata(courseBook)] : [];
}

async function fallbackLoadBookFromLocalStorage(bookId: string): Promise<Book | null> {
  if (bookId === 'java-software-design') {
    return await loadCourseAsBook('/course-data');
  }
  return null;
}

function fallbackSaveToLocalStorage(book: Book): boolean {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    let books: Book[] = raw ? JSON.parse(raw) : [];
    const idx = books.findIndex(b => b.id === book.id);
    if (idx >= 0) {
      books[idx] = book;
    } else {
      books.push(book);
    }
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(books));
    return true;
  } catch {
    return false;
  }
}

function fallbackLoadPrefsFromLocalStorage(): UserPreferences | null {
  try {
    const raw = localStorage.getItem(LEGACY_PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
