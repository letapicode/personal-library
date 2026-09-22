import React, { useState, useEffect } from 'react';
import styles from './ReadingPreferences.module.css';

interface ReadingPrefs {
  font: 'sans' | 'serif';
  size: 'compact' | 'default' | 'large';
  measure: 'comfortable' | 'wide';
}

const STORAGE_KEY = 'chatgpt_reader_preferences_v1';

export const ReadingPreferences: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const [prefs, setPrefs] = useState<ReadingPrefs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return { font: 'sans', size: 'default', measure: 'comfortable' };
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-reading-font', prefs.font);
    document.documentElement.setAttribute('data-reading-size', prefs.size);
    document.documentElement.setAttribute('data-reading-measure', prefs.measure);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.popoverOverlay} onClick={onClose} />
      <div className={styles.popoverPanel} role="dialog" aria-label="Reading Preferences">
        <div className={styles.title}>Typography & Display</div>

        <div className={styles.section}>
          <span className={styles.label}>Typeface</span>
          <div className={styles.btnGroup}>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.font === 'sans' ? styles.optionBtnActive : ''}`}
              onClick={() => setPrefs(p => ({ ...p, font: 'sans' }))}
            >
              Modern Sans
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.font === 'serif' ? styles.optionBtnActive : ''}`}
              style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
              onClick={() => setPrefs(p => ({ ...p, font: 'serif' }))}
            >
              Editorial Serif
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.label}>Text Size</span>
          <div className={styles.btnGroup}>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.size === 'compact' ? styles.optionBtnActive : ''}`}
              onClick={() => setPrefs(p => ({ ...p, size: 'compact' }))}
            >
              15.5px
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.size === 'default' ? styles.optionBtnActive : ''}`}
              onClick={() => setPrefs(p => ({ ...p, size: 'default' }))}
            >
              17px
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.size === 'large' ? styles.optionBtnActive : ''}`}
              onClick={() => setPrefs(p => ({ ...p, size: 'large' }))}
            >
              19px
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.label}>Reading Measure (Width)</span>
          <div className={styles.btnGroup}>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.measure === 'comfortable' ? styles.optionBtnActive : ''}`}
              onClick={() => setPrefs(p => ({ ...p, measure: 'comfortable' }))}
            >
              Standard (68ch)
            </button>
            <button
              type="button"
              className={`${styles.optionBtn} ${prefs.measure === 'wide' ? styles.optionBtnActive : ''}`}
              onClick={() => setPrefs(p => ({ ...p, measure: 'wide' }))}
            >
              Wide (86ch)
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
