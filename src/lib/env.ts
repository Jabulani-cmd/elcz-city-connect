/** Editor previews (embedded frames, *.lovableproject.com, id-preview--*.lovable.app) must not run the offline cache:
 *  it serves stale pages there, and the app can't be installed from inside a frame anyway. */
export const isPreviewEnvironment = (host: string = location.hostname, embedded: boolean = window.self !== window.top) =>
  embedded || /(^|\.)lovableproject\.com$/.test(host) || /^id-preview--.*\.lovable\.app$/.test(host);
