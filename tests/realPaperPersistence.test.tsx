// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserPreferences } from '../src/types/course';
import { useCourseStore } from '../src/hooks/useCourseStore';

const saved = vi.hoisted(() => ({ value: null as UserPreferences | null }));

vi.mock('../src/storage/libraryStorage', () => ({
  loadLibraryManifest: vi.fn(async () => []),
  loadPreferencesFromStorage: vi.fn(async () => saved.value),
  savePreferencesToStorage: vi.fn(async (preferences: UserPreferences) => {
    saved.value = preferences;
  })
}));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.replaceChildren();
  saved.value = null;
});

function ThemeHarness() {
  const { theme, isLoaded, changeTheme } = useCourseStore();
  return createElement('button', {
    onClick: () => changeTheme('real-paper-image')
  }, isLoaded ? theme : 'loading');
}

describe('saved real paper appearance', () => {
  it('loads a generated theme, saves an image theme, and restores it after remount', async () => {
    saved.value = {
      activeBookId: null,
      lastLessonId: null,
      scrollPositions: {},
      sidebarCollapsed: false,
      theme: 'real-paper-generated'
    };

    const host = document.createElement('div');
    document.body.append(host);
    const firstRoot = createRoot(host);
    await act(async () => firstRoot.render(createElement(ThemeHarness)));
    expect(host.textContent).toBe('real-paper-generated');

    await act(async () => host.querySelector('button')!.click());
    expect(saved.value?.theme).toBe('real-paper-image');
    await act(async () => firstRoot.unmount());

    const secondRoot = createRoot(host);
    await act(async () => secondRoot.render(createElement(ThemeHarness)));
    expect(host.textContent).toBe('real-paper-image');
    await act(async () => secondRoot.unmount());
  });
});
