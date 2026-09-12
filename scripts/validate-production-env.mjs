import { isIP } from 'node:net';

const requiredUrls = ['BACKEND_ORIGIN', 'NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_API_URL'];

/**
 * Detects hosts that resolve to the local build machine.
 *
 * @param {string} hostname - URL hostname to inspect.
 * @returns {boolean} Whether the host is loopback.
 */
function isLoopback(hostname) {
  const normalized = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname;
  return (
    normalized === 'localhost' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    (isIP(normalized) === 4 && normalized.startsWith('127.'))
  );
}

for (const name of requiredUrls) {
  const value = String(process.env[name] ?? '');
  if (!value) {
    throw new Error(`${name} is required for production builds`);
  }

  /** @type {URL} */
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use HTTP or HTTPS`);
  }
  if (isLoopback(url.hostname)) {
    throw new Error(`${name} must not use a loopback host`);
  }
  if (name === 'BACKEND_ORIGIN' && (url.pathname !== '/' || url.search || url.hash)) {
    throw new Error('BACKEND_ORIGIN must not include a path, query, or fragment');
  }
}
