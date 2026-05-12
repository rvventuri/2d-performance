import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { APP_NAME } from "@/lib/branding";
import Navbar from "./navbar";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({}),
    },
  })),
}));

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza logo e link Alunos", async () => {
    render(<Navbar />);
    const logo = await screen.findByRole("img", { name: APP_NAME });
    expect(logo.getAttribute("alt")).toBe(APP_NAME);
    const link = screen.getByRole("link", { name: /alunos/i });
    expect(link.getAttribute("href")).toBe("/dashboard");
  });
});
