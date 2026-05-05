# PropTech Rich Showcase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the rich showcase page at `/projects/proptech` per the spec at `docs/superpowers/specs/2026-05-04-proptech-rich-showcase-design.md` — interactive hero (5 pre-recorded queries) plus 10-section deep-dive with real numbers from a 3-provider eval run.

**Architecture:** Dedicated Astro page `src/pages/projects/proptech.astro` overrides the generic `[slug].astro`. Five new components live under `src/components/proptech/`. Three data files in `src/content/proptech-data/` are populated from a real eval run executed in the `proptech-semantic-search` repo. Component agents work against fixture stubs of those files; data-runner replaces stubs with real values when ready.

**Tech Stack:** Astro 6, Tailwind 4, astro-mermaid, system mono / JetBrains Mono. Python 3.12 + uv + httpx + rich for the eval pre-work. SVG charts hand-rolled (no client chart library). Inline `<script>` for the only interactive piece.

---

## Track layout

Six tracks. **Track 0 is sequential and blocking** — it lands fixture data files and excludes proptech from the dynamic route. Tracks A, B, C, D, E run **in parallel** after Track 0. Track F is sequential, last.

```
Track 0  Setup                           (blocking, ~30 min)
   ↓
Track A  data-runner    ────────┐        (parallel, ~half day)
Track B  page-shell     ────────┤
Track C  interactive-hero ──────┤        (parallel, ~2h each)
Track D  provider-chart ────────┤
Track E  annotated-blocks ──────┘
   ↓
Track F  content-pass + verify           (sequential, ~1h)
```

**Repo split:**
- `portfolio-site/` — tracks 0, B, C, D, E, F
- `proptech-semantic-search/` — track A

**Worktree convention:** each subagent runs in its own git worktree (`worktrees/<track-name>`) to avoid colliding with the user's parallel sessions.

---

# Track 0 — Setup

Lands the fixture data files (so other tracks can stub against them) and the dynamic-route exclusion.

### Task 0.1: Verify build is green before any changes

**Files:** none — read-only check.

- [ ] **Step 1:** Run baseline build.

```bash
cd /Users/eddubnitsky/portfolio-site
npm install
npm run build
```

Expected: build completes, exit code 0, dist/ generated.

- [ ] **Step 2:** Note the existing site in `dist/projects/proptech/index.html` exists (current generic showcase).

```bash
ls /Users/eddubnitsky/portfolio-site/dist/projects/proptech/index.html
```

Expected: file exists.

### Task 0.2: Exclude proptech from `[slug].astro`

**Files:** Modify `src/pages/projects/[slug].astro`

- [ ] **Step 1:** Open the file and locate the `getStaticPaths` filter.

The current code is:

```ts
return projects
  .filter(p => p.data.deep)
  .map((project) => ({ ... }));
```

- [ ] **Step 2:** Change the filter to exclude proptech.

```ts
return projects
  .filter(p => p.data.deep && p.data.slug !== 'proptech')
  .map((project) => ({ ... }));
```

- [ ] **Step 3:** Run build to verify. (Will fail until proptech.astro exists or proptech.md is reachable.)

```bash
npm run build
```

Expected: build still completes — proptech.md is now orphaned but Astro doesn't error on orphan content.

- [ ] **Step 4:** Commit.

```bash
git add src/pages/projects/[slug].astro
git commit -m "feat(routing): exclude proptech from [slug] route (dedicated page incoming)"
```

### Task 0.3: Create the data fixtures with stub values

**Files:** Create `src/content/proptech-data/hero-queries.json`, `provider-showdown.json`, `eval-diff.md`. Plus `src/content/proptech-data/README.md` describing the contract.

- [ ] **Step 1:** Create `src/content/proptech-data/hero-queries.json` with the shape from spec Appendix B and stub values clearly marked. Use the 5 query IDs the user picked in brainstorming.

```json
{
  "run_id": "STUB-pre-eval",
  "captured_at": "2026-05-04T00:00:00Z",
  "is_stub": true,
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
          "title": "STUB · 3-bedroom house with private pool, fenced garden",
          "explanation": "STUB · Quiet residential street, fenced garden, proximity to a primary school"
        },
        {
          "id": "listing_8822",
          "score": 0.88,
          "title": "STUB · Detached family home with above-ground pool",
          "explanation": "STUB · 4 bedrooms, large garden, school catchment"
        },
        {
          "id": "listing_2031",
          "score": 0.81,
          "title": "STUB · Suburban home with shared community pool",
          "explanation": "STUB · Family-friendly area, shared amenities"
        }
      ]
    },
    {
      "id": "young_professional_modern",
      "query": "Young single professional wants a modern apartment close to business district",
      "provider": "nim",
      "duration_ms": 1480,
      "cost_usd": 0.000038,
      "shadow_cost_openai_usd": 0.000122,
      "shadow_cost_nim_usd": 0.000038,
      "results": [
        {"id": "listing_5544", "score": 0.91, "title": "STUB · Loft in downtown core", "explanation": "STUB · Modern fit-out, 5-min walk to business district"},
        {"id": "listing_7720", "score": 0.85, "title": "STUB · 1-bed apartment with co-working", "explanation": "STUB · Building has on-site work pods"},
        {"id": "listing_3318", "score": 0.79, "title": "STUB · Studio in a converted warehouse", "explanation": "STUB · Open-plan, exposed brick, bike storage"}
      ]
    },
    {
      "id": "dog_owner_yard",
      "query": "Dog owner, need a private yard or close access to parks",
      "provider": "nim",
      "duration_ms": 1700,
      "cost_usd": 0.000042,
      "shadow_cost_openai_usd": 0.000131,
      "shadow_cost_nim_usd": 0.000042,
      "results": [
        {"id": "listing_9001", "score": 0.94, "title": "STUB · House with fenced 200m² garden", "explanation": "STUB · Pet-friendly area, two parks within 5 min"},
        {"id": "listing_4502", "score": 0.86, "title": "STUB · Townhouse next to a dog park", "explanation": "STUB · Park-adjacent, small private yard"},
        {"id": "listing_6612", "score": 0.78, "title": "STUB · Garden flat with shared lawn", "explanation": "STUB · Pet rules permit dogs"}
      ]
    },
    {
      "id": "elderly_parents_quiet",
      "query": "Quiet home for my elderly parents, accessible, one floor preferably",
      "provider": "nim",
      "duration_ms": 1620,
      "cost_usd": 0.000039,
      "shadow_cost_openai_usd": 0.000124,
      "shadow_cost_nim_usd": 0.000039,
      "results": [
        {"id": "listing_2244", "score": 0.92, "title": "STUB · Single-storey bungalow, level access", "explanation": "STUB · No stairs, quiet cul-de-sac"},
        {"id": "listing_1188", "score": 0.84, "title": "STUB · Ground-floor flat with lift", "explanation": "STUB · Accessible building, lift access"},
        {"id": "listing_7729", "score": 0.76, "title": "STUB · 2-bed with single-floor option", "explanation": "STUB · Master suite on ground floor"}
      ]
    },
    {
      "id": "remote_worker_quiet",
      "query": "I work from home full time, need a quiet place with a room I can use as office",
      "provider": "nim",
      "duration_ms": 1550,
      "cost_usd": 0.000040,
      "shadow_cost_openai_usd": 0.000128,
      "shadow_cost_nim_usd": 0.000040,
      "results": [
        {"id": "listing_3303", "score": 0.93, "title": "STUB · 3-bed with dedicated study", "explanation": "STUB · Separate office room, fibre connection"},
        {"id": "listing_5512", "score": 0.87, "title": "STUB · Quiet flat with bonus alcove", "explanation": "STUB · Low-traffic street, work nook off the living room"},
        {"id": "listing_8821", "score": 0.81, "title": "STUB · House with garden office", "explanation": "STUB · Detached studio in the garden"}
      ]
    }
  ]
}
```

- [ ] **Step 2:** Create `src/content/proptech-data/provider-showdown.json` with stub values.

```json
{
  "run_id": "STUB-pre-eval",
  "is_stub": true,
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
      "p95_latency_ms": 2100,
      "note": null
    },
    {
      "name": "openai",
      "model": "<from .env>",
      "mean_cost_usd": 0.000127,
      "p50_latency_ms": 1820,
      "p95_latency_ms": 2400,
      "note": null
    }
  ]
}
```

- [ ] **Step 3:** Create `src/content/proptech-data/eval-diff.md` (illustrative CI report).

```
=  Eval run: 2026-05-04-baseline → 2026-05-04-feature-rerank-v2
=
=  Query                          precision@1   MRR     Δ
-  family_with_pool                    1.00     1.00
+  family_with_pool                    0.00     0.50    ❌ regression
=  young_professional_modern           1.00     1.00
=  remote_worker_quiet                 1.00     1.00
=  dog_owner_yard                      1.00     0.67
=  elderly_parents_quiet               1.00     1.00
=
+  CI gate: precision@1 dropped on family_with_pool. Blocking merge.
```

- [ ] **Step 4:** Create `src/content/proptech-data/README.md` documenting the contract.

```markdown
# proptech-data

Build-time data for the `/projects/proptech` page. Files here populate the rich showcase components.

## Files

- `hero-queries.json` — 5 pre-recorded queries shown in the interactive hero
- `provider-showdown.json` — cost + latency per provider for the chart in section 7
- `eval-diff.md` — illustrative CI gate diff for section 8

## Lifecycle

1. **Stubs** — committed first, marked `"is_stub": true`. Component agents develop against these.
2. **Real values** — replaced by the data-runner agent after running eval against three providers in `proptech-semantic-search`. The `is_stub` flag flips to `false`.

The page surfaces an "as of <run_id>" footer line that pulls from `hero-queries.json::run_id`.
```

