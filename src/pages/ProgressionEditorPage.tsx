import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Eye,
  EyeOff,
  Layers3,
  LibraryBig,
  MoveRight,
  Plus,
  Presentation,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X
} from "lucide-react";
import type { AppSettings, Automatisme, Level } from "../types";
import { getChapterById, progressionLevels } from "../data/siteProgression";
import { domainLabels, levelLabels } from "../utils/labels";
import {
  applyProgressionCustomizations,
  getCustomizedChaptersForLevel,
  getEffectiveAutomatismeChapterId,
  parseAdditionalAutomatismeId
} from "../utils/progressionCustomization";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  disabledIds: string[];
  onSettingsChange: (next: Partial<AppSettings>) => void;
  onDisabledIdsChange: (next: string[]) => void;
};

export function ProgressionEditorPage({
  settings,
  automatismes,
  disabledIds,
  onSettingsChange,
  onDisabledIdsChange
}: Props) {
  const initialLevel = settings.levels[0] ?? "6e";
  const [level, setLevel] = useState<Level>(initialLevel);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [query, setQuery] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [sourceLevel, setSourceLevel] = useState<Level>(initialLevel);
  const [sourceChapterId, setSourceChapterId] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");

  const chapters = useMemo(
    () => getCustomizedChaptersForLevel(level, settings, true),
    [level, settings]
  );
  const allChaptersByLevel = useMemo(
    () => progressionLevels.map((item) => ({
      level: item,
      chapters: getCustomizedChaptersForLevel(item, settings, true)
    })),
    [settings]
  );
  const sourceChapters = useMemo(
    () => getCustomizedChaptersForLevel(sourceLevel, settings, true),
    [settings, sourceLevel]
  );
  const customizedAutomatismes = useMemo(
    () => applyProgressionCustomizations(automatismes, settings),
    [automatismes, settings]
  );

  useEffect(() => {
    if (!chapters.some((chapter) => chapter.id === selectedChapterId)) {
      setSelectedChapterId(chapters[0]?.id ?? "");
    }
  }, [chapters, selectedChapterId]);

  useEffect(() => {
    if (!sourceChapters.some((chapter) => chapter.id === sourceChapterId)) {
      setSourceChapterId(sourceChapters[0]?.id ?? "");
    }
  }, [sourceChapterId, sourceChapters]);

  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0];

  useEffect(() => {
    setTitleDraft(selectedChapter?.title ?? "");
    setQuery("");
    setLibraryOpen(false);
  }, [selectedChapter?.id, selectedChapter?.title]);

  const chapterSlides = useMemo(() => {
    if (!selectedChapter) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return customizedAutomatismes
      .filter((automatisme) => automatisme.chapterId === selectedChapter.id)
      .filter((automatisme) => {
        if (!normalizedQuery) return true;
        return `${automatisme.title} ${automatisme.statementTemplate} ${automatisme.subdomain}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      })
      .sort((left, right) => left.title.localeCompare(right.title, "fr"));
  }, [customizedAutomatismes, query, selectedChapter]);

  const chapterCounts = useMemo(() => {
    const counts = new Map<string, number>();
    customizedAutomatismes.forEach((automatisme) => {
      if (automatisme.chapterId) {
        counts.set(automatisme.chapterId, (counts.get(automatisme.chapterId) ?? 0) + 1);
      }
    });
    return counts;
  }, [customizedAutomatismes]);

  const librarySlides = useMemo(() => {
    const normalizedQuery = libraryQuery.trim().toLocaleLowerCase("fr");
    return automatismes
      .filter((automatisme) => getEffectiveAutomatismeChapterId(automatisme, settings) === sourceChapterId)
      .filter((automatisme) => {
        if (!normalizedQuery) return true;
        return `${automatisme.title} ${automatisme.statementTemplate} ${automatisme.subdomain}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      })
      .sort((left, right) => left.title.localeCompare(right.title, "fr"));
  }, [automatismes, libraryQuery, settings, sourceChapterId]);

  const disabledSet = useMemo(() => new Set(disabledIds), [disabledIds]);
  const hiddenChapterSet = useMemo(() => new Set(settings.hiddenChapterIds), [settings.hiddenChapterIds]);
  const hiddenSlides = customizedAutomatismes.filter((item) => disabledSet.has(item.id)).length;
  const addedSlides = Object.values(settings.automatismeAdditionalChapterIds).reduce(
    (total, chapterIds) => total + chapterIds.length,
    0
  );

  const isAddedToSelectedChapter = (automatisme: Automatisme) => {
    if (!selectedChapter) return false;
    return getEffectiveAutomatismeChapterId(automatisme, settings) === selectedChapter.id
      || (settings.automatismeAdditionalChapterIds[automatisme.id] ?? []).includes(selectedChapter.id);
  };

  const saveTitle = () => {
    if (!selectedChapter) return;
    const originalTitle = getChapterById(selectedChapter.id)?.title ?? selectedChapter.title;
    const nextTitle = titleDraft.trim();
    const nextOverrides = { ...settings.chapterTitleOverrides };
    if (!nextTitle || nextTitle === originalTitle) delete nextOverrides[selectedChapter.id];
    else nextOverrides[selectedChapter.id] = nextTitle;
    onSettingsChange({ chapterTitleOverrides: nextOverrides });
  };

  const toggleChapterVisibility = () => {
    if (!selectedChapter) return;
    const isHidden = hiddenChapterSet.has(selectedChapter.id);
    const nextHidden = isHidden
      ? settings.hiddenChapterIds.filter((id) => id !== selectedChapter.id)
      : [...settings.hiddenChapterIds, selectedChapter.id];
    const nextSelection = Object.fromEntries(
      progressionLevels.map((item) => [
        item,
        (settings.selectedChapterIdsByLevel[item] ?? []).filter((id) => id !== selectedChapter.id)
      ])
    ) as AppSettings["selectedChapterIdsByLevel"];
    onSettingsChange({
      hiddenChapterIds: nextHidden,
      selectedChapterIdsByLevel: nextSelection,
      selectedAutomatismeIds: []
    });
  };

  const toggleSlideVisibility = (automatismeId: string) => {
    onDisabledIdsChange(
      disabledSet.has(automatismeId)
        ? disabledIds.filter((id) => id !== automatismeId)
        : [...disabledIds, automatismeId]
    );
  };

  const addSlides = (slides: Automatisme[]) => {
    if (!selectedChapter) return;
    const nextAdditional = { ...settings.automatismeAdditionalChapterIds };
    slides.forEach((automatisme) => {
      if (getEffectiveAutomatismeChapterId(automatisme, settings) === selectedChapter.id) return;
      nextAdditional[automatisme.id] = [
        ...new Set([...(nextAdditional[automatisme.id] ?? []), selectedChapter.id])
      ];
    });
    onSettingsChange({
      automatismeAdditionalChapterIds: nextAdditional,
      selectedAutomatismeIds: []
    });
  };

  const removeAddedSlide = (automatismeId: string) => {
    const parsed = parseAdditionalAutomatismeId(automatismeId);
    if (!parsed) return;
    const nextAdditional = { ...settings.automatismeAdditionalChapterIds };
    const remaining = (nextAdditional[parsed.sourceId] ?? []).filter((chapterId) => chapterId !== parsed.chapterId);
    if (remaining.length) nextAdditional[parsed.sourceId] = remaining;
    else delete nextAdditional[parsed.sourceId];
    onSettingsChange({ automatismeAdditionalChapterIds: nextAdditional, selectedAutomatismeIds: [] });
    if (disabledSet.has(automatismeId)) {
      onDisabledIdsChange(disabledIds.filter((id) => id !== automatismeId));
    }
  };

  const moveSlide = (automatisme: Automatisme, nextChapterId: string) => {
    const added = parseAdditionalAutomatismeId(automatisme.id);
    const sourceId = added?.sourceId ?? automatisme.id;
    const source = automatismes.find((item) => item.id === sourceId);
    if (!source) return;

    if (added) {
      const nextAdditional = { ...settings.automatismeAdditionalChapterIds };
      const remaining = (nextAdditional[sourceId] ?? []).filter((chapterId) => chapterId !== added.chapterId);
      const primaryChapterId = getEffectiveAutomatismeChapterId(source, settings);
      const destinations = nextChapterId === primaryChapterId ? remaining : [...new Set([...remaining, nextChapterId])];
      if (destinations.length) nextAdditional[sourceId] = destinations;
      else delete nextAdditional[sourceId];
      onSettingsChange({ automatismeAdditionalChapterIds: nextAdditional, selectedAutomatismeIds: [] });
      if (disabledSet.has(automatisme.id)) {
        onDisabledIdsChange(disabledIds.filter((id) => id !== automatisme.id));
      }
      return;
    }

    const nextOverrides = { ...settings.automatismeChapterOverrides };
    if (nextChapterId === source.chapterId) delete nextOverrides[sourceId];
    else nextOverrides[sourceId] = nextChapterId;
    const nextAdditional = { ...settings.automatismeAdditionalChapterIds };
    const remaining = (nextAdditional[sourceId] ?? []).filter((chapterId) => chapterId !== nextChapterId);
    if (remaining.length) nextAdditional[sourceId] = remaining;
    else delete nextAdditional[sourceId];
    onSettingsChange({
      automatismeChapterOverrides: nextOverrides,
      automatismeAdditionalChapterIds: nextAdditional,
      selectedAutomatismeIds: []
    });
  };

  const resetSelectedChapter = () => {
    if (!selectedChapter) return;
    const nextTitles = { ...settings.chapterTitleOverrides };
    delete nextTitles[selectedChapter.id];
    const nextMoves = { ...settings.automatismeChapterOverrides };
    Object.entries(nextMoves).forEach(([automatismeId, chapterId]) => {
      const original = automatismes.find((item) => item.id === automatismeId)?.chapterId;
      if (chapterId === selectedChapter.id || original === selectedChapter.id) delete nextMoves[automatismeId];
    });
    const nextAdditional = Object.fromEntries(
      Object.entries(settings.automatismeAdditionalChapterIds)
        .map(([automatismeId, chapterIds]) => [
          automatismeId,
          chapterIds.filter((chapterId) => chapterId !== selectedChapter.id)
        ])
        .filter(([, chapterIds]) => (chapterIds as string[]).length > 0)
    );
    const removedCloneIds = disabledIds.filter((id) => parseAdditionalAutomatismeId(id)?.chapterId === selectedChapter.id);
    if (removedCloneIds.length) {
      onDisabledIdsChange(disabledIds.filter((id) => !removedCloneIds.includes(id)));
    }
    onSettingsChange({
      chapterTitleOverrides: nextTitles,
      hiddenChapterIds: settings.hiddenChapterIds.filter((id) => id !== selectedChapter.id),
      automatismeChapterOverrides: nextMoves,
      automatismeAdditionalChapterIds: nextAdditional,
      selectedAutomatismeIds: []
    });
    setTitleDraft(getChapterById(selectedChapter.id)?.title ?? selectedChapter.title);
  };

  return (
    <div className="progression-editor-screen">
      <header className="progression-editor-header app-page-header">
        <div>
          <p className="eyebrow">Personnalisation</p>
          <h1>Éditeur de progression</h1>
          <span>Renommez, déplacez, ajoutez ou masquez les chapitres et leurs diapos.</span>
        </div>
        <div className="progression-editor-stats">
          <article><BookOpenCheck size={18} /><span>Chapitres masqués</span><strong>{settings.hiddenChapterIds.length}</strong></article>
          <article><EyeOff size={18} /><span>Diapos masquées</span><strong>{hiddenSlides}</strong></article>
          <article><MoveRight size={18} /><span>Diapos déplacées</span><strong>{Object.keys(settings.automatismeChapterOverrides).length}</strong></article>
          <article><Plus size={18} /><span>Diapos ajoutées</span><strong>{addedSlides}</strong></article>
        </div>
      </header>

      <nav className="progression-editor-levels" aria-label="Niveau à modifier">
        {progressionLevels.map((item) => (
          <button type="button" key={item} className={item === level ? "selected" : ""} onClick={() => setLevel(item)}>
            {levelLabels[item]}
          </button>
        ))}
      </nav>

      <div className="progression-editor-layout">
        <aside className="progression-editor-chapters">
          <div className="progression-editor-panel-title">
            <div><Layers3 size={17} /><strong>Chapitres de {levelLabels[level]}</strong></div>
            <span>{chapters.length} chapitres</span>
          </div>
          <label className="progression-editor-chapter-select">
            <span>Chapitre à modifier</span>
            <select value={selectedChapter?.id ?? ""} onChange={(event) => setSelectedChapterId(event.target.value)}>
              {chapters.map((chapter, index) => (
                <option key={chapter.id} value={chapter.id}>
                  {index + 1}. {chapter.title} · {chapterCounts.get(chapter.id) ?? 0} diapos
                </option>
              ))}
            </select>
          </label>
          <div className="progression-editor-chapter-list">
            {chapters.map((chapter, index) => {
              const hidden = hiddenChapterSet.has(chapter.id);
              return (
                <button
                  type="button"
                  key={chapter.id}
                  className={[chapter.id === selectedChapter?.id ? "selected" : "", hidden ? "hidden-item" : ""].filter(Boolean).join(" ")}
                  onClick={() => setSelectedChapterId(chapter.id)}
                >
                  <span>{index + 1}</span>
                  <div><strong>{chapter.title}</strong><small>{chapterCounts.get(chapter.id) ?? 0} diapos</small></div>
                  {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="progression-editor-content">
          {selectedChapter ? (
            <>
              <section className="progression-editor-chapter-settings">
                <div className="progression-editor-title-field">
                  <label htmlFor="progression-chapter-title">Nom du chapitre</label>
                  <div>
                    <input id="progression-chapter-title" value={titleDraft} maxLength={160} onChange={(event) => setTitleDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveTitle(); }} />
                    <button type="button" onClick={saveTitle}><Save size={16} />Enregistrer</button>
                  </div>
                </div>
                <div className="progression-editor-chapter-actions">
                  <button type="button" onClick={toggleChapterVisibility}>
                    {hiddenChapterSet.has(selectedChapter.id) ? <Eye size={17} /> : <EyeOff size={17} />}
                    {hiddenChapterSet.has(selectedChapter.id) ? "Afficher le chapitre" : "Masquer le chapitre"}
                  </button>
                  <button type="button" onClick={resetSelectedChapter}><RotateCcw size={17} />Réinitialiser ce chapitre</button>
                </div>
              </section>

              <section className="progression-editor-slides">
                <div className="progression-editor-slides-head">
                  <div><Presentation size={18} /><strong>Diapos du chapitre</strong><span>{chapterSlides.length}</span></div>
                  <div className="progression-editor-slides-tools">
                    <button type="button" className="progression-editor-add-button" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((open) => !open)}>
                      {libraryOpen ? <X size={17} /> : <Plus size={17} />}
                      {libraryOpen ? "Fermer" : "Ajouter des diapos"}
                    </button>
                    <label>
                      <Search size={16} />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une diapo" />
                    </label>
                  </div>
                </div>

                {libraryOpen && (
                  <section className="progression-editor-library" aria-label="Bibliothèque de diapos">
                    <div className="progression-editor-library-title">
                      <div><LibraryBig size={19} /><div><strong>Ajouter des diapos</strong><span>Choisissez librement un niveau et un chapitre source.</span></div></div>
                      <button type="button" onClick={() => setLibraryOpen(false)} aria-label="Fermer la bibliothèque"><X size={18} /></button>
                    </div>
                    <div className="progression-editor-library-levels" aria-label="Niveau source">
                      {progressionLevels.map((item) => (
                        <button type="button" key={item} className={sourceLevel === item ? "selected" : ""} onClick={() => setSourceLevel(item)}>
                          {levelLabels[item]}
                        </button>
                      ))}
                    </div>
                    <div className="progression-editor-library-filters">
                      <label>
                        <span>Chapitre source</span>
                        <select value={sourceChapterId} onChange={(event) => setSourceChapterId(event.target.value)}>
                          {sourceChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Rechercher</span>
                        <div><Search size={16} /><input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Titre, énoncé…" /></div>
                      </label>
                      <button
                        type="button"
                        onClick={() => addSlides(librarySlides)}
                        disabled={librarySlides.length === 0 || librarySlides.every(isAddedToSelectedChapter)}
                      >
                        <Plus size={17} />Ajouter les {librarySlides.length} diapos
                      </button>
                    </div>
                    <div className="progression-editor-library-list">
                      {librarySlides.map((automatisme) => {
                        const alreadyAdded = isAddedToSelectedChapter(automatisme);
                        return (
                          <article key={automatisme.id}>
                            <div>
                              <span>{levelLabels[sourceLevel]}</span><span>{domainLabels[automatisme.domain]}</span>
                              <strong>{automatisme.title}</strong>
                              <p>{automatisme.statementTemplate}</p>
                            </div>
                            <button type="button" disabled={alreadyAdded} onClick={() => addSlides([automatisme])}>
                              {alreadyAdded ? <><BookOpenCheck size={16} />Déjà présente</> : <><Plus size={16} />Ajouter</>}
                            </button>
                          </article>
                        );
                      })}
                      {librarySlides.length === 0 && <div className="progression-editor-empty">Aucune diapo trouvée dans ce chapitre.</div>}
                    </div>
                  </section>
                )}

                <div className="progression-editor-slide-list">
                  {chapterSlides.map((automatisme) => {
                    const disabled = disabledSet.has(automatisme.id);
                    const added = parseAdditionalAutomatismeId(automatisme.id);
                    return (
                      <article className={disabled ? "progression-editor-slide disabled" : "progression-editor-slide"} key={automatisme.id}>
                        <div className="progression-editor-slide-copy">
                          <div>
                            {added && <span className="added-badge">Ajoutée</span>}
                            <span>{automatisme.levels.join(" · ")}</span><span>{domainLabels[automatisme.domain]}</span><span>Difficulté {automatisme.difficulty}</span>
                          </div>
                          <strong>{automatisme.title}</strong>
                          <p>{automatisme.statementTemplate}</p>
                        </div>
                        <label className="progression-editor-move">
                          <span>Chapitre</span>
                          <select value={automatisme.chapterId ?? selectedChapter.id} onChange={(event) => moveSlide(automatisme, event.target.value)}>
                            {allChaptersByLevel.map((group) => (
                              <optgroup key={group.level} label={levelLabels[group.level]}>
                                {group.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        </label>
                        <div className="progression-editor-slide-actions">
                          <button type="button" className="progression-editor-visibility" onClick={() => toggleSlideVisibility(automatisme.id)} aria-label={`${disabled ? "Afficher" : "Masquer"} ${automatisme.title}`}>
                            {disabled ? <Eye size={18} /> : <EyeOff size={18} />}
                            {disabled ? "Afficher" : "Masquer"}
                          </button>
                          {added && (
                            <button type="button" className="progression-editor-remove" onClick={() => removeAddedSlide(automatisme.id)}>
                              <Trash2 size={17} />Retirer
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                  {chapterSlides.length === 0 && <div className="progression-editor-empty">Aucune diapo dans ce chapitre avec ce filtre.</div>}
                </div>
              </section>
            </>
          ) : <div className="progression-editor-empty">Aucun chapitre disponible pour ce niveau.</div>}
        </main>
      </div>
    </div>
  );
}
