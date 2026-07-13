import { repairVisibleText } from "./textRepair";

type ScratchContext = {
  variables?: ReadonlySet<string>;
};

type ExpressionNode =
  | { kind: "atom"; value: string }
  | { kind: "operation"; operator: "+" | "-" | "*" | "/"; left: ExpressionNode; right: ExpressionNode };

const variablePattern = "[\\p{L}_][\\p{L}\\p{N}_-]*";
const scratchQuestionPlaceholder = "__SCRATCH_QUESTION_PLACEHOLDER__";
const scratchVariableXPlaceholder = "__SCRATCH_VARIABLE_X__";

export function cleanScratchText(text: string): string {
  const protectedText = text
    .replace(/(^|\s)\?(?=\s|$)/g, `$1${scratchQuestionPlaceholder}`)
    // In Scratch, x is a coordinate or a variable. It must not be repaired as
    // an old multiplication sign before the block syntax is interpreted.
    .replace(/\bx\b/giu, scratchVariableXPlaceholder);

  return repairVisibleText(protectedText)
    .replaceAll(scratchQuestionPlaceholder, "?")
    .replaceAll(scratchVariableXPlaceholder, "x")
    .replace(/\bclique\b/giu, "cliqué")
    .replace(/\brepeter\b/giu, "répéter")
    .replace(/\bdegres\b/giu, "degrés")
    .replace(/\bresultat\b/giu, "résultat")
    .replace(/\breponse\b/giu, "réponse")
    .replace(/\bgagne\b/giu, "gagné")
    .replace(/\bvalide\b/giu, "validé")
    .replace(/\brefuse\b/giu, "refusé")
    .replace(/\breussi\b/giu, "réussi")
    .replace(/\bRésultat\b/g, "résultat")
    .replace(/\bRéponse\b/g, "réponse")
    .replace(/(\d)\.(\d)/g, "$1,$2")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVariableName(value: string): string {
  return value.trim().toLocaleLowerCase("fr");
}

function escapeScratchValue(value: string): string {
  return value.replace(/([\\\]])/g, "\\$1");
}

function normalizeExpression(value: string): string {
  return value
    .trim()
    .replace(/[\u2212–—]/g, "-")
    .replace(/[\u00d7·]/g, "*")
    .replace(/\u00f7/g, "/")
    // Several old templates used the letter x as a multiplication sign.
    .replace(/\s+[xX]\s+/g, " * ")
    // In a few legacy strings, a lost multiplication sign became a question mark.
    .replace(/\s+\?\s+/g, " * ")
    .replace(/\s+/g, " ");
}

function removeOuterParentheses(value: string): string {
  let expression = value.trim();

  while (expression.startsWith("(") && expression.endsWith(")")) {
    let depth = 0;
    let wrapsEverything = true;

    for (let index = 0; index < expression.length; index += 1) {
      if (expression[index] === "(") depth += 1;
      if (expression[index] === ")") depth -= 1;
      if (depth === 0 && index < expression.length - 1) {
        wrapsEverything = false;
        break;
      }
    }

    if (!wrapsEverything || depth !== 0) break;
    expression = expression.slice(1, -1).trim();
  }

  return expression;
}

function previousNonSpace(value: string, start: number): string {
  for (let index = start; index >= 0; index -= 1) {
    if (value[index] !== " ") return value[index];
  }
  return "";
}

function findTopLevelOperator(value: string, operators: ReadonlySet<string>): number {
  let depth = 0;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const character = value[index];
    if (character === ")") {
      depth += 1;
      continue;
    }
    if (character === "(") {
      depth -= 1;
      continue;
    }
    if (depth !== 0 || !operators.has(character)) continue;

    if (character === "+" || character === "-") {
      const previous = previousNonSpace(value, index - 1);
      if (!previous || "+-*/(".includes(previous)) continue;
    }

    return index;
  }

  return -1;
}

function parseExpression(raw: string): ExpressionNode {
  const expression = removeOuterParentheses(normalizeExpression(raw));
  const additiveIndex = findTopLevelOperator(expression, new Set(["+", "-"]));

  if (additiveIndex >= 0) {
    return {
      kind: "operation",
      operator: expression[additiveIndex] as "+" | "-",
      left: parseExpression(expression.slice(0, additiveIndex)),
      right: parseExpression(expression.slice(additiveIndex + 1))
    };
  }

  const multiplicativeIndex = findTopLevelOperator(expression, new Set(["*", "/"]));
  if (multiplicativeIndex >= 0) {
    return {
      kind: "operation",
      operator: expression[multiplicativeIndex] as "*" | "/",
      left: parseExpression(expression.slice(0, multiplicativeIndex)),
      right: parseExpression(expression.slice(multiplicativeIndex + 1))
    };
  }

  if (expression.startsWith("-") && !/^-\d+(?:[.,]\d+)?$/.test(expression)) {
    return {
      kind: "operation",
      operator: "-",
      left: { kind: "atom", value: "0" },
      right: parseExpression(expression.slice(1))
    };
  }

  return { kind: "atom", value: expression || "?" };
}

