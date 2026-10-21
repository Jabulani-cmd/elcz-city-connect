import { describe, expect, it } from "vitest";
import { CHAT_TOPICS, guideAnswer } from "./farmChat";

describe("home page assistant offline answers", () => {
  it("a sick animal is always sent to the vet", () => expect(guideAnswer("My cow is sick and not eating")).toMatch(/call your vet/i));
  it("dipping question gets the dipping answer", () => expect(guideAnswer("How often should I dip my cattle?")).toMatch(/every 7 days/));
  it("unknown questions get the fallback, not a wrong answer", () => expect(guideAnswer("Who won the football?")).toMatch(/don't have a ready answer/));
  it("every suggested question has a built-in answer", () => {
    const missing = CHAT_TOPICS.flatMap((t) => t.questions).filter((q) => /don't have a ready answer/.test(guideAnswer(q)));
    expect(missing).toEqual([]);
  });
});
