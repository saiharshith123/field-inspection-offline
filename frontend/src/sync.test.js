import { describe, it, expect } from "vitest";

describe("retry backoff policy", () => {
  it("caps retry delay at 30 seconds", () => {
    const delayFor = (attempts) => Math.min(30000, 1000 * (2 ** Math.min(attempts, 5)));
    expect(delayFor(1)).toBe(2000);
    expect(delayFor(3)).toBe(8000);
    expect(delayFor(5)).toBe(30000);
    expect(delayFor(12)).toBe(30000);
  });
});
