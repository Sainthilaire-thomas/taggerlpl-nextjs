/**
 * Service de calculs statistiques pour H1
 */

export class H1StatisticsService {
  /**
   * Calcule le Chi² de Pearson
   */
  static calculateChiSquare(
    observed: number[][],
    expected: number[][]
  ): { chiSquare: number; df: number; pValue: number } {
    let chiSquare = 0;
    
    for (let i = 0; i < observed.length; i++) {
      for (let j = 0; j < observed[i].length; j++) {
        if (expected[i][j] > 0) {
          const diff = observed[i][j] - expected[i][j];
          chiSquare += (diff * diff) / expected[i][j];
        }
      }
    }

    const df = (observed.length - 1) * (observed[0].length - 1);
    const pValue = this.chiSquarePValue(chiSquare, df);

    return { chiSquare, df, pValue };
  }

  /**
   * Calcule le V de Cramér (force de l'association)
   */
  static calculateCramersV(chiSquare: number, n: number, rows: number, cols: number): number {
    const minDim = Math.min(rows - 1, cols - 1);
    return Math.sqrt(chiSquare / (n * minDim));
  }

  /**
   * Approximation p-value pour Chi²
   */
  private static chiSquarePValue(chiSquare: number, df: number): number {
    const criticalValues: { [key: number]: { [key: number]: number } } = {
      2: { 0.05: 5.991, 0.01: 9.210, 0.001: 13.816 },
      3: { 0.05: 7.815, 0.01: 11.345, 0.001: 16.266 },
      4: { 0.05: 9.488, 0.01: 13.277, 0.001: 18.467 },
      6: { 0.05: 12.592, 0.01: 16.812, 0.001: 22.458 },
    };

    const nearest = [2, 3, 4, 6].reduce((prev, curr) => 
      Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
    );

    const thresholds = criticalValues[nearest] || criticalValues[4];

    if (chiSquare > thresholds[0.001]) return 0.001;
    if (chiSquare > thresholds[0.01]) return 0.01;
    if (chiSquare > thresholds[0.05]) return 0.05;
    return 0.1;
  }

  /**
   * Interprète la force de l'association selon V de Cramér
   */
  static interpretCramersV(v: number): string {
    if (v < 0.1) return 'Très faible';
    if (v < 0.3) return 'Faible';
    if (v < 0.5) return 'Moyenne';
    return 'Forte';
  }

  /**
   * Calcule les fréquences attendues sous H0 (indépendance)
   */
  static calculateExpectedFrequencies(observed: number[][]): number[][] {
    if (!observed || observed.length === 0 || !observed[0]) {
      return [];
    }

    const rowTotals = observed.map(row => row.reduce((sum, val) => sum + val, 0));
    const colTotals = observed[0].map((_, colIdx) => 
      observed.reduce((sum, row) => sum + row[colIdx], 0)
    );
    const total = rowTotals.reduce((sum, val) => sum + val, 0);

    return observed.map((row, i) =>
      row.map((_, j) => (rowTotals[i] * colTotals[j]) / total)
    );
  }
}
