/**
 * Ordered Cable Sequence Generator
 *
 * Covers ratio-based cable families that need more than the simple
 * front/back split used by standard two-group cables.
 *
 * Examples:
 *   - 1/2/1 RC, 2/2/2 LPC, 4/1/4 RPC
 *   - 2/1 RT, 2/2 LPT
 *   - 1/1/1 RPT
 */

import type {
  CableGroupStitch,
  CableSequenceTemplate,
  CrossDirection,
  KnittingOperation,
} from "./schema";

const TWO_GROUP_TWIST_SIZES: [number, number][] = [
  [1, 1],
  [1, 2], [2, 1],
  [2, 2],
  [1, 3], [3, 1],
];

const THREE_GROUP_SEQUENCE_SIZES: [number, number, number][] = [
  [1, 1, 1],
  [1, 2, 1],
  [1, 3, 1],
  [2, 1, 2],
  [2, 2, 2],
  [3, 1, 3],
  [3, 2, 3],
  [3, 3, 3],
  [4, 1, 4],
  [4, 4, 4],
];

type SequenceFamily = "cross" | "purl_cross" | "twist" | "purl_twist";
type SequenceSuffix = "rc" | "lc" | "rpc" | "lpc" | "rt" | "lt" | "rpt" | "lpt";

function totalWidth(groups: number[]): number {
  return groups.reduce((sum, count) => sum + count, 0);
}

function ratio(groups: number[]): string {
  return groups.join("/");
}

function hasPurlGroup(groupStitches: CableGroupStitch[]): boolean {
  return groupStitches.includes("purl");
}

function hasTwistedKnits(template: CableSequenceTemplate): boolean {
  const tbl = template.group_tbl ?? [];
  return template.group_stitches.some(
    (stitch, index) => stitch === "knit" && tbl[index]
  );
}

function sequenceFamily(template: CableSequenceTemplate): SequenceFamily {
  const purl = hasPurlGroup(template.group_stitches);
  const twist = hasTwistedKnits(template);

  if (purl && twist) return "purl_twist";
  if (purl) return "purl_cross";
  if (twist) return "twist";
  return "cross";
}

function sequenceSuffix(template: CableSequenceTemplate): SequenceSuffix {
  const dir = template.direction === "right" ? "r" : "l";
  const family = sequenceFamily(template);

  switch (family) {
    case "cross":
      return `${dir}c` as SequenceSuffix;
    case "purl_cross":
      return `${dir}pc` as SequenceSuffix;
    case "twist":
      return `${dir}t` as SequenceSuffix;
    case "purl_twist":
      return `${dir}pt` as SequenceSuffix;
  }
}

function sequenceId(template: CableSequenceTemplate): string {
  return `cable_${template.groups.join("_")}_${sequenceSuffix(template)}`;
}

function sequenceKebabId(template: CableSequenceTemplate): string {
  return `cable-${template.groups.join("-")}-${sequenceSuffix(template)}`;
}

function directionWord(direction: CrossDirection): "Right" | "Left" {
  return direction === "right" ? "Right" : "Left";
}

function familyWords(template: CableSequenceTemplate): {
  canonical: string;
  lowercase: string;
  abbreviation: string;
} {
  const dir = directionWord(template.direction);
  switch (sequenceFamily(template)) {
    case "cross":
      return {
        canonical: `${dir} Cross`,
        lowercase: `${dir.toLowerCase()} cross`,
        abbreviation: template.direction === "right" ? "RC" : "LC",
      };
    case "purl_cross":
      return {
        canonical: `${dir} Purl Cross`,
        lowercase: `${dir.toLowerCase()} purl cross`,
        abbreviation: template.direction === "right" ? "RPC" : "LPC",
      };
    case "twist":
      return {
        canonical: `${dir} Twist`,
        lowercase: `${dir.toLowerCase()} twist`,
        abbreviation: template.direction === "right" ? "RT" : "LT",
      };
    case "purl_twist":
      return {
        canonical: `${dir} Purl Twist`,
        lowercase: `${dir.toLowerCase()} purl twist`,
        abbreviation: template.direction === "right" ? "RPT" : "LPT",
      };
  }
}

