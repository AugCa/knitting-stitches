/**
 * Center / Reverse Cable Generator
 *
 * Covers centered three-group cable families that are labeled "Reverse"
 * in some symbol systems and as center cables (for example RRC/LRC)
 * in others.
 */

import type { KnittingStitch } from "./schema";

const CENTER_CABLE_SIZES: [number, number, number][] = [
  [1, 1, 1],
  [2, 2, 2],
  [3, 2, 3],
  [3, 3, 3],
  [4, 4, 4],
];

const DIRECTIONAL_CENTER_LABEL_SIZES = new Set([
  "2/2/2",
  "3/2/3",
  "3/3/3",
]);

function totalWidth(groups: number[]): number {
  return groups.reduce((sum, count) => sum + count, 0);
}

function ratio(groups: number[]): string {
  return groups.join("/");
}

function centerId(groups: number[]): string {
  return `cable_${groups.join("_")}_center`;
}

function centerKebabId(groups: number[]): string {
  return `cable-${groups.join("-")}-center`;
}

function stitchWord(count: number): string {
  return count === 1 ? "stitch" : "stitches";
}

function knitInstruction(count: number): string {
  return `k${count}`;
}

function groupPhrase(count: number): string {
  return `${count}-stitch knit group`;
}

function hasDirectionalCenterLabels(groups: number[]): boolean {
  return DIRECTIONAL_CENTER_LABEL_SIZES.has(ratio(groups));
}

function centerSemanticDescription(groups: number[]): string {
  const ratioText = ratio(groups);
  const total = totalWidth(groups);
  const phrases = groups.map((count) => groupPhrase(count)).join(", ");
  const directionalNote = hasDirectionalCenterLabels(groups)
    ? ` Some chart systems distinguish right and left center variants as ${ratioText} RRC and ${ratioText} LRC.`
    : "";

  return (
    `A ${total}-stitch ${ratioText} centered three-group cable. ` +
    `From left to right before the crossing, the ordered groups are ${phrases}. ` +
    `The outer knit groups exchange places while the middle knit group remains structurally centered in the finished cable. ` +
    `In StitchMastery this family is labeled as a reverse cable.` +
    directionalNote
  );
}

function centerAlternateNames(groups: number[]): string[] {
  const ratioText = ratio(groups);
  const total = totalWidth(groups);

  return [
    `${ratioText} reverse cable`,
    `${ratioText} centered cable`,
    `${total}-stitch centered cable`,
    "three-element center cable",
  ];
}

function centerSourceSpecific(groups: number[]): Record<string, string[]> {
  const ratioText = ratio(groups);
  const sourceSpecific: Record<string, string[]> = {
    stitchmastery: [`${ratioText} Reverse`],
  };

  if (hasDirectionalCenterLabels(groups)) {
    sourceSpecific.knitting_unlimited = [
      `${ratioText} RRC`,
      `${ratioText} LRC`,
      `${ratioText} center`,
    ];
  }

  return sourceSpecific;
}

function centerAmbiguityNotes(groups: number[]): string[] {
  const ratioText = ratio(groups);
  const notes = [
    "Reverse cable is not universal terminology. Some publishers instead describe this as a center cable.",
  ];

  if (hasDirectionalCenterLabels(groups)) {
    notes.push(
      `${ratioText} RRC and ${ratioText} LRC are directional center-cable methods. This operation represents the centered family when the symbol set uses a single undirected reverse symbol instead of distinguishing those side variants.`
    );
  }

  return notes;
}

function centerWrittenForms(groups: number[]): string[] {
  const [left, middle, right] = groups;

  return [
    `sl${left} to 1st CN hold back, sl${middle} to 2nd CN hold front, ${knitInstruction(right)}, ${knitInstruction(middle)} from front CN, ${knitInstruction(left)} from back CN`,
    `sl${left + middle} to CN hold front, ${knitInstruction(right)}, sl${middle} from CN back to left needle and move CN back, ${knitInstruction(middle)}, ${knitInstruction(left)} from CN`,
  ];
}

function centerExecution(groups: number[]): string[] {
  const [left, middle, right] = groups;

  return [
    `Slip ${left} ${stitchWord(left)} to first cable needle and hold at BACK of work`,
    `Slip ${middle} ${stitchWord(middle)} to second cable needle and hold at FRONT of work`,
    `Knit ${right} from left needle`,
    `Knit ${middle} from front cable needle`,
    `Knit ${left} from back cable needle`,
  ];
}

function centerRelationships(groups: number[]): KnittingStitch["relationships"] {
  const base = `cable_${groups.join("_")}`;

  return {
    similar: [`${base}_rc`, `${base}_lc`],
  };
}

export function generateCenterCable(groups: [number, number, number]): KnittingStitch {
  const total = totalWidth(groups);
  const ratioText = ratio(groups);

  return {
    id: centerId(groups),
    canonical_name: `${ratioText} Center Cable`,
    category: "cable",
    subcategory: "center_cable",
    semantic_description: centerSemanticDescription(groups),
    stitch_manipulation: {
      stitches_in: total,
      stitches_out: total,
      lean: "center",
      cable_groups: [...groups],
      cable_group_stitches: ["knit", "knit", "knit"],
      cable_group_tbl: [false, false, false],
      cable_crossing_style: "center",
      requires_cable_needle: true,
    },
    surface_forms: {
      abbreviations: [],
      alternate_names: centerAlternateNames(groups),
      written_forms: centerWrittenForms(groups),
      source_specific: centerSourceSpecific(groups),
      ambiguity_notes: centerAmbiguityNotes(groups),
    },
    execution: {
      rs: centerExecution(groups),
      tools: ["cable needle", "second cable needle"],
    },
    relationships: centerRelationships(groups),
    tags: [
      "cable",
      "center_cable",
      "reverse_cable",
      "three_element",
      "knit_cross",
      total <= 4 ? "small_cable" : total <= 7 ? "medium_cable" : "large_cable",
      "generated",
    ],
    difficulty: "advanced",
  };
}

export function generateAllCenterCables(): KnittingStitch[] {
  return CENTER_CABLE_SIZES.map((groups) => generateCenterCable(groups));
}
