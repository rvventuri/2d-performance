import { RefObject } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "atleta";
}

function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 300);
      });
    });
  });
}

export async function exportAthletePdf(
  containerRef: RefObject<HTMLElement | null>,
  studentName: string
): Promise<void> {
  const element = containerRef.current;
  if (!element) {
    throw new Error("Elemento do relatório não encontrado");
  }

  await waitForRender();

  let dataUrl: string;
  try {
    dataUrl = await toPng(element, {
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: false,
    });
  } catch {
    // Retry without external images (CORS fallback)
    dataUrl = await toPng(element, {
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        if (node instanceof HTMLImageElement && node.src.startsWith("http")) {
          return false;
        }
        return true;
      },
    });
  }

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Falha ao processar imagem do relatório"));
  });

  const contentWidthMm = A4_WIDTH_MM - MARGIN_MM * 2;
  const imgHeightMm = (img.height * contentWidthMm) / img.width;
  const pageContentHeightMm = A4_HEIGHT_MM - MARGIN_MM * 2;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let remainingHeightMm = imgHeightMm;
  let sourceY = 0;
  let pageIndex = 0;

  while (remainingHeightMm > 0) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const sliceHeightMm = Math.min(remainingHeightMm, pageContentHeightMm);
    const sourceHeightPx = (sliceHeightMm / imgHeightMm) * img.height;

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = sourceHeightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Falha ao criar canvas para paginação");
    }

    ctx.drawImage(
      img,
      0,
      sourceY,
      img.width,
      sourceHeightPx,
      0,
      0,
      img.width,
      sourceHeightPx
    );

    const sliceDataUrl = canvas.toDataURL("image/png");
    pdf.addImage(sliceDataUrl, "PNG", MARGIN_MM, MARGIN_MM, contentWidthMm, sliceHeightMm);

    sourceY += sourceHeightPx;
    remainingHeightMm -= sliceHeightMm;
    pageIndex += 1;
  }

  pdf.save(`${slugify(studentName)}-relatorio.pdf`);
}
