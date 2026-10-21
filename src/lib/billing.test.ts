import { describe, expect, it } from "vitest";
import { computeBilling, type Sub } from "./billing";
import { canWrite, setReadOnly } from "./permissions";

const NOW = Date.parse("2026-10-21T10:00:00Z");
const day = (n: number) => new Date(NOW + n * 86_400_000).toISOString();
const sub = (o: Partial<Sub>): Sub => ({ farm_id: "f", plan_code: null, billing_interval: null, trial_ends_at: day(7), paid_until: null, ...o });

describe("computeBilling", () => {
  it("has no opinion until a subscription is known", () => expect(computeBilling(null, NOW).status).toBe("unknown"));
  it("is in trial for 7 days", () => { const b = computeBilling(sub({}), NOW); expect(b.status).toBe("trial"); expect(b.daysLeft).toBe(7); });
  it("counts a partly used day as a day left", () => expect(computeBilling(sub({ trial_ends_at: new Date(NOW + 3_600_000).toISOString() }), NOW).daysLeft).toBe(1));
  it("expires when the trial has passed and nothing is paid", () => expect(computeBilling(sub({ trial_ends_at: day(-1) }), NOW).status).toBe("expired"));
  it("is active while paid, even after the trial", () => { const b = computeBilling(sub({ trial_ends_at: day(-20), plan_code: "starter", paid_until: day(30) }), NOW); expect(b).toMatchObject({ status: "active", plan: "starter", daysLeft: 30 }); });
  it("expires again when the paid period ends", () => expect(computeBilling(sub({ trial_ends_at: day(-40), plan_code: "pro", paid_until: day(-1) }), NOW).status).toBe("expired"));
});

describe("read-only after the trial", () => {
  it("blocks every write but not the role rules when active", () => {
    setReadOnly(false); expect(canWrite("Owner", "finance")).toBe(true); expect(canWrite("Viewer", "finance")).toBe(false);
    setReadOnly(true); expect(canWrite("Owner", "finance")).toBe(false);
    setReadOnly(false);
  });
});
