import React from "react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority: _p, ...rest } = props;
    void _p;
    return React.createElement("img", rest);
  },
}));
