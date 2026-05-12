import { describe, it, expect } from "vitest";
import { METRIC_LABELS, METRIC_UNITS } from "./constants";

describe("constants", () => {
  it("labels e units cobrem as mesmas chaves", () => {
    const keys = Object.keys(METRIC_LABELS);
    expect(keys.sort()).toEqual(Object.keys(METRIC_UNITS).sort());
  });
});
