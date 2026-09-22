import type { Book, CourseManifest, Lesson } from '../types/course';

// Vite glob fallback for zero-network/bundled scenarios
const bundledLessons = import.meta.glob('/course-data/lessons/*.md', {
  query: '?raw',
  import: 'default'
}) as Record<string, () => Promise<string>>;

const bundledCourseJson = import.meta.glob('/course-data/course.json', {
  import: 'default'
}) as Record<string, () => Promise<CourseManifest>>;

/**
 * Fetches the course manifest from /course-data/course.json
 */
export async function fetchCourseManifest(basePath: string = '/course-data'): Promise<CourseManifest | null> {
  try {
    const res = await fetch(`${basePath}/course.json`);
    if (res.ok) {
      const data: CourseManifest = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Network fetch for course.json failed, checking bundled fallback...', err);
  }

  // Bundled fallback
  try {
    const key = '/course-data/course.json';
    if (bundledCourseJson[key]) {
      const mod = await bundledCourseJson[key]();
      return mod;
    }
  } catch (err) {
    console.error('Failed to load bundled course.json fallback:', err);
  }

  return null;
}

/**
 * Fetches an individual lesson's markdown content
 */
export async function fetchLessonMarkdown(
  basePath: string = '/course-data',
  filePath: string
): Promise<string> {
  // Normalize path (ensure no leading slash if basePath has it)
  const normalizedFile = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const fullUrl = `${basePath}/${normalizedFile}`;

  try {
    const res = await fetch(fullUrl);
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {
    console.warn(`Fetch for ${fullUrl} failed, checking bundled fallback...`, err);
  }

  // Bundled fallback
  try {
    const bundledKey = `/course-data/${normalizedFile}`;
    if (bundledLessons[bundledKey]) {
      const text = await bundledLessons[bundledKey]();
      return text;
    }
  } catch (err) {
    console.error(`Failed to load bundled fallback for ${filePath}:`, err);
  }

  return '';
}

/**
 * Builds a complete Book object by reading course.json and all individual lesson markdown files
 */
export async function loadCourseAsBook(basePath: string = '/course-data'): Promise<Book | null> {
  const manifest = await fetchCourseManifest(basePath);
  if (!manifest) {
    return null;
  }

  // Fetch all lesson files concurrently
  const lessonPromises = manifest.lessons.map(async (item): Promise<Lesson> => {
    const markdown = await fetchLessonMarkdown(basePath, item.file);
    return {
      id: item.id || `lesson-${item.number}`,
      number: item.number,
      title: item.title,
      section: item.section,
      markdown: markdown || `# Lesson ${item.number} — ${item.title}\n\nContent could not be loaded.`,
      completed: false,
      bookmarked: false
    };
  });

  const lessons = await Promise.all(lessonPromises);

  const book: Book = {
    id: manifest.id,
    title: manifest.title,
    subtitle: manifest.subtitle || '',
    author: manifest.author || 'ChatGPT',
    description: manifest.description || '',
    category: manifest.category || 'Software Architecture',
    coverGradient: manifest.coverGradient || 'linear-gradient(145deg, #1b0c26 0%, #3a164c 50%, #200d2b 100%)',
    accentColor: manifest.accentColor || '#e094b5',
    totalLessons: lessons.length,
    completedLessons: 0,
    createdAt: manifest.createdAt || '2026-03-01',
    tags: manifest.tags || ['Java', 'SOLID', '23 GoF Patterns', 'LLD', 'Software Design'],
    courseDataPath: basePath,
    lessons,
    scrollPositions: {},
    mediaProgress: {}
  };

  return book;
}
