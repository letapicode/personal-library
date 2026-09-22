export interface ImportResult {
  title?: string;
  markdown: string;
  provider: string;
  messageCount: number;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/**
 * Trims AI conversational preamble before the actual Chapter/Lesson header.
 * E.g., strips "Certainly! Here is the complete lesson for you: ..." before "# Lesson 1".
 */
function trimMessagePreamble(text: string): string {
  const match = text.match(
    /(?:^|\n)(#{1,4}\s*(?:\*{1,2})?(?:(?:Lesson|Chapter|Module|Unit|Act|Part|Section|अध्याय|पाठ|खण्ड|भाग|इकाई)\s+(?:[0-9०-९]+|[IVXLCDM]+)|[0-9०-९]+[\.\-–—\s])[^\n]*)/iu
  );
  if (match && match.index !== undefined) {
    const startIdx = match.index === 0 ? 0 : match.index + 1; // skip leading newline if present
    return text.slice(startIdx).trim();
  }
  return text.trim();
}

/**
 * Imports from a public ChatGPT shared link via ChatGPT's backend share API.
 */
async function importFromChatGpt(url: string, assistantOnly = true): Promise<ImportResult> {
  const parsed = new URL(url);
  const shareMatch = parsed.pathname.match(/\/share\/([a-zA-Z0-9_-]+)/);
  if (!shareMatch) {
    throw new Error('Invalid ChatGPT share URL. Expected format: https://chatgpt.com/share/xxxx-xxxx');
  }

  const shareId = shareMatch[1];
  const apiUrl = `https://chatgpt.com/backend-api/share/${shareId}`;

  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/plain, */*',
      'Referer': url
    }
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('ChatGPT share link was not found. Please ensure the link is public and still active.');
    }
    throw new Error(`ChatGPT responded with status ${res.status}: ${res.statusText}`);
  }

  const data: any = await res.json();
  const rawTitle = data.title?.replace(/ - ChatGPT$/, '') || 'Imported Course';
  
  // Extract visible linear nodes
  let nodes: any[] = [];
  if (Array.isArray(data.linear_conversation) && data.linear_conversation.length > 0) {
    nodes = data.linear_conversation;
  } else if (data.mapping && typeof data.mapping === 'object') {
    const mapping = data.mapping;
    if (data.current_node && mapping[data.current_node]) {
      let curr = data.current_node;
      const seen = new Set<string>();
      while (curr && !seen.has(curr) && mapping[curr]) {
        seen.add(curr);
        nodes.push(mapping[curr]);
        curr = mapping[curr].parent;
      }
      nodes.reverse();
    } else {
      nodes = Object.values(mapping)
        .filter((n: any) => n?.message)
        .sort((a: any, b: any) => {
          const tA = Number(a?.message?.create_time || 0);
          const tB = Number(b?.message?.create_time || 0);
          return tA - tB;
        });
    }
  }

  const messages: string[] = [];

  for (const node of nodes) {
    const msg = node?.message;
    if (!msg) continue;

    const role = msg.author?.role;
    if (assistantOnly && role !== 'assistant') continue;
    if (msg.metadata?.is_visually_hidden_from_conversation) continue;

    const content = msg.content;
    if (!content) continue;

    // Skip reasoning, thoughts, or internal tool calls
    if (content.content_type && content.content_type !== 'text') continue;

    const parts = content.parts;
    if (!Array.isArray(parts)) continue;

    const textPieces: string[] = [];
    for (const part of parts) {
      if (typeof part === 'string') {
        textPieces.push(part);
      } else if (part && typeof part === 'object' && typeof part.text === 'string') {
        textPieces.push(part.text);
      }
    }

    const fullMessage = textPieces.join('\n').trim();
    if (fullMessage) {
      const cleanMessage = trimMessagePreamble(fullMessage);
      messages.push(cleanMessage);
    }
  }

  if (messages.length === 0) {
    throw new Error('No readable conversation content could be extracted from this ChatGPT share.');
  }

  return {
    title: rawTitle,
    markdown: messages.join('\n\n---\n\n'),
    provider: 'chatgpt',
    messageCount: messages.length
  };
}

/**
 * Imports from Claude shared links.
 */
async function importFromClaude(url: string): Promise<ImportResult> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (res.status === 403 || res.status === 503) {
      throw new Error(
        'Claude shared conversations are protected by Cloudflare bot protection. Please open your Claude link, copy the conversation text, and paste it into the "Paste Markdown" tab.'
      );
    }

    const html = await res.text();
    // Look for __NEXT_DATA__ or embedded state
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch && nextDataMatch[1]) {
      const parsed = JSON.parse(nextDataMatch[1]);
      // Extract Claude conversation if available
      const chat = parsed?.props?.pageProps?.chat;
      if (chat && Array.isArray(chat.messages)) {
        const msgs = chat.messages
          .filter((m: any) => m.sender === 'assistant')
          .map((m: any) => trimMessagePreamble(m.text || ''))
          .filter(Boolean);

        if (msgs.length > 0) {
          return {
            title: chat.name || 'Imported Claude Book',
            markdown: msgs.join('\n\n---\n\n'),
            provider: 'claude',
            messageCount: msgs.length
          };
        }
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Cloudflare')) throw err;
  }

  throw new Error(
    'Could not automatically parse the Claude share link. Please copy the conversation text and paste it into the "Paste Markdown" tab.'
  );
}

/**
 * Checks if a hostname belongs to localhost, private LAN, or cloud metadata services.
 */
function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host === '169.254.169.254' ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }
  // Private IPv4 ranges (RFC 1918 & link-local)
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  if (/^127\.\d+\.\d+\.\d+$/.test(host)) return true;
  if (/^169\.254\.\d+\.\d+$/.test(host)) return true;
  return false;
}

