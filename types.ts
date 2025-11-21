
export interface PlantAnalysis {
  commonName: string;
  scientificName: string;
  plantSize: 'Small' | 'Medium' | 'Large'; // Estimated physical size
  lpc: string; // Light Compensation Point (Text)
  ppfd: string; // Recommended PPFD (Text)
  lightSummary: string; // Brief description
  confidenceLevel: string; // High, Medium, Low
  numericValues: {
    lpc: number;        // Numeric value for chart
    ppfdMin: number;    // Numeric value for chart
    ppfdMax: number;    // Numeric value for chart
    saturation: number; // Estimated saturation point for chart
  };
  spectrum: {
    bluePercent: number; // 0-100, percentage of blue light importance
    redPercent: number;  // 0-100, percentage of red light importance
    description: string; // Explanation of why (e.g., "Needs blue for foliage")
  };
}

export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  data: PlantAnalysis | null;
}
