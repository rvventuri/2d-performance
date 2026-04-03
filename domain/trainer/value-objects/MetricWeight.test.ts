import { describe, it, expect } from "vitest";
import { MetricWeight } from "./MetricWeight";

describe("MetricWeight", () => {
  it.each([0, 0.5, 1, 1.5, 2, 2.5, 3])("aceita peso válido: %s", (v) => {
    const w = MetricWeight.create(v);
    expect(w.value).toBe(v);
  });

  it.each([-1, -0.5, 3.5, 4, 1.2, 0.3])(
    "rejeita peso inválido: %s",
    (v) => {
      expect(() => MetricWeight.create(v)).toThrow("Peso inválido");
    }
  );

  it("isNeutral() retorna true para peso 1", () => {
    expect(MetricWeight.create(1).isNeutral()).toBe(true);
    expect(MetricWeight.create(2).isNeutral()).toBe(false);
  });

  it("isZero() retorna true para peso 0", () => {
    expect(MetricWeight.create(0).isZero()).toBe(true);
    expect(MetricWeight.create(1).isZero()).toBe(false);
  });
});
