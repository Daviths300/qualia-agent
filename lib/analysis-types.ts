export type RiskLevel = "low" | "medium" | "high";
export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type TestPriority = "low" | "medium" | "high";
export type RiskScore = number & { readonly __riskScore: unique symbol };

export function createRiskScore(value: number): RiskScore {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new RangeError("Risk score must be an integer from 0 to 100.");
  }
  return value as RiskScore;
}

export function deriveRiskLevel(score: RiskScore): RiskLevel {
  if (score <= 39) return "low";
  if (score <= 69) return "medium";
  return "high";
}

export type KeyRisk = {
  title: string;
  severity: RiskSeverity;
  explanation: string;
  evidence: string;
};

export type RecommendedTest = {
  title: string;
  priority: TestPriority;
  category: string;
  expectedOutcome: string;
};

export type SupportedAnalysisResult = {
  kind: "supported";
  summary: string;
  riskScore: RiskScore;
  riskLevel: RiskLevel;
  affectedAreas: string[];
  keyRisks: KeyRisk[];
  recommendedTests: RecommendedTest[];
  releaseRecommendation: string;
};

export type UnsupportedAnalysisResult = {
  kind: "unsupported";
  title: "Unsupported change in local demo";
  summary: string;
  guidance: string;
  humanReviewRequired: true;
};

export type AnalysisResult = SupportedAnalysisResult | UnsupportedAnalysisResult;
