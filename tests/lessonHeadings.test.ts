import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MarkdownRenderer } from '../src/components/MarkdownRenderer/MarkdownRenderer';
import { LessonTableOfContents } from '../src/components/LessonTableOfContents/LessonTableOfContents';
import { getLessonHeadings } from '../src/utils/lessonHeadings';

describe('lesson outline headings', () => {
  it('uses exactly the IDs rendered for formatted, duplicate, nested, and setext headings', () => {
    const markdown = [
      '# **Hello** &amp; [World](https://example.com)',
      '',
      '## Repeat',
      '## Repeat',
      '',
      '> ### Nested *heading*',
      '',
      '~~~md',
      '## Fake heading',
      '~~~',
      '',
      'Setext heading',
      '--------------'
    ].join('\n');

    const headings = getLessonHeadings(markdown);
    const html = renderToStaticMarkup(createElement(MarkdownRenderer, { content: markdown, headings }));
    const outlineHtml = renderToStaticMarkup(createElement(LessonTableOfContents, { headings }));
    const renderedIds = [...html.matchAll(/<h[123] id="([^"]+)"/g)].map(match => match[1]);

    expect(headings.map(heading => heading.text)).toEqual([
      'Hello & World', 'Repeat', 'Repeat', 'Nested heading', 'Setext heading'
    ]);
    expect(headings[2].id).toBe(`${headings[1].id}-2`);
    expect(renderedIds).toEqual(headings.map(heading => heading.id));
    expect((outlineHtml.match(/<button/g) || []).length).toBe(headings.length);
  });

  it('preserves non-Latin headings and excludes fenced code', () => {
    const markdown = '## अध्याय २ — परिचय\n\n```\n### hidden\n```\n';
    expect(getLessonHeadings(markdown)).toEqual([
      { id: 'cr-sec-अध्याय-२-परिचय', text: 'अध्याय २ — परिचय', level: 2, sourceOffset: 0 }
    ]);
  });
});
