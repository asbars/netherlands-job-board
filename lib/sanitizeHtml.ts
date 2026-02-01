/**
 * HTML Sanitization for Job Descriptions
 * Uses isomorphic-dompurify for server-side HTML sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

// Safe HTML tags allowed in job descriptions
const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'a',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr',
];

// Safe attributes allowed (only for links)
const ALLOWED_ATTR = [
  'href', 'target', 'rel',
];

/**
 * Sanitize HTML for safe rendering in job descriptions
 * Removes scripts, event handlers, styles, and dangerous tags
 */
export function sanitizeJobDescription(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Ensure external links open in new tab with security
    ADD_ATTR: ['target', 'rel'],
    // Explicitly forbid dangerous tags
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    // Explicitly forbid event handlers and inline styles
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'style'],
  });
}
