import type { ReaderTheme } from '../types/course';

export const READER_THEMES: ReadonlyArray<{ value: ReaderTheme; label: string }> = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'paper', label: 'Paper' },
  { value: 'real-paper-generated', label: 'Coded Paper' },
  { value: 'real-paper-image', label: 'Image Paper' }
];

export function isReaderTheme(value: unknown): value is ReaderTheme {
  return READER_THEMES.some(theme => theme.value === value);
}
