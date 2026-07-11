import { describe, it, expect } from 'vitest';
import { sanitizeSnippet } from './sanitizeSnippet';

describe('sanitizeSnippet', () => {
  it('converts marker spans to mark.hit', () => {
    expect(sanitizeSnippet('the <span>consensus</span> problem')).toBe(
      'the <mark class="hit">consensus</mark> problem',
    );
  });

  it('handles multiple markers', () => {
    expect(sanitizeSnippet('<span>a</span> x <span>b c</span>')).toBe(
      '<mark class="hit">a</mark> x <mark class="hit">b c</mark>',
    );
  });

  it('escapes HTML outside markers', () => {
    expect(sanitizeSnippet('a <b>bold</b> & <span>hit</span>')).toBe(
      'a &lt;b&gt;bold&lt;/b&gt; &amp; <mark class="hit">hit</mark>',
    );
  });

  it('escapes HTML inside markers (no nested markup survives)', () => {
    expect(sanitizeSnippet('<span><img src=x onerror=alert(1)></span>')).toBe(
      '<mark class="hit">&lt;img src=x onerror=alert(1)&gt;</mark>',
    );
  });

  it('neutralizes script tags', () => {
    expect(sanitizeSnippet('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapes an unclosed marker span instead of trusting it', () => {
    expect(sanitizeSnippet('start <span>hit no close')).toBe(
      'start &lt;span&gt;hit no close',
    );
  });

  it('escapes quotes', () => {
    expect(sanitizeSnippet(`he said "hi" & 'bye'`)).toBe(
      'he said &quot;hi&quot; &amp; &#39;bye&#39;',
    );
  });
});
