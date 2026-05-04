# PropTech Semantic Search — Rich Showcase Design

**Status:** draft for review
**Author:** Ed (with Claude)
**Date:** 2026-05-04
**Page:** `/projects/proptech` on the portfolio site

---

## 1. Goal and audience

A deep, technically credible showcase of the PropTech Semantic Search project. Hybrid format: a small interactive hero anyone can poke at, followed by a structured engineering case study that holds up to a code review.

**Primary readers:**

- Founder / CTO of a proptech-shaped startup (Spacenplace and similar) clicking through from a cover letter
- Senior engineer evaluating "can this person actually ship production AI"
- Recruiter scanning for credible numbers and named technologies

**Success criteria:**

- 30-second skim: reader sees the interactive hero work, key metric and provider switch
- 3-minute read: reader understands the architecture, the cost story, and the eval-as-CI-gate idea
- 7-minute read: reader can name three non-obvious decisions with rationale and at least one tradeoff

**Non-goals:**

- A blog. No author photo, no narrative voice "as I was sitting at my desk".
- A live backend. Hero responses are pre-recorded snapshots from a real eval run.
- A theme switch, animations, parallax.

---

## 2. Page model and routing

Current `/projects/proptech` is rendered by `src/pages/projects/[slug].astro` from the markdown collection entry `src/content/projects/proptech.md` through the generic `ShowcaseLayout`.

The rich showcase needs custom components (interactive hero, provider chart, annotated HTTP response, code excerpts with callouts, PR diff visualisation). Markdown alone does not embed Astro components without MDX, and `[slug].astro` is shared with other deep projects.

**Decision:** create a dedicated route `src/pages/projects/proptech.astro` that takes precedence over the dynamic `[slug]`. It still pulls metadata from `proptech.md` (title, tagline, status, year, stack, links, metrics) so the project card on the homepage stays consistent, but the body is laid out by hand with components.

`proptech.md` keeps its frontmatter as the canonical metadata source. Body content moves into the dedicated page; the markdown body becomes a short summary used for the homepage card and OG description.

The dynamic route excludes `proptech` (filter on `p.data.slug !== 'proptech'`) so it does not also try to render the generic version.

---

## 3. Sections (11)

Numbered, in scroll order. Each row: what it shows · primary data source · component(s).

| #  | Section | Shows | Data | Component |
|----|---|---|---|---|
| 1  | **Interactive hero** | 5 pre-recorded queries the reader can flip through; each shows the natural-language query, response top-3 with explanations, X-Cost-USD, X-Provider, X-Duration-Ms | `evals/results/<run-id>.json` snapshots from a real eval run | `proptech/InteractiveHero.astro` (new) |
| 2  | **Why filters fail** | A representative filter UI on the left vs lifestyle query on the right; shows a query like "family with kids and a dog" landing on no useful UI | Two static screenshots or HTML mocks | `BeforeAfterSplit.astro` (reuse) |
| 3  | **Architecture** | Mermaid diagram of pipeline with cost middleware as parallel branch; one paragraph of prose | Existing mermaid + revised text | inline mermaid in page |
| 4  | **Pipeline deep-dive** | Three stages: intent parse, retrieve, rerank+explain. For each: input, what runs, output, "what surprised me" observation | Same eval run as hero, plus prose | `PipelineStage.astro` (reuse) ×3 |
| 5  | **Multi-provider client** | Side-by-side: the protocol interface, then a 12-line Ollama client and a 12-line OpenAI client implementing it. One annotated callout: "switching providers is one env var" | Excerpts from `app/services/llm.py` | `proptech/CodeExcerpt.astro` (new, supports inline annotations) |
| 6  | **Cost middleware** | Annotated `curl -i` response showing X-Cost-USD plus shadow headers. Each header has a hover/static tooltip explaining what feeds it | Real headers from a real call (NIM provider) | `proptech/AnnotatedResponse.astro` (new) |
| 7  | **Provider showdown** | Bar chart: cost ($) and latency (ms) per provider on the same workload. Same 5 queries × 3 providers (Ollama / NIM / OpenAI) | Real numbers from the eval run, written into a small JSON file used at build time | `proptech/ProviderChart.astro` (new, server-renders SVG) |
| 8  | **Eval as CI gate** | A simulated PR diff ("metrics report" markdown rendered like a GitHub diff) showing precision regression caught before merge | Hand-crafted but plausible diff based on the actual eval format | `proptech/EvalDiff.astro` (new) |
| 9  | **Tradeoffs** | 3–5 short cards: "what I picked vs alternative vs why". Examples: Qdrant vs pgvector, two-call rerank vs one-shot, sync eval vs streaming | Prose | inline cards |
| 10 | **Roadmap** | What's next on the project (re-rank ablation, streaming responses, multi-modal listing photos). Stays honest about not-yet-done work | `docs/ROADMAP.md` from the repo | inline list |
| 11 | **Stack and links** | Stack chips and external links | `proptech.md` frontmatter | `StackList`, `LinksList` (reuse) |

