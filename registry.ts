/**
 * Knitting Operations Registry
 *
 * Central registry that loads all operation JSON files, builds lookup
 * indexes, and provides search/query utilities.
 *
 * Primary use cases:
 *   - Resolve an abbreviation to its semantic operation(s)
 *   - Look up an operation by ID
 *   - Filter operations by category, tag, or stitch behavior
 *   - Generate search text for vector embedding
 */

import type { KnittingOperation, OperationCategory } from "./schema";
import { generateAllStandardCables } from "./cable-generator";

/**
 * Coerces JSON-imported operations into the typed `KnittingOperation[]`.
 *
 * Why this exists: TypeScript's `resolveJsonModule` infers JSON literals more
 * narrowly than the schema accepts. For example, it widens `category: "decrease"`
 * to `string` (rather than the `OperationCategory` union), and surfaces optional
 * `source_specific` keys as `undefined` values, which doesn't structurally match
 * `Record<string, string[]>`.
 *
 * The schema is the source of truth, validated separately by `pnpm validate`,
 * so the runtime cast is sound. The function exists to centralize the cast in
 * one named, documented place rather than scatter `as unknown as` casts across
 * every JSON import site.
 */
function loadJsonOperations(data: unknown): KnittingOperation[] {
  return data as KnittingOperation[];
}

import { generateAllSequenceCables } from "./cable-sequence-generator";
import { generateAllCenterCables } from "./cable-center-generator";
import { generateAllCompositeCableOperations } from "./cable-composite-generator";

// ─── JSON imports ────────────────────────────────────────────────────────────

import basicOps from "./operations/basic.json";
import slippedOps from "./operations/slipped.json";
import decreaseOps from "./operations/decreases.json";
import increaseOps from "./operations/increases.json";
import cableOps from "./operations/cables.json";
import textureOps from "./operations/texture.json";
import briocheOps from "./operations/brioche.json";
import edgeOps from "./operations/edge.json";
import castOnOps from "./operations/cast-on.json";
import bindOffOps from "./operations/bind-off.json";
import compositeOps from "./operations/composite.json";
import structuralOps from "./operations/structural.json";
import placeholderOps from "./operations/placeholders.json";

// ─── Registry ────────────────────────────────────────────────────────────────

export class OperationRegistry {
  private byId: Map<string, KnittingOperation> = new Map();
  private byAbbreviation: Map<string, KnittingOperation[]> = new Map();
  private byTag: Map<string, KnittingOperation[]> = new Map();
  private byCategory: Map<OperationCategory, KnittingOperation[]> = new Map();

  constructor(operations: KnittingOperation[]) {
    for (const op of operations) {
      this.register(op);
    }
  }

  private register(op: KnittingOperation): void {
    // ID index (unique)
    if (this.byId.has(op.id)) {
      console.warn(`Duplicate operation ID: ${op.id} — skipping`);
      return;
    }
    this.byId.set(op.id, op);

    // Abbreviation index (case-insensitive, one-to-many, deduplicated)
    const seenKeys = new Set<string>();
    for (const abbr of op.surface_forms.abbreviations) {
      const key = abbr.toLowerCase().trim();
      if (seenKeys.has(key)) continue; // skip duplicate case variants
      seenKeys.add(key);
      const existing = this.byAbbreviation.get(key) ?? [];
      existing.push(op);
      this.byAbbreviation.set(key, existing);
    }

    // Tag index
    for (const tag of op.tags) {
      const existing = this.byTag.get(tag) ?? [];
      existing.push(op);
      this.byTag.set(tag, existing);
    }

    // Category index
    const catList = this.byCategory.get(op.category) ?? [];
    catList.push(op);
    this.byCategory.set(op.category, catList);
  }

  // ─── Lookups ─────────────────────────────────────────────────────────

  /** Get an operation by its unique ID. */
  getById(id: string): KnittingOperation | undefined {
    return this.byId.get(id);
  }

  /**
   * Resolve an abbreviation to matching operations.
   * Returns multiple results when the abbreviation is ambiguous
   * (e.g., "m1" matches m1, m1l, m1r).
   */
  resolveAbbreviation(abbr: string): KnittingOperation[] {
    return this.byAbbreviation.get(abbr.toLowerCase().trim()) ?? [];
  }

  /** Get all operations with a given tag. */
  getByTag(tag: string): KnittingOperation[] {
    return this.byTag.get(tag) ?? [];
  }

  /** Get all operations in a category. */
  getByCategory(category: OperationCategory): KnittingOperation[] {
    return this.byCategory.get(category) ?? [];
  }

  /** Get all registered operations. */
  getAll(): KnittingOperation[] {
    return Array.from(this.byId.values());
  }

  /** Total number of registered operations. */
  get size(): number {
    return this.byId.size;
  }

  // ─── Search utilities ────────────────────────────────────────────────

  /**
   * Find operations matching a stitch count behavior.
   * E.g., findByStitchCount(2, 1) finds all 2→1 decreases.
   */
  findByStitchCount(stitchesIn: number, stitchesOut: number): KnittingOperation[] {
    return this.getAll().filter(
      (op) =>
        op.stitch_manipulation.stitches_in === stitchesIn &&
        op.stitch_manipulation.stitches_out === stitchesOut
    );
  }

  /**
   * Find operations by lean direction.
   */
  findByLean(lean: "left" | "right" | "center" | "none"): KnittingOperation[] {
    return this.getAll().filter(
      (op) => op.stitch_manipulation.lean === lean
    );
  }

