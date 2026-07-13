import { BookOpenCheck, Eye, EyeOff, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { Automatisme, Level, MathDomain } from "../types";
import { generateQuestion } from "../generator/generateQuestion";
import { FigureView } from "../components/FigureView";
import { MathText } from "../components/MathText";
import { domainLabels, levelLabels, progressionLabels } from "../utils/labels";

type Props = {
  automatismes: Automatisme[];
  favoriteIds: string[];
  disabledIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleDisabled: (id: string) => void;
};

type StatusFilter = "all" | "active" | "disabled" | "favorites";

const levelOrder: Record<Level, number> = { "6e": 0, "5e": 1, "4e": 2, "3e": 3 };

function buildPreview(automatisme: Automatisme) {
  try {
    return generateQuestion(automatisme, `library:${automatisme.id}`, automatisme.defaultDurationSeconds);
  } catch {
    return null;
  }
}

export function LibraryPage({
  automatismes,
  favoriteIds,
  disabledIds,
  onToggleFavorite,
  onToggleDisabled
}: Props) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level | "all">("all");
  const [domain, setDomain] = useState<MathDomain | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState("");

  const domains = useMemo(
    () => [...new Set(automatismes.map((item) => item.domain))].sort(),
    [automatismes]
  );

  const levels = useMemo(
    () => [...new Set(automatismes.flatMap((item) => item.levels))].sort((a, b) => levelOrder[a] - levelOrder[b]),
    [automatismes]
  );

  const filtered = useMemo(
    () =>
      automatismes
        .filter((automatisme) => {
          const searchable = [
            automatisme.title,
            automatisme.subdomain,
            automatisme.chapterTitle ?? "",
            automatisme.statementTemplate,
            automatisme.correctionTemplate,
            automatisme.tags.join(" ")
          ]
            .join(" ")
            .toLowerCase();
          const disabled = disabledIds.includes(automatisme.id);
          const favorite = favoriteIds.includes(automatisme.id);

          return (
            searchable.includes(query.toLowerCase()) &&
            (level === "all" || automatisme.levels.includes(level)) &&
            (domain === "all" || automatisme.domain === domain) &&
            (status === "all" ||
              (status === "active" && !disabled) ||
              (status === "disabled" && disabled) ||
              (status === "favorites" && favorite))
          );
        })
        .sort(
          (a, b) =>
            levelOrder[a.levels[0]] - levelOrder[b.levels[0]] ||
            (a.chapterRank ?? 0) - (b.chapterRank ?? 0) ||
            domainLabels[a.domain].localeCompare(domainLabels[b.domain]) ||
            a.title.localeCompare(b.title)
        ),
    [automatismes, disabledIds, domain, favoriteIds, level, query, status]
  );

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0];
  const preview = selected ? buildPreview(selected) : null;
  const activeCount = automatismes.filter((item) => !disabledIds.includes(item.id)).length;
  const disabledCount = automatismes.length - activeCount;
  const favorite = selected ? favoriteIds.includes(selected.id) : false;
  const disabled = selected ? disabledIds.includes(selected.id) : false;

  return (
    <div className="library-v4-screen">
      <section className="library-v4-top">
        <div>
          <p className="eyebrow">Bibliothèque</p>
          <h1>Base d’automatismes</h1>
          <span>{filtered.length} modèles affichés sur {automatismes.length}</span>
        </div>
        <div className="library-v4-stats">
          <article>
            <BookOpenCheck size={17} />
            <span>Actifs</span>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <Star size={17} />
            <span>Favoris</span>
            <strong>{favoriteIds.length}</strong>
          </article>
          <article>
            <EyeOff size={17} />
            <span>Off</span>
            <strong>{disabledCount}</strong>
          </article>
        </div>
      </section>

      <section className="library-v4-filters">
        <label className="search-pill">
          <Search size={16} />
          <input
            value={query}
            placeholder="Rechercher chapitre, notion, énoncé, tag..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select value={level} onChange={(event) => setLevel(event.target.value as Level | "all")}>
          <option value="all">Tous niveaux</option>
          {levels.map((item) => (
            <option key={item} value={item}>
              {levelLabels[item]}
            </option>
          ))}
        </select>
        <select value={domain} onChange={(event) => setDomain(event.target.value as MathDomain | "all")}>
          <option value="all">Tous domaines</option>
          {domains.map((item) => (
            <option key={item} value={item}>
              {domainLabels[item]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          <option value="all">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="favorites">Favoris</option>
          <option value="disabled">Désactivés</option>
        </select>
      </section>

      <section className="library-v4-body">
        <div className="library-v4-list">
          {filtered.map((automatisme) => {
            const itemDisabled = disabledIds.includes(automatisme.id);
            const itemFavorite = favoriteIds.includes(automatisme.id);
            return (
              <button
                type="button"
                className={[
                  "library-v4-item",
                  selected?.id === automatisme.id ? "selected" : "",
                  itemDisabled ? "disabled" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={automatisme.id}
                onClick={() => setSelectedId(automatisme.id)}
              >
                <span>{automatisme.levels.join(", ")} · {automatisme.chapterRank ? `C${automatisme.chapterRank}` : progressionLabels[automatisme.progressionStep]}</span>
                <strong>{automatisme.title}</strong>
                <small>{domainLabels[automatisme.domain]} · D{automatisme.difficulty}{itemFavorite ? " · Favori" : ""}</small>
              </button>
            );
          })}
        </div>

        <div className="library-v4-detail">
          {selected && preview ? (
            <>
              <div className="library-v4-detail-head">
                <div>
                  <span>{selected.levels.join(", ")} · {selected.chapterTitle ?? selected.subdomain}</span>
                  <strong>{selected.title}</strong>
                  <small>{domainLabels[selected.domain]} · Difficulté {selected.difficulty} · {selected.status}</small>
                </div>
                <div className="library-v4-actions">
                  <button
                    type="button"
                    className={favorite ? "icon-button active" : "icon-button"}
                    onClick={() => onToggleFavorite(selected.id)}
                    title="Favori"
                  >
                    <Star size={17} />
                  </button>
                  <button
                    type="button"
                    className={disabled ? "icon-button danger" : "icon-button"}
                    onClick={() => onToggleDisabled(selected.id)}
                    title={disabled ? "Réactiver" : "Désactiver"}
                  >
                    {disabled ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="library-v4-preview">
                <div>
                  <span>Énoncé généré</span>
                  <h2><MathText text={preview.statement} /></h2>
                </div>
                {preview.figure && <FigureView figure={preview.figure} compact />}
              </div>

              <div className="library-v4-correction">
                <article>
                  <span>Réponse</span>
                  <strong><MathText text={preview.shortAnswer} /></strong>
                </article>
                <article>
                  <span>Correction</span>
                  <p><MathText text={preview.correction} /></p>
                </article>
              </div>

              <div className="library-v4-meta">
                <span>{selected.id}</span>
                <span>{selected.tags.slice(0, 8).join(" · ")}</span>
                {selected.sourceNote && <span>{selected.sourceNote}</span>}
              </div>
            </>
          ) : (
            <div className="selection-empty">
              <strong>Aucun automatisme à afficher.</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
