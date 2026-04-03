const VALID_WEIGHTS = [0, 0.5, 1, 1.5, 2, 2.5, 3] as const;
export type WeightValue = (typeof VALID_WEIGHTS)[number];

export class MetricWeight {
  private constructor(private readonly _value: WeightValue) {}

  static create(value: number): MetricWeight {
    if (!VALID_WEIGHTS.includes(value as WeightValue)) {
      throw new Error(
        `Peso inválido: ${value}. Valores aceitos: ${VALID_WEIGHTS.join(", ")}`
      );
    }
    return new MetricWeight(value as WeightValue);
  }

  get value(): WeightValue {
    return this._value;
  }

  isNeutral(): boolean {
    return this._value === 1;
  }

  isZero(): boolean {
    return this._value === 0;
  }
}