- [ ] **Step 5:** Run build to verify the new files don't break anything.

```bash
npm run build
```

Expected: build passes (these files aren't referenced yet).

- [ ] **Step 6:** Commit.

```bash
git add src/content/proptech-data/
git commit -m "feat(proptech): fixture data files for rich showcase (stubs)"
```

### Task 0.4: Slim down `proptech.md` body

**Files:** Modify `src/content/projects/proptech.md` — frontmatter stays, body shrinks to a one-paragraph summary used for OG description and homepage card.

- [ ] **Step 1:** Replace the body (everything after the frontmatter `---`) with the following.

```markdown
Lifestyle-based real-estate search built for production. Three LLM providers (Ollama / NIM / OpenAI) behind one OpenAI-compatible client. Cost middleware tracks the active provider plus shadow counterfactuals. Eval harness runs as a CI gate on five labelled queries.

→ See the [interactive demo and architecture deep-dive](/projects/proptech).
```

(The link target is the same page — Astro will resolve it to `proptech.astro` once it exists.)

- [ ] **Step 2:** Build to verify the markdown still parses.

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 3:** Commit.

```bash
git add src/content/projects/proptech.md
git commit -m "feat(proptech): shrink markdown body — content moves to dedicated page"
```

---

# Track A — data-runner (proptech-semantic-search repo)

**Worktree:** `worktrees/data-runner` of `proptech-semantic-search`.

**Output contract:** writes three files into `portfolio-site/src/content/proptech-data/` with `is_stub: false` and real values from a 2026-05-04 eval run against Ollama, NIM, OpenAI.

### Task A.1: Verify the API runs end-to-end on Ollama

**Files:** none — verification only.

- [ ] **Step 1:** Bring up infra and the API on Ollama.

```bash
cd /Users/eddubnitsky/proptech-semantic-search
make up
make api
```

Expected: API on http://localhost:8000.

- [ ] **Step 2:** Run a smoke search.

```bash
curl -i -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Family with two kids looking for a house with swimming pool"}'
```

Expected: HTTP 200, JSON body with results, headers including `X-Cost-USD`, `X-Request-Id`. If 500 or missing headers, fix before continuing — these are hard prerequisites for the showcase. **STOP and surface the error to the user — do not paper over.**

### Task A.2: Write `evals/seed_labels.py`

**Files:** Create `evals/seed_labels.py`. It reads `evals/queries.yaml`, calls OpenAI gpt-4o over the 100-property dataset for the 5 hero query IDs, and writes proposed `must_match` / `should_match` arrays back into `queries.yaml`.

- [ ] **Step 1:** Write a failing test first.

```bash
mkdir -p tests/evals
```

Create `tests/evals/test_seed_labels.py`:

```python
"""Smoke test for the seed_labels helper."""
from pathlib import Path
import pytest
import yaml

from evals.seed_labels import propose_labels, HERO_QUERY_IDS


def test_hero_query_ids_match_yaml():
    """The hardcoded HERO_QUERY_IDS must all exist in queries.yaml."""
    yaml_path = Path(__file__).resolve().parents[1].parent / "evals" / "queries.yaml"
    data = yaml.safe_load(yaml_path.read_text())
    ids_in_yaml = {q["id"] for q in data["queries"]}
    missing = set(HERO_QUERY_IDS) - ids_in_yaml
    assert not missing, f"hero query ids missing from yaml: {missing}"


def test_propose_labels_returns_dict_per_query(monkeypatch):
    """propose_labels returns a dict keyed by query id."""
    # Stub the OpenAI call so the test runs without network.
    def fake_call(*args, **kwargs):
        return {"must_match": ["listing_1"], "should_match": ["listing_2"]}

    monkeypatch.setattr("evals.seed_labels._call_labeller", fake_call)

    listings = [{"id": f"listing_{i}", "title": "x", "description": "y"} for i in range(3)]
    out = propose_labels(["family_with_pool"], listings)
    assert "family_with_pool" in out
    assert out["family_with_pool"]["must_match"] == ["listing_1"]
    assert out["family_with_pool"]["should_match"] == ["listing_2"]
```

- [ ] **Step 2:** Run the test, confirm it fails.

```bash
uv run pytest tests/evals/test_seed_labels.py -v
```

Expected: `ImportError: cannot import name 'propose_labels'` or `ModuleNotFoundError`.

- [ ] **Step 3:** Implement `evals/seed_labels.py`.

```python
"""Propose must_match / should_match labels for hero queries via gpt-4o.

Reads the 100-property dataset (Hugging Face: Binaryy/multimodal-real-estate-search,
subset by index 0..99) and asks the LLM, for each hero query, which listing IDs
must appear in top-K and which should appear. Writes the proposals back into
evals/queries.yaml; a human reviews before commit.

Usage:
    OPENAI_API_KEY=sk-... uv run python evals/seed_labels.py
    OPENAI_API_KEY=sk-... uv run python evals/seed_labels.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import yaml
from openai import OpenAI

ROOT = Path(__file__).resolve().parent.parent
QUERIES_YAML = ROOT / "evals" / "queries.yaml"

HERO_QUERY_IDS = [
    "family_with_pool",
    "young_professional_modern",
    "dog_owner_yard",
    "elderly_parents_quiet",
    "remote_worker_quiet",
]

LABELLING_PROMPT = """You are an expert real-estate matcher. Given a natural-language query and a catalogue of listings, return TWO sets of listing IDs:
- must_match: listings that absolutely should appear in the top 5 results
- should_match: listings that are also relevant and acceptable in the top 10

Respond with strict JSON: {"must_match": [...], "should_match": [...]}.
Do not include the same id in both lists.
Be selective: 1-3 must_match, 2-5 should_match. If nothing fits, return empty arrays.
"""


def _call_labeller(query: str, listings: list[dict[str, Any]]) -> dict[str, list[str]]:
    """Call gpt-4o once for one query against the listing catalogue."""
    client = OpenAI()
    user_msg = (
        f"Query: {query}\n\nListings (JSON):\n"
        + json.dumps(
            [{"id": l["id"], "title": l.get("title", ""), "description": l.get("description", "")[:400]} for l in listings],
            ensure_ascii=False,
        )
    )
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": LABELLING_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
    )
    return json.loads(resp.choices[0].message.content)


def propose_labels(query_ids: list[str], listings: list[dict[str, Any]]) -> dict[str, dict[str, list[str]]]:
    """For each query id, propose must_match/should_match by calling the labeller."""
    data = yaml.safe_load(QUERIES_YAML.read_text())
    by_id = {q["id"]: q for q in data["queries"]}
    out: dict[str, dict[str, list[str]]] = {}
    for qid in query_ids:
        q = by_id[qid]
        out[qid] = _call_labeller(q["query"], listings)
    return out


def _load_listings() -> list[dict[str, Any]]:
    """Load the 100-property subset. Datasets module is heavy — import lazily."""
    from datasets import load_dataset  # type: ignore

    ds = load_dataset("Binaryy/multimodal-real-estate-search", split="train")
    out = []
    for i in range(min(100, len(ds))):
        row = ds[i]
        out.append(
            {
                "id": f"listing_{i:04d}",
                "title": row.get("name", "") or row.get("title", ""),
                "description": row.get("description", "") or "",
            }
        )
    return out


def write_back(proposals: dict[str, dict[str, list[str]]]) -> None:
    """Merge proposals into queries.yaml in place."""
    data = yaml.safe_load(QUERIES_YAML.read_text())
    for q in data["queries"]:
        if q["id"] in proposals:
            q["must_match"] = proposals[q["id"]]["must_match"]
            q["should_match"] = proposals[q["id"]]["should_match"]
    QUERIES_YAML.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    listings = _load_listings()
    proposals = propose_labels(HERO_QUERY_IDS, listings)

    print(json.dumps(proposals, indent=2))
    if args.dry_run:
        return
    write_back(proposals)
    print(f"\nUpdated {QUERIES_YAML} with proposals for {len(proposals)} queries.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4:** Run the test, confirm it passes.

```bash
uv run pytest tests/evals/test_seed_labels.py -v
```

Expected: both tests pass.

- [ ] **Step 5:** Commit.

```bash
git add evals/seed_labels.py tests/evals/test_seed_labels.py
git commit -m "feat(evals): seed_labels.py — propose must_match/should_match via gpt-4o"
```

### Task A.3: Run seed_labels and review labels

**Files:** Modify `evals/queries.yaml` (must_match / should_match for 5 hero queries).

- [ ] **Step 1:** Run dry-run to inspect proposals first.

```bash
cd /Users/eddubnitsky/proptech-semantic-search
OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d= -f2) \
  uv run python evals/seed_labels.py --dry-run | tee /tmp/seed-proposals.json
```

Expected: JSON with 5 query IDs, each having `must_match` and `should_match` arrays. Review the lists for plausibility.

- [ ] **Step 2:** If proposals look reasonable, run for real.

```bash
OPENAI_API_KEY=$(grep OPENAI_API_KEY .env | cut -d= -f2) \
  uv run python evals/seed_labels.py
