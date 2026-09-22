const ALLOWED_HOSTS = new Set(['chatgpt.com', 'chat.openai.com']);
const MAX_URL_LENGTH = 1024;
const SHARE_PATH_REGEX = /^\/share\/[a-zA-Z0-9_-]{8,128}$/;

export function validateChatGptUrl(rawUrl: string): { valid: boolean; normalized?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL exceeds maximum allowable length (${MAX_URL_LENGTH} characters)` };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must use secure HTTPS protocol' };
    }

    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) {
      return { valid: false, error: 'URL hostname must be either chatgpt.com or chat.openai.com' };
    }

    // Strip trailing slash if present before testing
    const normalizedPath = parsed.pathname.replace(/\/+$/, '');
    if (!SHARE_PATH_REGEX.test(normalizedPath)) {
      return { valid: false, error: 'Path must match format: /share/<share-id>' };
    }

    const cleanUrl = `https://${host}${normalizedPath}`;
    return { valid: true, normalized: cleanUrl };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

