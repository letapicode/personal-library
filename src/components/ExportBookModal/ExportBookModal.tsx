import React, { useState } from 'react';
import { X, Download, FileText, Code2, Check, BookOpen } from 'lucide-react';
import type { Book } from '../../types/course';
import {
  generateBookMarkdown,
  generateBookJson,
  getSafeFilename,
  downloadFile
} from '../../utils/bookExporter';
import styles from './ExportBookModal.module.css';

interface ExportBookModalProps {
  book: Book;
  onClose: () => void;
}

export const ExportBookModal: React.FC<ExportBookModalProps> = ({ book, onClose }) => {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [includeToc, setIncludeToc] = useState(true);
  const [includeMeta, setIncludeMeta] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  const totalLessons = book.lessons?.length || book.totalLessons || 0;
  const currentFilename = getSafeFilename(book.title, format === 'markdown' ? 'md' : 'json');

  const handleDownload = async () => {
    try {
      if (format === 'markdown') {
        const content = generateBookMarkdown(book, { includeToc, includeMeta });
        await downloadFile(currentFilename, content, 'text/markdown;charset=utf-8');
      } else {
        const content = generateBookJson(book);
        await downloadFile(currentFilename, content, 'application/json;charset=utf-8');
      }
      setDownloaded(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to export book:', err);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <Download size={20} color="var(--accent-pink)" />
            <span>Export Book</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.bookBanner}>
            <div className={styles.bookBannerTitle}>{book.title}</div>
            <div className={styles.bookBannerMeta}>
              <span>By {book.author || 'Author'}</span>
              <span>•</span>
              <span>{totalLessons} {totalLessons === 1 ? 'Chapter' : 'Chapters'}</span>
              <span>•</span>
              <span>{book.category}</span>
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.optionsTitle}>Choose Export Format</label>
            <div className={styles.formatSelector}>
              <button
                type="button"
                className={`${styles.formatCard} ${format === 'markdown' ? styles.formatCardActive : ''}`}
                onClick={() => setFormat('markdown')}
              >
                <div className={styles.formatHeader}>
                  <FileText size={16} color="var(--accent-pink)" />
                  <span>Markdown (.md)</span>
                </div>
                <div className={styles.formatDesc}>
                  Single consolidated document. Ideal for Obsidian, Notion, Kokoro TTS, printing, or LLM feeding.
                </div>
              </button>

              <button
                type="button"
                className={`${styles.formatCard} ${format === 'json' ? styles.formatCardActive : ''}`}
                onClick={() => setFormat('json')}
              >
                <div className={styles.formatHeader}>
                  <Code2 size={16} color="var(--accent-lavender)" />
                  <span>Course Data (.json)</span>
                </div>
                <div className={styles.formatDesc}>
                  Raw structured manifest + lessons. Ideal for developers, backups, or script pipelines.
                </div>
              </button>
            </div>
          </div>

          {format === 'markdown' && (
            <div className={styles.optionsSection}>
              <div className={styles.optionsTitle}>Markdown Options</div>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={includeToc}
                  onChange={e => setIncludeToc(e.target.checked)}
                />
                <span>Generate Table of Contents with section anchors</span>
              </label>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={includeMeta}
                  onChange={e => setIncludeMeta(e.target.checked)}
                />
                <span>Include Book Title & Metadata Header</span>
              </label>
            </div>
          )}

          <div className={styles.filenameRow}>
            <span>File to download:</span>
            <span className={styles.filenameBadge}>{currentFilename}</span>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={handleDownload}
            disabled={downloaded}
          >
            {downloaded ? <Check size={16} /> : <Download size={16} />}
            <span>{downloaded ? 'Downloaded!' : `Download .${format === 'markdown' ? 'md' : 'json'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
