import { describe, it, expect } from "vitest";
import { compareAssessmentChronological, sortAssessmentsChronologically } from "./assessment-sort";

describe("compareAssessmentChronological", () => {
  it("ordena por date depois created_at", () => {
    const a = { date: "2025-01-02", created_at: "t2" };
    const b = { date: "2025-01-01", created_at: "t1" };
    expect(compareAssessmentChronological(a, b)).toBeGreaterThan(0);
    expect(compareAssessmentChronological(b, a)).toBeLessThan(0);
  });

  it("empata por created_at quando date igual", () => {
    const a = { date: "2025-01-01", created_at: "b" };
    const b = { date: "2025-01-01", created_at: "a" };
    expect(compareAssessmentChronological(a, b)).toBeGreaterThan(0);
  });
});

describe("sortAssessmentsChronologically", () => {
  it("não muta array original", () => {
    const rows = [
      { date: "2025-01-02", created_at: "x", id: 1 },
      { date: "2025-01-01", created_at: "y", id: 2 },
    ];
    const sorted = sortAssessmentsChronologically(rows);
    expect(sorted[0].id).toBe(2);
    expect(rows[0].id).toBe(1);
  });
});