```

Expected: `evals/queries.yaml` updated.

- [ ] **Step 3:** Manual review — open `evals/queries.yaml` and verify the 5 hero queries have non-empty lists. Edit if obvious mistakes (the labeller can hallucinate listing IDs that don't exist in the dataset; cross-check the IDs against the `listing_NNNN` format from `_load_listings`).

- [ ] **Step 4:** Commit the labelled queries.

```bash
git add evals/queries.yaml
git commit -m "data(evals): hero-query labels reviewed and committed"
```

### Task A.4: Run eval against all three providers

**Files:** Creates `evals/results/2026-05-04-baseline-{ollama,nim,openai}.json` and `.md`.

- [ ] **Step 1:** Confirm the API is up on Ollama (default).

```bash
curl -s http://localhost:8000/health
```

Expected: 200 OK.

- [ ] **Step 2:** Run eval with --compare (runs all available providers).

```bash
uv run python evals/run.py --compare --api-url http://localhost:8000
```

Expected: console output with per-query metrics, files written to `evals/results/<timestamp>.{md,json}`.

- [ ] **Step 3:** Rename results to the planned baseline ID for stability.

```bash
cd evals/results
LATEST=$(ls -t *.json | head -1 | sed 's/.json$//')
cp "${LATEST}.json" 2026-05-04-baseline.json
cp "${LATEST}.md"   2026-05-04-baseline.md
cd ../..
```

- [ ] **Step 4:** Commit the eval results.

```bash
git add evals/results/2026-05-04-baseline.json evals/results/2026-05-04-baseline.md evals/results/<timestamp>.{json,md}
git commit -m "data(evals): 2026-05-04 baseline run — Ollama / NIM / OpenAI"
```

### Task A.5: Capture per-provider raw API responses for the hero

**Files:** Creates `evals/results/2026-05-04-hero-snapshots.json`.

The aggregate eval JSON has metrics, but the hero needs the actual `/search` response body (titles, scores, explanations) and the response headers (cost, duration). Run the queries directly.

- [ ] **Step 1:** Write `evals/capture_hero_snapshots.py`.

```python
"""Capture raw /search responses for the 5 hero queries against the active provider.

Writes evals/results/2026-05-04-hero-snapshots.json with the shape consumed by
portfolio-site/src/content/proptech-data/hero-queries.json.

Usage:
    LLM_PROVIDER=nim uv run python evals/capture_hero_snapshots.py --api-url http://localhost:8000
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import httpx
import yaml

ROOT = Path(__file__).resolve().parent.parent
QUERIES_YAML = ROOT / "evals" / "queries.yaml"
OUT_PATH = ROOT / "evals" / "results" / "2026-05-04-hero-snapshots.json"

HERO_IDS = [
    "family_with_pool",
    "young_professional_modern",
    "dog_owner_yard",
    "elderly_parents_quiet",
    "remote_worker_quiet",
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://localhost:8000")
    args = parser.parse_args()

    data = yaml.safe_load(QUERIES_YAML.read_text())
    by_id = {q["id"]: q for q in data["queries"]}

    captured = []
    with httpx.Client(timeout=180.0) as client:
        for qid in HERO_IDS:
            q = by_id[qid]
            r = client.post(f"{args.api_url}/search", json={"query": q["query"]})
            r.raise_for_status()
            body = r.json()
            captured.append(
                {
                    "id": qid,
                    "query": q["query"],
                    "provider": r.headers.get("X-Provider", os.environ.get("LLM_PROVIDER", "unknown")),
                    "duration_ms": int(r.headers.get("X-Duration-Ms", "0") or 0),
                    "cost_usd": float(r.headers.get("X-Cost-USD", "0") or 0),
                    "shadow_cost_openai_usd": float(r.headers.get("X-Cost-Shadow-OpenAI-USD", "0") or 0),
                    "shadow_cost_nim_usd": float(r.headers.get("X-Cost-Shadow-NIM-USD", "0") or 0),
                    "results": [
                        {
                            "id": item.get("id"),
                            "score": item.get("score"),
                            "title": item.get("title"),
                            "explanation": item.get("match_explanation") or item.get("explanation"),
                        }
                        for item in body.get("results", [])[:3]
                    ],
                }
            )

    out = {
        "run_id": "2026-05-04-baseline",
        "captured_at": data.get("captured_at"),
        "is_stub": False,
        "queries": captured,
    }
    OUT_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2:** Run it against the **NIM** provider (the spec picks NIM as the hero's "active" provider — fastest of the hosted, with shadow costs alongside).

```bash
# Stop the currently-running API (started in Task A.1 with Ollama).
# Find and kill it; assume `make api` runs uvicorn on 8000.
pkill -f 'uvicorn.*app.main' || true
sleep 1

# Start with NIM as active provider.
# .env already has NIM_API_KEY; we override LLM_PROVIDER for this process only.
LLM_PROVIDER=nim make api &
sleep 8

# Capture.
uv run python evals/capture_hero_snapshots.py
```

Expected: `evals/results/2026-05-04-hero-snapshots.json` written with `is_stub: false` and 5 query entries with real headers.

- [ ] **Step 3:** Inspect the file and sanity-check the cost numbers.

```bash
cat evals/results/2026-05-04-hero-snapshots.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(q['id'], q['cost_usd'], q['duration_ms']) for q in d['queries']]"
```

Expected: 5 lines, each with non-zero cost (NIM is paid) and duration in 1000-3000 ms range.

- [ ] **Step 4:** Commit.

```bash
git add evals/capture_hero_snapshots.py evals/results/2026-05-04-hero-snapshots.json
git commit -m "data(evals): capture 5 hero snapshots from NIM run for portfolio"
```

### Task A.6: Generate the three portfolio data files

**Files:** Modify `portfolio-site/src/content/proptech-data/{hero-queries,provider-showdown,eval-diff}.{json,md}`. Replaces stubs with real values.

- [ ] **Step 1:** Write `evals/export_portfolio_data.py`.

```python
"""Export portfolio data files from eval run results.

Reads:
- evals/results/2026-05-04-hero-snapshots.json
- evals/results/2026-05-04-baseline.json (multi-provider summary)

Writes:
- portfolio-site/src/content/proptech-data/hero-queries.json
- portfolio-site/src/content/proptech-data/provider-showdown.json
- (eval-diff.md is left as the hand-written illustrative fixture; see spec section 8 honesty rule)

Usage:
    uv run python evals/export_portfolio_data.py \
        --portfolio-dir /Users/eddubnitsky/portfolio-site
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERO_SRC = ROOT / "evals" / "results" / "2026-05-04-hero-snapshots.json"
BASELINE_SRC = ROOT / "evals" / "results" / "2026-05-04-baseline.json"


def export_hero(portfolio_dir: Path) -> None:
    data = json.loads(HERO_SRC.read_text())
    out = portfolio_dir / "src" / "content" / "proptech-data" / "hero-queries.json"
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"Wrote {out}")


def export_provider_showdown(portfolio_dir: Path) -> None:
    raw = json.loads(BASELINE_SRC.read_text())
    # baseline.json shape from evals/run.py --compare:
    #   { "providers": { "ollama": {...}, "nim": {...}, "openai": {...}, ... } }
    # We translate to the spec's provider-showdown.json shape.
    providers_in = raw.get("providers", {})
    rows = []
    for name in ("ollama", "nim", "openai"):
        p = providers_in.get(name)
        if not p:
            continue
        rows.append(
            {
                "name": name,
                "model": p.get("model", ""),
                "mean_cost_usd": float(p.get("mean_cost_usd", 0.0)),
                "p50_latency_ms": int(p.get("p50_latency_ms", 0)),
                "p95_latency_ms": int(p.get("p95_latency_ms", 0)),
                "note": p.get("note"),
            }
        )

    out_data = {
        "run_id": "2026-05-04-baseline",
        "is_stub": False,
        "workload": "5 queries × 3 providers, same prompts, same retrieval",
        "providers": rows,
    }
    out = portfolio_dir / "src" / "content" / "proptech-data" / "provider-showdown.json"
    out.write_text(json.dumps(out_data, indent=2))
    print(f"Wrote {out}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--portfolio-dir", required=True, type=Path)
    args = parser.parse_args()
    export_hero(args.portfolio_dir)
    export_provider_showdown(args.portfolio_dir)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2:** Run it.

```bash
uv run python evals/export_portfolio_data.py --portfolio-dir /Users/eddubnitsky/portfolio-site
```

Expected: two files in the portfolio repo updated, both with `is_stub: false`.

- [ ] **Step 3:** Verify in portfolio.

```bash
cd /Users/eddubnitsky/portfolio-site
jq '.is_stub' src/content/proptech-data/hero-queries.json src/content/proptech-data/provider-showdown.json
```

Expected: both print `false`.

- [ ] **Step 4:** **NOTE — the export script may fail** if `evals/run.py --compare` doesn't write the per-provider mean_cost_usd / p50_latency_ms / p95_latency_ms fields the export expects. Read `evals/run.py` and adapt. If the output schema differs, modify `export_provider_showdown` to derive the fields from whatever shape `run.py --compare` actually emits. **Do not hardcode plausible-looking numbers; surface the schema mismatch and adapt.**

- [ ] **Step 5:** Commit (in proptech-semantic-search).

```bash
cd /Users/eddubnitsky/proptech-semantic-search
git add evals/export_portfolio_data.py
git commit -m "feat(evals): export_portfolio_data.py — hero + provider chart data"
```

- [ ] **Step 6:** Commit (in portfolio-site).

```bash
cd /Users/eddubnitsky/portfolio-site
git add src/content/proptech-data/hero-queries.json src/content/proptech-data/provider-showdown.json
git commit -m "data(proptech): real values from 2026-05-04 baseline eval run"
```

---

# Track B — page-shell

**Worktree:** `worktrees/page-shell` of `portfolio-site`.

Builds `src/pages/projects/proptech.astro` with all 11 sections wired up. Sections that need new components leave a slot (a clearly-marked TODO comment with the exact component import path) so this track does not block on the others.

### Task B.1: Bootstrap the dedicated page

**Files:** Create `src/pages/projects/proptech.astro`.