---

## 4. Component plan

**Reuse:**

- `BeforeAfterSplit.astro` — section 2
- `PipelineStage.astro` — section 4
- `MetricsTable.astro`, `StackList.astro`, `LinksList.astro` — frontmatter-driven sections
- `Sidebar.astro` — section nav (extended labels for the 11 sections)
- `BaseLayout.astro` — shell, head, OG tags

**New components, all under `src/components/proptech/`:**

- `InteractiveHero.astro` — chip selector + response panel. Receives the parsed hero queries via Astro prop. The chip-click swap is implemented as a small inline `<script>` that toggles `hidden` on pre-rendered response panels (one per query). No framework hydration needed. ~150 lines.
- `CodeExcerpt.astro` — code block with optional inline `[[1]]` callout markers and a numbered annotation list below. ~80 lines.
- `AnnotatedResponse.astro` — pre-formatted HTTP response with per-header annotations beside or below. ~80 lines.
- `ProviderChart.astro` — server-rendered SVG bar chart from a JSON input (no client JS). ~100 lines.
- `EvalDiff.astro` — markdown rendered with diff-aware styling (added/removed lines); takes a string or a path to a fixture. ~80 lines.

**One shared data file:**

- `src/content/proptech-data/hero-queries.json` — the 5 hero query snapshots
- `src/content/proptech-data/provider-showdown.json` — the chart numbers
- `src/content/proptech-data/eval-diff.md` — fixture for section 8

(Or a single `proptech-data.json` if simpler. Decide during implementation.)

---

## 5. Data plan: real numbers

The eval has not been run end-to-end yet (`evals/results/` is empty, `must_match` arrays in `queries.yaml` are empty stubs). Without this, the showcase ships either fake numbers or missing numbers.

**Pre-implementation work (one-shot, in the proptech repo):**

1. Pick the 5 hero queries from `evals/queries.yaml` (the strongest scenarios: `family_with_pool`, `young_professional_modern`, `dog_owner_yard`, `remote_worker_quiet`, `elderly_parents_quiet`).
2. Write `evals/seed_labels.py` (referenced in `queries.yaml` but missing). It runs an LLM over the dataset and proposes `must_match` / `should_match` per query. Use OpenAI gpt-4o for the labelling pass — it's the cheap-but-strong default for this kind of classification.
3. Manually review the seeded labels — at least the 5 hero ones must be hand-verified.
4. Run the eval against all three providers: Ollama (local), NIM (key in `.env`), OpenAI (key in `.env`).
5. Capture for each query: response body, X-Cost-USD, X-Cost-Shadow-* headers, X-Duration-Ms.
6. Commit results to `evals/results/2026-05-04-baseline-{ollama,nim,openai}.json`.
7. Generate the three data files for the portfolio (hero-queries, provider-showdown, eval-diff) from the commits.

**Honesty rules baked into the page:**

- Numbers in the metric strip (precision@1, MRR, latency) reference the run id and date in a hover-text or footnote.
- Cost numbers are real `(prompt_tokens × price_per_million)` calculated by the cost middleware, not napkin math.
- Roadmap stays honest about what is not done (e.g., the rerank ablation, the streaming response variant).

If steps 1–7 are too costly to run before showcase work, fallback is option B from earlier (Ollama-real, NIM/OpenAI projected from token counts) — but **only after explicit fallback decision**, with a visible "projected from token counts × published pricing" label on those numbers.

