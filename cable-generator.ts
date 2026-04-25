/**
 * Parameterized Cable Operation Generator
 *
 * Cables follow a predictable pattern: (front_count, back_count, direction, purl_cross).
 * Rather than manually defining every combination, this generator produces valid
 * KnittingOperation objects from parameters.
 *
 * The explicit cables in cables.json cover the most common combinations with
 * rich surface forms and ambiguity notes. This generator covers the long tail.
 */

import type { KnittingOperation, CableTemplate, CrossDirection } from "./schema";

function cableId(
  front: number,
  back: number,
  direction: CrossDirection,
  purlCross: boolean
): string {
  const suffix = purlCross ? "pc" : "c";
  const dir = direction === "right" ? "r" : "l";
  return `cable_${front}_${back}_${dir}${suffix}`;
}

function totalWidth(t: CableTemplate): number {
  return t.front_count + t.back_count;
}

function holdPosition(direction: CrossDirection): string {
  return direction === "right" ? "back" : "front";
}

function heldCount(t: CableTemplate): number {
  return t.direction === "right" ? t.back_count : t.front_count;
}

function workedFirstCount(t: CableTemplate): number {
  return t.direction === "right" ? t.front_count : t.back_count;
}

function workedFirstVerb(t: CableTemplate): "knit" | "purl" {
  if (!t.purl_cross) return "knit";
  return t.direction === "right" ? "knit" : "purl";
}

