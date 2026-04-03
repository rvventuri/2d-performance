import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock do módulo Supabase client ────────────────────────────────────────────
// vi.mock deve ficar no topo, antes de qualquer import dos módulos sob teste.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/client";
import {
  getStudents,
  uploadAthletePhoto,
  deleteAthletePhoto,
} from "../storage";

// Helpers -------------------------------------------------------------------

const mockUser = { id: "user-abc" };

/** Retorna um mock de SupabaseClient capaz de atender
 *  a cadeia: supabase.auth.getUser() */
function makeSupabase(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    ...overrides,
  };
}

// ── rowToStudent (photo_url → photoUrl) ─────────────────────────────────────
describe("getStudents — mapeamento photo_url → photoUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mapeia photo_url para photoUrl quando presente", async () => {
    const row = {
      id: "s-1",
      name: "João",
      age: 22,
      weight: 75,
      height: 180,
      objective: "saltar mais alto",
      photo_url: "https://storage.example.com/foto.jpg",
      created_at: "2025-01-01T00:00:00Z",
    };
    const supabase = makeSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [row], error: null }),
      }),
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const students = await getStudents();
    expect(students[0].photoUrl).toBe("https://storage.example.com/foto.jpg");
  });

  it("mapeia photoUrl como null quando photo_url é null", async () => {
    const row = {
      id: "s-2",
      name: "Maria",
      age: 20,
      weight: 60,
      height: 165,
      objective: "",
      photo_url: null,
      created_at: "2025-01-01T00:00:00Z",
    };
    const supabase = makeSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [row], error: null }),
      }),
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const students = await getStudents();
    expect(students[0].photoUrl).toBeNull();
  });

  it("mapeia photoUrl como null quando photo_url está ausente na row", async () => {
    const row = {
      id: "s-3",
      name: "Pedro",
      age: 25,
      weight: 80,
      height: 178,
      objective: "",
      created_at: "2025-01-01T00:00:00Z",
      // sem photo_url
    };
    const supabase = makeSupabase();
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [row], error: null }),
      }),
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const students = await getStudents();
    expect(students[0].photoUrl).toBeNull();
  });
});

// ── uploadAthletePhoto ────────────────────────────────────────────────────────
describe("uploadAthletePhoto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("faz upload no caminho correto e retorna URL pública com cache-bust", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/athlete-photos/user-abc/s-1/photo.jpg" },
    });
    const storageBucketMock = {
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    };
    const supabase = makeSupabase();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue(storageBucketMock);
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const file = new File(["data"], "foto.jpg", { type: "image/jpeg" });
    const url = await uploadAthletePhoto("s-1", file);

    // Verifica o caminho usado no upload
    expect(uploadMock).toHaveBeenCalledWith(
      "user-abc/s-1/photo.jpg",
      file,
      { upsert: true, contentType: "image/jpeg" }
    );
    // URL deve conter a base + query string de cache-bust
    expect(url).toMatch(/^https:\/\/cdn\.example\.com\/.*\?t=\d+$/);
  });

  it("usa extensão do nome do arquivo no caminho", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({
      data: { publicUrl: "https://cdn.example.com/p" },
    });
    const supabase = makeSupabase();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const file = new File(["data"], "athlete-photo.png", { type: "image/png" });
    await uploadAthletePhoto("s-2", file);

    expect(uploadMock).toHaveBeenCalledWith(
      "user-abc/s-2/photo.png",
      file,
      expect.objectContaining({ upsert: true })
    );
  });

  it("lança erro quando o upload falha", async () => {
    const supabase = makeSupabase();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: { message: "bucket não encontrado" } }),
      getPublicUrl: vi.fn(),
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const file = new File(["data"], "foto.jpg", { type: "image/jpeg" });
    await expect(uploadAthletePhoto("s-1", file)).rejects.toThrow("bucket não encontrado");
  });

  it("lança erro quando usuário não está autenticado", async () => {
    const supabase = makeSupabase({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    const file = new File(["data"], "foto.jpg", { type: "image/jpeg" });
    await expect(uploadAthletePhoto("s-1", file)).rejects.toThrow("Não autenticado");
  });
});

// ── deleteAthletePhoto ────────────────────────────────────────────────────────
describe("deleteAthletePhoto", () => {
  beforeEach(() => vi.clearAllMocks());

  it("remove todos os arquivos do diretório do atleta", async () => {
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    const files = [{ name: "photo.jpg" }, { name: "photo.png" }];
    const supabase = makeSupabase();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: files }),
      remove: removeMock,
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    await deleteAthletePhoto("s-1");

    expect(removeMock).toHaveBeenCalledWith([
      "user-abc/s-1/photo.jpg",
      "user-abc/s-1/photo.png",
    ]);
  });

  it("não chama remove quando não há arquivos no diretório", async () => {
    const removeMock = vi.fn();
    const supabase = makeSupabase();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [] }),
      remove: removeMock,
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    await deleteAthletePhoto("s-1");

    expect(removeMock).not.toHaveBeenCalled();
  });

  it("não chama remove quando list retorna null", async () => {
    const removeMock = vi.fn();
    const supabase = makeSupabase();
    (supabase.storage.from as ReturnType<typeof vi.fn>).mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: null }),
      remove: removeMock,
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    await deleteAthletePhoto("s-1");

    expect(removeMock).not.toHaveBeenCalled();
  });

  it("retorna silenciosamente quando usuário não está autenticado", async () => {
    const supabase = makeSupabase({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });
    vi.mocked(createClient).mockReturnValue(supabase as never);

    await expect(deleteAthletePhoto("s-1")).resolves.toBeUndefined();
  });
});
