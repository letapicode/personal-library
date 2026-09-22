import React, { useState } from 'react';
import { X, Link2, Upload, FileText, Sparkles, Loader2, BookOpen } from 'lucide-react';
import type { Book } from '../../types/course';
import { parseCourseMarkdown } from '../../parser/lessonParser';
import styles from './AddBookModal.module.css';

interface AddBookModalProps {
  onClose: () => void;
  onAddBook: (newBook: Book) => void;
}

const GRADIENTS = [
  'linear-gradient(145deg, #2b1055 0%, #7597de 100%)',
  'linear-gradient(145deg, #1b0c26 0%, #3a164c 50%, #200d2b 100%)',
  'linear-gradient(145deg, #091a2e 0%, #15385e 50%, #0d2036 100%)',
  'linear-gradient(145deg, #0b2216 0%, #17482f 50%, #0c2619 100%)',
  'linear-gradient(145deg, #2a1503 0%, #542b08 50%, #2f1906 100%)',
  'linear-gradient(145deg, #29081a 0%, #5e1338 50%, #300a1e 100%)'
];

export const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAddBook }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('Software Design');
  const [tagsInput, setTagsInput] = useState('');
  const [sourceType, setSourceType] = useState<'url' | 'file' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [assistantOnly, setAssistantOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlFetch = async () => {
    if (!url.trim()) {
      setError('Please provide a share URL (ChatGPT, Claude, or raw markdown link)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let res: { title?: string; markdown?: string; error?: string; provider?: string };
      if (window.electronAPI) {
        res = await window.electronAPI.importFromSharedUrl(url, assistantOnly);
      } else {
        const response = await fetch('/api/import-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), assistantOnly })
        });
        res = await response.json();
      }

      if (res.error) {
        setError(res.error);
      } else if (res.markdown) {
        setMarkdown(res.markdown);
        if (!title && res.title) {
          setTitle(res.title);
        }
        if (!author) {
          if (res.provider === 'chatgpt') setAuthor('ChatGPT');
          else if (res.provider === 'claude') setAuthor('Claude');
          else setAuthor('ChatGPT');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import from URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Selected file exceeds maximum allowable size (15MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMarkdown(content);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.onerror = () => {
      setError('Failed to read selected file');
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Please provide a title for the book');
      return;
    }
    if (!markdown.trim()) {
      setError('Please provide markdown content or import lessons');
      return;
    }

    const parsedLessons = parseCourseMarkdown(markdown);
    if (parsedLessons.length === 0) {
      setError('No lessons could be detected in the provided content. Ensure your lessons start with "# Lesson X — Title" or "Lesson X".');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || `${parsedLessons.length} Detailed Engineering Lessons`,
      author: author.trim() || 'ChatGPT',
      description: `Course imported on ${new Date().toLocaleDateString()} with ${parsedLessons.length} lessons.`,
      category: category.trim() || 'Software Design',
      coverGradient: randomGradient,
      accentColor: '#e094b5',
      lessons: parsedLessons,
      totalLessons: parsedLessons.length,
      createdAt: new Date().toISOString().split('T')[0],
      isCustom: true,
      tags: tags.length > 0 ? tags : ['Curriculum', 'Lessons'],
      sourceUrl: url.trim() || undefined
    };

    onAddBook(newBook);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <BookOpen size={20} color="var(--accent-pink)" />
            <span>Add New Book to Library</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Book Title *</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="e.g. Distributed Systems & High-Level Architecture"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Subtitle</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Masterclass from Scratch"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Author / Source</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Alex Xu / ChatGPT"
                value={author}
                onChange={e => setAuthor(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Category</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Low-Level Design"
                value={category}
                onChange={e => setCategory(e.target.value)}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Tags (comma-separated)</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Java, SOLID, Kafka"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Course Content Source</label>
            <div className={styles.tabsBar}>
              <button
                type="button"
                className={`${styles.tabBtn} ${sourceType === 'url' ? styles.tabBtnActive : ''}`}
                onClick={() => setSourceType('url')}
              >
                <Link2 size={14} />
                <span>AI Share Link / URL</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${sourceType === 'file' ? styles.tabBtnActive : ''}`}
                onClick={() => setSourceType('file')}
              >
                <Upload size={14} />
                <span>Upload File</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${sourceType === 'text' ? styles.tabBtnActive : ''}`}
                onClick={() => setSourceType('text')}
              >
                <FileText size={14} />
                <span>Paste Markdown</span>
              </button>
            </div>
          </div>

          {sourceType === 'url' && (
            <div className={styles.tabContent}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ flex: 1 }}
                  placeholder="https://chatgpt.com/share/... or Claude, raw .md URL"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleUrlFetch}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>{isLoading ? 'Importing...' : 'Fetch'}</span>
                </button>
              </div>
              <label style={{ fontSize: 12.5, color: 'var(--secondary-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={assistantOnly}
                  onChange={e => setAssistantOnly(e.target.checked)}
                />
                Extract only Assistant (AI) course responses (ignores prompts)
              </label>
            </div>
          )}

          {sourceType === 'file' && (
            <label className={styles.dropZone}>
              <Upload size={28} color="var(--accent-pink)" />
              <div style={{ fontWeight: 650, fontSize: 14 }}>Click or drag a .md or .txt file here</div>
              <div style={{ fontSize: 12, color: 'var(--secondary-text)' }}>
                Supports standard markdown files with multiple lessons or chapters
              </div>
              <input
                type="file"
                accept=".md,.txt,.markdown"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          )}

          {sourceType === 'text' && (
            <div className={styles.tabContent}>
              <textarea
                className={styles.textarea}
                placeholder="Paste book or course markdown here (e.g. # Chapter 1 — Foundations...)"
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
              />
            </div>
          )}

          {markdown && (
            <div style={{ fontSize: 13, color: 'var(--accent-pink)', fontWeight: 600, padding: '6px 10px', background: 'rgba(224, 148, 181, 0.08)', borderRadius: 6 }}>
              ✓ Loaded {markdown.length.toLocaleString()} characters of content.
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.submitBtn} onClick={handleSubmit}>
            Create Book & Add to Library
          </button>
        </div>
      </div>
    </div>
  );
};
