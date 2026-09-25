import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

export interface LessonHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
  /** Offset in the exact Markdown string passed to MarkdownRenderer. */
  sourceOffset: number;
}

const markdownParser = unified().use(remarkParse).use(remarkGfm);

export function generateHeadingId(text: string): string {
  const clean = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

  if (clean) return `cr-sec-${clean}`;

  let hash = 0;
  for (const character of text) {
    hash = ((hash << 5) - hash) + character.charCodeAt(0);
    hash |= 0;
  }
  return `cr-sec-h${Math.abs(hash).toString(36)}`;
}

/** Derive labels and DOM IDs from the same Markdown syntax tree used by the reader. */
export function getLessonHeadings(markdown: string): LessonHeading[] {
  const counts = new Map<string, number>();
  const headings: LessonHeading[] = [];
  const tree = markdownParser.parse(markdown);

  visit(tree, 'heading', node => {
    if (node.depth > 3) return;
    const text = toString(node).trim();
    if (!text || node.position?.start.offset === undefined) return;

    const baseId = generateHeadingId(text);
    const count = (counts.get(baseId) || 0) + 1;
    counts.set(baseId, count);
    headings.push({
      id: count === 1 ? baseId : `${baseId}-${count}`,
      text,
      level: node.depth as 1 | 2 | 3,
      sourceOffset: node.position.start.offset
    });
  });

  return headings;
}
