import { describe, expect, it } from "vitest";
import { loadLanguages, parse } from "scratchblocks/syntax/index.js";
import french from "scratchblocks/locales/fr.json";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { generateQuestion } from "../generator/generateQuestion";
import { cleanScratchText, makeScratchProgram, scratchReporter, scratchSyntax } from "./scratchSyntax";

type ParsedNode = {
  blocks?: ParsedNode[];
  children?: ParsedNode[];
  info?: {
    category?: string;
    id?: string;
  };
  scripts?: ParsedNode[];
};

loadLanguages({ fr: french });

function parsedBlocks(root: unknown): ParsedNode[] {
  const result: ParsedNode[] = [];

  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const parsed = node as ParsedNode;
    if (parsed.info) result.push(parsed);
    parsed.scripts?.forEach(visit);
    parsed.blocks?.forEach(visit);
    parsed.children?.forEach(visit);
  };

  visit(root);
  return result;
}

describe("Scratch syntax", () => {
  it("renders arithmetic as nested green operator reporters", () => {
    expect(scratchReporter("2 × 7")).toBe("((2) * (7))");
    expect(scratchReporter("2 + 3 × 4")).toBe("((2) + ((3) * (4)))");
    expect(scratchReporter("(2 + 3) ÷ 5")).toBe("(((2) + (3)) / (5))");
    expect(scratchSyntax("mettre résultat à 2 × 7")).toBe(
      "mettre [résultat v] à ((2) * (7))"
    );
  });

  it("repairs legacy multiplication spellings", () => {
    expect(scratchSyntax("mettre resultat a x x 4")).toBe(
      "mettre [résultat v] à ((x) * (4))"
    );
    expect(scratchSyntax("mettre resultat ? nombre ? 4")).toBe(
      "mettre [résultat v] à ((nombre) * (4))"
    );
  });

  it("uses real Scratch boolean blocks for inclusive comparisons", () => {
    expect(scratchSyntax("si score >= 10 alors")).toBe(
      "si <non <(score) < (10)>> alors"
    );
    expect(scratchSyntax("si score <= 10 alors")).toBe(
      "si <non <(score) > (10)>> alors"
    );
  });

  it("keeps messages as text but variable readings as reporters", () => {
    const program = makeScratchProgram([
      "mettre score à 2",
      "dire score",
      "dire gagné"
    ]);

    expect(program).toContain("dire (score)");
    expect(program).toContain("dire [gagné]");
  });

  it("parses representative programs as authentic Scratch blocks", () => {
    const program = makeScratchProgram([
      "quand drapeau vert cliqué",
      "mettre résultat à 2 × 7 + 3",
      "si résultat >= 10 alors",
      "dire résultat",
      "sinon",
      "dire trop petit"
    ]);
    const documentModel = parse(program, { languages: ["fr", "en"] });
    const blocks = parsedBlocks(documentModel);
    const ids = blocks.map((block) => block.info?.id);

    expect(ids).toContain("DATA_SETVARIABLETO");
    expect(ids).toContain("OPERATORS_MULTIPLY");
    expect(ids).toContain("OPERATORS_ADD");
    expect(ids).toContain("OPERATORS_NOT");
    expect(ids).toContain("OPERATORS_LT");
    expect(blocks.filter((block) => ["grey", "obsolete"].includes(block.info?.category ?? ""))).toEqual([]);
  });

  it("compiles every generated Scratch slide without fallback blocks", () => {
    const failures: string[] = [];
    const scratchItems = allOfficialAutomatismes.filter(
      (item) => item.figureTemplate?.kind === "scratch"
    );

    scratchItems.forEach((item) => {
      ["audit-a", "audit-b", "audit-c"].forEach((seed) => {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        if (question.figure?.kind !== "scratch") return;

        const program = makeScratchProgram(question.figure.blocks);
        const documentModel = parse(program, { languages: ["fr", "en"] });
        const parsed = parsedBlocks(documentModel);
        const invalid = parsed.filter((block) =>
          ["grey", "obsolete"].includes(block.info?.category ?? "")
        );
        const asksForInput = question.figure.blocks.some((block) =>
          /^demander\b/iu.test(cleanScratchText(block))
        );
        const readsAnswer = parsed.some((block) => block.info?.id === "SENSING_ANSWER");

        if (program.includes(":: grey") || invalid.length > 0 || (asksForInput && !readsAnswer)) {
          failures.push(
            `${item.id} (${seed})\n${question.figure.blocks.map(cleanScratchText).join(" | ")}\n${program}`
          );
        }
      });
    });

    expect(failures).toEqual([]);
  });
});