function validateTemplate(template: CableSequenceTemplate): void {
  if (template.groups.length < 2 || template.groups.length > 3) {
    throw new Error("Cable sequence generator currently supports 2 or 3 ordered groups.");
  }
  if (template.group_stitches.length !== template.groups.length) {
    throw new Error("group_stitches length must match groups length.");
  }
  if (template.group_tbl && template.group_tbl.length !== template.groups.length) {
    throw new Error("group_tbl length must match groups length.");
  }
}

function groupTbl(template: CableSequenceTemplate, index: number): boolean {
  return template.group_tbl?.[index] ?? false;
}

function compactGroupInstruction(
  count: number,
  stitch: CableGroupStitch,
  tbl: boolean
): string {
  if (stitch === "purl") return `p${count}`;
  return tbl ? `k${count} tbl` : `k${count}`;
}

function fullGroupInstruction(
  count: number,
  stitch: CableGroupStitch,
  tbl: boolean,
  source: string
): string {
  if (stitch === "purl") {
    return `Purl ${count} from ${source}`;
  }
  if (tbl) {
    return `Knit ${count} through the back loop from ${source}`;
  }
  return `Knit ${count} from ${source}`;
}

function groupPhrase(
  count: number,
  stitch: CableGroupStitch,
  tbl: boolean
): string {
  if (stitch === "purl") {
    return `${count}-stitch purl group`;
  }
  if (tbl) {
    return `${count}-stitch knit group worked through the back loop`;
  }
  return `${count}-stitch knit group`;
}

function sequenceSemanticDescription(template: CableSequenceTemplate): string {
  const family = familyWords(template);
  const groups = template.groups
    .map((count, index) => groupPhrase(count, template.group_stitches[index], groupTbl(template, index)))
    .join(", ");
  const total = totalWidth(template.groups);
  const threeGroupNote = template.groups.length === 3
    ? " The outer groups exchange places while the middle group remains centered in the finished cable."
    : "";
  const purlNote = hasPurlGroup(template.group_stitches)
    ? " The purl group forms a recessed background channel inside the crossing."
    : " All groups are knit.";
  const twistNote = hasTwistedKnits(template)
    ? " The knit groups are worked through the back loop, creating a tighter, more defined twisted cable."
    : "";

  return (
    `A ${total}-stitch ${ratio(template.groups)} ${family.lowercase} cable. ` +
    `From left to right before the crossing, the ordered groups are ${groups}.` +
    purlNote +
    threeGroupNote +
    twistNote
  );
}

function sequenceAbbreviations(template: CableSequenceTemplate): string[] {
  const family = familyWords(template);
  return [
    `${ratio(template.groups)} ${family.abbreviation}`,
    sequenceKebabId(template),
  ];
}

function sequenceAlternateNames(template: CableSequenceTemplate): string[] {
  const family = familyWords(template);
  const total = totalWidth(template.groups);

  const names = [
    `${ratio(template.groups)} ${family.lowercase}`,
    `${total}-stitch ${family.lowercase} cable`,
  ];

  if (template.groups.length === 3) {
    names.push(`three-element ${family.lowercase} cable`);
  }

  return names;
}

function sequenceAmbiguityNotes(template: CableSequenceTemplate): string[] | undefined {
  const notes: string[] = [];

  if (sequenceFamily(template) === "twist" || sequenceFamily(template) === "purl_twist") {
    notes.push(
      "RT/LT and RPT/LPT are not universal abbreviations. In some patterns they mean small no-cable-needle traveling stitches, while ratio-prefixed forms such as 2/1 RT or 2/2 RPT refer to twisted cable crossings."
    );
  }

  if (template.groups.length === 3) {
    notes.push(
      "Three-element cable notation is less standardized than plain RC/LC cables. Some publishers instead give fully written cable-needle instructions or use dedicated center-cross terminology."
    );
  }

  return notes.length > 0 ? notes : undefined;
}

