import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { openDefaultBrowser } from '../scripts/browser-launcher.mjs';

describe('Windows browser handoff', () => {
  it('uses the default URL handler and waits for dispatch before completing', async () => {
    const opener = new EventEmitter();
    const spawnProcess = vi.fn(() => opener);
    const result = openDefaultBrowser('http://127.0.0.1:3000', spawnProcess);

    expect(spawnProcess).toHaveBeenCalledWith(
      'rundll32.exe',
      ['url.dll,FileProtocolHandler', 'http://127.0.0.1:3000'],
      { stdio: 'inherit', windowsHide: false }
    );
    let completed = false;
    result.then(() => { completed = true; });
    await Promise.resolve();
    expect(completed).toBe(false);

    opener.emit('exit', 0);
    expect(await result).toBe(true);
  });
});
