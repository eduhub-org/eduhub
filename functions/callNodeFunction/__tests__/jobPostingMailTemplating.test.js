import {
  applyConditionalBlocks,
  escapeHtml,
  replaceJobPostingVariables,
} from '../publishJobPosting/index.js';

describe('applyConditionalBlocks', () => {
  it('keeps the body and strips the markers when the flag is set', () => {
    expect(applyConditionalBlocks('a[#if:Invoice]b[/if:Invoice]c', { Invoice: true })).toBe('abc');
  });

  it('drops the whole section when the flag is falsy', () => {
    expect(applyConditionalBlocks('a[#if:Invoice]b[/if:Invoice]c', { Invoice: false })).toBe('ac');
    expect(applyConditionalBlocks('a[#if:Invoice]b[/if:Invoice]c', {})).toBe('ac');
  });

  it('resolves a nested block, which a single replace pass cannot', () => {
    const template = 'x[#if:Invoice]A[#if:InvoiceLink]L[/if:InvoiceLink]B[/if:Invoice]y';
    expect(applyConditionalBlocks(template, { Invoice: true, InvoiceLink: true })).toBe('xALBy');
    expect(applyConditionalBlocks(template, { Invoice: true, InvoiceLink: false })).toBe('xABy');
    expect(applyConditionalBlocks(template, { Invoice: false, InvoiceLink: true })).toBe('xy');
  });

  it('leaves an unclosed marker untouched rather than eating the rest of the mail', () => {
    expect(applyConditionalBlocks('a[#if:Invoice]b', { Invoice: true })).toBe('a[#if:Invoice]b');
  });

  it('handles empty and missing input', () => {
    expect(applyConditionalBlocks('', {})).toBe('');
    expect(applyConditionalBlocks(undefined, {})).toBe('');
  });
});

describe('escapeHtml', () => {
  it('neutralises markup in employer-controlled values', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands first so entities are not double-broken', () => {
    expect(escapeHtml('A & B < C')).toBe('A &amp; B &lt; C');
  });
});

describe('replaceJobPostingVariables', () => {
  const vars = { '[JobPosting:Title]': 'Werkstudent <IT> & Co' };

  it('escapes substituted values in HTML bodies', () => {
    expect(replaceJobPostingVariables('<p>[JobPosting:Title]</p>', vars)).toBe(
      '<p>Werkstudent &lt;IT&gt; &amp; Co</p>'
    );
  });

  it('does not escape in subjects, which are plain text', () => {
    expect(replaceJobPostingVariables('[JobPosting:Title]', vars, { html: false })).toBe(
      'Werkstudent <IT> & Co'
    );
  });

  it('substitutes an empty string for null values', () => {
    expect(replaceJobPostingVariables('x[Invoice:Number]y', { '[Invoice:Number]': null })).toBe('xy');
  });
});
