/** Public links use the configured app origin. Catalog has no legacy host. */
export function canonicalPublicOrigin(appBaseUrl: string) {
  return appBaseUrl.replace(/\/$/, "");
}

export function legacyMcpUrl(_appBaseUrl: string): string | null {
  return null;
}
