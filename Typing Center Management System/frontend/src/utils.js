/**
 * Base44 compatibility utilities
 * Minimal implementation to keep UI working
 */

export function createPageUrl(path) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}