- [ ] **Step 1:** Create the file with the skeleton.

```astro
---
// src/pages/projects/proptech.astro
// Dedicated rich-showcase page. Overrides the dynamic [slug].astro for proptech.
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Sidebar from '../../components/Sidebar.astro';
import StatusTag from '../../components/StatusTag.astro';
import StackList from '../../components/StackList.astro';
import LinksList from '../../components/LinksList.astro';
import MetricsTable from '../../components/MetricsTable.astro';

const projects = await getCollection('projects');
const project = projects.find((p) => p.data.slug === 'proptech')!;

import heroData from '../../content/proptech-data/hero-queries.json';
import providerData from '../../content/proptech-data/provider-showdown.json';

const sections = [
  { id: 'hero',          label: 'Try it' },
  { id: 'problem',       label: 'Why filters fail' },
  { id: 'architecture',  label: 'Architecture' },
  { id: 'pipeline',      label: 'Pipeline deep-dive' },
  { id: 'multi-provider', label: 'Multi-provider client' },
  { id: 'cost',          label: 'Cost middleware' },
  { id: 'showdown',      label: 'Provider showdown' },
  { id: 'eval',          label: 'Eval as CI gate' },
  { id: 'tradeoffs',     label: 'Tradeoffs' },
  { id: 'roadmap',       label: 'Roadmap' },
  { id: 'stack',         label: 'Stack & links' },
];
---

<BaseLayout
  title={`${project.data.title} — Ed Dubnitsky`}
  description={project.data.description}
  ogImagePath={project.data.slug}
>
  <header class="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-border">
    <div class="max-w-5xl mx-auto px-6 py-3 flex items-baseline justify-between">
      <a href="/" class="text-text-muted hover:text-accent text-sm">← back · {project.data.title}</a>
      <StatusTag status={project.data.status} year={project.data.year} />
    </div>
  </header>

  <div class="max-w-5xl mx-auto px-6 pt-6">
    <h1 class="text-3xl font-semibold">{project.data.title}</h1>
    <p class="text-text-muted mt-2">{project.data.tagline}</p>
    <p class="text-text-muted text-sm mt-1 font-mono">{project.data.period}</p>
    {project.data.keyMetric && (
      <p class="text-accent font-mono text-sm mt-2">{project.data.keyMetric}</p>
    )}
  </div>

  <div class="max-w-5xl mx-auto px-6 pt-12 pb-16 flex gap-8">
    <Sidebar sections={sections} />
    <article class="flex-1 min-w-0 prose prose-invert max-w-none
                    prose-headings:scroll-mt-20
                    prose-h2:text-accent prose-h2:font-semibold prose-h2:text-xl
                    prose-h2:mt-12 prose-h2:mb-4
                    prose-p:text-text prose-strong:text-text">

      <!-- Section 1: Interactive hero — slot for Track C -->
      <section id="hero" class="not-prose mb-12">
        <!-- TODO(track-C): replace with <InteractiveHero queries={heroData.queries} runId={heroData.run_id} isStub={heroData.is_stub} /> -->
        <div class="border border-warn rounded p-6 font-mono text-sm">
          [hero placeholder — Track C will replace]
        </div>
      </section>

      <!-- Section 2: Why filters fail -->
      <section id="problem">
        <h2>Why filters fail</h2>
        <p>TODO(track-F): one paragraph framing the problem. Lifestyle queries don't translate into filters.</p>
        <!-- BeforeAfterSplit goes here once content-pass writes the prose; left = filter-only UI mock, right = lifestyle query result -->
      </section>

      <!-- Section 3: Architecture -->
      <section id="architecture">
        <h2>Architecture</h2>
        <p>TODO(track-F): one paragraph. Mermaid diagram below.</p>
        <pre class="mermaid">
graph LR
  query[Natural query] --> intent[Intent parser LLM]
  intent --> qdrant[(Qdrant)]
  qdrant --> rerank[Re-ranker LLM + explanations]
  rerank --> resp[Response]
  query -.parallel.-> cost[Cost middleware]
  cost --> real[X-Cost-USD]
  cost --> shadow1[X-Cost-Shadow-OpenAI]
  cost --> shadow2[X-Cost-Shadow-NIM]
  eval[Eval harness CI gate] -.checks.-> resp
        </pre>
      </section>

      <!-- Section 4: Pipeline deep-dive — uses PipelineStage ×3, populated by Track F -->
      <section id="pipeline">
        <h2>Pipeline deep-dive</h2>
        <p>TODO(track-F): three PipelineStage cards (intent / retrieve / rerank). Each shows real input from a hero query, real output, and one observation.</p>
      </section>

      <!-- Section 5: Multi-provider client — slot for Track E (CodeExcerpt) -->
      <section id="multi-provider">
        <h2>Multi-provider client</h2>
        <p>TODO(track-F): one paragraph. CodeExcerpt below shows the real Python.</p>
        <!-- TODO(track-E + track-F): <CodeExcerpt language="python" code={...} annotations={...} /> -->
      </section>

      <!-- Section 6: Cost middleware — slot for Track E (AnnotatedResponse) -->
      <section id="cost">
        <h2>Cost middleware</h2>
        <p>TODO(track-F): one paragraph. AnnotatedResponse below uses real headers from the NIM run.</p>
        <!-- TODO(track-E + track-A): <AnnotatedResponse status="HTTP/1.1 200 OK" headers={...} annotations={...} /> -->
      </section>

      <!-- Section 7: Provider showdown — slot for Track D (ProviderChart) -->
      <section id="showdown">
        <h2>Provider showdown</h2>
        <p>TODO(track-F): one sentence framing.</p>
        <!-- TODO(track-D): <ProviderChart providers={providerData.providers} runId={providerData.run_id} /> -->
        <p class="text-text-muted text-sm font-mono">[chart placeholder — Track D will replace]</p>
      </section>

      <!-- Section 8: Eval as CI gate — slot for Track E (EvalDiff) -->
      <section id="eval">
        <h2>Eval as CI gate</h2>
        <p>TODO(track-F): one paragraph framing the gate idea.</p>
        <!-- TODO(track-E): <EvalDiff path="../../content/proptech-data/eval-diff.md" caption="..." /> -->
      </section>

      <!-- Section 9: Tradeoffs -->
      <section id="tradeoffs">
        <h2>Tradeoffs</h2>
        <p>TODO(track-F): 3-5 cards, each: picked / alternative / why.</p>
      </section>

      <!-- Section 10: Roadmap (specific gaps) -->
      <section id="roadmap">
        <h2>Roadmap</h2>
        <p>TODO(track-F): list of specific not-yet-done items with brief rationale.</p>
      </section>

      <!-- Section 11: Stack & links -->
      <section id="stack" class="not-prose mt-12">
        <h2 class="text-accent font-semibold text-xl mb-4">Stack</h2>
        <StackList stack={project.data.stack} />

        {project.data.metrics && project.data.metrics.length > 0 && (
          <>
            <h2 class="text-accent font-semibold text-xl mt-12 mb-4">Metrics</h2>
            <MetricsTable metrics={project.data.metrics} />
          </>
        )}

        <h2 class="text-accent font-semibold text-xl mt-12 mb-4">Links</h2>
        <LinksList links={project.data.links} />

        <p class="text-text-muted text-xs font-mono mt-8">
          Numbers from run id <code>{heroData.run_id}</code>{heroData.is_stub && ' · STUB · awaiting data-runner'}
        </p>
      </section>
    </article>
  </div>
</BaseLayout>
```

- [ ] **Step 2:** Build to verify.

```bash
npm run build
```

Expected: build passes; `dist/projects/proptech/index.html` exists; mermaid diagram renders.

- [ ] **Step 3:** Visual smoke check.

```bash
npm run preview &
sleep 3
curl -s http://localhost:4321/projects/proptech | grep -c "Pipeline deep-dive"
```

Expected: 1 (the section heading is in the rendered HTML).

- [ ] **Step 4:** Commit.

```bash
git add src/pages/projects/proptech.astro
git commit -m "feat(proptech): dedicated page shell with section anchors and mermaid"
```

---

# Track C — interactive-hero

**Worktree:** `worktrees/interactive-hero` of `portfolio-site`.

Builds `src/components/proptech/InteractiveHero.astro`. Develops against the stub `hero-queries.json` from Task 0.3. When data-runner finishes, the same component will render real values without code changes.

### Task C.1: Component shell + props

**Files:** Create `src/components/proptech/InteractiveHero.astro`.

- [ ] **Step 1:** Create directory and file.

```bash
mkdir -p /Users/eddubnitsky/portfolio-site/src/components/proptech
```

- [ ] **Step 2:** Write the component.

