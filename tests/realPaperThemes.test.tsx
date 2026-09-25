// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeBlock } from '../src/components/CodeBlock/CodeBlock';
import { ThemePicker } from '../src/components/ThemePicker/ThemePicker';
import { isReaderTheme, READER_THEMES } from '../src/utils/readerThemes';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => document.body.replaceChildren());

describe('real paper themes', () => {
  it('offers both new themes in the picker and recognizes persisted values', async () => {
    expect(READER_THEMES.map(option => option.value)).toEqual([
      'dark', 'light', 'paper', 'real-paper-generated', 'real-paper-image'
    ]);
    expect(isReaderTheme('real-paper-generated')).toBe(true);
    expect(isReaderTheme('real-paper-image')).toBe(true);
    expect(isReaderTheme('missing')).toBe(false);

    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const onChange = vi.fn();
    await act(async () => root.render(createElement(ThemePicker, { theme: 'dark', onChange })));
    await act(async () => host.querySelector<HTMLButtonElement>('button[aria-haspopup="true"]')!.click());
    expect([...host.querySelectorAll('[role="group"] button')].map(button => button.textContent)).toEqual([
      'Dark', 'Light', 'Paper', 'Coded Paper', 'Image Paper'
    ]);
    await act(async () => {
      [...host.querySelectorAll<HTMLButtonElement>('[role="group"] button')]
        .find(button => button.textContent === 'Image Paper')!.click();
    });
    expect(onChange).toHaveBeenCalledWith('real-paper-image');
    await act(async () => root.unmount());
  });

  it('keeps code as selectable text and colors identifiers and numeric literals as tokens', () => {
    const code = 'public class BinarySearch { int left = 0; // 9 < 10\n String text = "<tag>"; }';
    const html = renderToStaticMarkup(createElement(CodeBlock, { language: 'java', code }));
    const host = document.createElement('div');
    host.innerHTML = html;
    expect(host.querySelector('code')?.textContent).toBe(code);
    expect(host.querySelector('.syn-paper-ident')?.textContent).toBe('BinarySearch');
    expect(host.querySelector('.syn-literal-number')?.textContent).toBe('0');
    expect(host.querySelector('.syn-com')?.textContent).toBe('// 9 < 10');
    expect(host.querySelector('.syn-str')?.textContent).toBe('"<tag>"');
  });
});
