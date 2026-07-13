import { Check, FileQuestion, Gauge, Grid2X2, Search, Shapes, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import type { AppSettings, Automatisme, Level, MathDomain } from "../types";
import { DNB_OFFICIAL_TAG } from "../data/dnbOfficialAutomatismes";
import { generateQuestion } from "../generator/generateQuestion";
import { getAutomatismeFamily, getFamilySortLabel } from "../utils/families";
import { domainLabels, levelLabels } from "../utils/labels";
import { resolveAutomatismePool } from "../utils/pool";
import { MathText } from "./MathText";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  disabledIds: string[];
  onChange: (next: Partial<AppSettings>) => void;
};

type FamilyGroup = {
  key: string;
  label: string;
  level: Level;
  chapterRank: number;
  chapterTitle: string;
  domain: MathDomain;
  items: Automatisme[];
};

type ScopeMode = "progression" | "all";

const theoremDomains: MathDomain[] = ["geometrie", "pythagore", "thales", "trigonometrie"];
const levelOrder: Record<Level, number> = { "6e": 0, "5e": 1, "4e": 2, "3e": 3 };

function previewQuestion(automatisme: Automatisme, seed: string) {
  try {
    return generateQuestion(automatisme, seed, automatisme.defaultDurationSeconds);
  } catch {
    return null;
  }
}