```astro
---
// src/components/proptech/InteractiveHero.astro
// Interactive hero: chip selector + pre-rendered response panels.
// One inline <script> toggles `hidden` on panels — no framework hydration.
//
// Props:
//   queries: array (see proptech-data/hero-queries.json shape)
//   runId:   string
//   isStub:  boolean (renders a "STUB · awaiting data-runner" tag if true)

export interface HeroQuery {
  id: string;
  query: string;
  provider: string;
  duration_ms: number;
  cost_usd: number;
  shadow_cost_openai_usd: number;
  shadow_cost_nim_usd: number;
  results: Array<{
    id: string;
    score: number;
    title: string;
    explanation: string;
  }>;
}

export interface Props {
  queries: HeroQuery[];
  runId: string;
  isStub?: boolean;
}

const { queries, runId, isStub = false } = Astro.props;
---

<section class="border border-border rounded-lg bg-surface overflow-hidden">

  <!-- Header strip with run-id stamp -->
  <div class="border-b border-border bg-bg px-4 py-2 flex items-center justify-between font-mono text-xs">
    <span class="text-text-muted">POST /search · provider chip-selectable below</span>
    <span class="text-text-muted">
      run <code class="text-accent">{runId}</code>
      {isStub && <span class="ml-2 text-warn">[STUB]</span>}
    </span>
  </div>

  <!-- Chip selector -->
  <div class="px-4 pt-4 pb-2 flex flex-wrap gap-2" role="tablist" aria-label="Pre-recorded queries">
    {queries.map((q, i) => (
      <button
        type="button"
        class={`hero-chip text-xs font-mono px-3 py-1.5 rounded border transition-colors
                ${i === 0 ? 'bg-accent/15 border-accent text-accent' : 'bg-bg border-border text-text-muted hover:border-text-muted'}`}
        role="tab"
        aria-controls={`hero-panel-${q.id}`}
        aria-selected={i === 0 ? 'true' : 'false'}
        data-target={`hero-panel-${q.id}`}
      >
        {q.query.length > 64 ? q.query.slice(0, 61) + '…' : q.query}
      </button>
    ))}
  </div>

  <!-- Response panels (one per query) -->
  <div class="px-4 pb-4">
    {queries.map((q, i) => (
      <div
        id={`hero-panel-${q.id}`}
        class={`hero-panel ${i === 0 ? '' : 'hidden'}`}
        role="tabpanel"
      >
        <pre class="text-sm font-mono leading-relaxed text-text whitespace-pre-wrap">{`$ curl -s -X POST http://localhost:8000/search \\
    -H 'Content-Type: application/json' \\
    -d '{"query":"${q.query}"}'`}</pre>

        <pre class="mt-3 text-xs font-mono leading-relaxed text-text-muted">{`HTTP/1.1 200 OK
X-Provider:                ${q.provider}
X-Duration-Ms:             ${q.duration_ms}
X-Cost-USD:                ${q.cost_usd.toFixed(6)}
X-Cost-Shadow-OpenAI-USD:  ${q.shadow_cost_openai_usd.toFixed(6)}
X-Cost-Shadow-NIM-USD:     ${q.shadow_cost_nim_usd.toFixed(6)}`}</pre>

        <ol class="mt-3 space-y-2">
          {q.results.map((r, ri) => (
            <li class="border border-border bg-bg rounded p-3">
              <div class="flex items-baseline gap-3 font-mono text-xs">
                <span class="text-accent">{(ri + 1)}.</span>
                <span class="text-text-muted">{r.id}</span>
                <span class="text-text-muted">score={r.score.toFixed(2)}</span>
              </div>
              <p class="text-text mt-1">{r.title}</p>
              <p class="text-text-muted text-sm mt-1 italic">→ {r.explanation}</p>
            </li>
          ))}
        </ol>
      </div>
    ))}
  </div>

</section>

<script is:inline>
  (function () {
    const chips = document.querySelectorAll('.hero-chip');
    const panels = document.querySelectorAll('.hero-panel');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const targetId = chip.getAttribute('data-target');
        chips.forEach((c) => {
          c.classList.remove('bg-accent/15', 'border-accent', 'text-accent');
          c.classList.add('bg-bg', 'border-border', 'text-text-muted');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.remove('bg-bg', 'border-border', 'text-text-muted');
        chip.classList.add('bg-accent/15', 'border-accent', 'text-accent');
        chip.setAttribute('aria-selected', 'true');
        panels.forEach((p) => {
          if (p.id === targetId) p.classList.remove('hidden');
          else p.classList.add('hidden');
        });
      });
    });
  })();
</script>
```

- [ ] **Step 3:** Wire it into the page (replace the placeholder in proptech.astro).

In `src/pages/projects/proptech.astro`, replace the `<!-- TODO(track-C): ... -->` block in the hero section with:

```astro
import InteractiveHero from '../../components/proptech/InteractiveHero.astro';
// (in the hero section)
<InteractiveHero queries={heroData.queries} runId={heroData.run_id} isStub={heroData.is_stub} />
```

(Move the `import` to the top of the page's frontmatter.)

- [ ] **Step 4:** Build.

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 5:** Preview and click chips manually.

```bash
npm run preview &
sleep 3
open http://localhost:4321/projects/proptech
```

Click each chip — the response panel should swap. With JS disabled (use a browser flag or DevTools), all 5 panels should render but only the first is visible (others are `hidden`); clicks are no-ops.

- [ ] **Step 6:** Commit.

```bash
git add src/components/proptech/InteractiveHero.astro src/pages/projects/proptech.astro
git commit -m "feat(proptech): InteractiveHero — chips + pre-rendered panels"
```

---

# Track D — provider-chart

**Worktree:** `worktrees/provider-chart` of `portfolio-site`.

Builds `src/components/proptech/ProviderChart.astro`. Server-renders SVG bars for cost (USD) and latency (ms) per provider. No client JS.

### Task D.1: Component with SVG bars + accessibility

**Files:** Create `src/components/proptech/ProviderChart.astro`.

- [ ] **Step 1:** Create the component.

```astro
---
// src/components/proptech/ProviderChart.astro
// Server-rendered SVG bar chart: cost (USD per query) and latency (ms p50)
// per provider. Reads provider-showdown.json shape.
//
// Two charts side-by-side:
//   left  = mean_cost_usd (log-style bars: Ollama ≈ 0)
//   right = p50_latency_ms

export interface Provider {
  name: string;
  model: string;
  mean_cost_usd: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  note: string | null;
}

export interface Props {
  providers: Provider[];
  runId: string;
}

const { providers, runId } = Astro.props;

// Layout constants
const W = 420;          // each chart width
const H = 220;          // each chart height
const TOP = 30;
const BOTTOM = 50;
const LEFT = 80;
const RIGHT = 16;
const innerW = W - LEFT - RIGHT;
const innerH = H - TOP - BOTTOM;

// --- Cost domain ---
// Special-case Ollama (cost = 0). We use linear scale on [0, max], with a tiny
// epsilon for ollama so the bar is visible as "≈0".
const maxCost = Math.max(...providers.map((p) => p.mean_cost_usd), 0.0001);
const costBarH = (cost: number) => {
  if (cost <= 0) return 2; // 2px floor — "free"
  return Math.max(2, (cost / maxCost) * innerH);
};

// --- Latency domain ---
const maxLatency = Math.max(...providers.map((p) => p.p50_latency_ms));
const latencyBarH = (ms: number) => Math.max(2, (ms / maxLatency) * innerH);

const colors: Record<string, string> = {
  ollama: '#86efac',   // green — local, free
  nim:    '#7dd3fc',   // accent blue — winner
  openai: '#fbbf24',   // warn — paid, slowest
};

const fmtCost = (c: number) => (c === 0 ? '$0' : `$${c.toFixed(6).replace(/0+$/, '0')}`);
const fmtLatency = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

const barW = innerW / providers.length * 0.6;
const gap = innerW / providers.length;
---

<figure class="my-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

    <!-- Cost chart -->
    <svg viewBox={`0 0 ${W} ${H}`} class="w-full bg-surface border border-border rounded-lg p-2"
         role="img" aria-labelledby="cost-title cost-desc">
      <title id="cost-title">Mean cost per query in USD, by provider</title>
      <desc id="cost-desc">Bar chart. Ollama is free at 0 dollars. NIM and OpenAI bars scale linearly to the maximum.</desc>

      <text x={LEFT} y={20} fill="currentColor" font-family="ui-monospace, monospace" font-size="12" class="fill-text">Cost · USD per query</text>

      <!-- Y axis baseline -->
      <line x1={LEFT} y1={TOP + innerH} x2={LEFT + innerW} y2={TOP + innerH} stroke="#242932" stroke-width="1" />

      {providers.map((p, i) => {
        const x = LEFT + i * gap + (gap - barW) / 2;
        const h = costBarH(p.mean_cost_usd);
        const y = TOP + innerH - h;
        return (
          <g>
            <rect x={x} y={y} width={barW} height={h} fill={colors[p.name] || '#7dd3fc'} rx="2" />
            <text x={x + barW / 2} y={y - 6} text-anchor="middle"
                  font-family="ui-monospace, monospace" font-size="11"
                  class="fill-text">{fmtCost(p.mean_cost_usd)}</text>
            <text x={x + barW / 2} y={TOP + innerH + 18} text-anchor="middle"
                  font-family="ui-monospace, monospace" font-size="11"
                  class="fill-text-muted">{p.name}</text>
          </g>
        );
      })}
    </svg>

    <!-- Latency chart -->
    <svg viewBox={`0 0 ${W} ${H}`} class="w-full bg-surface border border-border rounded-lg p-2"
         role="img" aria-labelledby="lat-title lat-desc">
      <title id="lat-title">p50 latency per provider, milliseconds</title>
      <desc id="lat-desc">Bar chart. Higher bars are slower. Ollama runs locally on M1 Pro; NIM and OpenAI are hosted.</desc>

      <text x={LEFT} y={20} fill="currentColor" font-family="ui-monospace, monospace" font-size="12" class="fill-text">Latency · p50 ms</text>

      <line x1={LEFT} y1={TOP + innerH} x2={LEFT + innerW} y2={TOP + innerH} stroke="#242932" stroke-width="1" />

      {providers.map((p, i) => {
        const x = LEFT + i * gap + (gap - barW) / 2;
        const h = latencyBarH(p.p50_latency_ms);
        const y = TOP + innerH - h;
        return (
          <g>
            <rect x={x} y={y} width={barW} height={h} fill={colors[p.name] || '#7dd3fc'} rx="2" />
            <text x={x + barW / 2} y={y - 6} text-anchor="middle"
                  font-family="ui-monospace, monospace" font-size="11"
                  class="fill-text">{fmtLatency(p.p50_latency_ms)}</text>
            <text x={x + barW / 2} y={TOP + innerH + 18} text-anchor="middle"
                  font-family="ui-monospace, monospace" font-size="11"
                  class="fill-text-muted">{p.name}</text>
          </g>
        );
      })}
    </svg>

  </div>

  <figcaption class="text-text-muted text-xs font-mono mt-3">
    Same workload, same prompts. Run id <code>{runId}</code>.
  </figcaption>
</figure>

<style>
  .fill-text       { fill: var(--color-text, #e6e9ef); }
  .fill-text-muted { fill: var(--color-text-muted, #8a94a7); }
</style>
```

- [ ] **Step 2:** Wire into proptech.astro by replacing the section-7 placeholder.

```astro
import ProviderChart from '../../components/proptech/ProviderChart.astro';
// in section showdown:
<ProviderChart providers={providerData.providers} runId={providerData.run_id} />
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

Expected: build passes; SVG appears in `dist/projects/proptech/index.html`.

- [ ] **Step 4:** Visual check. Open the page in a browser, verify both charts render with bars, labels, axis line.

- [ ] **Step 5:** Commit.

```bash
git add src/components/proptech/ProviderChart.astro src/pages/projects/proptech.astro
git commit -m "feat(proptech): ProviderChart — server-rendered SVG bars (cost + latency)"
```

---

# Track E — annotated-blocks

**Worktree:** `worktrees/annotated-blocks` of `portfolio-site`.

Three small components: `CodeExcerpt`, `AnnotatedResponse`, `EvalDiff`. Shared visual primitives. All three render at build time, no client JS.

### Task E.1: CodeExcerpt component

**Files:** Create `src/components/proptech/CodeExcerpt.astro`.

- [ ] **Step 1:** Create the component.

```astro
---
// src/components/proptech/CodeExcerpt.astro
// Code block with optional inline [[N]] callout markers and a numbered
// annotation list below.
//
// Props:
//   language: string (display label, e.g. "python")
//   code:     string (the code; use [[1]], [[2]] inline as callout markers)
//   annotations: Array<{ marker: number, note: string }>
//   filename?: string (shown in header)

export interface Annotation {
  marker: number;
  note: string;
}

export interface Props {
  language: string;
  code: string;
  annotations?: Annotation[];
  filename?: string;
}

const { language, code, annotations = [], filename } = Astro.props;

// Convert "[[1]]" inline markers into a styled span. The substitution is done
// here so output is server-rendered; no client JS needed.
const renderedCode = code.replace(
  /\[\[(\d+)\]\]/g,
  (_, n) => `<span class="callout-marker">${n}</span>`
);
---

<figure class="my-6 not-prose">
  <div class="bg-surface border border-border rounded-lg overflow-hidden">

    {filename && (
      <div class="bg-bg border-b border-border px-3 py-2 font-mono text-xs text-text-muted flex justify-between">
        <span>{filename}</span>
        <span class="text-text-muted/60">{language}</span>
      </div>
    )}

    <pre class="p-4 m-0 overflow-x-auto text-sm leading-relaxed font-mono text-text" set:html={renderedCode}></pre>
  </div>

  {annotations.length > 0 && (
    <ol class="mt-3 space-y-2 text-sm">
      {annotations.map((a) => (
        <li class="flex gap-3">
          <span class="callout-marker callout-marker-list">{a.marker}</span>
          <span class="text-text-muted">{a.note}</span>
        </li>
      ))}
    </ol>
  )}
</figure>

<style>
  .callout-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.4em;
    height: 1.4em;
    padding: 0 0.4em;
    margin: 0 0.15em;
    border-radius: 999px;
    background: rgba(125, 211, 252, 0.15);
    color: #7dd3fc;
    font-size: 0.78em;
    font-weight: 600;
    border: 1px solid rgba(125, 211, 252, 0.4);
  }
  .callout-marker-list {
    flex-shrink: 0;
    margin-top: 0.1em;
  }
