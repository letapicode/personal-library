import { useEffect, useRef, useState } from 'react';
import { BookOpen, Moon, Sun } from 'lucide-react';
import type { ReaderTheme } from '../../types/course';
import styles from './ThemePicker.module.css';

const choices: { value: ReaderTheme; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'paper', label: 'Paper', icon: BookOpen }
];

interface Props {
  theme: ReaderTheme;
  onChange: (theme: ReaderTheme) => void;
  buttonClassName?: string;
}

export function ThemePicker({ theme, onChange, buttonClassName = '' }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = choices.find(choice => choice.value === theme) || choices[0];
  const CurrentIcon = current.icon;

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
          {choices.map(choice => {
            const Icon = choice.icon;
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
