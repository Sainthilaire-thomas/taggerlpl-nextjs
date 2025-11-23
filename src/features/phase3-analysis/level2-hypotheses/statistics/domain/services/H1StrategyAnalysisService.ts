export class H1StrategyAnalysisService {
  static analyzeStrategy(
    strategy: string,
    contingencyMatrix: { matrix: Record<string, Record<string, number>>; strategies: string[]; reactions: string[] }
  ) {
    const reactions = contingencyMatrix.reactions;
    const strategyRow = reactions.map(r => contingencyMatrix.matrix[strategy]?.[r] || 0);
    const othersRow = reactions.map(r => {
      return contingencyMatrix.strategies
        .filter(s => s !== strategy)
        .reduce((sum, s) => sum + (contingencyMatrix.matrix[s]?.[r] || 0), 0);
    });
    
    const observed = [strategyRow, othersRow];
    const strategyTotal = strategyRow.reduce((a, b) => a + b, 0);
    const othersTotal = othersRow.reduce((a, b) => a + b, 0);
    const grandTotal = strategyTotal + othersTotal;
    const colTotals = reactions.map((_, i) => strategyRow[i] + othersRow[i]);
    const expected = [
      colTotals.map(ct => (ct * strategyTotal) / grandTotal),
      colTotals.map(ct => (ct * othersTotal) / grandTotal)
    ];
    
    let chiSquare = 0;
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < reactions.length; j++) {
        if (expected[i][j] > 0) {
          const diff = observed[i][j] - expected[i][j];
          chiSquare += (diff * diff) / expected[i][j];
        }
      }
    }
    
    const df = reactions.length - 1;
    const pValue = this.chiSquarePValue(chiSquare, df);
    
    return { strategy, chiSquare, df, pValue, isSignificant: pValue < 0.05, observed: strategyRow, expected: expected[0] };
  }
  
  private static chiSquarePValue(chiSquare: number, df: number): number {
    const criticalValues: { [key: number]: { [key: number]: number } } = {
      2: { 0.05: 5.991, 0.01: 9.210, 0.001: 13.816 },
      3: { 0.05: 7.815, 0.01: 11.345, 0.001: 16.266 }
    };
    const thresholds = criticalValues[df] || criticalValues[2];
    if (chiSquare > thresholds[0.001]) return 0.001;
    if (chiSquare > thresholds[0.01]) return 0.01;
    if (chiSquare > thresholds[0.05]) return 0.05;
    return 0.1;
  }
}
