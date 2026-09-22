import { describe, it, expect } from 'vitest';
import { validateChatGptUrl } from '../src/utils/chatGptUrl';

describe('ChatGPT Shared URL Validation', () => {
  it('accepts valid ChatGPT shared links', () => {
    const url = 'https://chatgpt.com/share/6aadb772-bc54-83ea-a66e-4a38aa17b59a';
    const result = validateChatGptUrl(url);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe(url);
  });

  it('rejects HTTP links', () => {
    const url = 'http://chatgpt.com/share/6aadb772-bc54-83ea-a66e-4a38aa17b59a';
    const result = validateChatGptUrl(url);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('HTTPS');
  });

  it('rejects spoofed domains', () => {
    const url = 'https://malicious-chatgpt.com/share/test';
    const result = validateChatGptUrl(url);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('hostname');
  });

  it('rejects non-share paths', () => {
    const url = 'https://chatgpt.com/c/some-private-chat';
    const result = validateChatGptUrl(url);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('/share/');
  });
});
