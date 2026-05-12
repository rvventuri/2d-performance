import { describe, it, expect, vi } from "vitest";
import { SupabaseStudentRepository } from "./StudentRepository";

const userId = "user-1";

const studentRow = {
  id: "s-1",
  name: "Ana",
  age: 20,
  weight: 60,
  height: 165,
  objective: "obj",
  photo_url: "http://x",
  created_at: "2025-01-01T00:00:00Z",
};

describe("SupabaseStudentRepository", () => {
  it("getAll mapeia rows e ignora null data", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [studentRow], error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseStudentRepository(supabase, userId);
    const list = await repo.getAll();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("Ana");
    expect(list[0].photoUrl).toBe("http://x");
  });

  it("getAll retorna [] sem erro quando data null", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
    const repo = new SupabaseStudentRepository(supabase, userId);
    expect(await repo.getAll()).toEqual([]);
  });

  it("getAll lança em erro Supabase", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
          }),
        }),
      }),
    };
    const repo = new SupabaseStudentRepository(supabase, userId);
    await expect(repo.getAll()).rejects.toThrow("boom");
  });

  it("getById retorna aluno mapeado", async () => {
    const single = vi.fn().mockResolvedValue({ data: studentRow, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single }),
          }),
        }),
      }),
    };
    const repo = new SupabaseStudentRepository(supabase, userId);
    const s = await repo.getById("s-1");
    expect(s?.id).toBe("s-1");
  });

  it("getById retorna null para PGRST116", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116", message: "no rows" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single }),
          }),
        }),
      }),
    };
    expect(await new SupabaseStudentRepository(supabase, userId).getById("x")).toBeNull();
  });

  it("getById lança em outro erro", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "OTHER", message: "db" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single }),
          }),
        }),
      }),
    };
    await expect(new SupabaseStudentRepository(supabase, userId).getById("x")).rejects.toThrow("db");
  });

  it("create insere e retorna mapeado", async () => {
    const single = vi.fn().mockResolvedValue({ data: studentRow, error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    };
    const repo = new SupabaseStudentRepository(supabase, userId);
    const created = await repo.create({
      name: "Ana",
      age: 20,
      weight: 60,
      height: 165,
      objective: "obj",
      photoUrl: "http://x",
    });
    expect(created.id).toBe("s-1");
  });

  it("create lança em erro", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "ins-fail" } });
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    };
    await expect(
      new SupabaseStudentRepository(supabase, userId).create({
        name: "Ana",
        age: 20,
        weight: 60,
        height: 165,
        objective: "obj",
        photoUrl: null,
      })
    ).rejects.toThrow("ins-fail");
  });

  it("update aplica campos parciais", async () => {
    const single = vi.fn().mockResolvedValue({ data: { ...studentRow, name: "Bia" }, error: null });
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update }) };
    const repo = new SupabaseStudentRepository(supabase, userId);
    const out = await repo.update("s-1", { name: "Bia" });
    expect(out?.name).toBe("Bia");
    expect(update).toHaveBeenCalled();
  });

  it("update envia photoUrl null quando definido", async () => {
    const single = vi.fn().mockResolvedValue({ data: studentRow, error: null });
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({ single }),
        }),
      }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update }) };
    await new SupabaseStudentRepository(supabase, userId).update("s-1", { photoUrl: null });
    const payload = update.mock.calls[0][0];
    expect(payload).toHaveProperty("photo_url", null);
  });

  it("delete delega ao supabase", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const del = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: del }) };
    await new SupabaseStudentRepository(supabase, userId).delete("s-1");
    expect(del).toHaveBeenCalled();
  });

  it("delete lança em erro", async () => {
    const eq2 = vi.fn().mockResolvedValue({ error: { message: "del-err" } });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const del = vi.fn().mockReturnValue({ eq: eq1 });
    const supabase = { from: vi.fn().mockReturnValue({ delete: del }) };
    await expect(new SupabaseStudentRepository(supabase, userId).delete("s-1")).rejects.toThrow("del-err");
  });
});
