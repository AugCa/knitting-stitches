/**
 * Knitting Operations Semantic Schema
 *
 * Three-layer architecture:
 *   A. Surface Forms  — what the pattern says (abbreviations, phrasings)
 *   B. Semantic Meaning — what the operation represents structurally
 *   C. Execution Recipe — how to physically perform the operation
 *
 * This schema is symbol-agnostic. Chart symbols are mapped to operations
 * separately. An operation describes WHAT happens to yarn and stitches,
 * not how it looks on a chart.
 */

// ─── Categories ──────────────────────────────────────────────────────────────

export type OperationCategory =
  | "basic"       // knit, purl, twisted variants
  | "yarn_over"   // YO and variants (0→N increases via wrapping)
  | "slip"        // slipped stitches (stitch moved, not worked)
  | "decrease"    // N stitches become fewer stitches
  | "increase"    // N stitches become more stitches (or 0→N)
  | "cable"       // stitch reordering via crossing
  | "texture"     // bobbles, nupps, wraps, drop stitches
  | "brioche"     // brioche/tuck stitch family
  | "colorwork"   // operations specific to color technique
  | "edge"        // selvedge, i-cord edges
  | "cast_on"     // methods of creating initial stitches
  | "bind_off"    // methods of securing final stitches
  | "composite"   // compound operations built from base operations
  | "structural"; // markers, no-stitch, turn, etc.

// ─── Lean / Direction ────────────────────────────────────────────────────────

/** The visual lean direction of the resulting fabric. */
export type Lean = "left" | "right" | "center" | "none";

/** Cable crossing direction, defined by which group travels in front. */
export type CrossDirection = "right" | "left";

/** Structural family for a cable crossing. */
export type CableCrossingStyle = "standard" | "center";

/** Stitch type for each ordered cable group. */
export type CableGroupStitch = "knit" | "purl";

// ─── Layer B: Semantic Meaning ───────────────────────────────────────────────

export interface StitchManipulation {
  /** Number of existing stitches consumed (0 for YO, M1, cast-on). */
  stitches_in: number;

  /** Number of stitches produced on the needle after the operation. */
  stitches_out: number;

  /** Visual lean of the result on RS of fabric. */
  lean?: Lean;

  /** For cables: which direction the front group crosses. */
  cross_direction?: CrossDirection;

  /**
   * For cables: the ordered stitch groups involved in the crossing.
   * E.g., [2, 2] for a C4B/C4F, [2, 1] for an asymmetric cable,
   * [2, 1, 2] for a three-element cable with a center stitch group.
   */
  cable_groups?: number[];

  /**
   * For cables: whether the held/background stitches are purled.
   * True for "purl cross" variants (traveling stitches on purl ground).
   */
  purl_cross?: boolean;

  /**
   * For ordered cable generators: stitch type for each cable group,
   * from left to right on the needle before the crossing.
   */
  cable_group_stitches?: CableGroupStitch[];

  /**
   * For ordered cable generators: whether each cable group is worked
   * through the back loop. Most often used for twist-cable families.
   */
  cable_group_tbl?: boolean[];

  /**
   * For cables: whether the crossing is a standard left/right cross
   * or a centered/reverse three-group cable family.
   */
  cable_crossing_style?: CableCrossingStyle;

  /** Number of chart rows this operation spans (default 1). */
  row_span?: number;

  /** Whether this operation requires a cable needle or auxiliary tool. */
  requires_cable_needle?: boolean;

  /**
   * Whether the stitch is worked through the back loop,
   * creating a twisted result.
   */
  worked_tbl?: boolean;
}

// ─── Layer A: Surface Forms ──────────────────────────────────────────────────

export interface SurfaceForms {
  /** Standard abbreviations: ["k2tog", "k2t"]. */
  abbreviations: string[];

  /** Alternate names: ["knit two together", "knit 2 together"]. */
  alternate_names: string[];

  /**
   * Full written-out instructions as they appear in pattern text.
   * These are the phrasings a knitter would read in a written pattern.
   * E.g., ["knit the next two stitches together"].
   */
  written_forms: string[];

