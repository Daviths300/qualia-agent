import {
  createRiskScore,
  deriveRiskLevel,
  type KeyRisk,
  type RecommendedTest,
  type RiskSeverity,
  type SupportedAnalysisResult,
  type TestPriority,
} from "@/lib/analysis-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => key in value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRiskSeverity(value: unknown): value is RiskSeverity {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

function isTestPriority(value: unknown): value is TestPriority {
  return value === "low" || value === "medium" || value === "high";
}

function parseKeyRisk(value: unknown): KeyRisk | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["title", "severity", "explanation", "evidence"]) ||
    !isNonEmptyString(value.title) ||
    !isRiskSeverity(value.severity) ||
    !isNonEmptyString(value.explanation) ||
    !isNonEmptyString(value.evidence)
  ) {
    return null;
  }

  return {
    title: value.title,
    severity: value.severity,
    explanation: value.explanation,
    evidence: value.evidence,
  };
}

function parseRecommendedTest(value: unknown): RecommendedTest | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["title", "priority", "category", "expectedOutcome"]) ||
    !isNonEmptyString(value.title) ||
    !isTestPriority(value.priority) ||
    !isNonEmptyString(value.category) ||
    !isNonEmptyString(value.expectedOutcome)
  ) {
    return null;
  }

  return {
    title: value.title,
    priority: value.priority,
    category: value.category,
    expectedOutcome: value.expectedOutcome,
  };
}

export function parseSupportedAnalysisResult(value: unknown): SupportedAnalysisResult | null {
  const modelKeys = [
    "kind",
    "summary",
    "riskScore",
    "affectedAreas",
    "keyRisks",
    "recommendedTests",
    "releaseRecommendation",
  ];

  if (
    !isRecord(value) ||
    !hasExactKeys(value, "riskLevel" in value ? [...modelKeys, "riskLevel"] : modelKeys) ||
    value.kind !== "supported" ||
    !isNonEmptyString(value.summary) ||
    typeof value.riskScore !== "number" ||
    !Number.isInteger(value.riskScore) ||
    value.riskScore < 0 ||
    value.riskScore > 100 ||
    !Array.isArray(value.affectedAreas) ||
    value.affectedAreas.length < 1 ||
    value.affectedAreas.length > 8 ||
    !value.affectedAreas.every(isNonEmptyString) ||
    !Array.isArray(value.keyRisks) ||
    value.keyRisks.length < 1 ||
    value.keyRisks.length > 6 ||
    !Array.isArray(value.recommendedTests) ||
    value.recommendedTests.length < 1 ||
    value.recommendedTests.length > 8 ||
    !isNonEmptyString(value.releaseRecommendation)
  ) {
    return null;
  }

  const keyRisks = value.keyRisks.map(parseKeyRisk);
  const recommendedTests = value.recommendedTests.map(parseRecommendedTest);
  if (keyRisks.some((risk) => risk === null) || recommendedTests.some((test) => test === null)) {
    return null;
  }

  const riskScore = createRiskScore(value.riskScore);
  const riskLevel = deriveRiskLevel(riskScore);
  if ("riskLevel" in value && value.riskLevel !== riskLevel) {
    return null;
  }

  return {
    kind: "supported",
    summary: value.summary,
    riskScore,
    riskLevel,
    affectedAreas: value.affectedAreas,
    keyRisks: keyRisks.filter((risk): risk is KeyRisk => risk !== null),
    recommendedTests: recommendedTests.filter((test): test is RecommendedTest => test !== null),
    releaseRecommendation: value.releaseRecommendation,
  };
}
