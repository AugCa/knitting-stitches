# translations/

Localized canonical names, abbreviations, alternate names, and written forms — keyed by stitch id and ISO 639-1 language code.

## Why translations live here (and not in `stitches/`)

The `stitches/*.json` files define each stitch in a publisher- and tradition-faithful way. Most of the existing `surface_forms.abbreviations` and `alternate_names` are English / English-language conventions. There's also a `surface_forms.source_specific` field that captures publisher-specific terminology (Vogue, DROPS, Lana Grossa, etc.) — but that's keyed by publisher, not by language, and English-language patterns published by German publishers (e.g., DROPS English editions) live there too.

Translations are *language*-keyed and *publisher*-agnostic. They answer: **"How does a knitter in Germany / France / Japan / Spain / Sweden / Italy say this stitch?"** — independent of who published the pattern they're reading.

This separation lets:

- A French knitter contribute French canonical names and abbreviations without touching the canonical stitch definitions
- A consumer app render the same chart in any supported language by merging the appropriate translation file at runtime
- New languages be added with a single new JSON file, no changes to anything else

## Currently shipped

| File | Language | Status |
|------|----------|--------|
| `en.json` | English | **Fully populated** (extracted from `stitches/*.json`) |
| `de.json` | German (Deutsch) | Skeleton — every stitch_id is present with empty fields |
| `fr.json` | French (Français) | Skeleton |
| `ja.json` | Japanese (日本語) | Skeleton |
| `es.json` | Spanish (Español) | Skeleton |
| `sv.json` | Swedish (Svenska) | Skeleton |
| `it.json` | Italian (Italiano) | Skeleton |

Want to add another language? Open a PR with a new `<iso-code>.json` file (modeled on `de.json` for the structure, on `en.json` for what the populated form looks like) and add the loader entry in `loader.ts`.

## File format

Each language file looks like:

```json
{
  "language": "de",
  "language_name": "Deutsch",
  "language_name_english": "German",
  "maintainers": ["github-handle-1", "github-handle-2"],
  "stitches": {
    "knit": {
      "canonical_name": "Rechte Masche",
      "abbreviations": ["re", "M re"],
      "alternate_names": ["Rechtsmasche"],
      "written_forms": ["1 Masche rechts stricken"]
    },
    "purl": {
      "canonical_name": "Linke Masche",
      "abbreviations": ["li", "M li"],
      "alternate_names": ["Linksmasche"],
      "written_forms": ["1 Masche links stricken"]
    },
    "k2tog": { ... }
  }
}
```

**All four fields per stitch are optional.** Leave any out and the loader falls back to the base stitch's English value. So you can populate just the canonical name and skip the rest if you're not sure.

## How to contribute a translation

1. Open the file for your language (e.g. `de.json` for German).
2. Find a stitch by id (the keys are the same across all language files — they match `stitches/*.json`).
3. Fill in any of `canonical_name` / `abbreviations` / `alternate_names` / `written_forms`. Empty fields are fine — leave what you don't know.
4. Optionally add yourself to `maintainers`.
5. Open a PR. Mention which traditions / publishers / regions inform your translations (e.g., "These are the abbreviations used by DROPS Norwegian and Pickles patterns").

You don't need to translate every stitch. Even a partial PR that fills in the basics (knit, purl, k2tog, ssk, yo) is valuable — the loader handles partial coverage gracefully.

## Adding a new language

1. Create `translations/<iso-code>.json` modeled on `de.json` (skeleton structure with every stitch_id present).
2. Add the import + entry in `loader.ts`:
   ```ts
   import xx from "./xx.json";
   const LANGUAGES = { ..., xx: xx as unknown as LanguageFile };
   ```
3. Update the table in this README.
4. Open a PR.

## Schema

See [`schema.ts`](./schema.ts) for the TypeScript types. Validation happens via `pnpm validate` at the repo root.

## Loader API

See [`loader.ts`](./loader.ts) — the public exports are:

- `availableLanguages(): string[]`
- `loadTranslations(language: string): LanguageFile`
- `mergeTranslations(base: KnittingStitch, translation?: StitchTranslation): KnittingStitch`

Translations are loaded statically (small JSON files, all bundled). If a downstream app cares about bundle size for many languages, file an issue — we can switch to dynamic imports.