  /**
   * Source-specific terminology keyed by publisher/tradition.
   * E.g., { "british_vintage": ["k2 tog"], "drops": ["K2tog"] }
   */
  source_specific?: Record<string, string[]>;

  /**
   * Known abbreviation conflicts. Each entry describes a situation
   * where this operation's abbreviation collides with another meaning.
   */
  ambiguity_notes?: string[];
}

// ─── Layer C: Execution Recipe ───────────────────────────────────────────────

export interface ExecutionRecipe {
  /** Ordered steps to perform on the right side (RS). */
  rs: string[];

  /**
   * Ordered steps for wrong side (WS) execution.
   * Null if the operation is only performed on RS,
   * or if the WS steps are identical to RS.
   */
  ws?: string[] | null;

  /** Any tools required beyond standard needles. */
  tools?: string[];
}

// ─── Relationships ───────────────────────────────────────────────────────────

export interface OperationRelationships {
  /**
   * The operation that produces the mirror-image result.
   * E.g., ssk is the mirror of k2tog (same decrease, opposite lean).
   */
  mirror?: string;

  /**
   * The operation that produces the same fabric result when worked
   * from the wrong side. E.g., k2tog ↔ p2tog.
   */
  ws_equivalent?: string;

  /**
   * Operations that produce a visually similar or identical result
   * through different mechanics. E.g., ssk ≈ skp ≈ k2tog_tbl.
   */
  similar?: string[];

  /**
   * For composite operations: the IDs of base operations combined.
   * E.g., a cable-with-decrease might reference ["cable_2_2_rc", "k2tog"].
   */
  components?: string[];

  /**
   * ID of the parent/base operation this is a variant of.
   * E.g., k2tog_tbl is a variant of k2tog.
   */
  variant_of?: string;

  /** Ops this contrasts with (used for disambiguation). */
  contrast?: string[];

  /** Same fabric result via different technique (e.g. kbf ≈ kfb). */
  mirror_technique?: string;
}

// ─── The Operation ───────────────────────────────────────────────────────────

export interface KnittingOperation {
  /** Unique identifier, lowercase with underscores. E.g., "k2tog". */
  id: string;

  /** The standard English name. E.g., "Knit Two Together". */
  canonical_name: string;

  /** Primary operation category. */
  category: OperationCategory;

  /** Finer classification within category. E.g., "single_right" in decrease. */
  subcategory?: string;

  /**
   * Rich natural-language description of what this operation IS,
   * written for semantic embedding. Should describe the structural
   * effect, not the execution steps.
   *
   * E.g., "A right-leaning single decrease that merges two stitches
   * into one by knitting them together. The resulting stitch leans
   * to the right on the right side of the fabric."
   */
  semantic_description: string;

  /** Layer B: structural stitch manipulation properties. */
  stitch_manipulation: StitchManipulation;

  /** Layer A: all surface forms (abbreviations, names, phrasings). */
  surface_forms: SurfaceForms;

  /** Layer C: step-by-step execution instructions. */
  execution: ExecutionRecipe;

  /** Connections to related operations. */
  relationships: OperationRelationships;

  /** Searchable tags for filtering and grouping. */
  tags: string[];

  /** Skill level typically required. */
  difficulty: "basic" | "intermediate" | "advanced";
}

// ─── Cable Template (for parameterized generation) ───────────────────────────

/**
 * Template for generating cable operations programmatically.
 * Rather than manually defining every cable combination,
 * cables follow a predictable pattern parameterized by group sizes
 * and crossing direction.
 */
export interface CableTemplate {
  front_count: number;
  back_count: number;
  direction: CrossDirection;
  purl_cross: boolean;
}

/**
 * Template for generating ordered cable sequences where more than two
 * groups participate in a single crossing, or where only specific
 * groups are twisted (worked through the back loop).
 */
export interface CableSequenceTemplate {
  /** Ordered cable groups from left to right before the crossing. */
  groups: number[];

  /** Stitch type for each ordered group. */
  group_stitches: CableGroupStitch[];

  /** Whether each ordered group is worked through the back loop. */
  group_tbl?: boolean[];

  /** Overall visible crossing direction on the RS. */
  direction: CrossDirection;
}