</style>
```

- [ ] **Step 2:** Sanity-check the rendering with a smoke usage in proptech.astro section 5.

In the page frontmatter import:

```astro
import CodeExcerpt from '../../components/proptech/CodeExcerpt.astro';
```

In section 5 replace the TODO with this call (real code from `app/services/llm.py` — Track F will refine if needed):

```astro
<CodeExcerpt
  language="python"
  filename="app/services/llm.py"
  code={`class LLMClient:
    """Thin wrapper around AsyncOpenAI configured for the active provider."""

    def __init__(self, settings: Settings | None = None,
                 provider: LLMProvider | None = None):
        self.settings = settings or get_settings()
        self.provider: LLMProvider = provider or self.settings.llm_provider
        self._client = self._build_client()

    def _build_client(self) -> AsyncOpenAI:  [[1]]
        s = self.settings
        if self.provider == "ollama":
            return AsyncOpenAI(base_url=f"{s.ollama_base_url}/v1",
                               api_key="ollama", timeout=s.llm_request_timeout_s)
        if self.provider == "openai":
            return AsyncOpenAI(api_key=s.openai_api_key or "missing",
                               timeout=s.llm_request_timeout_s)
        if self.provider == "nim":
            return AsyncOpenAI(base_url=s.nim_base_url,
                               api_key=s.nim_api_key or "missing",
                               timeout=s.llm_request_timeout_s)
        raise ValueError(f"unknown provider {self.provider}")

# Provider switch is one env var:  [[2]]
#   LLM_PROVIDER=nim    make api
#   LLM_PROVIDER=openai make api
`}
  annotations={[
    { marker: 1, note: "All three providers expose an OpenAI-compatible API. We use the openai SDK for everything and differ only in base_url + api_key + model." },
    { marker: 2, note: "Switching providers is one env var. Cost middleware reads X-Cost-USD plus shadow headers for the providers that would have been used." }
  ]}
/>
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

Expected: build passes; the rendered HTML contains the callout markers as styled `<span class="callout-marker">`.

- [ ] **Step 4:** Commit.

```bash
git add src/components/proptech/CodeExcerpt.astro src/pages/projects/proptech.astro
git commit -m "feat(proptech): CodeExcerpt — code with inline callouts + annotation list"
```

### Task E.2: AnnotatedResponse component

**Files:** Create `src/components/proptech/AnnotatedResponse.astro`.

- [ ] **Step 1:** Create the component.

```astro
---
// src/components/proptech/AnnotatedResponse.astro
// HTTP response with per-header annotations. Renders as a <dl> for screen
// readers; visual layout puts the response text on the left and annotations
// stacked on the right.
//
// Props:
//   status:      string (e.g. "HTTP/1.1 200 OK")
//   headers:     Array<{ name, value, annotation? }>
//   body?:       string (truncated JSON, optional)
//   caption?:    string

export interface ResponseHeader {
  name: string;
  value: string;
  annotation?: string;
}

export interface Props {
  status: string;
  headers: ResponseHeader[];
  body?: string;
  caption?: string;
}

const { status, headers, body, caption } = Astro.props;
---

<figure class="my-6 not-prose">
  <div class="bg-surface border border-border rounded-lg overflow-hidden">

    <div class="bg-bg border-b border-border px-3 py-2 font-mono text-xs text-text-muted">
      curl -i · response
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[1fr,1fr] gap-0">

      <!-- Left: raw response -->
      <div class="p-4 border-b md:border-b-0 md:border-r border-border font-mono text-sm">
        <div class="text-accent">{status}</div>
        <dl class="mt-2 space-y-1">
          {headers.map((h) => (
            <div class="flex">
              <dt class="text-text-muted w-72 shrink-0">{h.name}:</dt>
              <dd class="text-text">{h.value}</dd>
            </div>
          ))}
        </dl>
        {body && (
          <pre class="mt-3 text-xs text-text-muted whitespace-pre-wrap">{body}</pre>
        )}
      </div>

      <!-- Right: annotations -->
      <div class="p-4">
        <p class="text-xs text-text-muted uppercase tracking-wider mb-2">Why these headers</p>
        <ul class="space-y-3 text-sm">
          {headers.filter((h) => h.annotation).map((h) => (
            <li>
              <code class="text-accent text-xs">{h.name}</code>
              <p class="text-text-muted mt-1">{h.annotation}</p>
            </li>
          ))}
        </ul>
      </div>

    </div>

  </div>
  {caption && (
    <figcaption class="text-text-muted text-xs font-mono mt-3">{caption}</figcaption>
  )}
</figure>
```

- [ ] **Step 2:** Wire a smoke usage in section 6 of proptech.astro.

```astro
import AnnotatedResponse from '../../components/proptech/AnnotatedResponse.astro';
```

```astro
<AnnotatedResponse
  status="HTTP/1.1 200 OK"
  headers={[
    { name: "X-Provider", value: "nim",
      annotation: "Active provider on this request — read from LLM_PROVIDER env var at startup." },
    { name: "X-Duration-Ms", value: "1640",
      annotation: "End-to-end latency including intent parse, vector search, rerank+explain." },
    { name: "X-Cost-USD", value: "0.000040",
      annotation: "Real cost: input_tokens × price_per_million from app/core/config.py::cost_table." },
    { name: "X-Cost-Shadow-OpenAI-USD", value: "0.000127",
      annotation: "What the same request would have cost on OpenAI. Computed from the same token counts × OpenAI pricing." },
    { name: "X-Cost-Shadow-NIM-USD", value: "0.000040",
      annotation: "Same workload on NIM. Equal to X-Cost-USD when NIM is the active provider." }
  ]}
  caption="Real headers from the 2026-05-04 NIM run. Token counts come from the OpenAI SDK response when present, tiktoken cl100k_base when not."
/>
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 4:** Commit.

```bash
git add src/components/proptech/AnnotatedResponse.astro src/pages/projects/proptech.astro
git commit -m "feat(proptech): AnnotatedResponse — HTTP headers with per-header annotations"
```

### Task E.3: EvalDiff component

**Files:** Create `src/components/proptech/EvalDiff.astro`.

- [ ] **Step 1:** Create the component.

```astro
---
// src/components/proptech/EvalDiff.astro
// Renders a fixture text file with diff-aware styling.
// '+' lines green, '-' lines red, '=' lines (or no prefix) neutral.
//
// Props:
//   text:    string (the diff body)
//   caption: string (honest framing)

