# Contributing

This is a community-friendly knitting-vocabulary library. Most contributions land as small focused PRs against `operations/*.json` or `translations/*.json`.

## What we love

- **Translations.** Most of the `translations/` files are skeletons. Native speakers in any language can fill in canonical names, abbreviations, and written forms. See [`translations/README.md`](./translations/README.md).
- **Missing publisher abbreviations.** If your favorite designer (Vogue / Rowan / DROPS / Pom Pom / etc.) uses a different abbreviation for an operation we already have, add it.
- **New operations.** Rare but valid — Estonian or Aran or other tradition-specific stitches that don't exist yet.
- **Corrections.** Wrong stitch count, broken `relationships.{mirror,similar,ws_equivalent,variant_of}` reference, typo in execution steps.

## Philosophy

These are the rules of the road for a good PR. Internalize these before opening one.

### 1. Coverage over efficiency. When in doubt, split.

Do not merge operations that real publishers treat as distinct, even if their chart symbols look identical. The peaked-triangle ▲ is used by different publishers for `cdd`, `cdd_tbl`, AND `s2kp` — those are three separate operations because the underlying stitch differs. Don't collapse them.

### 2. Publisher-faithful, not opinionated.

This library does not pick winners between "ssk" vs "skp" vs "sl1-k1-psso". They're all real abbreviations real publishers use. Capture them all in `surface_forms.abbreviations` and disambiguate downstream via `ambiguity_notes` or pattern context.

### 3. Operations are the source of truth for stitch identity.

A symbol on a chart is just a rendering. The operation is what the knitter actually does. Two operations with the same chart symbol but different mechanics (e.g., `cdd` vs `cdd_tbl`) are *not* the same operation, even though the symbol designer drew them the same.

### 4. Cite a source.

A PR that says "I knit in Estonia and we use 'X' for sssk" is a great source. So is a published pattern, a stitch dictionary, a designer's style guide, or a charting software's reference table. Domain experience and tradition count — you don't need a citation to a peer-reviewed paper.

If you can, mention what publisher / region / tradition uses your addition in the PR description. This helps reviewers and future maintainers.

## How to add a new abbreviation

For example, you knit a Japanese pattern that uses `2目一度` for k2tog:

1. Open `operations/decreases.json`, find the `k2tog` entry.
2. Add to `surface_forms.source_specific.japanese` (create the key if it doesn't exist):
   ```json
   "japanese": ["2目一度", "k2tog"]
   ```
3. (Optional) Also add `2目一度` to `translations/ja.json` under `operations.k2tog.abbreviations`.
4. Open a PR.

## How to add a translation

See [`translations/README.md`](./translations/README.md). Short version: open the language file (e.g., `translations/de.json`), find the operation, fill in any of `canonical_name` / `abbreviations` / `alternate_names` / `written_forms`. Empty fields stay empty.

## How to add a new operation

This is the highest bar — only do it if your stitch genuinely isn't already covered (check by `id`, then by abbreviation, then by description).

Checklist:

1. Pick the right file (`operations/decreases.json`, `operations/cables.json`, etc.) by category.
2. Mirror the structure of an existing similar operation. Required fields: `id`, `canonical_name`, `category`, `subcategory`, `semantic_description`, `stitch_manipulation`, `surface_forms.abbreviations`, `surface_forms.alternate_names`, `surface_forms.written_forms`, `execution.rs`, `relationships`, `tags`, `difficulty`.
3. ID convention: `snake_case`. For variants, prefer `<base>_<modifier>` (`cdd_tbl`, `k2tog_tbl`, `lli_purl`).
4. Set `relationships` thoughtfully — `mirror` (the directional opposite), `ws_equivalent` (the WS-row counterpart, or `null` if RS-only), `similar` (related but distinct stitches), `variant_of` (parent if this is a modifier of an existing op).
5. PR description should answer: *why isn't this an existing operation? Which publishers use it? What disambiguates it from neighbors?*

## Validation

Before opening a PR, run the integrity check:

```bash
pnpm install
pnpm validate
```

This checks:
- JSON parses
- Schema fields are well-formed
- All `relationships.{mirror,similar,ws_equivalent,variant_of}` references resolve to operations that exist
- No duplicate operation ids
- No abbreviation accidentally claimed by two operations (intentional collisions are documented in `ambiguity_notes`)
- Stitch math (`stitches_in` / `stitches_out`) matches the category (decreases must shrink, increases must grow)

If any check fails, the PR will be flagged in CI. Fix locally and re-push.

## Review expectations

- Most translation PRs and abbreviation additions are merged within a week.
- New operations require more discussion — expect a back-and-forth on naming, relationships, and whether the stitch is genuinely distinct from existing entries.
- We won't merge a PR that conflicts with the philosophy above (e.g., merging two operations that real publishers treat as distinct). That's a feature, not a bug.

## Code of conduct

Be kind. This is a hobby for most of us, including the maintainers. Knitting traditions vary across regions and decades; assume good faith and bring sources when you disagree.
