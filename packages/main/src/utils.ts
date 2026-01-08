import { pathToFileURL } from 'url';

/**
 * Normalizes a path or URL and appends query parameters.
 * Works for both dev (http) and prod (file) environments.
 */
export const formatAppUrl = (
  base: { path: string } | URL,
  params: Record<string, string>
): string => {
  let urlObj: URL;

  if (base instanceof URL) {
    // If it's already a URL (Dev Mode), just clone it
    urlObj = new URL(base.href);
  } else {
    // If it's a string (Prod Mode), convert path to file:// URL
    // pathToFileURL handles the triple slashes and encoding for Linux/Debian
    urlObj = pathToFileURL(base.path);
  }

  // Append parameters safely
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return urlObj.href;
};