---

## 6. Visual and interaction defaults

- Dark dev-aesthetic, same Tailwind tokens as the existing site (`bg`, `surface`, `border`, `accent`, `text`, `text-muted`).
- JetBrains Mono / system mono for all code, response bodies, headers, metric values.
- Sidebar visible on `lg:` and up (≥1024 px); on smaller screens it collapses to a top-of-page sticky section nav.
- Interactive hero is the **only** place client JS runs, and only as a small inline `<script>` toggling `hidden` on pre-rendered response panels — no Astro hydration directive, no framework. If JS fails to load, all panels render and the chip click is a no-op; the hero still shows the first query and response.
- Mermaid uses the existing `astro-mermaid` integration.
- Charts in section 7 render as SVG at build time — no client chart library.
- Accessibility: chips in interactive hero are real `<button>` elements with `aria-pressed`; SVG charts have `<title>` and `<desc>`; annotated HTTP response is a `<dl>` so it makes sense to a screen reader.
- OG image continues using the existing `astro-og-canvas` setup, no special treatment.

---

## 7. Subagent parallelization

The work splits cleanly into independent tracks. Five subagents run **in parallel** from the start. The data-runner produces the real numbers; component builders work against fixture stubs that match the same JSON shape, then swap to real data when data-runner finishes.

1. **data-runner** — does the eval pre-work in section 5, lands `evals/results/*` and the three data files. Long-running (half a day) but does not block the others.
2. **page-shell** — creates `src/pages/projects/proptech.astro`, wires section anchors, sidebar, frontmatter import, OG. Excludes proptech from `[slug].astro`. Does sections 2, 3, 9, 10, 11 inline (those need no new component beyond reuse). Uses fixture data files initially.
3. **interactive-hero** — builds `InteractiveHero.astro` and consumes the hero queries data via Astro prop. Independent of page-shell once the slot is defined.
4. **provider-chart** — builds `ProviderChart.astro` (server-rendered SVG) and consumes the provider-showdown JSON via Astro prop.
5. **annotated-blocks** — builds `CodeExcerpt.astro`, `AnnotatedResponse.astro`, `EvalDiff.astro`. Three small components share styling primitives.

Coordination contract: every component takes its data via Astro props and never reads disk directly. The page assembles props from the JSON files. The data file shapes are defined in the spec (Appendix B) so component builders can stub against them before data-runner is done. This is the seam that lets all five run independently.

A sixth small task — **content-pass** — runs after the components land: writes the prose for sections 2, 3, 4, 9, 10 against the new shape. This is sequential, last.

---

## 8. Open questions

These are the ones I want Ed to resolve on mobile.

1. **Section 5 — code language.** Show Python (the actual repo) or pseudocode? Python is more credible but slightly noisier.
2. **Section 8 — eval CI gate visualisation.** PR diff style (added/removed lines) or a side-by-side "before / after merge" report? PR diff is more dramatic; side-by-side is easier to read.
3. **Hero query count.** I picked 5. Is 5 right, or 6, or 4? More than 6 starts feeling like a quiz.
4. **Roadmap honesty.** Do you want the "what's not done yet" list to call out the specific gaps (rerank ablation, streaming, multi-modal photos), or stay generic?
5. **Domain.** Page lives at `/projects/proptech` regardless of whether the site is on `thelonius.github.io` or a custom domain. Anything to coordinate?

If you don't reach this section before I start drafting, I will pick: Python · PR diff · 5 · specific gaps · no special coordination.

---

## 9. Out of scope

- A live backend or live demo. Snapshots only.
- Multilingual page. EN only matches the audience and the rest of the site.
- Re-running the existing other project pages. They stay on the generic `[slug].astro`.
- Search engine for the portfolio site itself.
- Video or animated explainers.

---

## 10. Risks

- **Data run is heavier than expected.** Budget half a day for the full eval pre-work. If labelling is the bottleneck, fall back to option B with the label clearly visible.
- **Astro 6 + new components.** No SSR concerns since this is a static build, but watch out for the `client:load` directive on the interactive hero — it's the only component that ships JS.
- **Honesty mismatch.** If the run-id / date in the page lags the repo, the page should show "as of <date>" and link to the eval results commit.

