import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  Layers3,
  ListChecks,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Timer,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AppSettings, Automatisme, CorrectionMode, DifficultyMode, Level, MathDomain, SlideshowMode } from "../types";
import { LEVELS, domainLabels, difficultyLabels, levelLabels } from "../utils/labels";
import { resolveAutomatismePool } from "../utils/pool";
import { generateQuestion } from "../generator/generateQuestion";
import { FigureView } from "../components/FigureView";
import { MathText } from "../components/MathText";
import { repairVisibleText } from "../utils/textRepair";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  disabledIds: string[];
  error: string;
  onSettingsChange: (next: Partial<AppSettings>) => void;
  onStart: () => void;
};

type WorkshopTab = "domains" | "format";

type DomainTreeItem = {
  domain: MathDomain;
  subdomains: Array<{
    key: string;
    label: string;
    items: Automatisme[];
  }>;
  items: Automatisme[];
};

const questionChoices = [8, 10, 12, 15, 20, 30];
const durationChoices = [8, 10, 12, 15, 20, 30, 45, 60];
const readingChoices = [0, 3, 5, 8, 10];

const workshopAccentReplacements: Array<[RegExp, string]> = [
  [/\bde equilibre\b/gi, "dé équilibré"],
  [/\bl unite\b/gi, "l’unité"],
  [/\btrace d'un\b/gi, "tracé d’un"],
  [/\brelatifs enchaine\b/gi, "relatifs enchaînés"],
  [/\?galit\?/gi, "égalité"],
  [/\bcontrapos\?e\b/gi, "contraposée"],
  [/\bd\?composer\b/gi, "décomposer"],
  [/\bd\?composition\b/gi, "décomposition"],
  [/\bgradu\?e\b/gi, "graduée"],
  [/\bpond\?r\?e\b/gi, "pondérée"],
  [/\bencha\?n\?/gi, "enchaîné"],
  [/\br\?daction\b/gi, "rédaction"],
  [/\brep\?rage\b/gi, "repérage"],
  [/\bquatri\?me\b/gi, "quatrième"],
  [/in\?galit\?/gi, "inégalité"],
  [/\bproportionnalit\?/gi, "proportionnalité"],
  [/\bdiff\?rent\b/gi, "différent"],
  [/\bdiff\?rents\b/gi, "différents"],
  [/\bcomplement\b/gi, "complément"],
  [/\bdecimal\b/gi, "décimal"],
  [/\bdecimale\b/gi, "décimale"],
  [/\bmoitie\b/gi, "moitié"],
  [/\bquantite\b/gi, "quantité"],
  [/\bperimetre\b/gi, "périmètre"],
  [/\bpriorite\b/gi, "priorité"],
  [/\bparentheses\b/gi, "parenthèses"],
  [/\boppose\b/gi, "opposé"],
  [/\bmeme\b/gi, "même"],
  [/\bdenominateur\b/gi, "dénominateur"],
  [/\bquatrieme\b/gi, "quatrième"],
  [/\breduire\b/gi, "réduire"],
  [/\betendue\b/gi, "étendue"],
  [/\bequation\b/gi, "équation"],
  [/\bprobabilite\b/gi, "probabilité"],
  [/\bfrequence\b/gi, "fréquence"],
  [/\bdistributivite\b/gi, "distributivité"],
  [/\bidentite\b/gi, "identité"],
  [/\blineaire\b/gi, "linéaire"],
  [/\bdivisibilite\b/gi, "divisibilité"],
  [/\bcritere\b/gi, "critère"],
  [/\bdefinition\b/gi, "définition"],
  [/\bdecomposition\b/gi, "décomposition"],
  [/\becriture\b/gi, "écriture"],
  [/\begalite\b/gi, "égalité"],
  [/\begalites\b/gi, "égalités"],
  [/\bevenement\b/gi, "événement"],
  [/\bevenements\b/gi, "événements"],
  [/\bnon equiprobabilite\b/gi, "non-équiprobabilité"],
  [/\bequiprobabilite\b/gi, "équiprobabilité"],
  [/\bmediane\b/gi, "médiane"],
  [/\bcentieme\b/gi, "centième"],
  [/\birreductible\b/gi, "irréductible"],
  [/\bproportionnalite\b/gi, "proportionnalité"],
  [/\bproportionnelle\b/gi, "proportionnelle"],
  [/\bcompleter\b/gi, "compléter"],
  [/\bcomplementaire\b/gi, "complémentaire"],
  [/\bsupplementaire\b/gi, "supplémentaire"],
  [/\bparallele\b/gi, "parallèle"],
  [/\bparalleles\b/gi, "parallèles"],
  [/\bperpendiculaire\b/gi, "perpendiculaire"],
  [/\bperpendiculaires\b/gi, "perpendiculaires"],
  [/\bcote\b/gi, "côté"],
  [/\bcotes\b/gi, "côtés"],
  [/\bposee\b/gi, "posée"],
  [/\breduction\b/gi, "réduction"],
  [/\brepete\b/gi, "répété"],
  [/\brepetee\b/gi, "répétée"],
  [/\bdifferent\b/gi, "différent"],
  [/\bdifferents\b/gi, "différents"],
  [/\binterieur\b/gi, "intérieur"],
  [/\bexterieur\b/gi, "extérieur"],
  [/\bsuperieur\b/gi, "supérieur"],
  [/\binferieur\b/gi, "inférieur"],
  [/\bpremiere\b/gi, "première"],
  [/\bdeuxieme\b/gi, "deuxième"],
  [/\btroisieme\b/gi, "troisième"],
  [/\bresultat\b/gi, "résultat"],
  [/\bnumero\b/gi, "numéro"],
  [/\bnumerateur\b/gi, "numérateur"],
  [/\bunite\b/gi, "unité"],
  [/\bechelle\b/gi, "échelle"],
  [/\bantecedent\b/gi, "antécédent"],
  [/\bordonnee\b/gi, "ordonnée"],
  [/\bcoordonnees\b/gi, "coordonnées"],
  [/\bmediatrice\b/gi, "médiatrice"],
  [/\bmedian\b/gi, "médian"],
  [/\bponderee\b/gi, "pondérée"],
  [/\bimbriquee\b/gi, "imbriquée"],
  [/\bhomothetie\b/gi, "homothétie"],
  [/\bequivalente\b/gi, "équivalente"],
  [/\bnegative\b/gi, "négative"],
  [/\bprefixe\b/gi, "préfixe"],
  [/\breversible\b/gi, "réversible"],
  [/\bcontraposee\b/gi, "contraposée"],
  [/\bsecante\b/gi, "sécante"],
  [/\bsecantes\b/gi, "sécantes"],
  [/\bguide\b/gi, "guidé"],
  [/\benchaine\b/gi, "enchaîné"],
  [/\brepeter\b/gi, "répéter"],
  [/\brepetition\b/gi, "répétition"],
  [/\bequilateral\b/gi, "équilatéral"],
  [/\binitialisee\b/gi, "initialisée"],
  [/\bverifier\b/gi, "vérifier"],
  [/\bdevelopper\b/gi, "développer"],
  [/\bzero\b/gi, "zéro"],
  [/\bthales\b/gi, "Thalès"],
  [/\bcone\b/gi, "cône"],
  [/\bpyramide\b/gi, "pyramide"],
  [/\breciproque\b/gi, "réciproque"],
  [/\btheoreme\b/gi, "théorème"],
  [/\bsymetrie\b/gi, "symétrie"],
  [/\bduree\b/gi, "durée"],
  [/\breperage\b/gi, "repérage"],
  [/\ba\b/g, "à"]
];

function formatWorkshopLabel(text: string): string {
  let formatted = repairVisibleText(text.trim());
  workshopAccentReplacements.forEach(([pattern, replacement]) => {
    formatted = formatted.replace(pattern, (match) => {
      if (match === match.toUpperCase()) return replacement.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
      return replacement;
    });
  });
  return formatted.replace(/^([a-zà-ÿ])/, (letter) => letter.toUpperCase());
}

export function AdvancedSettingsPage({ settings, automatismes, disabledIds, error, onSettingsChange, onStart }: Props) {
  const [activeTab, setActiveTab] = useState<WorkshopTab>("domains");
  const [expandedDomains, setExpandedDomains] = useState<MathDomain[]>([]);
  const [expandedSubdomains, setExpandedSubdomains] = useState<string[]>([]);
  const [previewAutomatisme, setPreviewAutomatisme] = useState<Automatisme | null>(null);
  const selectedLevels: Level[] = settings.levels.length > 0 ? settings.levels : ["6e"];

  const toggleWorkshopLevel = (level: Level) => {
    const levels = settings.levels.includes(level)
      ? settings.levels.length > 1
        ? LEVELS.filter((item) => settings.levels.includes(item) && item !== level)
        : settings.levels
      : LEVELS.filter((item) => [...settings.levels, level].includes(item));
    onSettingsChange({
      levels,
      progressionByLevel: { "6e": "end", "5e": "end", "4e": "end", "3e": "end" },
      chapterLimitByLevel: { "6e": 999, "5e": 999, "4e": 999, "3e": 999 },
      selectedChapterIdsByLevel: { "6e": [], "5e": [], "4e": [], "3e": [] },
      includePreviousSteps: true,
      selectedAutomatismeIds: []
    });
    setExpandedDomains([]);
    setExpandedSubdomains([]);
  };

  useEffect(() => {
    const fullYear = selectedLevels.every(
      (level) => settings.progressionByLevel[level] === "end" && settings.chapterLimitByLevel[level] >= 999
    );
    const hasChapterFilter = Object.values(settings.selectedChapterIdsByLevel).some((ids) => ids.length > 0);

    if (!fullYear || hasChapterFilter || !settings.includePreviousSteps) {
      onSettingsChange({
        levels: selectedLevels,
        progressionByLevel: { "6e": "end", "5e": "end", "4e": "end", "3e": "end" },
        chapterLimitByLevel: { "6e": 999, "5e": 999, "4e": 999, "3e": 999 },
        selectedChapterIdsByLevel: { "6e": [], "5e": [], "4e": [], "3e": [] },
        includePreviousSteps: true,
        selectedAutomatismeIds: []
      });
    }
  }, []);

  const currentPool = useMemo(
    () => resolveAutomatismePool(automatismes, settings, disabledIds),
    [automatismes, disabledIds, settings]
  );
  const availableTotal = useMemo(
    () => automatismes.filter((item) => !disabledIds.includes(item.id)).length,
    [automatismes, disabledIds]
  );
  const domainBasePool = useMemo(
    () =>
      automatismes.filter(
        (automatisme) =>
          !disabledIds.includes(automatisme.id) &&
          selectedLevels.some((level) => automatisme.levels.includes(level))
      ),
    [automatismes, disabledIds, selectedLevels]
  );
  const domainTree = useMemo<DomainTreeItem[]>(() => {
    const domainMap = new Map<MathDomain, DomainTreeItem>();
    domainBasePool.forEach((automatisme) => {
      const domainGroup =
        domainMap.get(automatisme.domain) ??
        {
          domain: automatisme.domain,
          subdomains: [],
          items: []
        };
      domainGroup.items.push(automatisme);
      domainMap.set(automatisme.domain, domainGroup);
    });

    return [...domainMap.values()]
      .sort((left, right) => domainLabels[left.domain].localeCompare(domainLabels[right.domain]))
      .map((domainGroup) => {
        const subdomainMap = new Map<string, Automatisme[]>();
        domainGroup.items.forEach((automatisme) => {
          const label = formatWorkshopLabel(automatisme.subdomain || automatisme.chapterTitle || "Autres");
          subdomainMap.set(label, [...(subdomainMap.get(label) ?? []), automatisme]);
        });

        return {
          ...domainGroup,
          subdomains: [...subdomainMap.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([label, items]) => ({
              key: `${domainGroup.domain}:${label}`,
              label,
              items: items.sort((left, right) =>
                formatWorkshopLabel(left.title).localeCompare(formatWorkshopLabel(right.title), "fr")
              )
            }))
        };
      });
  }, [domainBasePool]);
  const previewQuestion = useMemo(() => {
    if (!previewAutomatisme) {
      return null;
    }
    const level = selectedLevels.find((item) => previewAutomatisme.levels.includes(item)) ?? previewAutomatisme.levels[0];
    return generateQuestion(previewAutomatisme, `preview:${previewAutomatisme.id}`, previewAutomatisme.defaultDurationSeconds, level);
  }, [previewAutomatisme, selectedLevels]);

  useEffect(() => {
    if (!previewAutomatisme) {
      return;
    }
    const closePreview = () => setPreviewAutomatisme(null);
    window.addEventListener("pointerup", closePreview);
    window.addEventListener("pointercancel", closePreview);
    window.addEventListener("blur", closePreview);
    return () => {
      window.removeEventListener("pointerup", closePreview);
      window.removeEventListener("pointercancel", closePreview);
      window.removeEventListener("blur", closePreview);
    };
  }, [previewAutomatisme]);

  const selectedIdSet = useMemo(() => new Set(settings.selectedAutomatismeIds), [settings.selectedAutomatismeIds]);
  const manualCount = settings.selectedAutomatismeIds.length;
  const canLaunch = currentPool.length >= settings.questionCount;
  const selectedLevelLabel = selectedLevels
    .map((level) => levelLabels[level])
    .join(" + ");
  const selectedQuestionLabel = manualCount > 0 ? `${manualCount} choisies` : `${currentPool.length} possibles`;

  const resetSelection = () => {
    onSettingsChange({
      selectedAutomatismeIds: [],
      selectedDomains: [],
      excludedTags: []
    });
  };

  const toggleDomain = (domain: MathDomain) => {
    onSettingsChange({
      selectedDomains: settings.selectedDomains.includes(domain)
        ? settings.selectedDomains.filter((item) => item !== domain)
        : [...settings.selectedDomains, domain],
      selectedAutomatismeIds: []
    });
  };

  const setItemSelection = (ids: string[]) => {
    onSettingsChange({
      selectedAutomatismeIds: [...new Set(ids)],
      selectedDomains: []
    });
  };

  const toggleSubdomain = (items: Automatisme[]) => {
    const ids = items.map((item) => item.id);
    const allSelected = ids.every((id) => selectedIdSet.has(id));
    setItemSelection(
      allSelected
        ? settings.selectedAutomatismeIds.filter((id) => !ids.includes(id))
        : [...settings.selectedAutomatismeIds, ...ids]
    );
  };

  const toggleSlideContent = (id: string) => {
    setItemSelection(
      selectedIdSet.has(id)
        ? settings.selectedAutomatismeIds.filter((item) => item !== id)
        : [...settings.selectedAutomatismeIds, id]
    );
  };

  const toggleExpandedDomain = (domain: MathDomain) => {
    setExpandedDomains((current) =>
      current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain]
    );
  };

  const toggleExpandedSubdomain = (key: string) => {
    setExpandedSubdomains((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  return (
    <div className="workshop-screen">
      <section className="workshop-top app-page-header">
        <div className="workshop-title">
          <p className="eyebrow">Atelier séance</p>
          <h1>Composer une séance</h1>
          <span>
            {selectedLevelLabel} · {settings.questionCount} questions · {settings.durationSeconds}s
          </span>
        </div>

        <div className="workshop-kpis">
          <article>
            <ListChecks size={17} />
            <span>Base</span>
            <strong>{availableTotal}</strong>
          </article>
          <article>
            <Layers3 size={17} />
            <span>Sélection</span>
            <strong>{selectedQuestionLabel}</strong>
          </article>
          <article className={canLaunch ? "ready" : "blocked"}>
            <CheckCircle2 size={17} />
            <span>État</span>
            <strong>{canLaunch ? "Prêt" : `${currentPool.length}/${settings.questionCount}`}</strong>
          </article>
        </div>

        <button type="button" className="workshop-launch" onClick={onStart} disabled={!canLaunch}>
          <Play size={20} />
          <span>Lancer</span>
        </button>
      </section>

      {(error || !canLaunch) && (
        <div className="workshop-alert">
          {error ||
            `Sélection trop courte : ${currentPool.length} modèle${currentPool.length > 1 ? "s" : ""} pour ${settings.questionCount} questions.`}
        </div>
      )}

      <nav className="workshop-tabs" aria-label="Sections de l'atelier">
        {[
          ["domains", "Domaines"],
          ["format", "Format"]
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? "selected" : ""}
            onClick={() => setActiveTab(key as WorkshopTab)}
          >
            {label}
          </button>
        ))}
      </nav>

      <nav className="workshop-cumulative-tabs" aria-label="Niveaux du diaporama">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={selectedLevels.includes(level) ? "selected" : ""}
            onClick={() => toggleWorkshopLevel(level)}
          >
            <strong>{levelLabels[level]}</strong>
            <span>{selectedLevels.includes(level) ? "Inclus" : "Ajouter"}</span>
          </button>
        ))}
      </nav>

      <section className="workshop-tab-panel">
        {activeTab === "domains" && (
          <article className="workshop-panel">
            <div className="workshop-panel-head">
              <div>
                <p className="eyebrow">Domaines</p>
                <h2>Thèmes du diaporama</h2>
              </div>
              <button type="button" className="workshop-reset" onClick={resetSelection}>
                <RotateCcw size={15} />
                Tous
              </button>
            </div>

            <div className="workshop-domain-tree">
              {domainTree.map((domainGroup) => {
                const domainExpanded = expandedDomains.includes(domainGroup.domain);
                const domainIds = domainGroup.items.map((item) => item.id);
                const manualDomainSelected = domainIds.length > 0 && domainIds.every((id) => selectedIdSet.has(id));
                const domainSelected = settings.selectedDomains.includes(domainGroup.domain) || manualDomainSelected;

                return (
                  <div className="workshop-domain-node" key={domainGroup.domain}>
                    <div className="workshop-tree-row domain">
                      <button
                        type="button"
                        className={domainExpanded ? "expanded" : ""}
                        onClick={() => toggleExpandedDomain(domainGroup.domain)}
                        aria-label={`Afficher ${domainLabels[domainGroup.domain]}`}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <label>
                        <input
                          type="checkbox"
                          checked={domainSelected}
                          onChange={() => toggleDomain(domainGroup.domain)}
                        />
                        <strong>{domainLabels[domainGroup.domain]}</strong>
                        <span>{domainGroup.items.length} contenus</span>
                      </label>
                    </div>

                    {domainExpanded && (
                      <div className="workshop-subdomain-list">
                        {domainGroup.subdomains.map((subdomain) => {
                          const subdomainExpanded = expandedSubdomains.includes(subdomain.key);
                          const subdomainIds = subdomain.items.map((item) => item.id);
                          const subdomainSelected =
                            subdomainIds.length > 0 && subdomainIds.every((id) => selectedIdSet.has(id));
                          const subdomainPartial =
                            !subdomainSelected && subdomainIds.some((id) => selectedIdSet.has(id));

                          return (
                            <div className="workshop-subdomain-node" key={subdomain.key}>
                              <div className="workshop-tree-row subdomain">
                                <button
                                  type="button"
                                  className={subdomainExpanded ? "expanded" : ""}
                                  onClick={() => toggleExpandedSubdomain(subdomain.key)}
                                  aria-label={`Afficher ${subdomain.label}`}
                                >
                                  <ChevronDown size={15} />
                                </button>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={subdomainSelected}
                                    onChange={() => toggleSubdomain(subdomain.items)}
                                  />
                                  <strong>{subdomain.label}</strong>
                                  <span>
                                    {subdomainPartial ? "partiel · " : ""}
                                    {subdomain.items.length} diaporamas
                                  </span>
                                </label>
                              </div>

                              {subdomainExpanded && (
                                <div className="workshop-slide-content-list">
                                  {subdomain.items.map((automatisme) => (
                                    <label className="workshop-slide-content" key={automatisme.id}>
                                      <input
                                        type="checkbox"
                                        checked={selectedIdSet.has(automatisme.id)}
                                        onChange={() => toggleSlideContent(automatisme.id)}
                                      />
                                      <span>{automatisme.levels.join("/")}</span>
                                      <span>D{automatisme.difficulty}</span>
                                      <strong>{formatWorkshopLabel(automatisme.title)}</strong>
                                      <small>{formatWorkshopLabel(automatisme.chapterTitle ?? automatisme.subdomain)}</small>
                                      <button
                                        type="button"
                                        className="workshop-preview-trigger"
                                        onPointerDown={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          setPreviewAutomatisme(automatisme);
                                        }}
                                        onPointerUp={() => setPreviewAutomatisme(null)}
                                        onPointerCancel={() => setPreviewAutomatisme(null)}
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                        }}
                                        aria-label={`Maintenir pour prévisualiser ${formatWorkshopLabel(automatisme.title)}`}
                                        title="Maintenir pour afficher l’aperçu"
                                      >
                                        <Eye size={16} />
                                      </button>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        )}

        {activeTab === "format" && (
          <article className="workshop-panel workshop-format">
            <div className="workshop-panel-head">
              <div>
                <p className="eyebrow">Format</p>
                <h2>Durée et correction</h2>
              </div>
              <button type="button" className="workshop-reset" onClick={resetSelection}>
                <RotateCcw size={15} />
                Auto
              </button>
            </div>

            <div className="workshop-setting">
              <span>Questions</span>
              <div className="workshop-chip-row">
                {questionChoices.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={settings.questionCount === count ? "selected" : ""}
                    onClick={() => onSettingsChange({ questionCount: count })}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="workshop-setting">
              <span>Chrono</span>
              <div className="workshop-chip-row">
                {durationChoices.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    className={settings.durationSeconds === duration ? "selected" : ""}
                    onClick={() => onSettingsChange({ durationSeconds: duration })}
                  >
                    {duration}s
                  </button>
                ))}
              </div>
            </div>

            <div className="workshop-setting">
              <span>Lecture</span>
              <div className="workshop-chip-row">
                {readingChoices.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    className={settings.readingSeconds === duration ? "selected" : ""}
                    onClick={() => onSettingsChange({ readingSeconds: duration })}
                  >
                    {duration}s
                  </button>
                ))}
              </div>
            </div>

            <div className="workshop-mode-grid">
              {(["easy", "medium", "hard", "mixed"] as DifficultyMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={settings.difficultyMode === mode ? "selected" : ""}
                  onClick={() => onSettingsChange({ difficultyMode: mode, selectedAutomatismeIds: [] })}
                >
                  <Trophy size={15} />
                  {difficultyLabels[mode]}
                </button>
              ))}
            </div>

            <div className="workshop-two-cols">
              <div className="workshop-mini-group">
                <span>Mode</span>
                {(["ritual", "training", "evaluation"] as SlideshowMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={settings.slideshowMode === mode ? "selected" : ""}
                    onClick={() => onSettingsChange({ slideshowMode: mode })}
                  >
                    {mode === "ritual" ? "Rituel" : mode === "training" ? "Entraînement" : "Évaluation"}
                  </button>
                ))}
              </div>

              <div className="workshop-mini-group">
                <span>Correction</span>
                {(["final", "immediate"] as CorrectionMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={settings.correctionMode === mode ? "selected" : ""}
                    onClick={() => onSettingsChange({ correctionMode: mode })}
                  >
                    {mode === "final" ? "À la fin" : "Directe"}
                  </button>
                ))}
              </div>
            </div>

            <div className="workshop-switch-grid">
              <label className="workshop-toggle">
                <input
                  type="checkbox"
                  checked={settings.showTimer}
                  onChange={(event) => onSettingsChange({ showTimer: event.target.checked })}
                />
                <Timer size={15} />
                <span>Chrono visible</span>
              </label>
              <label className="workshop-toggle">
                <input
                  type="checkbox"
                  checked={settings.durationByDifficulty}
                  onChange={(event) => onSettingsChange({ durationByDifficulty: event.target.checked })}
                />
                <Clock3 size={15} />
                <span>Temps adapté</span>
              </label>
              <label className="workshop-toggle">
                <input
                  type="checkbox"
                  checked={settings.detailedCorrections}
                  onChange={(event) => onSettingsChange({ detailedCorrections: event.target.checked })}
                />
                <SlidersHorizontal size={15} />
                <span>Correction détaillée</span>
              </label>
            </div>
          </article>
        )}
      </section>
      {previewQuestion && (
        <div className="workshop-preview-overlay" aria-live="polite">
          <article className="workshop-preview-popup">
            <header>
              <span>Aperçu · {previewQuestion.level}</span>
              <strong>{formatWorkshopLabel(previewQuestion.title)}</strong>
              <small>Relâchez le clic pour fermer</small>
            </header>
            <div className={previewQuestion.figure ? "workshop-preview-body with-figure" : "workshop-preview-body"}>
              <h2><MathText text={previewQuestion.statement} /></h2>
              {previewQuestion.figure && <FigureView figure={previewQuestion.figure} compact />}
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
