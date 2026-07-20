import assert from "node:assert/strict";
import test from "node:test";

import { createRiskScore, deriveRiskLevel } from "./analysis-types.ts";

const boundaryCases = [
  [0, "low"],
  [39, "low"],
  [40, "medium"],
  [69, "medium"],
  [70, "high"],
  [100, "high"],
];

for (const [score, expectedLevel] of boundaryCases) {
  test(`${score} maps to ${expectedLevel}`, () => {
    assert.equal(deriveRiskLevel(createRiskScore(score)), expectedLevel);
  });
}
