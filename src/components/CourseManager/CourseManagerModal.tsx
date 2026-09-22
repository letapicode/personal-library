import React, { useState } from 'react';
import { X, Upload, Globe, FileText, Download } from 'lucide-react';
import type { Lesson } from '../../types/course';
import { parseCourseMarkdown, mergeLessons } from '../../parser/lessonParser';
import styles from './CourseManagerModal.module.css';

interface Props {
  currentLessons: Lesson[];
  onClose: () => void;
  onUpdateLessons: (lessons: Lesson[], replace: boolean) => void;
  onExportMarkdown: () => void;
}

export const CourseManagerModal: React.FC<Props> = ({
  currentLessons,
  onClose,
  onUpdateLessons,
  onExportMarkdown
}) => {
  const [tab, setTab] = useState<'url' | 'paste' | 'file'>('url');
  const [urlInput, setUrlInput] = useState('https://chatgpt.com/share/6aadb772-bc54-83ea-a66e-4a38aa17b59a');
  const [assistantOnly, setAssistantOnly] = useState(true);
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedLessons, setDetectedLessons] = useState<Lesson[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  const handleFetchUrl = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setDetectedLessons([]);
    try {
      let res: { title?: string; markdown?: string; error?: string };
      if (window.electronAPI) {
        res = await window.electronAPI.importFromSharedUrl(urlInput, assistantOnly);
      } else {
        const response = await fetch('/api/import-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput.trim(), assistantOnly })
        });
        res = await response.json();
      }

      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.markdown) {
        const parsed = parseCourseMarkdown(res.markdown);
        if (parsed.length === 0) {
          setErrorMsg('No formatted chapters or lessons could be detected in this conversation.');
        } else {
          setDetectedLessons(parsed);
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to import URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectRawText = () => {
    setErrorMsg(null);
    const parsed = parseCourseMarkdown(rawText);
    if (parsed.length === 0) {
      setErrorMsg('No lessons detected. Check format: e.g. "Lesson 1 — Title"');
    } else {
      setDetectedLessons(parsed);
    }
  };

  const handleOpenFile = async () => {
    setErrorMsg(null);
    if (window.electronAPI) {
      const res = await window.electronAPI.openFileDialog();
      if (!res.canceled && res.content) {
        const parsed = parseCourseMarkdown(res.content);
        setRawText(res.content);
        setDetectedLessons(parsed);
      }
    } else {
      // Browser file upload fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.txt,.markdown,text/plain';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 15 * 1024 * 1024) {
            setErrorMsg('Selected file exceeds maximum allowable size (15MB)');
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
              const parsed = parseCourseMarkdown(content);
              setRawText(content);
              setDetectedLessons(parsed);
            }
          };
          reader.onerror = () => {
            setErrorMsg('Failed to read selected file');
          };
          reader.readAsText(file);
        }
      };
      input.click();
    }
  };

  const handleApply = () => {
    if (detectedLessons.length === 0) return;
    if (importMode === 'replace') {
      onUpdateLessons(detectedLessons, true);
    } else {
      const merged = mergeLessons(currentLessons, detectedLessons, 'replace-conflicts');
      onUpdateLessons(merged, false);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Manage Course Content</div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'url' ? styles.tabActive : ''}`} onClick={() => setTab('url')}>
              <Globe size={14} style={{ display: 'inline', marginRight: 6 }} /> Shared URL
            </button>
            <button className={`${styles.tab} ${tab === 'paste' ? styles.tabActive : ''}`} onClick={() => setTab('paste')}>
              <FileText size={14} style={{ display: 'inline', marginRight: 6 }} /> Paste Markdown
            </button>
            <button className={`${styles.tab} ${tab === 'file' ? styles.tabActive : ''}`} onClick={() => setTab('file')}>
              <Upload size={14} style={{ display: 'inline', marginRight: 6 }} /> Import File
            </button>
          </div>

          {errorMsg && (
            <div className={styles.errorBanner}>
              {errorMsg}
            </div>
          )}

          {tab === 'url' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 8 }}>
                Paste a public ChatGPT shared conversation URL:
              </p>
              <input
                type="text"
                className={styles.inputField}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://chatgpt.com/share/..."
              />
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="assistantOnly"
                  checked={assistantOnly}
                  onChange={(e) => setAssistantOnly(e.target.checked)}
                />
                <label htmlFor="assistantOnly" style={{ fontSize: 13, color: 'var(--secondary-text)' }}>
                  Extract Assistant responses only (recommended)
                </label>
              </div>
              <button
                className={styles.btnSecondary}
                style={{ marginTop: 14 }}
                disabled={isLoading}
                onClick={handleFetchUrl}
              >
                {isLoading ? 'Extracting Conversation...' : 'Import Conversation'}
              </button>
            </div>
          )}

          {tab === 'paste' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 8 }}>
                Paste entire course Markdown text below:
              </p>
              <textarea
                className={styles.textareaField}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="# Lesson 1 — Foundations..."
              />
              <button className={styles.btnSecondary} style={{ marginTop: 8 }} onClick={handleInspectRawText}>
                Parse Lessons
              </button>
            </div>
          )}

          {tab === 'file' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--secondary-text)', marginBottom: 12 }}>
                Import .md or .txt file containing your complete course.
              </p>
              <button className={styles.btnSecondary} onClick={handleOpenFile}>
                Choose File...
              </button>
            </div>
          )}

          {detectedLessons.length > 0 && (
            <div className={styles.previewSection}>
              <div className={styles.previewTitle}>
                Detected {detectedLessons.length} Lesson{detectedLessons.length > 1 ? 's' : ''}
              </div>
              <div className={styles.previewList}>
                {detectedLessons.map((l) => (
                  <div key={l.number} style={{ padding: '3px 0' }}>
                    Lesson {l.number} — {l.title}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 16 }}>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                  />
                  Replace Entire Course
                </label>
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                  />
                  Append / Update Existing
                </label>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onExportMarkdown} title="Export course to Markdown">
            <Download size={14} style={{ display: 'inline', marginRight: 4 }} /> Export
          </button>
          <button className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.btnPrimary}
            disabled={detectedLessons.length === 0}
            onClick={handleApply}
          >
            Confirm Import
          </button>
        </div>
      </div>
    </div>
  );
};
