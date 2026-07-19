import {
  createRiskScore,
  type AnalysisResult,
  type SupportedAnalysisResult,
  type UnsupportedAnalysisResult,
} from "@/lib/analysis-types";

export type DemoFixture = {
  id: "web" | "solana";
  label: string;
  diff: string;
  analysis: SupportedAnalysisResult;
};

export const webDemo: DemoFixture = {
  id: "web",
  label: "Web authentication validation",
  diff: `diff --git a/src/auth/validateLogin.ts b/src/auth/validateLogin.ts
index 2f71be1..6bb29f4 100644
--- a/src/auth/validateLogin.ts
+++ b/src/auth/validateLogin.ts
@@ -8,9 +8,15 @@ export function validateLogin(input: LoginInput) {
-  if (!input.email || !input.password) {
-    throw new ValidationError("Email and password are required");
+  const email = input.email.trim().toLowerCase();
+
+  if (!email || input.password.length < 8) {
+    throw new ValidationError("Enter a valid email and password");
   }
 
-  return input;
+  return { ...input, email };
 }`,
  analysis: {
    kind: "supported",
    summary: "Login validation now normalizes email addresses and rejects passwords shorter than eight characters before authentication.",
    riskScore: createRiskScore(64),
    riskLevel: "medium",
    affectedAreas: ["Login form validation", "Authentication API contract", "Existing user access", "Error messaging"],
    keyRisks: [
      {
        title: "Existing users may be locked out",
        severity: "high",
        explanation: "Users with legacy passwords shorter than eight characters could be rejected before their credentials reach the authentication service.",
        evidence: "The new `input.password.length < 8` condition applies to every login attempt, not only registration or password changes.",
      },
      {
        title: "Missing password can cause a runtime error",
        severity: "critical",
        explanation: "If the request omits the password, reading `.length` may throw instead of returning a controlled validation response.",
        evidence: "The previous explicit `!input.password` guard was replaced by a direct `input.password.length` access.",
      },
      {
        title: "Email identity behavior changes",
        severity: "medium",
        explanation: "Trimming and lowercasing can change the identifier sent downstream and may conflict with case-sensitive legacy records.",
        evidence: "The returned input now overwrites `email` with `input.email.trim().toLowerCase()`.",
      },
    ],
    recommendedTests: [
      { title: "Submit login without a password", priority: "high", category: "Validation", expectedOutcome: "The API returns the expected validation error and does not throw an unhandled exception." },
      { title: "Authenticate a legacy short-password account", priority: "high", category: "Regression", expectedOutcome: "Product policy is enforced intentionally without silently locking out supported accounts." },
      { title: "Login with mixed-case and padded email", priority: "medium", category: "Authentication", expectedOutcome: "The normalized email resolves to the correct account and the user signs in once." },
      { title: "Verify validation error presentation", priority: "low", category: "UI", expectedOutcome: "The login form displays the new message accessibly and retains the email input." },
    ],
    releaseRecommendation: "Hold release until missing-password handling and the impact on legacy short-password accounts are reviewed and verified.",
  },
};

