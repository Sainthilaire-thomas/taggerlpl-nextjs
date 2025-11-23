export class H1TagAnalysisService {
  /**
   * Chi² pour UN tag vs tous les autres
   */
  static analyzeTag(
    tag: string,
    tagFamily: string,
    contingencyMatrix: { 
      matrix: Record<string, Record<string, number>>; 
      tags: string[]; 
      reactions: string[] 
    }
  ) {
    const reactions = contingencyMatrix.reactions;
    
    // Ligne 1: Ce tag
    const tagRow = reactions.map(r => contingencyMatrix.matrix[tag]?.[r] || 0);
    
    // Ligne 2: Tous les autres tags combinés
    const othersRow = reactions.map(r => {
      return contingencyMatrix.tags
        .filter(t => t !== tag)
        .reduce((sum, t) => sum + (contingencyMatrix.matrix[t]?.[r] || 0), 0);
    });
    
    const observed = [tagRow, othersRow];
    
    // Totaux
    const tagTotal = tagRow.reduce((a, b) => a + b, 0);
    const othersTotal = othersRow.reduce((a, b) => a + b, 0);
    const grandTotal = tagTotal + othersTotal;
    
    // Fréquences attendues
    const colTotals = reactions.map((_, i) => tagRow[i] + othersRow[i]);
    const expected = [
      colTotals.map(ct => (ct * tagTotal) / grandTotal),
      colTotals.map(ct => (ct * othersTotal) / grandTotal)
    ];
    
    // Chi²
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
    
    return { 
      tag, 
      family: tagFamily,
      chiSquare, 
      df, 
      pValue, 
      isSignificant: pValue < 0.05, 
      observed: tagRow, 
      expected: expected[0] 
    };
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
