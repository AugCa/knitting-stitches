/**
 * Composite Cable Generator
 *
 * Materializes decorated cable families as first-class semantic operations
 * instead of leaving them under a generic cable-composite umbrella.
 *
 * Narrow and wide chart renderings stay in per-symbol metadata; the semantic
 * operation is defined by:
 *   - base cable direction
 *   - embedded decorator operation
 *   - decorator placement (left/right)
 */

import type { KnittingOperation } from "./schema";

const COMPOSITE_CABLE_BASE_OPERATION_IDS = [
  "twist_right",
  "twist_left",
] as const;

const COMPOSITE_CABLE_DECORATOR_OPERATION_IDS = [
  "bead",
  "brk",
  "cdd",
  "centered_purl_increase",
  "decrease_unspecified",
  "inc_1_to_3",
  "k1_yo_k1",
  "increase_or_slip",
  "increase_or_slip_purlwise",
  "k2tog",
  "k3tog",
  "knit",
  "knit_tbl",
  "p1_yo_p1",
  "pcdd",
  "purl",
  "purl_decrease",
  "purl_tbl",
  "ssk",
  "sssk",
  "yarn_over",
] as const;

const COMPOSITE_CABLE_PLACEMENTS = ["left", "right"] as const;

type CompositeCablePlacement = (typeof COMPOSITE_CABLE_PLACEMENTS)[number];

function placementWord(placement: CompositeCablePlacement): "Left" | "Right" {
  return placement === "left" ? "Left" : "Right";
}

function oppositePlacement(placement: CompositeCablePlacement): CompositeCablePlacement {
  return placement === "left" ? "right" : "left";
}

function mirrorBaseOperationId(baseOperationId: string): string {
  return baseOperationId === "twist_right" ? "twist_left" : "twist_right";
}

function isCompositeDecoratorOperationId(id: string | undefined): id is (typeof COMPOSITE_CABLE_DECORATOR_OPERATION_IDS)[number] {
  return !!id && COMPOSITE_CABLE_DECORATOR_OPERATION_IDS.includes(
    id as (typeof COMPOSITE_CABLE_DECORATOR_OPERATION_IDS)[number]
  );
}

export function compositeCableOperationId(
  baseOperationId: string,
  decoratorOperationId: string,
  placement: CompositeCablePlacement
): string {
  return `cable_comp_${baseOperationId}_${decoratorOperationId}_${placement}`;
}

export function generateCompositeCableOperation(
  baseOperation: KnittingOperation,
  decoratorOperation: KnittingOperation,
  placement: CompositeCablePlacement
): KnittingOperation {
  const baseOperationId = baseOperation.id;
  const decoratorOperationId = decoratorOperation.id;
  const baseSm = baseOperation.stitch_manipulation;
  const decoratorMirrorId = isCompositeDecoratorOperationId(
    decoratorOperation.relationships.mirror
  )
    ? decoratorOperation.relationships.mirror
    : decoratorOperationId;

  return {
    id: compositeCableOperationId(baseOperationId, decoratorOperationId, placement),
    canonical_name: `${baseOperation.canonical_name} with ${decoratorOperation.canonical_name} on ${placementWord(placement)}`,
    category: "composite",
    subcategory: "decorated_cable_variant",
    semantic_description:
      `A composite cable operation combining ${baseOperation.canonical_name.toLowerCase()} ` +
      `with an embedded ${decoratorOperation.canonical_name.toLowerCase()} applied on the ${placement} side of the crossing. ` +
      "This is a semantic stitch operation rather than a mere chart redraw: StitchMastery may show narrow and wide render variants, but those glyph variants map to the same composite technique.",
    stitch_manipulation: {
      stitches_in: 0,
      stitches_out: 0,
      lean: baseSm.lean,
      cross_direction: baseSm.cross_direction,
      cable_groups: baseSm.cable_groups ? [...baseSm.cable_groups] : undefined,
      requires_cable_needle: baseSm.requires_cable_needle,
    },
    surface_forms: {
      abbreviations: [],
      alternate_names: [
        `${baseOperation.canonical_name} with ${decoratorOperation.canonical_name} on the ${placement}`,
        `${baseOperation.canonical_name} ${placement} ${decoratorOperation.canonical_name}`,
      ],
      written_forms: [
        `work ${baseOperation.canonical_name.toLowerCase()} with ${decoratorOperation.canonical_name.toLowerCase()} embedded on the ${placement} side of the cable as specified in the legend`,
      ],
    },
    execution: {
      rs: [
        `Work the ${baseOperation.canonical_name.toLowerCase()} crossing`,
        `Apply the embedded ${decoratorOperation.canonical_name.toLowerCase()} on the ${placement} side of the cable as specified in the chart legend`,
      ],
    },
    relationships: {
      mirror: compositeCableOperationId(
        mirrorBaseOperationId(baseOperationId),
        decoratorMirrorId,
        oppositePlacement(placement)
      ),
      components: [baseOperationId, decoratorOperationId],
      variant_of: "cable_composite",
      similar: [baseOperationId, decoratorOperationId, "cable_composite"],
    },
    tags: [
      "generated",
      "composite",
      "cable",
      "decorated",
      "embedded_operation",
      `${placement}_placement`,
      `decorator_${decoratorOperation.category}`,
    ],
    difficulty: "advanced",
  };
}

export function generateAllCompositeCableOperations(
  existingOperations: KnittingOperation[]
): KnittingOperation[] {
  const byId = new Map(existingOperations.map((operation) => [operation.id, operation]));
  const generated: KnittingOperation[] = [];

  for (const baseOperationId of COMPOSITE_CABLE_BASE_OPERATION_IDS) {
    const baseOperation = byId.get(baseOperationId);
    if (!baseOperation) continue;

    for (const decoratorOperationId of COMPOSITE_CABLE_DECORATOR_OPERATION_IDS) {
      const decoratorOperation = byId.get(decoratorOperationId);
      if (!decoratorOperation) continue;

      for (const placement of COMPOSITE_CABLE_PLACEMENTS) {
        generated.push(
          generateCompositeCableOperation(baseOperation, decoratorOperation, placement)
        );
      }
    }
  }

  return generated;
}
