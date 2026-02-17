/**
 * Client-Side CSRF Token Utility
 * ===============================
 * Handles CSRF token fetching and inclusion in API requests
 */

'use client';

let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token from server
 * Uses caching to avoid redundant requests
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // If a fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Fetch new token
  tokenFetchPromise = (async () => {
    try {
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      cachedToken = data.token;
      return cachedToken!;
    } catch (error) {
      console.error('CSRF token fetch failed:', error);
      throw error;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

/**
 * Clear cached CSRF token
 * Call this after logout or when token is invalidated
 */
export function clearCsrfToken(): void {
  cachedToken = null;
  tokenFetchPromise = null;
}

/**
 * Wrapper for fetch() that automatically includes CSRF token
 * Use this for all state-changing requests (POST, PUT, DELETE, PATCH)
 *
 * @example
 * ```typescript
 * const response = await fetchWithCsrf('/api/ingest', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';

  // Skip CSRF for safe methods
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return fetch(url, options);
  }

  // Get CSRF token
  const token = await getCsrfToken();

  // Add CSRF header
  const headers = new Headers(options.headers);
  headers.set('X-CSRF-Token', token);

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}

/**
 * Refresh CSRF token from server
 * Call this if you get a 403 CSRF error
 */
export async function refreshCsrfToken(): Promise<string> {
  clearCsrfToken();
  return getCsrfToken();
}
