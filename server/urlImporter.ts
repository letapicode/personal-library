import dns from 'node:dns/promises';

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json, text/plain, */*',
        'Referer': url
      }
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request to ChatGPT share link timed out after 15 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
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
    if (err.name === 'AbortError') {
      throw new Error('Request to Claude share link timed out after 15 seconds');
    }
    if (err.message && err.message.includes('Cloudflare')) throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  throw new Error(
    'Could not automatically parse the Claude share link. Please copy the conversation text and paste it into the "Paste Markdown" tab.'
  );
}

/**
 * Validates whether an IP address belongs to loopback, private RFC 1918,
 * link-local/cloud-metadata RFC 3927, carrier-grade NAT, or IPv6 private/local ranges.
 */
export function isPrivateOrBlockedIp(ip: string): boolean {
  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  const mappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const cleanIp = mappedMatch ? mappedMatch[1] : ip;

  // IPv4 validation
  const ipv4Parts = cleanIp.split('.').map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [b0, b1] = ipv4Parts;
    // 0.0.0.0/8 (current network)
    if (b0 === 0) return true;
    // 127.0.0.0/8 (loopback)
    if (b0 === 127) return true;
    // 10.0.0.0/8 (private)
    if (b0 === 10) return true;
    // 172.16.0.0/12 (private: 172.16 - 172.31)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // 192.168.0.0/16 (private)
    if (b0 === 192 && b1 === 168) return true;
    // 169.254.0.0/16 (link-local, cloud metadata)
    if (b0 === 169 && b1 === 254) return true;
    // 100.64.0.0/10 (carrier-grade NAT: 100.64 - 100.127)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (documentation)
    if (b0 === 192 && b1 === 0 && ipv4Parts[2] === 2) return true;
    if (b0 === 198 && b1 === 51 && ipv4Parts[2] === 100) return true;
    if (b0 === 203 && b1 === 0 && ipv4Parts[2] === 113) return true;
    // 224.0.0.0/4 (multicast) & 240.0.0.0/4 (reserved)
    if (b0 >= 224) return true;
    return false;
  }

  // IPv6 validation
  const lowerIpv6 = cleanIp.toLowerCase();
  // Loopback (::1) or Unspecified (::)
  if (lowerIpv6 === '::1' || lowerIpv6 === '::' || /^0*(:0*)*:?1$/.test(lowerIpv6)) return true;
  // Link-local: fe80::/10 (fe80 to febf)
  if (/^fe[89ab][0-9a-f]:/i.test(lowerIpv6)) return true;
  // Unique local: fc00::/7 (fc00 to fdff)
  if (/^f[cd][0-9a-f]{2}:/i.test(lowerIpv6)) return true;

  return false;
}

/**
 * Checks if a hostname belongs to localhost, private LAN, or numeric/hex encoded IP formats.
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '0.0.0.0' ||
    host === '169.254.169.254' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    host.endsWith('.lan')
  ) {
    return true;
  }

  // Pure integer / dword or hex/octal encoded hostnames (e.g. 2130706433 or 0x7f000001)
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return true;

  // Check if raw hostname is already a private IP
  if (isPrivateOrBlockedIp(host)) return true;

  return false;
}

/**
 * Resolves all DNS IP records for a hostname and ensures none point to forbidden internal addresses.
 */
export async function assertSafeDnsTarget(hostname: string): Promise<void> {
  if (isBlockedHostname(hostname)) {
    throw new Error('Access to local or private network addresses is forbidden');
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const rec of records) {
      if (isPrivateOrBlockedIp(rec.address)) {
        throw new Error('Resolved IP address belongs to forbidden private or local network range');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('forbidden')) throw err;
    throw new Error(`DNS resolution failed for hostname "${hostname}": ${err.message || 'unknown error'}`);
  }
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB limit

/**
 * Imports raw markdown or plaintext from direct file URLs (e.g. GitHub raw, Gist, web markdown).
 * Protected against SSRF, DNS rebinding, redirect hijacking, and streaming memory exhaustion.
 */
async function importFromRawUrl(initialUrl: string): Promise<ImportResult> {
  let currentUrl = initialUrl;
  let redirectsRemaining = 3;

  while (true) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Only HTTP and HTTPS URLs are supported');
    }

    // Strict DNS and IP pre-flight validation
    await assertSafeDnsTarget(parsed.hostname);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const res = await fetch(currentUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
        redirect: 'manual'
      });

      // Handle redirects manually to validate destination IP against SSRF
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          throw new Error(`Redirect response HTTP ${res.status} missing location header`);
        }
        if (redirectsRemaining <= 0) {
          throw new Error('Too many HTTP redirects');
        }
        redirectsRemaining--;
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch file: HTTP ${res.status}`);
      }

      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_FILE_BYTES) {
        throw new Error('Remote file exceeds maximum allowed size (15MB)');
      }

      // Safe bounded stream reader to prevent memory exhaustion from chunked/infinite streams
      let text = '';
      if (res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let bytesReceived = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            bytesReceived += value.byteLength;
            if (bytesReceived > MAX_FILE_BYTES) {
              await reader.cancel();
              throw new Error('Remote file exceeds maximum allowed size (15MB)');
            }
            text += decoder.decode(value, { stream: true });
          }
        }
        text += decoder.decode(); // flush remaining characters
      } else {
        text = await res.text();
        if (text.length > MAX_FILE_BYTES) {
          throw new Error('Remote file exceeds maximum allowed size (15MB)');
        }
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
