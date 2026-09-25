export interface MediaAttachment {
  id: string;
  type: 'video' | 'audio';
  url: string;
  title: string;
  duration?: number;
  provider?: 'html5' | 'youtube' | 'vimeo';
}

export interface Lesson {
  id: string;
  number: number;
  title: string;
  section?: string;
  markdown: string;
  completed?: boolean;
  bookmarked?: boolean;
  media?: MediaAttachment[];
}

export interface BookMetadata {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  description: string;
  category: string;
  coverGradient: string;
  accentColor: string;
  totalLessons: number;
  completedLessons?: number;
  lastReadLessonId?: string;
  createdAt: string;
  isCustom?: boolean;
  tags?: string[];
  sourceUrl?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  courseDataPath?: string;
}

export interface CourseManifestLesson {
  id: string;
  number: number;
  title: string;
  section: string;
  sectionId?: string;
  file: string;
  sha256?: string;
}

export interface CourseManifestSection {
  id: string;
  title: string;
  startLesson: number;
  endLesson: number;
}

export interface CourseManifest {
  schemaVersion: number;
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  description?: string;
  category?: string;
  coverGradient?: string;
  accentColor?: string;
  createdAt?: string;
  tags?: string[];
  lessonCount: number;
  firstLesson: number;
  lastLesson: number;
  sections: CourseManifestSection[];
  lessons: CourseManifestLesson[];
}

export interface Book extends BookMetadata {
  lessons: Lesson[];
  scrollPositions?: Record<string, number>;
  mediaProgress?: Record<string, number>;
}

export interface CourseState {
  courseTitle: string;
  sourceUrl?: string;
  importedAt: string;
  lessons: Lesson[];
}

export interface UserPreferences {
  activeBookId: string | null;
  lastLessonId: string | null;
  scrollPositions: Record<string, number>;
  mediaProgress?: Record<string, number>;
  sidebarCollapsed: boolean;
  theme: ReaderTheme;
}

export type ReaderTheme = 'dark' | 'light' | 'paper' | 'real-paper-generated' | 'real-paper-image';

export interface SharedConversationImportResult {
  title?: string;
  markdown: string;
  messageCount: number;
  error?: string;
}

export interface ElectronAPI {
  loadCourseData: () => Promise<CourseState | null>;
  saveCourseData: (course: CourseState) => Promise<boolean>;
  loadPreferences: () => Promise<UserPreferences | null>;
  savePreferences: (prefs: UserPreferences) => Promise<boolean>;
  importFromSharedUrl: (url: string, assistantOnly: boolean) => Promise<SharedConversationImportResult>;
  openFileDialog: () => Promise<{ canceled: boolean; content?: string; filename?: string }>;
  saveFileDialog: (defaultName: string, content: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