  /**
   * Find operations that are mirrors of a given operation.
   */
  getMirror(id: string): KnittingOperation | undefined {
    const op = this.byId.get(id);
    if (!op?.relationships.mirror) return undefined;
    return this.byId.get(op.relationships.mirror);
  }

  /**
   * Find operations that are the WS equivalent of a given operation.
   */
  getWsEquivalent(id: string): KnittingOperation | undefined {
    const op = this.byId.get(id);
    if (!op?.relationships.ws_equivalent) return undefined;
    return this.byId.get(op.relationships.ws_equivalent);
  }

  /**
   * Full-text search across all surface forms and descriptions.
   * Simple substring matching — for production use, replace with
   * vector similarity search on embedded text.
   */
  search(query: string): KnittingOperation[] {
    const q = query.toLowerCase().trim();
    return this.getAll().filter((op) => {
      const searchable = getSearchText(op).toLowerCase();
      return searchable.includes(q);
    });
  }

  // ─── Validation ──────────────────────────────────────────────────────

  /**
   * Validate relationship integrity — all referenced IDs exist.
   * Returns a list of broken references.
   */
  validateRelationships(): string[] {
    const errors: string[] = [];
    for (const op of this.getAll()) {
      const rel = op.relationships;
      if (rel.mirror && !this.byId.has(rel.mirror)) {
        errors.push(`${op.id}: mirror '${rel.mirror}' not found`);
      }
      if (rel.ws_equivalent && !this.byId.has(rel.ws_equivalent)) {
        errors.push(`${op.id}: ws_equivalent '${rel.ws_equivalent}' not found`);
      }
      for (const sim of rel.similar ?? []) {
        if (!this.byId.has(sim)) {
          errors.push(`${op.id}: similar '${sim}' not found`);
        }
      }
      for (const comp of rel.components ?? []) {
        if (!this.byId.has(comp)) {
          errors.push(`${op.id}: component '${comp}' not found`);
        }
      }
      if (rel.variant_of && !this.byId.has(rel.variant_of)) {
        errors.push(`${op.id}: variant_of '${rel.variant_of}' not found`);
      }
    }
    return errors;
  }
}

// ─── Search text generation (for vector embedding) ───────────────────────────

/**
 * Generates a rich text string suitable for vector embedding.
 * Concatenates all human-readable content: name, description,
 * abbreviations, alternate names, written forms, and tags.
 *
 * When this text is embedded, a semantic search for
 * "decrease that leans right" will match k2tog because
 * the description says "right-leaning single decrease."
 */
export function getSearchText(op: KnittingOperation): string {
  const parts: string[] = [
    op.canonical_name,
    op.semantic_description,
    op.category,
    op.subcategory ?? "",
    ...op.surface_forms.abbreviations,
    ...op.surface_forms.alternate_names,
    ...op.surface_forms.written_forms,
    ...op.tags,
  ];

  // Include source-specific terms
  if (op.surface_forms.source_specific) {
    for (const terms of Object.values(op.surface_forms.source_specific)) {
      parts.push(...terms);
    }
  }

  // Include ambiguity notes (valuable context for search)
  if (op.surface_forms.ambiguity_notes) {
    parts.push(...op.surface_forms.ambiguity_notes);
  }

  return parts.filter(Boolean).join(" | ");
}

// ─── Default registry (loads everything) ─────────────────────────────────────

let _defaultRegistry: OperationRegistry | null = null;

/**
 * Returns the singleton default registry with all operations loaded.
 * Includes both hand-authored operations and generated cables.
 */
export function getDefaultRegistry(): OperationRegistry {
  if (!_defaultRegistry) {
    // Hand-authored operation files plus generated cable families.
    //
    // The `loadJsonOperations` helper is used to coerce JSON-imported arrays
    // into `KnittingOperation[]`. We need this because `resolveJsonModule`
    // infers JSON literal types more narrowly than the schema (e.g. it widens
    // `category: "decrease"` to `string` rather than the `OperationCategory`
    // union, and surfaces optional `source_specific` keys with `undefined`
    // values). The JSON files are validated separately via `pnpm validate`,
    // so the runtime cast is sound.
    const allOps: KnittingOperation[] = [
      ...loadJsonOperations(basicOps),
      ...loadJsonOperations(slippedOps),
      ...loadJsonOperations(decreaseOps),
      ...loadJsonOperations(increaseOps),
      ...loadJsonOperations(cableOps),
      ...loadJsonOperations(textureOps),
      ...loadJsonOperations(briocheOps),
      ...loadJsonOperations(edgeOps),
      ...loadJsonOperations(castOnOps),
      ...loadJsonOperations(bindOffOps),
      ...loadJsonOperations(compositeOps),
      ...loadJsonOperations(structuralOps),
      ...loadJsonOperations(placeholderOps),
    ];

    // Add generated cables that don't overlap with hand-authored ones
    const existingIds = new Set(allOps.map((op) => op.id));
    for (const cable of generateAllStandardCables()) {
      if (!existingIds.has(cable.id)) {
        allOps.push(cable);
        existingIds.add(cable.id);
      }
    }
    for (const cable of generateAllSequenceCables()) {
      if (!existingIds.has(cable.id)) {
        allOps.push(cable);
        existingIds.add(cable.id);
      }
    }
    for (const cable of generateAllCenterCables()) {
      if (!existingIds.has(cable.id)) {
        allOps.push(cable);
        existingIds.add(cable.id);
      }
    }
    for (const cable of generateAllCompositeCableOperations(allOps)) {
      if (!existingIds.has(cable.id)) {
        allOps.push(cable);
        existingIds.add(cable.id);
      }
    }

    _defaultRegistry = new OperationRegistry(allOps);
  }
  return _defaultRegistry;
}