function heldGroupVerb(t: CableTemplate): "knit" | "purl" {
  if (!t.purl_cross) return "knit";
  return t.direction === "right" ? "purl" : "knit";
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function cableAbbreviations(t: CableTemplate): string[] {
  const total = totalWidth(t);
  const dirChar = t.direction === "right" ? "B" : "F";
  const dirName = t.direction === "right" ? "R" : "L";
  const explicitSuffix = `${dirName}${t.purl_cross ? "P" : ""}C`;

  const abbrevs: string[] = [];

  // Explicit style: {front}/{back} {R|L}{C|PC}
  abbrevs.push(`${t.front_count}/${t.back_count} ${explicitSuffix}`);

  // Total-stitch shorthand used in CYC cable symbol tables and many glossaries.
  abbrevs.push(`${total}-st ${explicitSuffix}`);

  // "CnB/F" shorthand for knit cables, "TnB/F" for purl-cross cables (twist).
  // Both are widely used by Aran/British publishers (e.g. Norah Gaughan, Alice Starmore)
  // and CYC's cable convention tables. Apply to symmetric cables of any size, plus the
  // common 2/1 and 1/2 asymmetric short cables.
  const isStandardShortCable =
    (total === 3 && (
      (t.front_count === 2 && t.back_count === 1) ||
      (t.front_count === 1 && t.back_count === 2)
    )) ||
    (t.front_count === t.back_count);
  if (isStandardShortCable) {
    const prefix = t.purl_cross ? "T" : "C";
    abbrevs.push(`${prefix}${total}${dirChar}`);
  }

  // ID-style
  abbrevs.push(cableId(t.front_count, t.back_count, t.direction, t.purl_cross));

  return abbrevs;
}

function cableSemanticDescription(t: CableTemplate): string {
  const total = totalWidth(t);
  const dirWord = t.direction === "right" ? "right" : "left";
  const holdWord = holdPosition(t.direction);
  const held = heldCount(t);
  const worked = workedFirstCount(t);
  const firstVerb = workedFirstVerb(t);
  const heldVerb = heldGroupVerb(t);
  const purlNote = t.purl_cross
    ? ` The traveling group is knit and the background group is purled, so the cable travels across a reverse-stockinette ground.`
    : ` All stitches are knit.`;

  return (
    `A ${total}-stitch cable where ${t.front_count} stitches cross over ` +
    `${t.back_count} stitches to the ${dirWord}.${purlNote} ` +
    `Hold ${held} stitch${held > 1 ? "es" : ""} at the ${holdWord}, ` +
    `${firstVerb} ${worked}, then ${heldVerb} ${held} from the cable needle.`
  );
}

function cableExecutionSteps(t: CableTemplate): string[] {
  const hold = holdPosition(t.direction);
  const held = heldCount(t);
  const worked = workedFirstCount(t);
  const firstVerb = capitalize(workedFirstVerb(t));
  const heldVerb = capitalize(heldGroupVerb(t));

  return [
    `Slip ${held} stitch${held > 1 ? "es" : ""} to cable needle and hold at ${hold} of work`,
    `${firstVerb} ${worked} from left needle`,
    `${heldVerb} ${held} from cable needle`,
  ];
}

export function generateCable(template: CableTemplate): KnittingOperation {
  const total = totalWidth(template);
  const dirWord = template.direction === "right" ? "Right" : "Left";
  const pcWord = template.purl_cross ? " Purl" : "";
  const isSymmetric = template.front_count === template.back_count;

  return {
    id: cableId(
      template.front_count,
      template.back_count,
      template.direction,
      template.purl_cross
    ),
    canonical_name: `${template.front_count}/${template.back_count} ${dirWord}${pcWord} Cross Cable`,
    category: "cable",
    subcategory: template.purl_cross
      ? "purl_cross_cable"
      : isSymmetric
        ? "standard_cable"
        : "asymmetric_cable",
    semantic_description: cableSemanticDescription(template),
    stitch_manipulation: {
      stitches_in: total,
      stitches_out: total,
      lean: template.direction === "right" ? "right" : "left",
      cross_direction: template.direction,
      cable_groups: [template.front_count, template.back_count],
      purl_cross: template.purl_cross || undefined,
      cable_crossing_style: "standard",
      requires_cable_needle: total > 2,
    },
    surface_forms: {
      abbreviations: cableAbbreviations(template),
      alternate_names: [
        `${template.front_count} over ${template.back_count} ${dirWord.toLowerCase()}${pcWord.toLowerCase()} cross`,
        `${total}-stitch ${dirWord.toLowerCase()}${pcWord.toLowerCase()} cable`,
      ],
      written_forms: [
        `sl${heldCount(template)} to CN hold ${holdPosition(template.direction)}, ${workedFirstVerb(template).charAt(0)}${workedFirstCount(template)}, ${heldGroupVerb(template).charAt(0)}${heldCount(template)} from CN`,
      ],
      ambiguity_notes: [
        "In cable notation, 'front' and 'back' refer to where the held stitches sit, while 'left' and 'right' describe the visible crossing direction on the right side of the fabric.",
      ],
    },
    execution: {
      rs: cableExecutionSteps(template),
      tools: ["cable needle"],
    },
    relationships: {
      mirror: cableId(
        template.front_count,
        template.back_count,
        template.direction === "right" ? "left" : "right",
        template.purl_cross
      ),
    },
    tags: [
      "cable",
      template.direction === "right" ? "right_cross" : "left_cross",
      template.purl_cross ? "purl_cross" : "knit_cross",
      isSymmetric ? "symmetric_cable" : "asymmetric_cable",
      total <= 4 ? "small_cable" : total <= 6 ? "medium_cable" : "large_cable",
      "generated",
    ],
    difficulty: total <= 4 ? "intermediate" : "advanced",
  };
}

/**
 * Generate all standard cable combinations.
 * Produces standard two-group cables, in both directions,
 * with and without purl cross.
 */
export function generateAllStandardCables(): KnittingOperation[] {
  const results: KnittingOperation[] = [];
  const sizes: [number, number][] = [
    [1, 2], [2, 1],
    [2, 2],
    [1, 3], [3, 1],
    [2, 3], [3, 2],
    [3, 3],
    [1, 4], [4, 1],
    [2, 4], [4, 2],
    [3, 4], [4, 3],
    [4, 4],
    [5, 5],
    [6, 6],
    [5, 1], [1, 5],
    [5, 2], [2, 5],
    // Added for Stitchmastery v3.2.2 DotCableEH / DashCableEH coverage:
    [2, 6], [6, 2],
    [4, 5], [5, 4],
    [8, 8],
    [9, 9],
    [12, 12],
  ];

  for (const [front, back] of sizes) {
    for (const direction of ["right", "left"] as CrossDirection[]) {
      for (const purl_cross of [false, true]) {
        results.push(
          generateCable({ front_count: front, back_count: back, direction, purl_cross })
        );
      }
    }
  }

  return results;
}
