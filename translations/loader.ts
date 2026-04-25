/**
 * Translation loader and merge helpers.
 *
 * Usage:
 *
 *   import { getDefaultRegistry } from "knitting-operations";
 *   import { loadTranslations, mergeTranslations } from "knitting-operations/translations/loader";
 *
 *   const reg = getDefaultRegistry();
 *   const de = loadTranslations("de");
 *   const knitInGerman = mergeTranslations(reg.lookupById("knit"), de.operations.knit);
 *   //   → operation with canonical_name + abbreviations + ... replaced by German entries
 *   //     where the German file provides them; English fields preserved otherwise.
 *
 * Languages currently shipped (most as skeletons awaiting community contribution):
 *   - en (English) — fully populated from operations/*.json
 *   - de, fr, ja, es, sv, it — skeleton files, contributions welcome
 */

import type { KnittingOperation } from "../schema";
import type { LanguageFile, OperationTranslation } from "./schema";

import en from "./en.json";
import de from "./de.json";
import fr from "./fr.json";
import ja from "./ja.json";
import es from "./es.json";
import sv from "./sv.json";
import it from "./it.json";

const LANGUAGES: Record<string, LanguageFile> = {
  en: en as unknown as LanguageFile,
  de: de as unknown as LanguageFile,
  fr: fr as unknown as LanguageFile,
  ja: ja as unknown as LanguageFile,
  es: es as unknown as LanguageFile,
  sv: sv as unknown as LanguageFile,
  it: it as unknown as LanguageFile,
};

/** ISO 639-1 codes for languages currently shipped in this repo. */
export function availableLanguages(): string[] {
  return Object.keys(LANGUAGES).sort();
}

/**
 * Load the language file for the given ISO 639-1 code. Throws if the
 * code isn't shipped — call `availableLanguages()` first if you need
 * runtime safety.
 */
export function loadTranslations(language: string): LanguageFile {
  const file = LANGUAGES[language];
  if (!file) {
    throw new Error(
      `No translation file for language "${language}". Available: ${availableLanguages().join(", ")}`,
    );
  }
  return file;
}

/**
 * Merge a translation into a base operation. Returns a new operation
 * with `canonical_name`, `surface_forms.abbreviations`,
 * `surface_forms.alternate_names`, and `surface_forms.written_forms`
 * replaced by the translation entries when provided. All other fields
 * (stitch_manipulation, execution, relationships, etc.) are unchanged.
 *
 * Pass `undefined` for `translation` to get the base operation back
 * unmodified — useful when iterating over many operations and only
 * some have translations in the chosen language.
 */
export function mergeTranslations(
  base: KnittingOperation,
  translation: OperationTranslation | undefined,
): KnittingOperation {
  if (!translation) return base;
  return {
    ...base,
    canonical_name: translation.canonical_name ?? base.canonical_name,
    surface_forms: {
      ...base.surface_forms,
      abbreviations: translation.abbreviations ?? base.surface_forms.abbreviations,
      alternate_names: translation.alternate_names ?? base.surface_forms.alternate_names,
      written_forms: translation.written_forms ?? base.surface_forms.written_forms,
    },
  };
}
