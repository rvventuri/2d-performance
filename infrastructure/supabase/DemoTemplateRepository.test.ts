import { describe, it, expect, vi } from "vitest";
import { SupabaseDemoTemplateRepository } from "./DemoTemplateRepository";

describe("SupabaseDemoTemplateRepository", () => {
  it("cloneDemoFromTemplateUser rejeita mesmo usuário", async () => {
    const admin = { from: vi.fn() };
    const repo = new SupabaseDemoTemplateRepository(admin as never);
    await expect(repo.cloneDemoFromTemplateUser("x", "x")).rejects.toThrow("mesmo");
  });

  it("cloneDemoFromTemplateUser rejeita seed sem alunos", async () => {
    const admin = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseDemoTemplateRepository(admin as never);
    await expect(repo.cloneDemoFromTemplateUser("t", "seed")).rejects.toThrow("sem alunos");
  });

  it("cloneDemoFromTemplateUser clona um aluno sem avaliações", async () => {
    const templateStudent = {
      id: "old-s",
      user_id: "seed",
      name: "Demo",
      age: 20,
      weight: 70,
      height: 170,
      objective: "o",
    };

    let fromCall = 0;
    const admin = {
      from: vi.fn((table: string) => {
        if (table === "students") {
          fromCall++;
          if (fromCall === 1) {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [templateStudent], error: null }),
                }),
              }),
            };
          }
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "new-s" }, error: null }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "assessments") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "new-a" }, error: null }),
              }),
            }),
          };
        }
        if (table === "custom_metric_values") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "ai_analyses") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "user_demo_state") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    };

    const repo = new SupabaseDemoTemplateRepository(admin as never);
    await repo.cloneDemoFromTemplateUser("target", "seed");
    expect(admin.from).toHaveBeenCalled();
  });

  it("clearDemoStudents retorna contagem", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      })),
    };
    const repo = new SupabaseDemoTemplateRepository(admin as never);
    expect(await repo.clearDemoStudents("u")).toBe(2);
  });

  it("markDemoCleared atualiza estado", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const admin = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq }),
      }),
    };
    await new SupabaseDemoTemplateRepository(admin as never).markDemoCleared("u");
    expect(eq).toHaveBeenCalledWith("user_id", "u");
  });
});
