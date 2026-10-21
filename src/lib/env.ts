/** Editor previews (embedded frames, Lovable preview hosts) must not run the offline cache:
 *  it serves stale pages there, and the app can't be installed from inside a frame anyway. */
export const isPreviewEnvironment = (host: string = location.hostname, embedded: boolean = window.self !== window.top) =>
  embedded ||
  /^(id-)?preview--/.test(host) ||
  /(^|\.)lovableproject(-dev)?\.com$/.test(host) ||
  /(^|\.)beta\.lovable\.dev$/.test(host);
