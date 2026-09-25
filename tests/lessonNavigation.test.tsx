// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarkdownRenderer } from '../src/components/MarkdownRenderer/MarkdownRenderer';
import { LessonTableOfContents, OUTLINE_LANDING_OFFSET } from '../src/components/LessonTableOfContents/LessonTableOfContents';
import { getLessonHeadings } from '../src/utils/lessonHeadings';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('lesson outline navigation', () => {
  it('lands the named heading after repeated clicks and keeps a clamped final heading visible', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 0));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);

    const markdown = [
      '## Same *title*',
      '\nText',
      '## Same *title*',
      '\nMore text',
      '> ### गहरा [विषय](https://example.com)',
      '\nLast paragraph',
      '## Last heading'
    ].join('\n');
    const headings = getLessonHeadings(markdown);
    const host = document.createElement('div');
    document.body.append(host);
    const scroller = document.createElement('div');
    scroller.id = 'main-reader';
    host.append(scroller);
    const root = createRoot(scroller);
    await act(async () => {
      root.render(createElement('div', null,
        createElement(MarkdownRenderer, { content: markdown, headings }),
        createElement(LessonTableOfContents, { headings })));
    });

    const headingY = [240, 900, 1400, 1880];
    const elements = headings.map((heading, index) => {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      element!.getBoundingClientRect = () => ({
        top: 100 + headingY[index] - scroller.scrollTop,
        bottom: 140 + headingY[index] - scroller.scrollTop,
        left: 0, right: 500, width: 500, height: 40, x: 0,
        y: 100 + headingY[index] - scroller.scrollTop,
        toJSON: () => ({})
      });
      return element!;
    });
    scroller.getBoundingClientRect = () => ({
      top: 100, bottom: 600, left: 0, right: 500, width: 500,
      height: 500, x: 0, y: 100, toJSON: () => ({})
    });
    Object.defineProperties(scroller, {
      scrollHeight: { value: 2000, configurable: true },
      clientHeight: { value: 500, configurable: true }
    });
    const scrollTo = vi.fn(({ top }: ScrollToOptions) => {
      scroller.scrollTop = top ?? 0;
      scroller.dispatchEvent(new Event('scroll'));
    });
    scroller.scrollTo = scrollTo;
    const buttons = [...host.querySelectorAll<HTMLElement>('nav button')];

    await act(async () => buttons[1].click());
    expect(scroller.scrollTop).toBe(900 - OUTLINE_LANDING_OFFSET);
    expect(elements[1].getBoundingClientRect().top - scroller.getBoundingClientRect().top)
      .toBe(OUTLINE_LANDING_OFFSET);
    expect(document.activeElement).toBe(elements[1]);

    // A new click must replace the destination even if the old animation was mid-flight.
    scroller.scrollTop = 450;
    await act(async () => buttons[2].click());
    expect(scroller.scrollTop).toBe(1400 - OUTLINE_LANDING_OFFSET);
    expect(elements[2].getBoundingClientRect().top - scroller.getBoundingClientRect().top)
      .toBe(OUTLINE_LANDING_OFFSET);
    expect(document.activeElement).toBe(elements[2]);

    await act(async () => buttons[3].click());
    expect(scroller.scrollTop).toBe(1500);
    expect(elements[3].getBoundingClientRect().top).toBeLessThan(scroller.getBoundingClientRect().bottom);
    expect(document.activeElement).toBe(elements[3]);
    expect(scrollTo).toHaveBeenCalledTimes(3);

    await act(async () => root.unmount());
  });
});
