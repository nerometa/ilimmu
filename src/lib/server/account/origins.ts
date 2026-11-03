/** Additional loopback aliases for development only; production stays exact. */
export function developmentOrigins(baseURL: string, mode: string | undefined): string[] {
  const url = new URL(baseURL);
  if (mode !== 'development' || !['localhost', '127.0.0.1'].includes(url.hostname)) return [];
  return ['localhost', '127.0.0.1'].map((hostname) => {
    const alias = new URL(url.origin);
    alias.hostname = hostname;
    return alias.origin;
  });
}
