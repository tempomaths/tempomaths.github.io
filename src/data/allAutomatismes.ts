import { largeAutomatismes } from "./largeAutomatismes";
import { dnbOfficialAutomatismes } from "./dnbOfficialAutomatismes";
import { mentalCalculAutomatismes } from "./mentalCalculAutomatismes";
import { repairVisibleText } from "../utils/textRepair";

const removedOfficialQuestionIds = new Set([
  "mental-6e-03",
  "mental-6e-04",
  "mental-6e-05",
  "mental-6e-06",
  "mental-5e-21",
  "site-6e-chap-06-05",
  "mental-6e-13",
  "mental-5e-18",
  "mental-5e-22",
  "mental-5e-23",
  "site-5e-chap-18-08",
  "site-5e-chap-19-completion-04",
  "site-5e-chap-21-14",
  "site-4e-chap-12-11",
  "mental-4e-34",
  "site-4e-chap-18-04",
  "site-4e-chap-20-14",
  "site-3e-chap-01-11",
  "site-3e-chap-10-11",
  "site-3e-chap-10-12",
  "site-3e-chap-10-13",
  "site-3e-chap-10-14",
  "site-3e-chap-10-15",
  "site-3e-chap-10-16",
  "site-3e-chap-10-20",
  "mental-3e-43",
  "mental-3e-45",
  "site-3e-chap-16-14"
]);

// Modèles dont la tâche mathématique est nettement en dessous du niveau du
// chapitre (calcul isolé, simple lecture ou propriété déjà acquise). Les
// chapitres concernés conservent au moins dix types réellement distincts.
const tooSimpleForLevelQuestionIds = new Set([
  // 5e
  "site-5e-chap-01-01",
  "site-5e-chap-01-02",
  "site-5e-chap-01-03",
  "site-5e-chap-05-01",
  "site-5e-chap-05-05",
  "site-5e-chap-05-06",
  "site-5e-chap-05-13",
  "site-5e-chap-05-14",
  "site-5e-chap-05-15",
  "site-5e-chap-05-16",
  "site-5e-chap-05-17",
  "site-5e-chap-16-02",
  "site-5e-chap-16-completion-01",
  "site-5e-chap-18-02",
  "site-5e-chap-18-03",
  "site-5e-chap-18-12",

  // 4e
  "site-4e-chap-02-01",
  "site-4e-chap-02-02",
  "site-4e-chap-02-04",
  "site-4e-chap-08-01",
  "site-4e-chap-08-02",
  "site-4e-chap-10-01",
  "site-4e-chap-10-05",
  "site-4e-chap-10-06",
  "site-4e-chap-10-14",
  "site-4e-chap-10-15",
  "site-4e-chap-10-16",
  "site-4e-chap-10-17",
  "site-4e-chap-10-18",
  "site-4e-chap-12-02",
  "site-4e-chap-12-03",
  "site-4e-chap-12-14",
  "site-4e-chap-12-16",
  "site-4e-chap-15-04",
  "site-4e-chap-17-12",
  "site-4e-chap-17-13",
  "site-4e-chap-17-17",
  "site-4e-chap-18-09",
  "site-4e-chap-18-11",
  "site-4e-chap-18-12",
  "site-4e-chap-18-13",
  "site-4e-chap-18-14",
  "site-4e-chap-18-18",
  "site-4e-chap-19-02",
  "site-4e-chap-19-04",
  "site-4e-chap-19-06",
  "site-4e-chap-19-07",
  "site-4e-chap-19-09",
  "site-4e-chap-19-11",
  "site-4e-chap-19-completion-06",
  "site-4e-chap-19-completion-07",
  "site-4e-chap-19-completion-08",
  "site-4e-chap-20-02",
  "site-4e-chap-20-10",
  "site-4e-chap-20-11",
  "site-4e-chap-20-12",
  "site-4e-chap-20-22",
  "site-4e-chap-20-23",

  // 3e (hors banque DNB officielle, conservée telle quelle)
  "site-3e-chap-01-02",
  "site-3e-chap-01-03",
  "site-3e-chap-01-14",
  "site-3e-chap-01-16",
  "mental-3e-35",
  "site-3e-chap-03-01",
  "site-3e-chap-03-02",
  "site-3e-chap-03-03",
  "site-3e-chap-03-04",
  "site-3e-chap-03-06",
  "site-3e-chap-03-07",
  "site-3e-chap-03-08",
  "site-3e-chap-03-09",
  "site-3e-chap-04-01",
  "site-3e-chap-04-03",
  "site-3e-chap-06-05",
  "site-3e-chap-06-07",
  "site-3e-chap-06-11",
  "mental-3e-38",
  "site-3e-chap-07-01",
  "site-3e-chap-07-02",
  "site-3e-chap-07-03",
  "site-3e-chap-07-04",
  "site-3e-chap-07-05",
  "site-3e-chap-07-06",
  "site-3e-chap-07-07",
  "site-3e-chap-07-08",
  "site-3e-chap-09-02",
  "site-3e-chap-09-03",
  "site-3e-chap-12-completion-01",
  "site-3e-chap-12-completion-02",
  "site-3e-chap-13-01",
  "site-3e-chap-13-02",
  "site-3e-chap-13-04",
  "site-3e-chap-13-06",
  "site-3e-chap-13-07",
  "site-3e-chap-13-08",
  "site-3e-chap-13-10",
  "site-3e-chap-13-12",
  "site-3e-chap-13-13",
  "site-3e-chap-13-14",
  "site-3e-chap-13-16",
  "site-3e-chap-13-17",
  "site-3e-chap-13-18",
  "site-3e-chap-13-19",
  "site-3e-chap-13-20",
  "site-3e-chap-15-01",
  "site-3e-chap-15-03",
  "site-3e-chap-15-04",
  "site-3e-chap-15-05",
  "site-3e-chap-15-06",
  "site-3e-chap-15-07",
  "site-3e-chap-15-08",
  "site-3e-chap-15-09",
  "site-3e-chap-15-10",
  "site-3e-chap-15-11",
  "site-3e-chap-15-12",
  "site-3e-chap-15-13",
  "site-3e-chap-15-14",
  "site-3e-chap-15-15",
  "site-3e-chap-15-16",
  "site-3e-chap-16-02",
  "site-3e-chap-16-07",
  "site-3e-chap-16-10",
  "site-3e-chap-16-11",
  "site-3e-chap-16-12",
  "site-3e-chap-16-22",
  "site-3e-chap-16-23"
]);

const normalizeQuestionStatement = (statement: string) => repairVisibleText(statement)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\\(?:,|;|!|quad|qquad)/g, "")
  .replace(/[\s$.,:;!?]/g, "")
  .replace(/[’']/g, "");

const seenStatementsByChapter = new Set<string>();

export const allOfficialAutomatismes = [
  ...largeAutomatismes,
  ...mentalCalculAutomatismes,
  ...dnbOfficialAutomatismes
]
  .filter((automatisme) => !removedOfficialQuestionIds.has(automatisme.id))
  .filter((automatisme) => !tooSimpleForLevelQuestionIds.has(automatisme.id))
  .filter((automatisme) => {
    if (!automatisme.chapterId) return true;
    if (automatisme.tags.includes("variation-thematique")) return true;
    const fingerprint = `${automatisme.chapterId}:${normalizeQuestionStatement(automatisme.statementTemplate)}`;
    if (seenStatementsByChapter.has(fingerprint)) return false;
    seenStatementsByChapter.add(fingerprint);
    return true;
  });
