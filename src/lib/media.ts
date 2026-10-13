/**
 * Farming photos and short background clips for the home page.
 *
 * Files live in /public/media (deliberately outside the service-worker precache, so they never bloat the offline
 * cache). Every slot is optional: when a slot is empty, or the file can't load (offline, slow data), the screen
 * shows the built-in illustrated scene instead. Only add media that is licensed for free commercial use
 * (Unsplash/Pexels licence, CC0 or CC BY with the credit below) and keep photos under ~120 KB, clips under ~1.5 MB.
 */
export type Photo = {
  /** e.g. "/media/hero.jpg" */
  src: string;
  /** optional smaller version for phones, e.g. "/media/hero-640.jpg 640w, /media/hero.jpg 1280w" */
  srcSet?: string;
  alt: string;
  /** photographer / source, shown in the credits list */
  credit: string;
  license: string;
  sourceUrl: string;
};

export type Clip = {
  /** MP4 (H.264) under ~1.5 MB; a WebM sibling is optional */
  mp4: string;
  webm?: string;
  poster: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

export type LandingMedia = {
  heroClip?: Clip;
  hero?: Photo;
  livestock?: Photo;
  crops?: Photo;
  community?: Photo;
};

export const LANDING_MEDIA: LandingMedia = {};

export const mediaCredits = (): Array<Photo | Clip> =>
  Object.values(LANDING_MEDIA).filter((m): m is Photo | Clip => !!m);