---

## Appendix A — file plan

```
portfolio-site/
├── src/
│   ├── pages/projects/
│   │   ├── [slug].astro                    (modified: exclude proptech)
│   │   └── proptech.astro                  (new: dedicated rich page)
│   ├── components/
│   │   └── proptech/
│   │       ├── InteractiveHero.astro       (new)
│   │       ├── CodeExcerpt.astro           (new)
│   │       ├── AnnotatedResponse.astro     (new)
│   │       ├── ProviderChart.astro         (new)
│   │       └── EvalDiff.astro              (new)
│   └── content/
│       ├── projects/proptech.md            (modified: body shrunk to summary)
│       └── proptech-data/
│           ├── hero-queries.json           (new)
│           ├── provider-showdown.json      (new)
│           └── eval-diff.md                (new)
└── docs/superpowers/specs/
    └── 2026-05-04-proptech-rich-showcase-design.md  (this file)

proptech-semantic-search/                   (separate repo, parallel work)
├── evals/
│   ├── queries.yaml                        (modified: must_match for 5 hero queries)
│   ├── seed_labels.py                      (new — file is missing today)
│   └── results/
│       ├── 2026-05-04-baseline-ollama.json (new)
│       ├── 2026-05-04-baseline-nim.json    (new)
│       └── 2026-05-04-baseline-openai.json (new)
```

---

## Appendix B — data file shapes

These are the shared contracts between data-runner and the visual subagents. Component builders stub against these shapes; data-runner produces the real values.

**`hero-queries.json`**

```jsonc
{
  "run_id": "2026-05-04-baseline",
  "captured_at": "2026-05-04T11:32:00Z",
  "queries": [
    {
      "id": "family_with_pool",
      "query": "Family with two kids looking for a house with swimming pool and garden",
      "provider": "nim",
      "duration_ms": 1640,
      "cost_usd": 0.000040,
      "shadow_cost_openai_usd": 0.000127,
      "shadow_cost_nim_usd": 0.000040,
      "results": [
        {
          "id": "listing_4711",
          "score": 0.93,
          "title": "3-bedroom house with private pool, fenced garden",
          "explanation": "Quiet residential street, fenced garden, proximity to a primary school"
        }
        // up to 3 results
      ]
    }
    // up to 5 queries
  ]
}
```

**`provider-showdown.json`**

```jsonc
{
  "run_id": "2026-05-04-baseline",
  "workload": "5 queries × 3 providers, same prompts, same retrieval",
  "providers": [
    {
      "name": "ollama",
      "model": "qwen3.5:9b",
      "mean_cost_usd": 0.0,
      "p50_latency_ms": 38000,
      "p95_latency_ms": 52000,
      "note": "local, free; M1 Pro"
    },
    {
      "name": "nim",
      "model": "<from .env>",
      "mean_cost_usd": 0.000041,
      "p50_latency_ms": 1640,
      "p95_latency_ms": 2100
    },
    {
      "name": "openai",
      "model": "<from .env>",
      "mean_cost_usd": 0.000127,
      "p50_latency_ms": 1820,
      "p95_latency_ms": 2400
    }
  ]
}
```

**`eval-diff.md`**

A markdown fragment shaped like a CI report from a hypothetical PR. The component renders it with diff-aware styling (`+` lines green, `-` lines red, `=` lines neutral). Example body:

```
=  Eval run: 2026-05-04-baseline → 2026-05-04-feature-rerank-v2
=
=  Query                          precision@1   MRR     Δ
-  family_with_pool                    1.00     1.00
+  family_with_pool                    0.00     0.50    ❌ regression
=  young_professional_modern           1.00     1.00
=  remote_worker_quiet                 1.00     1.00
+  dog_owner_yard                      1.00     0.67    ✓
+  elderly_parents_quiet               1.00     1.00
=
+  CI gate: precision@1 dropped on family_with_pool. Blocking merge.
```

The component takes a `caption` prop. The page passes an honest-by-default caption: "Illustrative CI report. The baseline numbers (left column) are from the real 2026-05-04 run; the regression branch is fabricated to show what the gate would print." This keeps the artefact useful without claiming a regression that never happened.