export const solanaDemo: DemoFixture = {
  id: "solana",
  label: "Solana transaction retry and confirmation",
  diff: `diff --git a/src/solana/sendPayment.ts b/src/solana/sendPayment.ts
index 43aa9cd..f18db21 100644
--- a/src/solana/sendPayment.ts
+++ b/src/solana/sendPayment.ts
@@ -18,8 +18,19 @@ export async function sendPayment(transaction: Transaction) {
-  const signature = await wallet.sendTransaction(transaction, connection);
-  await connection.confirmTransaction(signature, "confirmed");
+  let signature: string;
+  try {
+    signature = await wallet.sendTransaction(transaction, connection);
+  } catch {
+    signature = await wallet.sendTransaction(transaction, fallbackConnection);
+  }
+
+  const confirmation = await Promise.race([
+    connection.confirmTransaction(signature, "confirmed"),
+    timeout(12_000),
+  ]);
+
+  if (!confirmation) scheduleConfirmationPoll(signature);
 
   return signature;
 }`,
  analysis: {
    kind: "supported",
    summary: "Payment submission now retries through a fallback RPC and stops waiting after 12 seconds, with background confirmation polling.",
    riskScore: createRiskScore(87),
    riskLevel: "high",
    affectedAreas: ["Wallet signing", "Transaction submission", "RPC failover", "Confirmation tracking", "Payment UI state"],
    keyRisks: [
      { title: "Duplicate transaction submission", severity: "critical", explanation: "A first submission may reach the network even when the RPC call throws; immediately submitting again can create duplicate payment attempts.", evidence: "Every error from the first `sendTransaction` triggers a second submission through `fallbackConnection` without checking chain state." },
      { title: "Rejected wallet signature is retried", severity: "high", explanation: "A user rejection is not an infrastructure failure and should not trigger another wallet prompt or submission attempt.", evidence: "The catch block handles all errors identically and does not classify wallet rejection separately from RPC failure." },
      { title: "RPC timeout can hide a valid submission", severity: "high", explanation: "Network latency can leave the transaction valid but unresolved when the local timeout completes.", evidence: "Confirmation is raced against a fixed 12-second timeout, regardless of current cluster conditions." },
      { title: "Delayed confirmation may be misclassified", severity: "medium", explanation: "Slow confirmation shifts responsibility to background polling while the calling flow already receives a signature.", evidence: "The function returns after scheduling a poll and exposes no pending status or eventual confirmation result to its caller." },
      { title: "Frontend state can become stale", severity: "high", explanation: "The UI may show success, failure, or pending indefinitely because confirmation changes happen outside the original request lifecycle.", evidence: "`scheduleConfirmationPoll(signature)` has no visible state synchronization contract with the caller." },
    ],
    recommendedTests: [
      { title: "Simulate ambiguous primary RPC failure", priority: "high", category: "Transaction safety", expectedOutcome: "Only one payment lands on-chain and the client reconciles the original submission before any retry." },
      { title: "Reject the wallet signature", priority: "high", category: "Wallet interaction", expectedOutcome: "The rejection is shown once, no fallback submission occurs, and no second signature prompt opens." },
      { title: "Delay confirmation beyond 12 seconds", priority: "high", category: "Confirmation", expectedOutcome: "The UI stays pending, then resolves to the final chain state without reporting a false failure." },
      { title: "Fail the primary RPC before submission", priority: "medium", category: "Resilience", expectedOutcome: "The fallback RPC submits successfully and confirmation tracking uses a compatible connection." },
      { title: "Reload while confirmation is pending", priority: "medium", category: "Frontend state", expectedOutcome: "The payment status is restored from the signature and eventually matches the confirmed chain state." },
    ],
    releaseRecommendation: "Do not release until errors are classified, duplicate submission is prevented, and pending confirmations reliably reconcile with frontend state.",
  },
};

const unsupportedAnalysis: UnsupportedAnalysisResult = {
  kind: "unsupported",
  title: "Unsupported change in local demo",
  summary:
    "The deterministic Phase 1 demo cannot reliably classify this diff, so no risk score or release recommendation is being asserted.",
  guidance:
    "Load one of the provided demos or use the upcoming AI-powered semantic analysis.",
  humanReviewRequired: true,
};

export function analyzeDiff(diff: string): AnalysisResult {
  const normalized = diff.toLowerCase();
  const solanaMarkers = [
    "sendtransaction",
    "confirmtransaction",
    "fallbackconnection",
    "wallet",
    "rpc",
    "confirmation",
    "transaction",
  ];
  const webMarkers = [
    "validatelogin",
    "input.email",
    "input.password",
    "validationerror",
    "authentication",
  ];

  if (
    normalized.includes("solana") ||
    solanaMarkers.filter((marker) => normalized.includes(marker)).length >= 2
  ) {
    return solanaDemo.analysis;
  }

  if (
    normalized.includes("auth/validatelogin") ||
    webMarkers.filter((marker) => normalized.includes(marker)).length >= 2
  ) {
    return webDemo.analysis;
  }

  return unsupportedAnalysis;
}
