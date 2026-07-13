import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Eye, EyeOff, Layers3, MoveRight, Presentation, RotateCcw, Save, Search } from "lucide-react";
import type { AppSettings, Automatisme, Level } from "../types";
import { getChapterById, progressionLevels } from "../data/siteProgression";
import { domainLabels, levelLabels } from "../utils/labels";
import {
  getCustomizedChaptersForLevel,
  getEffectiveAutomatismeChapterId
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

  useEffect(() => {
    if (!chapters.some((chapter) => chapter.id === selectedChapterId)) {
      setSelectedChapterId(chapters[0]?.id ?? "");
    }
  }, [chapters, selectedChapterId]);

  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0];

  useEffect(() => {
    setTitleDraft(selectedChapter?.title ?? "");
    setQuery("");
  }, [selectedChapter?.id, selectedChapter?.title]);

  const chapterSlides = useMemo(() => {
    if (!selectedChapter) return [];
    const normalizedQuery = query.trim().toLocaleLowerCase("fr");
    return automatismes
      .filter((automatisme) => getEffectiveAutomatismeChapterId(automatisme, settings) === selectedChapter.id)
      .filter((automatisme) => {
        if (!normalizedQuery) return true;
        return `${automatisme.title} ${automatisme.statementTemplate} ${automatisme.subdomain}`
          .toLocaleLowerCase("fr")
          .includes(normalizedQuery);
      })
      .sort((left, right) => left.title.localeCompare(right.title, "fr"));
  }, [automatismes, query, selectedChapter, settings]);

  const chapterCounts = useMemo(() => {
    const counts = new Map<string, number>();
    automatismes.forEach((automatisme) => {
      const chapterId = getEffectiveAutomatismeChapterId(automatisme, settings);
      if (chapterId) counts.set(chapterId, (counts.get(chapterId) ?? 0) + 1);
    });
    return counts;
  }, [automatismes, settings]);

  const disabledSet = useMemo(() => new Set(disabledIds), [disabledIds]);
  const hiddenChapterSet = useMemo(() => new Set(settings.hiddenChapterIds), [settings.hiddenChapterIds]);
  const hiddenSlides = automatismes.filter((item) => disabledSet.has(item.id)).length;

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

  const moveSlide = (automatisme: Automatisme, nextChapterId: string) => {
    const nextOverrides = { ...settings.automatismeChapterOverrides };
    if (nextChapterId === automatisme.chapterId) delete nextOverrides[automatisme.id];
    else nextOverrides[automatisme.id] = nextChapterId;
    onSettingsChange({
      automatismeChapterOverrides: nextOverrides,
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
    onSettingsChange({
      chapterTitleOverrides: nextTitles,
      hiddenChapterIds: settings.hiddenChapterIds.filter((id) => id !== selectedChapter.id),
      automatismeChapterOverrides: nextMoves,
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
          <span>Renommez, déplacez ou masquez les chapitres et leurs diapos.</span>
        </div>
        <div className="progression-editor-stats">
          <article><BookOpenCheck size={18} /><span>Chapitres masqués</span><strong>{settings.hiddenChapterIds.length}</strong></article>
          <article><EyeOff size={18} /><span>Diapos masquées</span><strong>{hiddenSlides}</strong></article>
          <article><MoveRight size={18} /><span>Diapos déplacées</span><strong>{Object.keys(settings.automatismeChapterOverrides).length}</strong></article>
        </div>
      </header>

      <nav className="progression-editor-levels" aria-label="Niveau à modifier">
        {progressionLevels.map((item) => (
          <button
            type="button"
            key={item}
            className={item === level ? "selected" : ""}
            onClick={() => setLevel(item)}
          >
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
                    <input
                      id="progression-chapter-title"
                      value={titleDraft}
                      maxLength={160}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") saveTitle(); }}
                    />
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
                  <label>
                    <Search size={16} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une diapo" />
                  </label>
                </div>

                <div className="progression-editor-slide-list">
                  {chapterSlides.map((automatisme) => {
                    const disabled = disabledSet.has(automatisme.id);
                    const effectiveChapterId = getEffectiveAutomatismeChapterId(automatisme, settings) ?? selectedChapter.id;
                    return (
                      <article className={disabled ? "progression-editor-slide disabled" : "progression-editor-slide"} key={automatisme.id}>
                        <div className="progression-editor-slide-copy">
                          <div><span>{automatisme.levels.join(" · ")}</span><span>{domainLabels[automatisme.domain]}</span><span>Difficulté {automatisme.difficulty}</span></div>
                          <strong>{automatisme.title}</strong>
                          <p>{automatisme.statementTemplate}</p>
                        </div>
                        <label className="progression-editor-move">
                          <span>Chapitre</span>
                          <select value={effectiveChapterId} onChange={(event) => moveSlide(automatisme, event.target.value)}>
                            {allChaptersByLevel.map((group) => (
                              <optgroup key={group.level} label={levelLabels[group.level]}>
                                {group.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
                              </optgroup>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="progression-editor-visibility"
                          onClick={() => toggleSlideVisibility(automatisme.id)}
                          aria-label={`${disabled ? "Afficher" : "Masquer"} ${automatisme.title}`}
                        >
                          {disabled ? <Eye size={18} /> : <EyeOff size={18} />}
                          {disabled ? "Afficher" : "Masquer"}
                        </button>
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
