// @ts-check
const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes the five HTML-significant characters. Any value is stringified
 * first, so nothing reaches markup unescaped.
 * @param {unknown} value
 * @returns {string}
 */
export const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
