import { CalendarDays, Heart, Play, Trash2 } from "lucide-react";
import type { FavoriteSlideshow } from "../types";

type Props = {
  favorites: FavoriteSlideshow[];
  onRename: (id: string, name: string) => void;
  onPlay: (favorite: FavoriteSlideshow, mode: "original" | "fresh") => void;
  onDelete: (id: string) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function FavoritesPage({ favorites, onRename, onPlay, onDelete }: Props) {
  return (
    <div className="favorites-screen">
      <section className="favorites-header app-page-header">
        <div>
          <p className="eyebrow">Bibliothèque personnelle</p>
          <h1>Diaporamas favoris</h1>
          <span>Retrouvez et relancez vos séries enregistrées à l’identique.</span>
        </div>
        <div className="favorites-count">
          <Heart size={18} fill="currentColor" />
          <strong>{favorites.length}</strong>
          <span>{favorites.length > 1 ? "favoris" : "favori"}</span>
        </div>
      </section>

      {favorites.length === 0 ? (
        <section className="favorites-empty">
          <Heart size={42} />
          <h2>Aucun diaporama favori</h2>
          <p>Cliquez sur le cœur pendant ou à la fin d’un diaporama pour l’enregistrer ici.</p>
        </section>
      ) : (
        <section className="favorites-grid">
          {favorites.map((favorite) => {
            const levels = [...new Set(favorite.series.questions.map((question) => question.level))].join(" + ");
            return (
              <article className="favorite-card" key={favorite.id}>
                <div className="favorite-card-top">
                  <Heart size={20} fill="currentColor" />
                  <span>{levels}</span>
                  <strong>{favorite.series.questions.length} questions</strong>
                </div>
                <label>
                  <span>Nom du favori</span>
                  <input
                    value={favorite.name}
                    onChange={(event) => onRename(favorite.id, event.target.value)}
                    aria-label="Nom du diaporama favori"
                  />
                </label>
                <div className="favorite-card-date">
                  <CalendarDays size={15} />
                  <span>{formatDate(favorite.createdAt)}</span>
                </div>
                <div className="favorite-card-actions">
                  <button type="button" className="secondary-button" onClick={() => onPlay(favorite, "original")}>
                    <Play size={17} />
                    Original
                  </button>
                  <button type="button" className="primary-button" onClick={() => onPlay(favorite, "fresh")}>
                    <Play size={17} />
                    Nouvelles données
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => onDelete(favorite.id)}
                    title="Supprimer ce favori"
                    aria-label={`Supprimer ${favorite.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
