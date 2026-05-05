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
