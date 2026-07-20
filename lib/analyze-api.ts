import type { SupportedAnalysisResult } from "@/lib/analysis-types";
import { parseSupportedAnalysisResult } from "@/lib/analysis-validation";

export const analysisErrorCodes = [
  "INVALID_INPUT",
  "CONFIGURATION_ERROR",
  "TIMEOUT",
  "BILLING_ERROR",
  "RATE_LIMITED",
  "PROVIDER_ERROR",
  "INVALID_MODEL_OUTPUT",
] as const;

export type AnalysisErrorCode = (typeof analysisErrorCodes)[number];

export type AnalysisApiError = {
  code: AnalysisErrorCode;
  message: string;
  retryable: boolean;
};

export type AnalyzeSuccessResponse = {
  ok: true;
  result: SupportedAnalysisResult;
};

export type AnalyzeFailureResponse = {
  ok: false;
  error: AnalysisApiError;
};

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeFailureResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const actualKeys = Object.keys(value);
  return actualKeys.length === keys.length && keys.every((key) => key in value);
}

function isAnalysisErrorCode(value: unknown): value is AnalysisErrorCode {
  return typeof value === "string" && analysisErrorCodes.some((code) => code === value);
}

export function parseAnalyzeResponse(value: unknown): AnalyzeResponse | null {
  if (!isRecord(value) || value.ok === undefined) return null;

  if (value.ok === true && hasExactKeys(value, ["ok", "result"])) {
    const result = parseSupportedAnalysisResult(value.result);
    return result ? { ok: true, result } : null;
  }

  if (
    value.ok === false &&
    hasExactKeys(value, ["ok", "error"]) &&
    isRecord(value.error) &&
    hasExactKeys(value.error, ["code", "message", "retryable"]) &&
    isAnalysisErrorCode(value.error.code) &&
    typeof value.error.message === "string" &&
    typeof value.error.retryable === "boolean"
  ) {
    return {
      ok: false,
      error: {
        code: value.error.code,
        message: value.error.message,
        retryable: value.error.retryable,
      },
    };
  }

  return null;
}
