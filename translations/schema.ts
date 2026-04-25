/**
 * Translation schema for knitting-stitches.
 *
 * Each language file at `translations/<iso-code>.json` follows the
 * `LanguageFile` shape below. Stitches are keyed by their canonical id
 * (matching the registry); each translation provides any of the four
 * surface-form fields (canonical_name / abbreviations / alternate_names /
 * written_forms). Empty / undefined fields fall back to whatever the
 * base stitch says (typically English).
 *
 * Translations are deliberately separate from `stitches/*.json` so
 * native speakers can iterate on their own language file without
 * touching the canonical stitch definitions, and so consumers can
 * choose at runtime which language(s) to merge in.
 */

export interface StitchTranslation {
  /** Localized canonical name (e.g. "Rechte Masche" for de.knit). */
  canonical_name?: string;
  /** Short abbreviations as they appear in chart legends written in this language. */
  abbreviations?: string[];
  /** Longer human-readable names (e.g. "rechte Masche stricken"). */
  alternate_names?: string[];
  /** Pattern-text phrasings (e.g. "1 Masche rechts stricken"). */
  written_forms?: string[];
}

export interface LanguageFile {
  /** ISO 639-1 language code (e.g. "de", "fr", "ja"). */
  language: string;
  /** Native-language name of this language (e.g. "Deutsch"). */
  language_name: string;
  /** English name of this language (e.g. "German"). */
  language_name_english: string;
  /** GitHub usernames of contributors maintaining this file. Optional. */
  maintainers?: string[];
  /** Translations keyed by stitch id. */
  stitches: Record<string, StitchTranslation>;
}