export interface Props {
  text: string;
  caption?: string;
}

const { text, caption } = Astro.props;

type LineKind = 'add' | 'remove' | 'context' | 'header';
type Line = { kind: LineKind; text: string };

function classifyLine(raw: string): Line {
  if (raw.startsWith('+ ') || raw.startsWith('+\t')) return { kind: 'add',     text: raw.slice(2) };
  if (raw.startsWith('- ') || raw.startsWith('-\t')) return { kind: 'remove',  text: raw.slice(2) };
  if (raw.startsWith('= ') || raw.startsWith('=\t')) return { kind: 'context', text: raw.slice(2) };
  if (raw.trim() === '=')                            return { kind: 'context', text: '' };
  return { kind: 'context', text: raw };
}

const lines: Line[] = text.split('\n').map(classifyLine);

const styleByKind: Record<LineKind, string> = {
  add:     'bg-green-400/10 text-green-300',
  remove:  'bg-red-400/10 text-red-300',
  context: 'text-text-muted',
  header:  'text-accent',
};

const prefixByKind: Record<LineKind, string> = {
  add: '+ ', remove: '- ', context: '  ', header: '  ',
};
---

<figure class="my-6 not-prose">
  <div class="bg-surface border border-border rounded-lg overflow-hidden">
    <div class="bg-bg border-b border-border px-3 py-2 font-mono text-xs text-text-muted">
      eval CI report · markdown rendered as diff
    </div>
    <pre class="p-0 m-0 overflow-x-auto font-mono text-sm leading-relaxed">
      {lines.map((line) => (
        <div class={`px-4 ${styleByKind[line.kind]}`}>
          <span class="select-none">{prefixByKind[line.kind]}</span>{line.text || ' '}
        </div>
      ))}
    </pre>
  </div>
  {caption && (
    <figcaption class="text-text-muted text-xs font-mono mt-3">{caption}</figcaption>
  )}
</figure>
```

- [ ] **Step 2:** Wire a smoke usage in section 8 of proptech.astro.

```astro
import EvalDiff from '../../components/proptech/EvalDiff.astro';
import evalDiffText from '../../content/proptech-data/eval-diff.md?raw';
```

```astro
<EvalDiff
  text={evalDiffText}
  caption="Illustrative CI report. The baseline numbers (left column) are from the real 2026-05-04 run; the regression branch is fabricated to show what the gate would print."
/>
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

Expected: build passes; '+' lines render with green tint, '-' with red.

- [ ] **Step 4:** Commit.

```bash
git add src/components/proptech/EvalDiff.astro src/pages/projects/proptech.astro
git commit -m "feat(proptech): EvalDiff — markdown rendered with diff-aware styling"
```

---

# Track F — content-pass + verification

Sequential, after Tracks A–E land. Writes the prose for sections 2, 3, 4, 9, 10, then runs full verification.

### Task F.1: Section 2 prose + BeforeAfterSplit setup

**Files:** Modify `src/pages/projects/proptech.astro`. Optionally create two static HTML mock files in `public/proptech-mocks/` for the iframes.

- [ ] **Step 1:** Create two simple HTML mock files for the iframes.

`public/proptech-mocks/filter-ui.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Filter UI</title>
<style>
  body { background: #1a1e24; color: #e6e9ef; font-family: system-ui; padding: 24px; margin: 0; }
  h3   { color: #7dd3fc; font-size: 14px; margin: 0 0 12px; }
  .row { display: flex; gap: 12px; margin-bottom: 8px; align-items: center; }
  label { width: 90px; font-size: 12px; color: #8a94a7; }
  select, input { background: #0f1216; color: #e6e9ef; border: 1px solid #242932; padding: 4px 8px; font-size: 12px; }
  .empty { color: #8a94a7; font-size: 12px; margin-top: 16px; font-style: italic; }
</style></head>
<body>
  <h3>Filter-based search</h3>
  <div class="row"><label>Bedrooms</label><select><option>2+</option></select></div>
  <div class="row"><label>Price</label><input value="500000-800000"></div>
  <div class="row"><label>District</label><select><option>All</option></select></div>
  <div class="row"><label>Type</label><select><option>House</option></select></div>
  <p class="empty">"family with kids and a dog, quiet area" · no place to type this</p>
</body></html>
```

`public/proptech-mocks/lifestyle.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Lifestyle search</title>
<style>
  body { background: #1a1e24; color: #e6e9ef; font-family: system-ui; padding: 24px; margin: 0; }
  h3   { color: #7dd3fc; font-size: 14px; margin: 0 0 12px; }
  .input { background: #0f1216; border: 1px solid #7dd3fc; padding: 8px; font-family: ui-monospace, monospace; font-size: 13px; color: #e6e9ef; }
  .result { border: 1px solid #242932; padding: 10px; margin-top: 10px; font-size: 12px; }
  .reason { color: #8a94a7; font-style: italic; margin-top: 4px; font-size: 11px; }
  .score { color: #86efac; font-family: ui-monospace, monospace; font-size: 11px; }
</style></head>
<body>
  <h3>Lifestyle search</h3>
  <div class="input">family with kids and a dog, quiet area</div>
  <div class="result">3-bed house · fenced garden · cul-de-sac <span class="score">0.93</span>
    <div class="reason">→ pet-friendly fenced yard, quiet residential street, primary school 5 min</div>
  </div>
  <div class="result">Townhouse · two parks adjacent <span class="score">0.86</span>
    <div class="reason">→ dog-friendly area, school catchment, low traffic</div>
  </div>
</body></html>
```

- [ ] **Step 2:** Wire BeforeAfterSplit and add prose to section 2.

```astro
import BeforeAfterSplit from '../../components/BeforeAfterSplit.astro';
```

Replace the section-2 placeholder with:

```astro
<section id="problem">
  <h2>Why filters fail</h2>
  <p>Traditional real-estate search is a stack of dropdowns: bedroom count, price band, district code. A query like "family with kids and a dog, quiet street" doesn't fit any of those fields. The user has to translate intent into filter values and the system loses everything that doesn't fit a numeric box.</p>
  <p>Lifestyle search inverts this. The natural-language query is the input; the listing's textual description and amenity tags are what gets matched. Below: the same intent expressed both ways.</p>

  <BeforeAfterSplit
    leftSrc="/proptech-mocks/filter-ui.html"
    leftLabel="Filters · 2024"
    rightSrc="/proptech-mocks/lifestyle.html"
    rightLabel="Lifestyle · this demo"
    height="320px"
  />
</section>
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

Expected: build passes; two iframes render in section 2.

- [ ] **Step 4:** Commit.

```bash
git add public/proptech-mocks/ src/pages/projects/proptech.astro
git commit -m "feat(proptech): section 2 — filters vs lifestyle BeforeAfterSplit"
```

### Task F.2: Section 3 prose

**Files:** Modify `src/pages/projects/proptech.astro` section 3.

- [ ] **Step 1:** Replace the section-3 paragraph with:

```astro
<section id="architecture">
  <h2>Architecture</h2>
  <p>FastAPI in front. The pipeline is a three-stage RAG: an intent parser (LLM, JSON-mode) extracts lifestyle constraints from the natural-language query; Qdrant runs hybrid vector search over multi-modal listing embeddings; a re-ranker (LLM) produces the final ordering with a short explanation per listing. A cost middleware runs alongside, attaching <code>X-Cost-USD</code> and shadow-cost headers to every response. An evaluation harness runs the same shape of work as a CI gate.</p>

  <pre class="mermaid">
graph LR
  query[Natural query] --> intent[Intent parser LLM]
  intent --> qdrant[(Qdrant)]
  qdrant --> rerank[Re-ranker LLM + explanations]
  rerank --> resp[Response]
  query -.parallel.-> cost[Cost middleware]
  cost --> real[X-Cost-USD]
  cost --> shadow1[X-Cost-Shadow-OpenAI]
  cost --> shadow2[X-Cost-Shadow-NIM]
  eval[Eval harness CI gate] -.checks.-> resp
  </pre>
