import { describe, expect, it } from "vitest";
import { guide, LIVESTOCK_RULES } from "./ai";
import { VET_SYMPTOMS } from "./vet";

const check = (...selectedSymptoms: string[]) => guide({ kind: "livestock", symptoms: "", selectedSymptoms, species: "Cattle" });

describe("vet check care advice", () => {
  it("bloat means see a vet immediately", () => expect(check("Swollen left side (bloat)").care?.vetTiming).toBe("Immediately"));
  it("skin lumps mean isolate and report (notifiable)", () => {
    const c = check("Lumps on the skin").care!;
    expect(c.isolate).toBe(true);
    expect(c.notifiable).toBe(true);
    expect(c.vetTiming).toBe("Immediately");
  });
  it("sudden death means isolate and vet immediately", () => {
    const c = check("Sudden death of an animal").care!;
    expect(c.isolate).toBe(true);
    expect(c.vetTiming).toBe("Immediately");
  });
  it("lameness alone does not need isolation or an emergency vet", () => {
    const c = check("Limping / lame").care!;
    expect(c.isolate).toBe(false);
    expect(c.vetTiming).toBe("If no improvement in 24–48 hours");
  });
  it("coughing (contagious) means isolate, vet within 24 hours", () => {
    const c = check("Coughing").care!;
    expect(c.isolate).toBe(true);
    expect(c.vetTiming).toBe("Within 24 hours");
  });
  it("the most urgent finding is listed first", () => expect(check("Limping / lame", "Swollen left side (bloat)").findings[0].name).toBe("Bloat"));
  it("every symptom in the drop-down is recognised by the offline guide", () => {
    const orphans = VET_SYMPTOMS.filter((s) => !LIVESTOCK_RULES.some((r) => r.match.test(s)));
    expect(orphans).toEqual([]);
  });
});
