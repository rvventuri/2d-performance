import { ImageResponse } from "next/og";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/branding";

export const runtime = "edge";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #050814 0%, #0b1020 40%, #1e1b4b 85%, #070b14 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "linear-gradient(135deg, #4f46e5 0%, #4de1c1 100%)",
            }}
          />
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: "-0.03em",
            }}
          >
            {APP_NAME}
          </span>
        </div>
        <p
          style={{
            fontSize: 34,
            color: "rgba(248,250,252,0.75)",
            maxWidth: 900,
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          {APP_DESCRIPTION}
        </p>
        <p
          style={{
            marginTop: 28,
            fontSize: 22,
            color: "#4de1c1",
            fontWeight: 600,
          }}
        >
          Métricas · evolução · IA para decisões de treino
        </p>
      </div>
    ),
    { ...size }
  );
}
