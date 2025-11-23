export const sanitizeTextInput = (value: string, maxLength: number = 120): string => {
  if (!value) return '';
  const sanitized = value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized.slice(0, maxLength);
};

export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // Avoid javascript: or other executable protocols
  if (/^javascript:/i.test(trimmed) || /^data:text\/html/i.test(trimmed)) return '';

  if (!/^https?:\/\//i.test(trimmed)) return '';

  // Prefer https to avoid mixed content issues
  return trimmed.replace(/^http:\/\//i, 'https://');
};

export const isValidEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
};

export const isStrongPassword = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpper && hasLower && hasNumber;
};
