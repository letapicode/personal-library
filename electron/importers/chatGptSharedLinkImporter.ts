import { BrowserWindow, net } from 'electron';
import { validateChatGptUrl } from '../../src/utils/chatGptUrl';

export { validateChatGptUrl };

const MAX_HTTP_RESPONSE_BYTES = 10 * 1024 * 1024; // 10MB limit
const HEADLESS_TIMEOUT_MS = 25000; // 25s max execution

/**
 * Strategy 1: Fetch raw HTML and search for JSON data structures in scripts.
 */
async function fetchViaHttp(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const request = net.request({
      url,
      method: 'GET',
      redirect: 'error' // Do not automatically follow arbitrary redirects
    });

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        request.abort();
        reject(new Error('HTTP request timed out'));
      }
    }, 15000);

    let body = '';
    let bytesReceived = 0;

    request.on('response', (response) => {
      if (response.statusCode >= 400) {
        clearTimeout(timeout);
        resolved = true;
        reject(new Error(`HTTP request failed with status ${response.statusCode}`));
        return;
      }
      response.on('data', (chunk) => {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_HTTP_RESPONSE_BYTES) {
          clearTimeout(timeout);
          resolved = true;
          request.abort();
          reject(new Error('HTTP response exceeded maximum safe size limit (10MB)'));
          return;
        }
        body += chunk.toString('utf-8');
      });
      response.on('end', () => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          resolve(body);
        }
      });
    });

    request.on('error', (err) => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    request.end();
  });
}

function tryParseStructuredHtml(html: string, assistantOnly: boolean): { title?: string; markdown: string; messageCount: number } | null {
  try {
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch && nextDataMatch[1]) {
      const data = JSON.parse(nextDataMatch[1]);
      const serverResponse = data?.props?.pageProps?.serverResponse?.data;
      if (serverResponse) {
        const title = serverResponse.title || 'Imported ChatGPT Course';
        const linearConversation = serverResponse.linear_conversation || [];
        const messages: string[] = [];

        for (const item of linearConversation) {
          const role = item?.message?.author?.role;
          const parts = item?.message?.content?.parts;
          if (parts && Array.isArray(parts)) {
            const textContent = parts.filter(p => typeof p === 'string').join('\n\n');
            if (textContent.trim()) {
              if (!assistantOnly || role === 'assistant') {
                messages.push(textContent.trim());
              }
            }
          }
        }

        if (messages.length > 0) {
          return {
            title,
            markdown: messages.join('\n\n---\n\n'),
            messageCount: messages.length
          };
        }
      }
    }
  } catch (e) {
    // Fall through to DOM fallback
  }
  return null;
}

/**
 * Strategy 2 & 3: Headless Chromium BrowserWindow extraction
 * Executes inside Electron's sandboxed renderer without external dependencies.
 */
async function extractViaHeadlessWindow(url: string, assistantOnly: boolean): Promise<{ title?: string; markdown: string; messageCount: number }> {
  const hiddenWin = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // Strict navigation locks: prevent popups, window openings, or redirect hijacking
  hiddenWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  hiddenWin.webContents.on('will-navigate', (event, targetUrl) => {
    if (targetUrl !== url) {
      event.preventDefault();
    }
  });
  hiddenWin.webContents.on('will-redirect', (event, targetUrl) => {
    if (targetUrl !== url) {
      event.preventDefault();
    }
  });

  const extractionPromise = (async () => {
    await hiddenWin.loadURL(url, { waitUntil: 'domcontentloaded' });
    // Allow initial client-side hydration
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await hiddenWin.webContents.executeJavaScript(`
      (async () => {
        // Progressive scrolling to force DOM hydration of all virtualized messages in long threads
        const scrollStep = 900;
        let retries = 0;
        let maxScrolls = 40; // Max 40 steps (~36,000px height coverage)

        while (maxScrolls > 0) {
          maxScrolls--;
          window.scrollBy(0, scrollStep);
          await new Promise(r => setTimeout(r, 150));
          const atBottom = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 50);
          if (atBottom) {
            retries++;
            await new Promise(r => setTimeout(r, 300));
            if (retries >= 3) break;
          } else {
            retries = 0;
          }
        }

        const title = document.title?.replace(/ - ChatGPT$/, '') || 'Imported ChatGPT Course';
        // Select message content elements and de-duplicate nested matches
        const rawElements = Array.from(document.querySelectorAll('article, [data-message-author-role]'));
        const articles = rawElements.filter(el => {
          let parent = el.parentElement;
          while (parent) {
            if (rawElements.includes(parent)) {
              return false; // Nested inside another matched element, skip to avoid double text
            }
            parent = parent.parentElement;
          }
          return true;
        });
        const extracted = [];

        if (articles.length > 0) {
          for (const el of articles) {
            const role = el.getAttribute('data-message-author-role') || 
              (el.innerHTML.includes('markdown') ? 'assistant' : 'unknown');
            
            // Extract the markdown or inner text container
            const textEl = el.querySelector('.markdown') || el;
            const text = textEl.innerText.trim();
            if (text) {
              extracted.push({ role, text });
            }
          }
        } else {
          // General prose fallback
          const prose = Array.from(document.querySelectorAll('.prose, main div[class*="text-"]'));
          for (const p of prose) {
            const text = p.innerText.trim();
            if (text.length > 30) {
              extracted.push({ role: 'assistant', text });
            }
          }
        }
        return { title, extracted };
      })()
    `);

    const filtered = (result.extracted || [])
      .filter((m: any) => !assistantOnly || m.role === 'assistant' || m.role === 'unknown')
      .map((m: any) => m.text);

    if (filtered.length === 0) {
      throw new Error('The shared conversation was opened, but its content could not be automatically extracted.');
    }

    return {
      title: result.title || 'Imported Course',
      markdown: filtered.join('\n\n---\n\n'),
      messageCount: filtered.length
    };
  })();

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Extraction timed out after 25 seconds')), HEADLESS_TIMEOUT_MS);
  });

  try {
    return await Promise.race([extractionPromise, timeoutPromise]);
  } finally {
    if (!hiddenWin.isDestroyed()) {
      hiddenWin.destroy();
    }
  }
}

export async function importChatGptSharedLink(url: string, assistantOnly = true): Promise<{ title?: string; markdown: string; messageCount: number }> {
  const validation = validateChatGptUrl(url);
  if (!validation.valid || !validation.normalized) {
    throw new Error(validation.error || 'Invalid URL provided');
  }

  // Attempt static fetch extraction first (fast & lightweight)
  try {
    const rawHtml = await fetchViaHttp(validation.normalized);
    const parsed = tryParseStructuredHtml(rawHtml, assistantOnly);
    if (parsed) return parsed;
  } catch {
    // Proceed to browser rendering fallback
  }

  // Attempt isolated Chromium execution
  return await extractViaHeadlessWindow(validation.normalized, assistantOnly);
}
