import { describe, it, expect } from "vitest";
import { BenchmarkValues } from "./BenchmarkValues";

describe("BenchmarkValues — higherIsBetter", () => {
  it("aceita rec < trained < elite", () => {
    const b = BenchmarkValues.create({
      recreational: 30,
      trained: 42,
      elite: 60,
      higherIsBetter: true,
    });
    expect(b.recreational).toBe(30);
    expect(b.trained).toBe(42);
    expect(b.elite).toBe(60);
  });

  it("rejeita rec >= trained", () => {
    expect(() =>
      BenchmarkValues.create({ recreational: 42, trained: 42, elite: 60, higherIsBetter: true })
    ).toThrow("recreativo");
  });

  it("rejeita trained >= elite", () => {
    expect(() =>
      BenchmarkValues.create({ recreational: 30, trained: 60, elite: 60, higherIsBetter: true })
    ).toThrow("treinado");
  });
});

describe("BenchmarkValues — lowerIsBetter", () => {
  it("aceita rec > trained > elite", () => {
    const b = BenchmarkValues.create({
      recreational: 300,
      trained: 230,
      elite: 170,
      higherIsBetter: false,
    });
    expect(b.recreational).toBe(300);
    expect(b.trained).toBe(230);
    expect(b.elite).toBe(170);
  });

  it("rejeita rec <= trained (menor=melhor)", () => {
    expect(() =>
      BenchmarkValues.create({ recreational: 230, trained: 230, elite: 170, higherIsBetter: false })
    ).toThrow("recreativo");
  });

  it("rejeita trained <= elite (menor=melhor)", () => {
    expect(() =>
      BenchmarkValues.create({ recreational: 300, trained: 170, elite: 170, higherIsBetter: false })
    ).toThrow("treinado");
  });
});