function sequenceWrittenForm(template: CableSequenceTemplate): string {
  if (template.groups.length === 2) {
    const heldIndex = template.direction === "right" ? 1 : 0;
    const workedIndex = template.direction === "right" ? 0 : 1;
    const holdWord = template.direction === "right" ? "back" : "front";

    return (
      `sl${template.groups[heldIndex]} to CN hold ${holdWord}, ` +
      `${compactGroupInstruction(
        template.groups[workedIndex],
        template.group_stitches[workedIndex],
        groupTbl(template, workedIndex)
      )}, ` +
      `${compactGroupInstruction(
        template.groups[heldIndex],
        template.group_stitches[heldIndex],
        groupTbl(template, heldIndex)
      )} from CN`
    );
  }

  const [left, middle, right] = template.groups;
  const [leftStitch, middleStitch, rightStitch] = template.group_stitches;
  const leftTbl = groupTbl(template, 0);
  const middleTbl = groupTbl(template, 1);
  const rightTbl = groupTbl(template, 2);

  if (template.direction === "right") {
    return (
      `sl${left + middle} to CN hold back, ` +
      `${compactGroupInstruction(right, rightStitch, rightTbl)}, ` +
      `sl${middle} from CN back to left needle and move CN front, ` +
      `${compactGroupInstruction(middle, middleStitch, middleTbl)}, ` +
      `${compactGroupInstruction(left, leftStitch, leftTbl)} from CN`
    );
  }

  return (
    `sl${left} to 1st CN hold front, ` +
    `sl${middle} to 2nd CN hold back, ` +
    `${compactGroupInstruction(right, rightStitch, rightTbl)}, ` +
    `${compactGroupInstruction(middle, middleStitch, middleTbl)} from back CN, ` +
    `${compactGroupInstruction(left, leftStitch, leftTbl)} from front CN`
  );
}

function sequenceExecution(template: CableSequenceTemplate): string[] {
  if (template.groups.length === 2) {
    const heldIndex = template.direction === "right" ? 1 : 0;
    const workedIndex = template.direction === "right" ? 0 : 1;
    const holdWord = template.direction === "right" ? "BACK" : "FRONT";

    return [
      `Slip ${template.groups[heldIndex]} stitch${template.groups[heldIndex] > 1 ? "es" : ""} to cable needle and hold at ${holdWord} of work`,
      fullGroupInstruction(
        template.groups[workedIndex],
        template.group_stitches[workedIndex],
        groupTbl(template, workedIndex),
        "left needle"
      ),
      fullGroupInstruction(
        template.groups[heldIndex],
        template.group_stitches[heldIndex],
        groupTbl(template, heldIndex),
        "cable needle"
      ),
    ];
  }

  const [left, middle, right] = template.groups;
  const [leftStitch, middleStitch, rightStitch] = template.group_stitches;
  const leftTbl = groupTbl(template, 0);
  const middleTbl = groupTbl(template, 1);
  const rightTbl = groupTbl(template, 2);

  if (template.direction === "right") {
    return [
      `Slip ${left + middle} stitches to cable needle and hold at BACK of work`,
      fullGroupInstruction(right, rightStitch, rightTbl, "left needle"),
      `Slip ${middle} stitch${middle > 1 ? "es" : ""} from cable needle back to left needle`,
      `Move cable needle with remaining ${left} stitch${left > 1 ? "es" : ""} to FRONT of work`,
      fullGroupInstruction(middle, middleStitch, middleTbl, "left needle"),
      fullGroupInstruction(left, leftStitch, leftTbl, "cable needle"),
    ];
  }

  return [
    `Slip ${left} stitch${left > 1 ? "es" : ""} to first cable needle and hold at FRONT of work`,
    `Slip ${middle} stitch${middle > 1 ? "es" : ""} to second cable needle and hold at BACK of work`,
    fullGroupInstruction(right, rightStitch, rightTbl, "left needle"),
    fullGroupInstruction(middle, middleStitch, middleTbl, "back cable needle"),
    fullGroupInstruction(left, leftStitch, leftTbl, "front cable needle"),
  ];
}

function sequenceTools(template: CableSequenceTemplate): string[] | undefined {
  if (template.groups.length === 3 && template.direction === "left") {
    return ["cable needle", "second cable needle"];
  }
  if (template.groups.length >= 2) {
    return ["cable needle"];
  }
  return undefined;
}