export function QuestionSelectionPanel({ settings, automatismes, disabledIds, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level | "all">("all");
  const [domain, setDomain] = useState<MathDomain | "all">("all");
  const [scope, setScope] = useState<ScopeMode>("progression");
  const [focusedFamilyKey, setFocusedFamilyKey] = useState<string>("");

  const allCandidates = useMemo(
    () => automatismes.filter((item) => !disabledIds.includes(item.id)),
    [automatismes, disabledIds]
  );

  const progressionCandidates = useMemo(
    () =>
      resolveAutomatismePool(
        automatismes,
        {
          ...settings,
          selectedAutomatismeIds: [],
          selectedDomains: [],
          excludedTags: [],
          difficultyMode: "mixed"
        },
        disabledIds
      ),
    [automatismes, disabledIds, settings]
  );

  const candidates = scope === "progression" ? progressionCandidates : allCandidates;

  const availableLevels = useMemo(
    () => [...new Set(candidates.flatMap((item) => item.levels))].sort((a, b) => levelOrder[a] - levelOrder[b]),
    [candidates]
  );

  const availableDomains = useMemo(
    () => [...new Set(candidates.map((item) => item.domain))].sort(),
    [candidates]
  );

  const visible = useMemo(
    () =>
      candidates.filter((automatisme) => {
        const searchable = [
          automatisme.title,
          automatisme.subdomain,
          automatisme.chapterTitle ?? "",
          automatisme.statementTemplate,
          automatisme.tags.join(" ")
        ]
          .join(" ")
          .toLowerCase();

        return (
          searchable.includes(query.toLowerCase()) &&
          (level === "all" || automatisme.levels.includes(level)) &&
          (domain === "all" || automatisme.domain === domain)
        );
      }),
    [candidates, domain, level, query]
  );

  const grouped = useMemo<FamilyGroup[]>(() => {
    const map = new Map<string, FamilyGroup>();
    [...visible]
      .sort(
        (a, b) =>
          levelOrder[a.levels[0]] - levelOrder[b.levels[0]] ||
          (a.chapterRank ?? 0) - (b.chapterRank ?? 0) ||
          getFamilySortLabel(a).localeCompare(getFamilySortLabel(b)) ||
          a.title.localeCompare(b.title)
      )
      .forEach((automatisme) => {
        const family = getAutomatismeFamily(automatisme);
        const levelValue = automatisme.levels[0];
        const key = `${levelValue}-${automatisme.chapterRank ?? 0}-${family.key}`;
        const existing =
          map.get(key) ??
          {
            key,
            label: family.label,
            level: levelValue,
            chapterRank: automatisme.chapterRank ?? 0,
            chapterTitle: automatisme.chapterTitle ?? automatisme.subdomain,
            domain: automatisme.domain,
            items: []
          };
        existing.items.push(automatisme);
        map.set(key, existing);
      });
    return [...map.values()];
  }, [visible]);

  const focusedFamily = grouped.find((family) => family.key === focusedFamilyKey) ?? grouped[0];
  const focusedPreview = focusedFamily ? previewQuestion(focusedFamily.items[0], `family-preview:${focusedFamily.key}`) : null;
  const allCandidateIds = new Set(allCandidates.map((item) => item.id));
  const selectedIds = settings.selectedAutomatismeIds.filter((id) => allCandidateIds.has(id));
  const selectedSet = new Set(selectedIds);
  const manualSelection = selectedIds.length > 0;
  const selectedCount = manualSelection ? selectedIds.length : candidates.length;

  const setSelection = (ids: string[]) => {
    onChange({ selectedAutomatismeIds: [...new Set(ids)] });
  };

  const toggleQuestion = (id: string) => {
    if (!manualSelection) {
      setSelection([id]);
      return;
    }
    setSelection(selectedSet.has(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  const setFamilySelection = (family: FamilyGroup) => {
    const ids = family.items.map((item) => item.id);
    const familyFullySelected = manualSelection && ids.every((id) => selectedSet.has(id));

    if (!manualSelection) {
      setSelection(ids);
      return;
    }

    setSelection(familyFullySelected ? selectedIds.filter((id) => !ids.includes(id)) : [...selectedIds, ...ids]);
  };

  const selectVisibleBy = (predicate: (item: Automatisme) => boolean) => {
    setSelection(visible.filter(predicate).map((item) => item.id));
  };

  const selectCurrentChapter = () => {
    setSelection(
      allCandidates
        .filter((item) =>
          settings.levels.some(
            (levelItem) => item.levels.includes(levelItem) && item.chapterRank === settings.chapterLimitByLevel[levelItem]
          )
        )
        .map((item) => item.id)
    );
  };

  const selectDnbOfficial = () => {
    setSelection(allCandidates.filter((item) => item.tags.includes(DNB_OFFICIAL_TAG)).map((item) => item.id));
  };

  return (
    <section className="panel wide selection-panel selection-panel-v3">
      <div className="selection-v3-header">
        <div>
          <p className="eyebrow">Création détaillée</p>
          <h2>Familles lisibles et aperçus</h2>
        </div>
        <div className="selection-count">
          <strong>{selectedCount}</strong>
          <span>{manualSelection ? "choisies" : scope === "progression" ? "dans la progression" : "dans la base"}</span>
        </div>
      </div>

      <div className="selection-v3-toolbar">
        <label className="search-pill">
          <Search size={16} />
          <input
            value={query}
            placeholder="Rechercher : fractions, Pythagore, Scratch..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select value={level} onChange={(event) => setLevel(event.target.value as Level | "all")}>
          <option value="all">Niveaux actifs</option>
          {availableLevels.map((item) => (
            <option key={item} value={item}>
              {levelLabels[item]}
            </option>
          ))}
        </select>
        <select value={domain} onChange={(event) => setDomain(event.target.value as MathDomain | "all")}>
          <option value="all">Tous domaines</option>
          {availableDomains.map((item) => (
            <option key={item} value={item}>
              {domainLabels[item]}
            </option>
          ))}
        </select>
        <div className="selection-scope-switch">
          <button
            type="button"
            className={scope === "progression" ? "selected" : ""}
            onClick={() => setScope("progression")}
          >
            Progression
          </button>
          <button type="button" className={scope === "all" ? "selected" : ""} onClick={() => setScope("all")}>
            Toute base
          </button>
        </div>
      </div>

      <div className="selection-v3-actions">
        <button type="button" className="secondary-button" onClick={() => onChange({ selectedAutomatismeIds: [] })}>
          <Sparkles size={16} />
          Auto
        </button>
        <button type="button" className="secondary-button" onClick={() => setSelection(visible.map((item) => item.id))}>
          <Grid2X2 size={16} />
          Tout filtré
        </button>
        <button type="button" className="secondary-button" onClick={selectCurrentChapter}>
          <Target size={16} />
          Chapitre courant
        </button>
        <button type="button" className="secondary-button" onClick={() => selectVisibleBy((item) => item.tags.includes("flash"))}>
          <Gauge size={16} />
          Flash
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => selectVisibleBy((item) => theoremDomains.includes(item.domain))}
        >
          <Shapes size={16} />
          Théorèmes
        </button>
        <button type="button" className="secondary-button" onClick={selectDnbOfficial}>
          <FileQuestion size={16} />
          DNB
        </button>
        <button type="button" className="primary-button" onClick={() => selectVisibleBy((item) => item.difficulty >= 3)}>
          <Check size={16} />
          Plus dur
        </button>
      </div>

      <div className="selection-v3-workbench">
        <div className="selection-family-list">
          <div className="selection-list-head">
            <span>{scope === "progression" ? "Progression active" : "Toute la base"}</span>
            <strong>{grouped.length} familles</strong>
          </div>

          {grouped.length === 0 && (
            <div className="selection-empty">
              <strong>Aucune famille visible avec ces filtres.</strong>
              <button type="button" className="secondary-button" onClick={() => setScope("all")}>
                Voir toute la base
              </button>
            </div>
          )}

          {grouped.map((family) => {
            const selectedInFamily = manualSelection
              ? family.items.filter((item) => selectedSet.has(item.id)).length
              : family.items.length;
            const familyFullySelected = selectedInFamily === family.items.length;
            const difficultyMin = Math.min(...family.items.map((item) => item.difficulty));
            const difficultyMax = Math.max(...family.items.map((item) => item.difficulty));
            return (
              <article
                className={[
                  "selection-family-row",
                  focusedFamily?.key === family.key ? "focused" : "",
                  selectedInFamily > 0 ? "selected" : "",
                  familyFullySelected ? "full" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={family.key}
              >
                <button type="button" className="selection-family-main" onClick={() => setFocusedFamilyKey(family.key)}>
                  <span>
                    {family.level} · C{family.chapterRank || "?"} · {domainLabels[family.domain]} · D{difficultyMin}
                    {difficultyMax !== difficultyMin ? `-${difficultyMax}` : ""}
                  </span>
                  <strong>{family.label}</strong>
                  <small>{family.chapterTitle}</small>
                </button>
                <button type="button" className="selection-family-pick" onClick={() => setFamilySelection(family)}>
                  <span>
                    {selectedInFamily}/{family.items.length}
                  </span>
                  {familyFullySelected && manualSelection ? "Retirer" : "Choisir"}
                </button>
              </article>
            );
          })}
        </div>

        <div className="selection-family-detail">
          {focusedFamily ? (
            <>
              <div className="selection-detail-head">
                <div>
                  <span>
                    {focusedFamily.level} · Chapitre {focusedFamily.chapterRank} · {domainLabels[focusedFamily.domain]}
                  </span>
                  <strong>{focusedFamily.label}</strong>
                  <small>{focusedFamily.chapterTitle}</small>
                </div>
                <button type="button" className="primary-button" onClick={() => setFamilySelection(focusedFamily)}>
                  Choisir
                </button>
              </div>

              {focusedPreview && (
                <div className="selection-family-preview">
                  <span>Aperçu</span>
                  <strong>
                    <MathText text={focusedPreview.statement} />
                  </strong>
                  <small>Réponse : <MathText text={focusedPreview.shortAnswer} /></small>
                </div>
              )}

              <div className="selection-question-list">
                {focusedFamily.items.map((automatisme) => {
                  const selected = manualSelection && selectedSet.has(automatisme.id);
                  const preview = previewQuestion(automatisme, `question-preview:${automatisme.id}`);
                  return (
                    <button
                      key={automatisme.id}
                      type="button"
                      className={selected ? "selection-question-row selected" : "selection-question-row"}
                      onClick={() => toggleQuestion(automatisme.id)}
                    >
                      <span>D{automatisme.difficulty}</span>
                      <strong>{automatisme.title}</strong>
                      <small>
                        {preview ? <MathText text={preview.statement} /> : domainLabels[automatisme.domain]}
                      </small>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="selection-empty">
              <strong>Aucune famille à afficher.</strong>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
