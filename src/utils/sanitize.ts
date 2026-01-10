/**
 * Security utilities to prevent XSS and HTML injection attacks
 */

// HTML entities that need to be escaped
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Sanitize a string to prevent XSS attacks by escaping HTML entities
 * Use this for any user-provided text that will be rendered in the DOM
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return String(text).replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
};

/**
 * Sanitize an object's string properties recursively
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeText(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  // Remove any HTML tags and trim
  const cleaned = email.replace(/<[^>]*>/g, '').trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : '';
};

/**
 * Validate and sanitize phone number
 */
export const sanitizePhone = (phone: string): string => {
  // Remove any non-digit characters except + for country code
  return phone.replace(/[^\d+\-\s()]/g, '').trim();
};

/**
 * Validate URL to ensure it's safe
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize URL - returns empty string if invalid
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  return isValidUrl(trimmed) ? trimmed : '';
};

/**
 * Strip HTML tags from a string
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Validate candidate ID format
 */
export const isValidCandidateId = (id: string): boolean => {
  // Expected format: FIC followed by 5 digits
  return /^FIC\d{5}$/.test(id);
};
