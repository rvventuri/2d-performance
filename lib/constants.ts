import type { Metrics } from "./types";

export const METRIC_LABELS: Record<keyof Metrics, string> = {
  cmj: "CMJ (cm)",
  sj: "SJ (cm)",
  abalakov: "Abalakov (cm)",
  rsi: "RSI",
  tempoContato: "Tempo de Contato (ms)",
  alturaSaltoDJ: "Altura Salto DJ (cm)",
  cmjEsquerdo: "CMJ Esquerdo (cm)",
  cmjDireito: "CMJ Direito (cm)",
  assimetriaPercentual: "Assimetria (%)",
  saltoHorizontal: "Salto Horizontal (cm)",
};

export const METRIC_UNITS: Record<keyof Metrics, string> = {
  cmj: "cm",
  sj: "cm",
  abalakov: "cm",
  rsi: "",
  tempoContato: "ms",
  alturaSaltoDJ: "cm",
  cmjEsquerdo: "cm",
  cmjDireito: "cm",
  assimetriaPercentual: "%",
  saltoHorizontal: "cm",
};
