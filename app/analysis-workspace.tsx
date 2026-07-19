"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisResult, RiskLevel, RiskSeverity, TestPriority } from "@/lib/analysis-types";
import { analyzeDiff, solanaDemo, webDemo } from "@/lib/demo-data";

const severityStyle: Record<RiskSeverity, string> = {
  low: "border-sky-200 bg-sky-50 text-sky-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-700",
};
const priorityStyle: Record<TestPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};
const levelStyle: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-700",
};

export function AnalysisWorkspace() {
  const [diff, setDiff] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const requestVersionRef = useRef(0);
  const currentDiffRef = useRef(diff);

  function invalidatePendingAnalysis() {
    requestVersionRef.current += 1;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (focusFrameRef.current !== null) {
      window.cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }
    setResult(null);
    setIsLoading(false);
  }

  useEffect(() => {
    return () => {
      requestVersionRef.current += 1;
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    };
  }, []);

  function loadDemo(value: string) {
    invalidatePendingAnalysis();
    currentDiffRef.current = value;
    setDiff(value);
    setError("");
  }

  function changeDiff(value: string) {
    invalidatePendingAnalysis();
    currentDiffRef.current = value;
    setDiff(value);
    if (error) setError("");
  }

  function analyze() {
    if (isLoading) return;

    invalidatePendingAnalysis();
    const diffSnapshot = diff;
    if (!diff.trim()) {
      setError("Paste a code diff or load a demo before analyzing the change.");
      return;
    }
    setError("");
    setIsLoading(true);
    const requestVersion = requestVersionRef.current;
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (
        requestVersionRef.current !== requestVersion ||
        currentDiffRef.current !== diffSnapshot
      ) {
        return;
      }
      setResult(analyzeDiff(diffSnapshot));
      setIsLoading(false);
      focusFrameRef.current = window.requestAnimationFrame(() => {
        focusFrameRef.current = null;
        resultsRef.current?.focus();
      });
    }, 3000);
  }

  return (
    <>
      <section aria-labelledby="analyzer-heading" className="card p-5 sm:p-7">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Change input</p>
            <h2 id="analyzer-heading" className="mt-1 text-xl font-semibold text-slate-950">What changed?</h2>
          </div>
          <p className="text-sm text-slate-500">Local demo analysis · no data leaves your browser</p>
        </div>
        <label htmlFor="code-diff" className="sr-only">Code diff</label>
        <textarea
          id="code-diff"
          value={diff}
          onChange={(event) => changeDiff(event.target.value)}
          disabled={isLoading}
          aria-describedby={error ? "diff-error" : "diff-help"}
          aria-invalid={Boolean(error)}
          spellCheck={false}
          placeholder="Paste a unified code diff here…"
          className="min-h-72 w-full resize-y rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-[13px] leading-6 text-slate-100 shadow-inner outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-wait disabled:opacity-80"
        />
        <div className="mt-3 min-h-6">
          {error ? <p id="diff-error" role="alert" className="text-sm font-medium text-red-600">{error}</p> :
            <p id="diff-help" className="text-sm text-slate-500">Load a realistic fixture or paste your own diff. Phase 1 maps changes to deterministic demo results.</p>}
        </div>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="button-secondary" onClick={() => loadDemo(webDemo.diff)} disabled={isLoading}>Load Web Demo</button>
            <button type="button" className="button-secondary" onClick={() => loadDemo(solanaDemo.diff)} disabled={isLoading}>Load Solana Demo</button>
          </div>
          <button type="button" className="button-primary" onClick={analyze} disabled={isLoading}>
            {isLoading ? <><span className="spinner" aria-hidden="true" />Analyzing change…</> : "Analyze Change"}
          </button>
        </div>
      </section>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isLoading ? "Analysis in progress" : result ? "Analysis complete" : ""}
      </div>
      {isLoading && <LoadingState />}
      {result && <AnalysisResults result={result} resultsRef={resultsRef} />}
    </>
  );
}

function LoadingState() {
  return <section className="card mt-6 p-7" aria-hidden="true"><div className="animate-pulse space-y-5">
    <div className="h-4 w-28 rounded bg-slate-200" /><div className="h-9 w-3/5 rounded bg-slate-200" />
    <div className="grid gap-4 sm:grid-cols-3"><div className="h-28 rounded-2xl bg-slate-100" /><div className="h-28 rounded-2xl bg-slate-100 sm:col-span-2" /></div>
  </div></section>;
}

