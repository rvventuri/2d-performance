export interface BenchmarkInput {
  recreational: number;
  trained: number;
  elite: number;
  higherIsBetter: boolean;
}

export class BenchmarkValues {
  private constructor(
    readonly recreational: number,
    readonly trained: number,
    readonly elite: number,
    readonly higherIsBetter: boolean
  ) {}

  static create(input: BenchmarkInput): BenchmarkValues {
    const { recreational, trained, elite, higherIsBetter } = input;

    if (higherIsBetter) {
      if (recreational >= trained) {
        throw new Error(
          `Benchmark inválido: recreativo (${recreational}) deve ser menor que treinado (${trained})`
        );
      }
      if (trained >= elite) {
        throw new Error(
          `Benchmark inválido: treinado (${trained}) deve ser menor que elite (${elite})`
        );
      }
    } else {
      if (recreational <= trained) {
        throw new Error(
          `Benchmark inválido (menor=melhor): recreativo (${recreational}) deve ser maior que treinado (${trained})`
        );
      }
      if (trained <= elite) {
        throw new Error(
          `Benchmark inválido (menor=melhor): treinado (${trained}) deve ser maior que elite (${elite})`
        );
      }
    }

    return new BenchmarkValues(recreational, trained, elite, higherIsBetter);
  }
}
