# QualiAgent

QualiAgent turns code diffs into explainable QA risks, prioritized regression tests, and a human-reviewed release recommendation. It is a Developer Tools project designed to help engineers and QA reviewers understand what changed, what could break, what to test first, and whether a change appears ready to release.

**Live demo:** [https://qualia-agent.vercel.app](https://qualia-agent.vercel.app)

## What it does

Paste a unified code diff or load one of the included demos. QualiAgent analyzes the change and returns:

- a concise summary of the change;
- an overall risk score and deterministic risk label;
- affected product and engineering areas;
- prioritized risks with explanations and evidence from the diff;
- actionable regression tests with expected outcomes; and
- a release recommendation that explicitly requires qualified human review.

QualiAgent is decision support, not an automated release gate. The final QA and release decision always remains with a human reviewer.

## Demo workflows

### Web authentication

The Web demo changes login validation by normalizing email addresses and enforcing a minimum password length. The analysis highlights risks such as missing-password runtime failures, legacy user lockout, and changed email identity behavior, then prioritizes validation and authentication regression tests.

### Solana transactions

The Solana demo adds fallback RPC submission, a fixed confirmation timeout, and background polling. The analysis identifies transaction-specific risks including duplicate submission, rejected wallet signatures, RPC timeouts, delayed confirmation, and stale frontend state.

Both demo buttons load realistic unified diffs. Analysis normally runs through the server-side AI route; if that request fails for an unchanged bundled demo, the application can display its corresponding deterministic local fixture. Unrelated custom diffs are never misclassified as either demo.

## Technology stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- OpenAI JavaScript SDK
- OpenAI Responses API with GPT-5.6
- ESLint 9 with the Next.js configuration
- Vercel for production hosting

## How the AI analysis works

The browser sends the submitted diff to the Next.js `POST /api/analyze` route. The server validates the input, keeps the OpenAI API key server-side, and calls GPT-5.6 through the OpenAI Responses API.

The request uses strict Structured Outputs with an application-defined JSON Schema for summaries, scores, affected areas, evidence-backed risks, recommended tests, and the release recommendation. The returned JSON is then validated again by application code before it is sent to the browser. Unknown fields, invalid ranges, unsupported severity or priority values, empty required content, and malformed structures are rejected safely.

The model supplies a validated integer `riskScore` from 0 to 100, but it does not control the displayed overall risk label. QualiAgent derives that label from one application-owned mapping:

- 0–39: Low Risk
- 40–69: Medium Risk
- 70–100: High Risk

Individual finding severities remain independent of the overall label. Provider retries are disabled, and the server uses an abortable 45-second request timeout with safe error responses.

## Local development

### Prerequisites

- Node.js compatible with Next.js 16
- npm
- an OpenAI API key

### Installation

```bash
git clone https://github.com/Daviths300/qualia-agent.git
cd qualia-agent
npm install
```

Create a local `.env.local` file:

```bash
OPENAI_API_KEY=your_openai_api_key
# Optional; defaults to gpt-5.6
OPENAI_MODEL=gpt-5.6
```

Never commit `.env.local` or expose the API key to browser code.

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Run static validation:

```bash
npm run lint
npm run build
```

## Suggested testing flow for judges

1. Open the [live demo](https://qualia-agent.vercel.app) and read the product promise and human-review notice.
2. Select **Load Web Demo**, run **Analyze Change**, and verify that the result explains the authentication change, cites concrete diff evidence, and prioritizes the missing-password and legacy-account checks.
3. Select **Load Solana Demo**, run the analysis, and compare its transaction-specific risks and regression plan with the Web result.
4. Paste a small unified diff of your own and verify that the response remains grounded in the submitted change rather than reusing a demo fixture.
5. Confirm that every supported result clearly presents the risk score, derived risk label, affected areas, prioritized tests, release guidance, and the requirement for human approval.

## Built with Codex

Codex accelerated the implementation by helping translate the product brief into a small vertical architecture, integrate the OpenAI Responses API, define strict domain types and Structured Outputs, build layered response validation, add focused boundary checks, debug asynchronous request and timeout behavior, and validate production builds for Vercel deployment. It also shortened iteration cycles by reviewing diffs, running lint and production builds, and isolating narrowly scoped correctness fixes.

The human creator retained control of the key product and engineering decisions: the Developer Tools use case, product scope, Web and Solana scenarios, risk-label thresholds, human-review principle, model and runtime configuration, API-key ownership, deployment decisions, and final acceptance of every implementation change. QualiAgent likewise leaves each real release recommendation with a qualified human reviewer.

## License

This project is available under the [MIT License](LICENSE).
