/** Explicit development preview origins; never extend production trust. */
export function trustedCmsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = env.BETTER_AUTH_URL;
  if (!configured) return [];
  const origins = [new URL(configured).origin];
  if (env.NODE_ENV !== 'production') {
    for (const value of (env.CMS_PREVIEW_ORIGINS ?? '').split(',')) {
      if (!value.trim()) continue;
      const url = new URL(value.trim());
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
          !['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
          url.pathname !== '/' || url.search || url.hash) {
        throw new Error('CMS_PREVIEW_ORIGINS must contain exact loopback origins');
      }
      origins.push(url.origin);
    }
  }
  return [...new Set(origins)];
}