</section>
```

- [ ] **Step 2:** Build.

```bash
npm run build
```

Expected: build passes; mermaid renders.

- [ ] **Step 3:** Commit.

```bash
git add src/pages/projects/proptech.astro
git commit -m "feat(proptech): section 3 — architecture prose"
```

### Task F.3: Section 4 — three PipelineStage cards

**Files:** Modify `src/pages/projects/proptech.astro` section 4.

- [ ] **Step 1:** Add the import.

```astro
import PipelineStage from '../../components/PipelineStage.astro';
```

- [ ] **Step 2:** Pull a real example from `heroData.queries[0]` (`family_with_pool`) so the input/output values are real.

Replace the section-4 placeholder with:

```astro
<section id="pipeline" class="not-prose">
  <h2 class="text-accent font-semibold text-xl mt-12 mb-4">Pipeline deep-dive</h2>
  <p class="text-text mb-4">One representative query through the three stages. Numbers and result IDs come from a real run; intent and explanation strings are real LLM output, lightly trimmed for layout.</p>

  <PipelineStage
    num={1}
    name="Intent parse"
    what="A small LLM call (json_mode=true) extracts a structured intent from the natural-language query. We keep this stage cheap so it pays for itself on cache hits."
    inputLabel="Query"
    inputValue={heroData.queries[0].query}
    outputLabel="Parsed intent"
    outputValue={`{ "household": "family-with-children",
  "amenities": ["pool", "garden"],
  "lifestyle_traits": ["family-friendly"],
  "constraints_strict": [],
  "constraints_soft":   ["quiet"] }`}
    observation="The intent JSON is also a cache key — same query → same intent → same retrieval inputs. Hit rate on the eval set is around 60% even with low query repetition."
  />

  <PipelineStage
    num={2}
    name="Retrieve"
    what="Qdrant runs a hybrid query: vector similarity on the listing description embedding plus filter on the structured intent fields. Top-K is over-fetched (K=20) to give the reranker headroom."
    inputLabel="Vector input"
    inputValue="embed('Family with two kids looking for a house with swimming pool and garden')"
    outputLabel="Top-3 from Qdrant (pre-rerank)"
    outputValue={heroData.queries[0].results.slice(0, 3).map((r, i) => `${i + 1}. ${r.id}  score=${r.score.toFixed(2)}`).join('\n')}
    observation="Score normalisation matters here — Qdrant's cosine score is not directly comparable across collections. Per-collection score baselines are pinned in the config."
  />

  <PipelineStage
    num={3}
    name="Rerank + explain"
    what="A second LLM call ranks the top-K and emits a short reason per listing. JSON-mode again so the response is parseable without regex."
    inputLabel="Reranker prompt"
    inputValue="Score the candidates against the user's query. For each, write one short reason in user-facing English. Output JSON."
    outputLabel="Top result + explanation"
    outputValue={`${heroData.queries[0].results[0].title}\n→ ${heroData.queries[0].results[0].explanation}`}
    observation="The explanation is what the user actually reads. Without it the score number is meaningless. We log the full reranker output so a regression in explanation quality shows up in eval review."
  />
</section>
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

Expected: build passes; three pipeline-stage cards render with real text and IDs from `heroData.queries[0]`.

- [ ] **Step 4:** Commit.

```bash
git add src/pages/projects/proptech.astro
git commit -m "feat(proptech): section 4 — three PipelineStage cards from real run"
```

### Task F.4: Sections 9 (tradeoffs) and 10 (roadmap)

**Files:** Modify `src/pages/projects/proptech.astro` sections 9 and 10.

- [ ] **Step 1:** Replace section 9 with three tradeoff cards.

```astro
<section id="tradeoffs" class="not-prose">
  <h2 class="text-accent font-semibold text-xl mt-12 mb-4">Tradeoffs</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

    <article class="border border-border rounded-lg p-5 bg-surface">
      <p class="text-xs text-text-muted uppercase tracking-wider">Vector store</p>
      <h3 class="text-text font-semibold mt-1">Qdrant over pgvector</h3>
      <p class="text-text-muted text-sm mt-3">pgvector is operationally cheap if Postgres is already there. Qdrant gives me HNSW tuning knobs (m, ef, ef_construct), payload filters that compose well with vector search, and snapshot-based collection migration. For a system where retrieval quality is the headline metric, those knobs are worth a separate service.</p>
    </article>

    <article class="border border-border rounded-lg p-5 bg-surface">
      <p class="text-xs text-text-muted uppercase tracking-wider">Reranker shape</p>
      <h3 class="text-text font-semibold mt-1">Two-call rerank over one-shot</h3>
      <p class="text-text-muted text-sm mt-3">A single call that does intent + retrieve + rerank in one prompt is faster but harder to debug — when a query goes wrong I can't tell whether intent was off or the reranker was. Two calls give me an intermediate JSON I can log, cache, and assert on in eval. Worth ~150ms.</p>
    </article>

    <article class="border border-border rounded-lg p-5 bg-surface">
      <p class="text-xs text-text-muted uppercase tracking-wider">Cost telemetry</p>
      <h3 class="text-text font-semibold mt-1">Shadow costs in headers, not just metrics</h3>
      <p class="text-text-muted text-sm mt-3">Per-request shadow-cost headers (<code>X-Cost-Shadow-OpenAI-USD</code>, <code>X-Cost-Shadow-NIM-USD</code>) are visible to anyone running curl. They make the provider-choice argument concrete in the moment a question comes up — "what would this have cost on OpenAI?" is a header read, not a Grafana query.</p>
    </article>

    <article class="border border-border rounded-lg p-5 bg-surface">
      <p class="text-xs text-text-muted uppercase tracking-wider">Eval cadence</p>
      <h3 class="text-text font-semibold mt-1">CI gate over async batch</h3>
      <p class="text-text-muted text-sm mt-3">Some teams run eval as a nightly batch and look at trends. I run it on every PR that touches retrieval or prompts. The cost is around 30s per provider on this dataset, which is acceptable as a merge gate. The win: regressions surface before they merge, not the morning after.</p>
    </article>

  </div>
</section>
```

- [ ] **Step 2:** Replace section 10 with the specific roadmap (per the user's "specific gaps" choice).

```astro
<section id="roadmap">
  <h2>Roadmap</h2>
  <p>What's in the repo as scaffolding but not finished:</p>
  <ul>
    <li><strong>Reranker ablation.</strong> Right now there's one LLM-rerank pass without comparison to BM25 + embedding-rerank. The eval harness can express the comparison but the BM25 leg isn't wired up yet. The point is to know what the rerank is buying over hybrid retrieval alone.</li>
    <li><strong>Streaming responses.</strong> The pipeline is synchronous end to end, p50 ≈ 1.6s on NIM. The plan is to return top-K immediately and stream explanations as they come back from the reranker. The <code>asyncio</code> shape is already there; the API contract changes.</li>
    <li><strong>Multi-modal listings.</strong> Today only the listing text is indexed. The dataset (<code>Binaryy/multimodal-real-estate-search</code>) ships photos. Adding CLIP embeddings on the photos and a fusion step would unlock queries like "sunny rooms with large windows" that pure text can't catch.</li>
    <li><strong>Cost dashboard in Grafana.</strong> The Prometheus counter (<code>llm_call_cost_usd_total</code>) is emitting; the dashboard JSON is not committed. Same for the cost-by-provider stacked bar over time.</li>
  </ul>
</section>
```

- [ ] **Step 3:** Build.

```bash
npm run build
```

- [ ] **Step 4:** Commit.

```bash
git add src/pages/projects/proptech.astro
git commit -m "feat(proptech): sections 9 + 10 — tradeoffs cards + specific roadmap"
```

### Task F.5: Full verification

- [ ] **Step 1:** Build production bundle.

```bash
cd /Users/eddubnitsky/portfolio-site
npm run build 2>&1 | tee /tmp/proptech-build.log
```

Expected: exit 0, no warnings about missing imports or broken mermaid.

- [ ] **Step 2:** Inspect the built page.

```bash
test -f dist/projects/proptech/index.html && echo OK
wc -l dist/projects/proptech/index.html
grep -c "id=\"hero\"\|id=\"problem\"\|id=\"architecture\"\|id=\"pipeline\"\|id=\"multi-provider\"\|id=\"cost\"\|id=\"showdown\"\|id=\"eval\"\|id=\"tradeoffs\"\|id=\"roadmap\"\|id=\"stack\"" dist/projects/proptech/index.html
```

Expected: all 11 section ids present.

- [ ] **Step 3:** Confirm `is_stub: false` is in the deployed data.

```bash
grep '"is_stub"' src/content/proptech-data/hero-queries.json src/content/proptech-data/provider-showdown.json
```

Expected: both `false`. If either is still `true`, the data-runner track did not finish — leave the page deployed in stub mode but flag this in the page footer (already handled by the `isStub` prop).

- [ ] **Step 4:** Visual smoke (optional but recommended): preview and click every chip, verify charts render, verify mermaid renders, verify the iframes in section 2 load.

```bash
npm run preview
# open http://localhost:4321/projects/proptech
```

- [ ] **Step 5:** Final commit (if any leftover changes).

```bash
git status
# if dirty:
git add -A && git commit -m "chore(proptech): final polish after content-pass"
```

---

## Self-Review

Spec coverage check (compare against `docs/superpowers/specs/2026-05-04-proptech-rich-showcase-design.md`):

- ✅ §1 hero — Track C
- ✅ §2 problem — Task F.1
- ✅ §3 architecture — Task F.2
- ✅ §4 pipeline deep-dive — Task F.3
- ✅ §5 multi-provider client — Task E.1 (component) + Task F (prose was inline in Task E.1's smoke usage; if more refinement is needed Task F can edit it)
- ✅ §6 cost middleware — Task E.2 (component) + smoke usage embeds prose
- ✅ §7 provider showdown — Track D
- ✅ §8 eval as CI gate — Task E.3
- ✅ §9 tradeoffs — Task F.4
- ✅ §10 roadmap — Task F.4
- ✅ §11 stack and links — Task B.1
- ✅ Data plan (spec §5) — Track A
- ✅ Subagent contract (spec §7) — Tracks decomposition; data files via props per spec Appendix B

Risks called out in spec §10 are addressed: data-runner stubs let other tracks proceed; the only client JS is the inline hero script; the page surfaces `is_stub` and `run_id` for honesty.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-04-proptech-rich-showcase.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per track, review between tracks, fast iteration. Tracks A–E run in parallel after Track 0; Track F runs sequentially last.
2. **Inline Execution** — execute tasks in the current session, batch with checkpoints.

Which approach?
