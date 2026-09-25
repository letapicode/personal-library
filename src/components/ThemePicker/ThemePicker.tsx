import { useEffect, useRef, useState } from 'react';
import { BookOpen, FileImage, Moon, ScrollText, Sun } from 'lucide-react';
import type { ReaderTheme } from '../../types/course';
import { READER_THEMES } from '../../utils/readerThemes';
import styles from './ThemePicker.module.css';

const icons: Record<ReaderTheme, typeof Moon> = {
  dark: Moon,
  light: Sun,
  paper: BookOpen,
  'real-paper-generated': ScrollText,
  'real-paper-image': FileImage
};

interface Props {
  theme: ReaderTheme;
  onChange: (theme: ReaderTheme) => void;
  buttonClassName?: string;
}

export function ThemePicker({ theme, onChange, buttonClassName = '' }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = READER_THEMES.find(choice => choice.value === theme) || READER_THEMES[0];
  const CurrentIcon = icons[current.value];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.picker} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${buttonClassName}`}
        onClick={() => setOpen(value => !value)}
        aria-label={`Appearance: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="true"
        title={`Appearance: ${current.label}`}
      >
        <CurrentIcon size={17} />
      </button>
      {open && (
        <div className={styles.menu} role="group" aria-label="Appearance">
          <div className={styles.menuTitle}>Appearance</div>
          {READER_THEMES.map(choice => {
            const Icon = icons[choice.value];
            return (
              <button
                type="button"
                key={choice.value}
                className={`${styles.choice} ${theme === choice.value ? styles.selected : ''}`}
                aria-pressed={theme === choice.value}
                onClick={() => {
                  onChange(choice.value);
                  setOpen(false);
                }}
              >
                <Icon size={16} />
                <span>{choice.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
