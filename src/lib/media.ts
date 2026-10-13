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



export type Slide = Photo & { caption: string };

const COMMONS = "https://commons.wikimedia.org/wiki/File:";

/** Carousel of real farming in Zimbabwe, shown below the stats strip. Files live in /public/media. */
export const FARMING_SLIDES: Slide[] = [
  { src: "/media/maize-field.webp", alt: "Farmers tending young maize plants in a field in Zimbabwe", caption: "Feeding young maize, Zimbabwe", credit: "SuSanA Secretariat", license: "CC BY 2.0", sourceUrl: `${COMMONS}Applying_urine_to_the_maize_plants_using_small_dispensers_(5568155364).jpg` },
  { src: "/media/bull.webp", alt: "A bull walking along a red dirt farm road", caption: "Cattle on the farm road", credit: "Shark2025", license: "CC BY-SA 4.0", sourceUrl: `${COMMONS}Cattle_or_bhuru.jpg` },
  { src: "/media/bananas.webp", alt: "Farmers loading harvested bananas onto a truck in Zimbabwe", caption: "Banana harvest going to market", credit: "USAID in Africa", license: "Public domain", sourceUrl: `${COMMONS}Banana_farmers,_Zimbabwe_(39695820082).jpg` },
  { src: "/media/irrigation.webp", alt: "Centre-pivot irrigation over a green field", caption: "Centre-pivot irrigation", credit: "Nicholastapiwa", license: "CC BY-SA 4.0", sourceUrl: `${COMMONS}Farm_irrigation_system.jpg` },
  { src: "/media/dairy-cattle.webp", alt: "A farm worker spraying dairy cattle in a pen", caption: "Spraying dairy cattle against ticks", credit: "Nicholastapiwa", license: "CC BY-SA 4.0", sourceUrl: `${COMMONS}Dairy_Cattle_fumigation.jpg` },
  { src: "/media/maize-chopper.webp", alt: "A maize chopping machine on a farm", caption: "Chopping maize for silage", credit: "Sisnoe", license: "CC BY-SA 4.0", sourceUrl: `${COMMONS}Maize_harvest_machine.jpg` },
];

export const mediaCredits = (): Array<Photo | Clip> =>
  [...Object.values(LANDING_MEDIA).filter((m): m is Photo | Clip => !!m), ...FARMING_SLIDES];

/** Owner-provided photos crossfading behind the hero section. Not listed in the footer credits. */
export const HERO_BG_SLIDES: Photo[] = [
  { src: "/media/hero-tobacco-field.webp", alt: "", credit: "Farm owner", license: "Owner-provided photo", sourceUrl: "" },
  { src: "/media/hero-cattle-bull.webp", alt: "", credit: "Shark2025", license: "CC BY-SA 4.0", sourceUrl: `${COMMONS}Cattle_or_bhuru.jpg` },
  { src: "/media/hero-cattle-dip-tank.webp", alt: "", credit: "Nicholastapiwa", license: "CC BY-SA 4.0", sourceUrl: `${COMMONS}Dairy_Cattle_fumigation.jpg` },
  { src: "/media/hero-poultry-farmer.webp", alt: "", credit: "Farm owner", license: "Owner-provided photo", sourceUrl: "" },
];
