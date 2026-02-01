/**
 * HTML Sanitization for Job Descriptions
 * Uses sanitize-html for server-side HTML sanitization
 */

import sanitizeHtml from 'sanitize-html';
import { decode } from 'he';

/**
 * Sanitize HTML for safe rendering in job descriptions
 * Removes scripts, event handlers, styles, and dangerous tags
 * Decodes HTML entities if the HTML is escaped
 */
export function sanitizeJobDescription(html: string): string {
  // First decode HTML entities (in case HTML is escaped like &lt;p&gt;)
  const decodedHtml = decode(html);

  return sanitizeHtml(decodedHtml, {
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