function renderExpression(node: ExpressionNode): string {
  if (node.kind === "atom") {
    return `(${escapeScratchValue(node.value)})`;
  }

  return `(${renderExpression(node.left)} ${node.operator} ${renderExpression(node.right)})`;
}

export function scratchReporter(value: string): string {
  return renderExpression(parseExpression(value));
}

function isOperation(value: string): boolean {
  return parseExpression(value).kind === "operation";
}

function scratchCondition(left: string, operator: string, right: string): string {
  const leftReporter = scratchReporter(left);
  const rightReporter = scratchReporter(right);

  if (operator === ">=" || operator === "≥") {
    return `<non <${leftReporter} < ${rightReporter}>>`;
  }
  if (operator === "<=" || operator === "≤") {
    return `<non <${leftReporter} > ${rightReporter}>>`;
  }
  if (operator === "!=" || operator === "≠") {
    return `<non <${leftReporter} = ${rightReporter}>>`;
  }

  return `<${leftReporter} ${operator} ${rightReporter}>`;
}

function collectScratchVariables(blocks: string[]): Set<string> {
  const variables = new Set<string>();
  const setVariable = new RegExp(`^mettre (${variablePattern}) (?:à|a|=|\\?) `, "iu");
  const changeVariable = new RegExp(`^ajouter .+ (?:à|a|=|\\?) (${variablePattern})$`, "iu");

  blocks.map(cleanScratchText).forEach((block) => {
    const setMatch = block.match(setVariable);
    if (setMatch) variables.add(normalizeVariableName(setMatch[1]));

    const changeMatch = block.match(changeVariable);
    if (changeMatch && !/^[xy]$/i.test(changeMatch[1])) {
      variables.add(normalizeVariableName(changeMatch[1]));
    }
  });

  return variables;
}

function scratchString(value: string): string {
  return `[${escapeScratchValue(value)}]`;
}

export function scratchSyntax(raw: string, context: ScratchContext = {}): string {
  const text = cleanScratchText(raw);
  let match: RegExpMatchArray | null;

  if (/^quand (?:le )?drapeau vert cliqué$/iu.test(text)) {
    return "quand @greenFlag est cliqué";
  }
  if ((match = text.match(/^répéter (.+) fois$/iu))) {
    return `répéter ${scratchReporter(match[1])} fois`;
  }
  if ((match = text.match(/^répéter jusqu['’]à (.+?)\s*(>=|<=|!=|≥|≤|≠|>|<|=)\s*(.+)$/iu))) {
    return `répéter jusqu'à ce que ${scratchCondition(match[1], match[2], match[3])}`;
  }
  if ((match = text.match(/^avancer(?: de)?(?: (.+?))?(?: pas)?$/iu))) {
    return `avancer de ${scratchReporter(match[1] || "10")} pas`;
  }
  if ((match = text.match(/^tourner(?: de)? (.+?) degrés$/iu))) {
    return `tourner @turnRight de ${scratchReporter(match[1])} degrés`;
  }
  if ((match = text.match(/^aller (?:à|a) x:\s*(.+?) y:\s*(.+)$/iu))) {
    return `aller à x: ${scratchReporter(match[1])} y: ${scratchReporter(match[2])}`;
  }
  if ((match = text.match(/^ajouter (.+) (?:à|a|=|\?) ([xy])$/iu))) {
    return `ajouter ${scratchReporter(match[1])} à ${match[2].toLowerCase()}`;
  }
  if ((match = text.match(new RegExp(`^mettre (${variablePattern}) (?:à|a|=|\\?) (.+)$`, "iu")))) {
    return `mettre [${escapeScratchValue(match[1])} v] à ${scratchReporter(match[2])}`;
  }
  if ((match = text.match(new RegExp(`^ajouter (.+) (?:à|a|=|\\?) (${variablePattern})$`, "iu")))) {
    return `ajouter ${scratchReporter(match[1])} à [${escapeScratchValue(match[2])} v]`;
  }
  if ((match = text.match(/^dire (.+)$/iu))) {
    const argument = match[1].trim();
    const isVariable = context.variables?.has(normalizeVariableName(argument)) ?? false;
    const isReporter = isVariable || /^(?:réponse|answer)$/iu.test(argument);
    const isNumeric = /^-?\d+(?:[.,]\d+)?$|^\?$/.test(argument);
    return `dire ${isReporter || isNumeric || isOperation(argument) ? scratchReporter(argument) : scratchString(argument)}`;
  }
  if ((match = text.match(/^demander (.+)$/iu))) {
    return `demander ${scratchString(match[1])} et attendre`;
  }
  if ((match = text.match(/^si (.+?)\s*(>=|<=|!=|≥|≤|≠|>|<|=)\s*(.+?) alors$/iu))) {
    return `si ${scratchCondition(match[1], match[2], match[3])} alors`;
  }
  if (/^sinon$/iu.test(text)) return "sinon";

  return `${text} :: grey`;
}

export function makeScratchProgram(blocks: string[]): string {
  const variables = collectScratchVariables(blocks);
  const lines = blocks.map((block) => scratchSyntax(block, { variables }));
  const controls = lines.filter((line) => /^(?:répéter|si )/iu.test(line)).length;
  return [...lines, ...Array.from({ length: controls }, () => "fin")].join("\n");
}
