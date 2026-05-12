import { describe, it, expect, vi, afterEach } from "vitest";

describe("getDemoSeedUserIdForTemplate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("retorna undefined sem env", async () => {
    vi.stubEnv("DEMO_TEMPLATE_USER_PREPARADOR_FISICO", "");
    vi.stubEnv("DEMO_TEMPLATE_USER_ID", "");
    const { getDemoSeedUserIdForTemplate } = await import("./demo-seed-users");
    expect(getDemoSeedUserIdForTemplate("preparador_fisico")).toBeUndefined();
  });

  it("usa DEMO_TEMPLATE_USER_ID como fallback preparador", async () => {
    delete process.env.DEMO_TEMPLATE_USER_PREPARADOR_FISICO;
    vi.stubEnv("DEMO_TEMPLATE_USER_ID", "  uuid-123  ");
    const { getDemoSeedUserIdForTemplate } = await import("./demo-seed-users");
    expect(getDemoSeedUserIdForTemplate("preparador_fisico")).toBe("uuid-123");
  });

  it("lê env específica do template", async () => {
    vi.stubEnv("DEMO_TEMPLATE_USER_CROSS_TRAINING", "ct-id");
    const { getDemoSeedUserIdForTemplate } = await import("./demo-seed-users");
    expect(getDemoSeedUserIdForTemplate("cross_training")).toBe("ct-id");
  });
});