function sequenceRelationships(template: CableSequenceTemplate): KnittingOperation["relationships"] {
  const mirror: CableSequenceTemplate = {
    ...template,
    groups: [...template.groups],
    group_stitches: [...template.group_stitches],
    group_tbl: template.group_tbl ? [...template.group_tbl] : undefined,
    direction: template.direction === "right" ? "left" : "right",
  };

  const relationships: KnittingOperation["relationships"] = {
    mirror: sequenceId(mirror),
  };

  if (hasTwistedKnits(template)) {
    const untwisted: CableSequenceTemplate = {
      ...template,
      groups: [...template.groups],
      group_stitches: [...template.group_stitches],
      group_tbl: template.group_stitches.map(() => false),
    };
    const ratioIsOneByOne = template.groups.length === 2 && template.groups[0] === 1 && template.groups[1] === 1;

    if (!ratioIsOneByOne) {
      relationships.variant_of = sequenceId(untwisted);
    }
  } else if (
    template.groups.length === 2 &&
    template.groups[0] === 1 &&
    template.groups[1] === 1
  ) {
    relationships.similar = [
      hasPurlGroup(template.group_stitches)
        ? template.direction === "right"
          ? "twist_right_purl"
          : "twist_left_purl"
        : template.direction === "right"
          ? "twist_right"
          : "twist_left",
    ];
  }

  return relationships;
}

export function generateSequenceCable(template: CableSequenceTemplate): KnittingOperation {
  validateTemplate(template);

  const family = familyWords(template);
  const total = totalWidth(template.groups);
  const twist = hasTwistedKnits(template);
  const purl = hasPurlGroup(template.group_stitches);

  return {
    id: sequenceId(template),
    canonical_name: `${ratio(template.groups)} ${family.canonical} Cable`,
    category: "cable",
    subcategory: template.groups.length === 3
      ? "sequence_cable"
      : purl && twist
        ? "purl_twist_cable"
        : "twisted_cable",
    semantic_description: sequenceSemanticDescription(template),
    stitch_manipulation: {
      stitches_in: total,
      stitches_out: total,
      lean: template.direction,
      cross_direction: template.direction,
      cable_groups: [...template.groups],
      purl_cross: purl || undefined,
      cable_group_stitches: [...template.group_stitches],
      cable_group_tbl: template.group_stitches.map((_, index) => groupTbl(template, index)),
      cable_crossing_style: "standard",
      requires_cable_needle: true,
      worked_tbl: twist || undefined,
    },
    surface_forms: {
      abbreviations: sequenceAbbreviations(template),
      alternate_names: sequenceAlternateNames(template),
      written_forms: [sequenceWrittenForm(template)],
      ambiguity_notes: sequenceAmbiguityNotes(template),
    },
    execution: {
      rs: sequenceExecution(template),
      tools: sequenceTools(template),
    },
    relationships: sequenceRelationships(template),
    tags: [
      "cable",
      template.direction === "right" ? "right_cross" : "left_cross",
      template.groups.length === 3 ? "three_element" : "two_group",
      template.groups.length === 3 ? "sequence_cable" : "twisted_cable",
      purl ? "purl_cross" : "knit_cross",
      twist ? "worked_tbl" : "untwisted",
      total <= 4 ? "small_cable" : total <= 7 ? "medium_cable" : "large_cable",
      "generated",
    ],
    difficulty: template.groups.length === 3 || total >= 5 ? "advanced" : "intermediate",
  };
}

export function generateAllSequenceCables(): KnittingOperation[] {
  const results: KnittingOperation[] = [];

  for (const [left, right] of TWO_GROUP_TWIST_SIZES) {
    for (const direction of ["right", "left"] as CrossDirection[]) {
      results.push(
        generateSequenceCable({
          groups: [left, right],
          group_stitches: ["knit", "knit"],
          group_tbl: [true, true],
          direction,
        })
      );

      results.push(
        generateSequenceCable({
          groups: [left, right],
          group_stitches: ["knit", "purl"],
          group_tbl: [true, false],
          direction,
        })
      );
    }
  }

  for (const [left, middle, right] of THREE_GROUP_SEQUENCE_SIZES) {
    for (const direction of ["right", "left"] as CrossDirection[]) {
      results.push(
        generateSequenceCable({
          groups: [left, middle, right],
          group_stitches: ["knit", "knit", "knit"],
          group_tbl: [false, false, false],
          direction,
        })
      );

      results.push(
        generateSequenceCable({
          groups: [left, middle, right],
          group_stitches: ["knit", "purl", "knit"],
          group_tbl: [false, false, false],
          direction,
        })
      );

      results.push(
        generateSequenceCable({
          groups: [left, middle, right],
          group_stitches: ["knit", "purl", "knit"],
          group_tbl: [true, false, true],
          direction,
        })
      );
    }
  }

  return results;
}
