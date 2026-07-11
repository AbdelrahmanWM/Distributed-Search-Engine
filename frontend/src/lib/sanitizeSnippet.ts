const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Server snippets wrap query hits in bare `<span>...</span>` pairs; the rest is
 * untrusted crawled text. Escape everything, then re-materialize only complete
 * marker pairs as <mark class="hit">.
 */
export function sanitizeSnippet(raw: string): string {
  const parts: string[] = [];
  let i = 0;
  const OPEN = '<span>';
  const CLOSE = '</span>';
  while (i < raw.length) {
    const start = raw.indexOf(OPEN, i);
    if (start === -1) {
      parts.push(escapeHtml(raw.slice(i)));
      break;
    }
    const end = raw.indexOf(CLOSE, start + OPEN.length);
    if (end === -1) {
      parts.push(escapeHtml(raw.slice(i)));
      break;
    }
    parts.push(escapeHtml(raw.slice(i, start)));
    parts.push(`<mark class="hit">${escapeHtml(raw.slice(start + OPEN.length, end))}</mark>`);
    i = end + CLOSE.length;
  }
  return parts.join('');
}
