/**
 * HTML Sanitization for Job Descriptions
 * Uses sanitize-html for server-side HTML sanitization
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML for safe rendering in job descriptions
 * Removes scripts, event handlers, styles, and dangerous tags
 */
export function sanitizeJobDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'div', 'span',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'a',
      'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
    },
    // Ensure external links open in new tab with security
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
    // Disallow any CSS/style attributes
    allowedStyles: {},
  });
}
