/** Symptom pick-list and media helpers for the AI vet check. */

export const VET_SYMPTOM_GROUPS: { group: string; symptoms: string[] }[] = [
  { group: "General", symptoms: ["Fever / feels hot", "Not eating (off feed)", "Dull, weak or lethargic", "Losing weight / thin", "Sudden death of an animal"] },
  { group: "Breathing", symptoms: ["Coughing", "Runny nose / nasal discharge", "Laboured or fast breathing"] },
  { group: "Stomach & dung", symptoms: ["Diarrhoea / scours", "Blood in dung", "Swollen left side (bloat)"] },
  { group: "Blood & urine", symptoms: ["Red or dark urine", "Pale gums or eyes"] },
  { group: "Skin & coat", symptoms: ["Lumps on the skin", "Heavy tick load", "Hair loss / itchy skin", "Bottle jaw (swelling under the jaw)"] },
  { group: "Mouth, feet & eyes", symptoms: ["Blisters or sores in the mouth", "Drooling / foaming at the mouth", "Limping / lame", "Swollen foot or hoof", "Eye watery, cloudy or red"] },
  { group: "Brain & nerves", symptoms: ["Circling, stumbling or head pressing", "Convulsions / fits"] },
  { group: "Birth & udder", symptoms: ["Abortion / stillbirth", "Difficult birth", "Swollen or hot udder", "Clots in milk"] },
  { group: "Poultry", symptoms: ["Twisted neck or shaking (poultry)", "Many birds dying", "Drop in egg laying", "Green diarrhoea (poultry)"] },
  { group: "Other", symptoms: ["Snake bite suspected"] },
];

export const VET_SYMPTOMS = VET_SYMPTOM_GROUPS.flatMap((g) => g.symptoms);

export const MAX_PHOTOS = 4;
export const VIDEO_FRAMES = 4;

/** Grab a few still frames from a video so the AI can look at it (AI models read pictures, not video). */
export function readVideoFrames(file: File, count = VIDEO_FRAMES, max = 768): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const fail = (msg: string) => { clearTimeout(timer); URL.revokeObjectURL(url); reject(new Error(msg)); };
    const timer = setTimeout(() => fail("That video took too long to read. Try a shorter clip or a photo."), 20000);
    video.onerror = () => fail("This video format can’t be read on this device. Try a photo instead.");
    video.onloadedmetadata = async () => {
      try {
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
        const scale = Math.min(1, max / Math.max(video.videoWidth || max, video.videoHeight || max));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round((video.videoWidth || max) * scale));
        c.height = Math.max(1, Math.round((video.videoHeight || max) * scale));
        const ctx = c.getContext("2d")!;
        const frames: string[] = [];
        for (let i = 0; i < count; i++) {
          await new Promise<void>((res) => { video.onseeked = () => res(); video.currentTime = Math.min(duration - 0.05, ((i + 0.5) / count) * duration); });
          ctx.drawImage(video, 0, 0, c.width, c.height);
          frames.push(c.toDataURL("image/jpeg", 0.8));
        }
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        resolve(frames);
      } catch {
        fail("Could not read frames from that video.");
      }
    };
    video.src = url;
  });
}