/**
 * Imports raw markdown or plaintext from direct file URLs (e.g. GitHub raw, Gist, web markdown).
 * Protected against SSRF, intranet scanning, and memory exhaustion.
 */
async function importFromRawUrl(url: string): Promise<ImportResult> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error('Access to local or private network addresses is forbidden');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file: HTTP ${res.status}`);
    }

    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 15 * 1024 * 1024) {
      throw new Error('Remote file exceeds maximum allowed size (15MB)');
    }

    const text = await res.text();
    if (text.length > 15 * 1024 * 1024) {
      throw new Error('Remote file exceeds maximum allowed size (15MB)');
    }

    const urlParts = parsed.pathname.split('/');
    const rawFileName = urlParts[urlParts.length - 1] || 'Imported Book';
    const cleanTitle = decodeURIComponent(rawFileName).replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

    return {
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      markdown: text,
      provider: 'raw-url',
      messageCount: 1
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Universal URL Ingestion Router
 */
export async function importUniversalUrl(rawUrl: string, assistantOnly = true): Promise<ImportResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please provide a valid URL');
  }

  const trimmed = rawUrl.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  const host = parsedUrl.hostname.toLowerCase();

  // 1. ChatGPT
  if (host === 'chatgpt.com' || host === 'chat.openai.com') {
    return await importFromChatGpt(trimmed, assistantOnly);
  }

  // 2. Claude
  if (host === 'claude.ai') {
    return await importFromClaude(trimmed);
  }

  // 3. Raw text or markdown file
  if (
    parsedUrl.pathname.endsWith('.md') ||
    parsedUrl.pathname.endsWith('.txt') ||
    parsedUrl.pathname.endsWith('.markdown') ||
    host === 'raw.githubusercontent.com' ||
    host === 'gist.githubusercontent.com'
  ) {
    return await importFromRawUrl(trimmed);
  }

  throw new Error(
    `Unsupported share link host: "${host}". Supported: ChatGPT (chatgpt.com), Claude (claude.ai), or direct raw Markdown URLs.`
  );
}
