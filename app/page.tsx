import { AnalysisWorkspace } from "@/app/analysis-workspace";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#main-content" className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 font-semibold text-white shadow-sm shadow-violet-200">Q</span>
            <span className="text-lg font-semibold tracking-tight text-slate-950">QualiAgent</span>
          </a>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">Phase 1 · Local demo</span>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <section className="mb-9 max-w-4xl">
          <p className="eyebrow">Explainable QA decision support</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">Turn every code change into a clear release decision.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">QualiAgent analyzes a diff, explains what could break, prioritizes regression tests, and prepares a human-reviewed release recommendation.</p>
        </section>
        <AnalysisWorkspace />
      </main>

      <footer className="mt-14 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 sm:px-6 lg:px-8">Deterministic local analysis for Phase 1. No external services are connected.</div>
      </footer>
    </div>
  );
}
