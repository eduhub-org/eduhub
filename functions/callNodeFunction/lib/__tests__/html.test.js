import { describe, expect, it } from '@jest/globals';
import { escapeHtml } from '../html.js';
import { escapeHtml as escapeTemplateValue } from '../emailTemplateVariables.js';

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;'
    );
  });

  it('stringifies non-string values before escaping', () => {
    expect(escapeHtml(['<b>'])).toBe('&lt;b&gt;');
    expect(escapeHtml(5)).toBe('5');
  });
});

describe('email template escapeHtml', () => {
  it('renders empty values as nothing', () => {
    expect(escapeTemplateValue(null)).toBe('');
    expect(escapeTemplateValue(undefined)).toBe('');
    expect(escapeTemplateValue('')).toBe('');
  });

  it('escapes non-string values too', () => {
    expect(escapeTemplateValue(['<b>'])).toBe('&lt;b&gt;');
  });
});
