# SSD Catch Analytics Rich Showcase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a rich showcase page at `/projects/ssd` that demonstrates the power of the SSD catch analytics platform (NL-to-SQL, Geospatial analysis, Fleet monitoring).

**Context:** The project is live at `https://radar.176-123-166-252.sslip.io/` (auth: admin/fish1147). Since it's behind auth, the showcase will use **pre-rendered snapshots** and **simulated interactive components** based on real data and the codebase in `../ssd`.

**Architecture:** 
- Dedicated page `src/pages/projects/ssd.astro`.
- Custom components in `src/components/ssd/`.
- Fixture data in `src/content/ssd-data/` (derived from `../ssd/tests` and live site analysis).

---

## Track Layout

```
Track 0  Setup                           (blocking)
   ↓
Track A  Data Mining (from ../ssd)       (parallel)
Track B  Page Shell                      (parallel)
Track C  Interactive NL-to-SQL Hero      (parallel)
Track D  Visual Components (Radar/Map)   (parallel)
Track E  Technical Deep-dive (Architecture) (parallel)
   ↓
Track F  Content Pass & Verification     (sequential)
```

---

# Track 0 — Setup

### Task 0.1: Exclude ssd from dynamic route
- [ ] Modify `src/pages/projects/[slug].astro` and `src/pages/ru/projects/[slug].astro` to exclude `ssd`.

### Task 0.2: Create basic project entry
- [ ] Create `src/content/projects/ssd.md` and `src/content/projects/ru/ssd.md`.
- [ ] Frontmatter should include: title, tagline, period, status ('production'), year, stack, and links.

### Task 0.3: Setup data directory
- [ ] Create `src/content/ssd-data/`.
- [ ] Create `README.md` describing the data contract for the showcase.

---

# Track A — Data Mining

**Source:** `../ssd/tests`, `../ssd/frontend`, and live site.

### Task A.1: Extract "Golden Queries"
- [ ] Analyze `../ssd/tests/test_nl_sql.py` to find 5-7 high-impact natural language queries and their corresponding results.
- [ ] Format these into `src/content/ssd-data/queries.json`.

### Task A.2: Define Key Metrics
- [ ] Identify performance metrics (e.g., query latency, data volume, accuracy) from the codebase or tests.
- [ ] Save to `src/content/ssd-data/metrics.json`.

---

# Track B — Page Shell

### Task B.1: Create `src/pages/projects/ssd.astro`
- [ ] Implement the layout with `BaseLayout` and `Sidebar`.
- [ ] Define sections: 
    - `hero` (The "Magic" of NL-to-SQL)
    - `problem` (The complexity of catch reporting)
    - `architecture` (From Raw Data to Insight)
    - `features` (Radar, Maps, Analytics)
    - `stack` (The engine under the hood)

---

# Track C — Interactive NL-to-SQL Hero

### Task C.1: Develop `src/components/ssd/NLHero.astro`
- [ ] Build a "Chat-like" interface where clicking a query triggers a simulated "processing" state.
- [ ] Show the transition: `Natural Language` $\rightarrow$ `Generated SQL` $\rightarrow$ `Visual Answer` (Table/Chart).
- [ ] Use data from `ssd-data/queries.json`.

---

# Track D — Visual Components

### Task D.1: Develop `src/components/ssd/RadarSimulation.astro`
- [ ] Create a stylized, server-rendered SVG or CSS-based "Radar" view that mimics the real `RadarView.vue`.
- [ ] Add tooltips or highlights to show how vessel monitoring works.

### Task D.2: Develop `src/components/ssd/GeoInsight.astro`
- [ ] Create a component showing a map snippet (SVG/Image) with "Heatmap" overlays of catch density.

---

# Track E — Technical Deep-dive

### Task E.1: Architecture Diagram
- [ ] Implement a Mermaid diagram showing the pipeline: `Frontend (Vue)` $\rightarrow$ `API (FastAPI/Python)` $\rightarrow$ `LLM (NL-to-SQL)` $\rightarrow$ `Database` $\rightarrow$ `Geo-Processing`.

### Task E.2: Code Snippets
- [ ] Use `CodeExcerpt` to show interesting parts of the `../ssd` codebase (e.g., the prompt engineering for SQL generation or the normalization logic).

---

# Track F — Final Polish

### Task F.1: Content Writing
- [ ] Write professional descriptions for each section in both EN and RU.
- [ ] Ensure the narrative emphasizes the "Productivity Gain" (e.g., "From hours of manual reporting to seconds of natural language query").

### Task F.2: Visual Verification
- [ ] Run `npm run build` and verify all components render correctly.
- [ ] Final check against the live site for visual consistency.
