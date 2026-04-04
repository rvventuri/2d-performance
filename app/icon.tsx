import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1020 0%, #1e1b4b 100%)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "linear-gradient(135deg, #4f46e5 0%, #4de1c1 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
