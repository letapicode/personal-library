import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { MediaPlayer } from '../MediaPlayer/MediaPlayer';
import { generateHeadingId } from '../LessonTableOfContents/LessonTableOfContents';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
}

function isSafeLinkUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('mailto:')) {
    return true;
  }
  return false;
}

function isSafeMediaUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

function isSafeImageUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('https://') || lower.startsWith('http://')) return true;
  // Safe image data URIs only (no HTML, scripts, or executables)
  if (/^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return true;
  }
  return false;
}

function extractNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (!node) return '';
  if (Array.isArray(node)) {
    return node.map(extractNodeText).join('');
  }
  if (React.isValidElement(node) && node.props && 'children' in (node.props as Record<string, unknown>)) {
    return extractNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className={styles.markdownContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const rawString = String(children).replace(/\n$/, '');

            if (match) {
              return <CodeBlock language={match[1]} code={rawString} />;
            }

            // Multiline code without language tag vs inline code
            if (rawString.includes('\n')) {
              return <CodeBlock language="text" code={rawString} />;
            }

            return (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            );
          },
          blockquote({ children }) {
            return <blockquote className={styles.blockquote}>{children}</blockquote>;
          },
          table({ children }) {
            return (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className={styles.tableHeaderCell}>{children}</th>;
          },
          td({ children }) {
            return <td className={styles.tableCell}>{children}</td>;
          },
          h1({ children }) {
            const text = extractNodeText(children).trim();
            const id = text ? generateHeadingId(text) : undefined;
            return (
              <h1 id={id} className={styles.h1}>
                {children}
              </h1>
            );
          },
          h2({ children }) {
            const text = extractNodeText(children).trim();
            const id = text ? generateHeadingId(text) : undefined;
            return (
              <h2 id={id} className={styles.h2}>
                {children}
              </h2>
            );
          },
          h3({ children }) {
            const text = extractNodeText(children).trim();
            const id = text ? generateHeadingId(text) : undefined;
            return (
              <h3 id={id} className={styles.h3}>
                {children}
              </h3>
            );
          },
          p({ children }) {
            return <p className={styles.paragraph}>{children}</p>;
          },
          ul({ children }) {
            return <ul className={styles.unorderedList}>{children}</ul>;
          },
          ol({ children }) {
            return <ol className={styles.orderedList}>{children}</ol>;
          },
          li({ children }) {
            return <li className={styles.listItem}>{children}</li>;
          },
          a({ href, children }) {
            const isSafe = isSafeLinkUrl(href);
            if (!isSafe) {
              return <span className={styles.link}>{children}</span>;
            }
            const isInternal = href?.startsWith('#');
            return (
              <a
                href={href}
                target={isInternal ? undefined : '_blank'}
                rel={isInternal ? undefined : 'noopener noreferrer'}
                className={styles.link}
              >
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            if (!src) return null;

            const isMedia = isSafeMediaUrl(src);
            const isVideo =
              isMedia &&
              (/\.(mp4|webm|ogv)(\?.*)?$/i.test(src) ||
                src.includes('youtube.com') ||
                src.includes('youtu.be') ||
                src.includes('vimeo.com'));
            const isAudio = isMedia && /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(src);

            if (isVideo) {
              return <MediaPlayer type="video" src={src} title={alt || 'Lesson Video'} />;
            }
            if (isAudio) {
              return <MediaPlayer type="audio" src={src} title={alt || 'Audio Lecture'} />;
            }

            if (!isSafeImageUrl(src)) {
              return null;
            }

            return (
              <img
                src={src}
                alt={alt || ''}
                referrerPolicy="no-referrer"
                loading="lazy"
                className={styles.image}
              />
            );
          },
          hr() {
            return <hr className={styles.divider} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