function AnalysisResults({ result, resultsRef }: { result: AnalysisResult; resultsRef: React.RefObject<HTMLElement | null> }) {
  if (result.kind === "unsupported") {
    return (
      <section ref={resultsRef} tabIndex={-1} aria-labelledby="unsupported-heading" className="mt-6 outline-none">
        <div className="card p-5 sm:p-7">
          <p className="eyebrow">Analysis unavailable</p>
          <h2 id="unsupported-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{result.title}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{result.summary}</p>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">{result.guidance}</p>
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-violet-950">
            <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-bold text-white">!</span>
            <div><p className="font-semibold">Human review required</p><p className="mt-1 text-sm leading-6 text-violet-800">No automated QA decision has been made for this change.</p></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={resultsRef} tabIndex={-1} aria-labelledby="results-heading" className="mt-6 space-y-6 outline-none">
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl"><p className="eyebrow">Analysis complete</p><h2 id="results-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">QA decision brief</h2><p className="mt-3 leading-7 text-slate-600">{result.summary}</p></div>
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Risk score</p><p className="mt-1 text-4xl font-semibold tabular-nums text-slate-950">{result.riskScore}<span className="text-lg text-slate-400">/100</span></p></div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${levelStyle[result.riskLevel]}`}>{result.riskLevel} risk</span>
            </div>
          </div>
        </div>
        <div className="grid divide-y divide-slate-200 lg:grid-cols-[0.85fr_2.15fr] lg:divide-x lg:divide-y-0">
          <div className="p-5 sm:p-7"><p className="eyebrow">Affected areas</p><ul className="mt-4 flex flex-wrap gap-2" aria-label="Affected areas">{result.affectedAreas.map((area) => <li key={area} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700">{area}</li>)}</ul></div>
          <div className="p-5 sm:p-7"><p className="eyebrow">Release recommendation</p><p className="mt-3 text-lg font-medium leading-8 text-slate-900">{result.releaseRecommendation}</p>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 text-violet-950"><span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-bold text-white">!</span><div><p className="font-semibold">Human review required</p><p className="mt-1 text-sm leading-6 text-violet-800">This is decision support. A qualified reviewer must approve the release.</p></div></div>
          </div>
        </div>
      </div>

      <section aria-labelledby="risks-heading">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="eyebrow">What could break?</p><h3 id="risks-heading" className="mt-1 text-xl font-semibold text-slate-950">Explainable key risks</h3></div><span className="text-sm text-slate-500">{result.keyRisks.length} identified</span></div>
        <div className="grid gap-4 md:grid-cols-2">{result.keyRisks.map((risk, index) => <article key={risk.title} className="card p-5 sm:p-6 last:odd:md:col-span-2">
          <div className="flex items-start justify-between gap-4"><span className="text-sm font-semibold tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${severityStyle[risk.severity]}`}>{risk.severity}</span></div>
          <h4 className="mt-4 text-lg font-semibold text-slate-950">{risk.title}</h4><p className="mt-2 leading-7 text-slate-600">{risk.explanation}</p>
          <div className="mt-4 border-l-2 border-violet-300 pl-4"><p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Evidence from diff</p><p className="mt-1 text-sm leading-6 text-slate-600">{risk.evidence}</p></div>
        </article>)}</div>
      </section>

      <section aria-labelledby="tests-heading"><div className="mb-4"><p className="eyebrow">What should be tested first?</p><h3 id="tests-heading" className="mt-1 text-xl font-semibold text-slate-950">Prioritized regression tests</h3></div>
        <ol className="card divide-y divide-slate-200 overflow-hidden">{result.recommendedTests.map((test, index) => <li key={test.title} className="grid gap-4 p-5 sm:grid-cols-[2.5rem_1fr_auto] sm:items-start sm:p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-sm font-semibold text-white">{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-slate-950">{test.title}</h4><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{test.category}</span></div><p className="mt-2 text-sm leading-6 text-slate-600"><span className="font-medium text-slate-800">Expected:</span> {test.expectedOutcome}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${priorityStyle[test.priority]}`}>{test.priority} priority</span>
        </li>)}</ol>
      </section>
    </section>
  );
}
