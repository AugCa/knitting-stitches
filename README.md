# knitting-operations

A machine-readable semantic vocabulary of knitting operations.

For app builders, pattern parsers, and chart-rendering tools that need a stable, structured definition of *what each stitch is* — distinct from how it's drawn or abbreviated.

## What's in here

- **Operations** (`operations/*.json`) — ~250 hand-curated knitting operations: knits, purls, decreases, increases, cables, brioche, slipped stitches, edges, cast-ons, bind-offs, structural markers. Each operation carries:
  - A canonical id (e.g. `cdd`, `cable_3_3_lc`, `kfbf`)
  - Stitch math: `stitches_in`, `stitches_out`, `lean`, `worked_tbl`, cable groups, etc.
  - Surface forms: every common abbreviation, alternate name, and written form publishers use, plus per-publisher overrides
  - Step-by-step execution
  - Relationships: WS equivalent, mirror, similar, variant_of
- **Cable generators** (`cable-*.ts`) — parameterized generators for cables of any width / direction / purl-cross / center / composite combination, on top of the explicit hand-authored entries
- **Registry** (`registry.ts`) — `OperationRegistry` with lookup-by-id, abbreviation, tag, category
- **Translations** (`translations/`) — language-keyed translations of canonical names, abbreviations, and written forms. Currently English is fully populated; German / French / Japanese / Spanish / Swedish / Italian are skeletons awaiting community contribution

## What's NOT in here

- **Symbol SVGs** — the visual chart symbols themselves are not included. Different libraries (CYC, JIS, StitchMastery, German publishers) have a tangle of redistribution licenses that need careful handling. This repo defines stitch *identity*; symbol files live elsewhere or get curated per-app.
- **A pattern parser, OCR pipeline, or app** — this is a vocabulary, not a tool. Use it to power your own.

## Install

```bash
pnpm add @knitr/knitting-operations
```

(Once published. For now: clone and use as a workspace dependency.)

## Quick examples

**Look up an operation by id:**

```ts
import { getDefaultRegistry } from "knitting-operations";

const reg = getDefaultRegistry();
const k2tog = reg.lookupById("k2tog");
// → { id: "k2tog", canonical_name: "Knit Two Together", stitch_manipulation: { stitches_in: 2, stitches_out: 1, lean: "right" }, ... }
```

**Resolve an abbreviation from a chart legend:**

```ts
const matches = reg.lookupByAbbreviation("C6F");
// → [{ id: "cable_3_3_lc", ... }]
```

**Apply a translation:**

```ts
import { loadTranslations, mergeTranslations } from "knitting-operations/translations/loader";

const de = loadTranslations("de");
const knitDe = mergeTranslations(reg.lookupById("knit"), de.knit);
// → English fields replaced with German where the translation file provides them
```

## Design philosophy

**Coverage over efficiency.** When in doubt, split. Don't merge operations that real publishers treat as distinct, even if their chart symbols look identical (`cdd` vs `cdd_tbl` vs `s2kp`, for example).

**Publisher-faithful.** Preserve the abbreviations and conventions real designers use, even when they collide. Disambiguate via `ambiguity_notes` and `source_specific` rather than picking a winner.

**Operations are the source of truth for stitch identity.** A symbol on a chart is just a rendering; the operation is what the knitter actually does.

See [`CURATOR.md`](./CURATOR.md) for the full curation philosophy.

## Contributing

PRs are welcome — especially for:

- **Translations** — most of the language files are skeletons. If you knit in German / French / Japanese / Spanish / Swedish / Italian / [your language], you can fill in canonical names, abbreviations, and written forms for any operation. See [`translations/README.md`](./translations/README.md).
- **Missing publisher abbreviations** — if Vogue / Rowan / DROPS / Lana Grossa / Phildar / a Japanese pattern uses a different abbreviation for an operation we already have, add it to `surface_forms.source_specific.{publisher}` in the relevant operations file.
- **Missing operations** — rare, but possible. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the checklist.
- **Corrections** — wrong stitch counts, broken relationship references, typos in execution steps.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full guide.

## License

[Apache 2.0](./LICENSE).

## Provenance

This library was originally extracted from the [Knitr](https://github.com/) app's internal knitting-operations directory and open-sourced so the broader knitting / pattern-tools community can contribute and benefit. The Knitr team continues to be a primary maintainer; outside contributions are warmly welcomed.
