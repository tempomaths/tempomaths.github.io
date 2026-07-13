import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AppSettings, Automatisme, FavoriteSlideshow, GeneratedSeries, Level, QuestionAttempt, SeriesResult, StoredPayload, TrainingContext } from "./types";
import { allOfficialAutomatismes } from "./data/allAutomatismes";
import { generateSeries } from "./generator/generateSeries";
import { generateQuestion } from "./generator/generateQuestion";
import { AppShell, type PageKey } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { AdvancedSettingsPage } from "./pages/AdvancedSettingsPage";
import { EditorPage } from "./pages/EditorPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProgressionPage } from "./pages/ProgressionPage";
import { ProgressionEditorPage } from "./pages/ProgressionEditorPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { BELT_STAGES, BeltTrainingPage, createBeltPreset } from "./pages/BeltTrainingPage";
import { SlideshowView } from "./components/SlideshowView";
import { ResultsView } from "./components/ResultsView";
import { defaultSettings, loadStorage, saveStorage } from "./services/storage";
import { LEVELS } from "./utils/labels";
import { resolveAutomatismePool } from "./utils/pool";
import { applyProgressionCustomizations } from "./utils/progressionCustomization";

type Stage = "app" | "slideshow" | "results";

export function App() {
  const [stored, setStored] = useState<StoredPayload>(() => loadStorage());
  const [page, setPage] = useState<PageKey>("home");
  const [stage, setStage] = useState<Stage>("app");
  const [activeSeries, setActiveSeries] = useState<GeneratedSeries | null>(null);
  const [activeResult, setActiveResult] = useState<SeriesResult | null>(null);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    saveStorage(stored);
  }, [stored]);

  const settings = stored.settings;
  const rawAutomatismes = useMemo(
    () => [...allOfficialAutomatismes, ...stored.customAutomatismes],
    [stored.customAutomatismes]
  );
  const allAutomatismes = useMemo(
    () => applyProgressionCustomizations(rawAutomatismes, settings),
    [rawAutomatismes, settings]
  );

  const eligibleAutomatismes = useMemo(
    () => resolveAutomatismePool(allAutomatismes, settings, stored.disabledIds),
    [allAutomatismes, settings, stored.disabledIds]
  );

  const updateSettings = (next: Partial<AppSettings>) => {
    setStored((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...next,
        progressionByLevel: {
          ...current.settings.progressionByLevel,
          ...next.progressionByLevel
        },
        chapterLimitByLevel: {
          ...defaultSettings.chapterLimitByLevel,
          ...current.settings.chapterLimitByLevel,
          ...next.chapterLimitByLevel
        },
        selectedChapterIdsByLevel: {
          ...defaultSettings.selectedChapterIdsByLevel,
          ...current.settings.selectedChapterIdsByLevel,
          ...next.selectedChapterIdsByLevel
        },
        chapterOrderByLevel: {
          ...defaultSettings.chapterOrderByLevel,
          ...current.settings.chapterOrderByLevel,
          ...next.chapterOrderByLevel
        },
        chapterLevelOverrides: next.chapterLevelOverrides ?? current.settings.chapterLevelOverrides,
        chapterTitleOverrides: next.chapterTitleOverrides ?? current.settings.chapterTitleOverrides,
        hiddenChapterIds: next.hiddenChapterIds ?? current.settings.hiddenChapterIds,
        automatismeChapterOverrides:
          next.automatismeChapterOverrides ?? current.settings.automatismeChapterOverrides,
        automatismeAdditionalChapterIds:
          next.automatismeAdditionalChapterIds ?? current.settings.automatismeAdditionalChapterIds
      }
    }));
  };

  const updateDisabledIds = (next: string[]) => {
    setStored((current) => ({ ...current, disabledIds: [...new Set(next)] }));
  };

  const startSeries = (seedOverride?: string) => {
    setError("");
    try {
      const nextSettings = {
        ...settings,
        seed: seedOverride ?? settings.seed
      };
      const series = generateSeries(allAutomatismes, nextSettings, stored.disabledIds);
      setActiveFavoriteId(null);
      setActiveSeries(series);
      setActiveResult(null);
      setStage("slideshow");
      setStored((current) => ({
        ...current,
        settings: {
          ...current.settings,
          seed: nextSettings.seed
        },
        history: [series, ...current.history].slice(0, 30)
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Génération impossible.");
    }
  };

  const startPresetSeries = (preset: Partial<AppSettings>, trainingContext?: TrainingContext) => {
    setError("");
    const nextSettings: AppSettings = {
      ...settings,
      ...preset,
      progressionByLevel: {
        ...settings.progressionByLevel,
        ...preset.progressionByLevel
      },
      chapterLimitByLevel: {
        ...settings.chapterLimitByLevel,
        ...preset.chapterLimitByLevel
      },
      selectedChapterIdsByLevel: {
        ...settings.selectedChapterIdsByLevel,
        ...preset.selectedChapterIdsByLevel
      },
      chapterOrderByLevel: {
        ...settings.chapterOrderByLevel,
        ...preset.chapterOrderByLevel
      },
      chapterLevelOverrides: {
        ...settings.chapterLevelOverrides,
        ...preset.chapterLevelOverrides
      },
      seed: preset.seed ?? ""
    };

    try {
      const coverChapterIds = trainingContext?.kind === "belt"
        ? nextSettings.selectedChapterIdsByLevel[trainingContext.level]
        : undefined;
      const generatedSeries = generateSeries(allAutomatismes, nextSettings, stored.disabledIds, { coverChapterIds });
      const series = trainingContext ? { ...generatedSeries, trainingContext } : generatedSeries;
      setActiveFavoriteId(null);
      setActiveSeries(series);
      setActiveResult(null);
      setStage("slideshow");
      setStored((current) => ({
        ...current,
        settings: nextSettings,
        history: [series, ...current.history].slice(0, 30)
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Génération impossible.");
    }
  };

  const replaySeries = (series: GeneratedSeries) => {
    setActiveSeries(series);
    setActiveResult(null);
    setStage("slideshow");
  };

  const startSimilarSeries = (series: GeneratedSeries) => {
    const nextSettings = {
      ...settings,
      ...series.settings,
      chapterTitleOverrides: settings.chapterTitleOverrides,
      hiddenChapterIds: settings.hiddenChapterIds,
      automatismeChapterOverrides: settings.automatismeChapterOverrides,
      automatismeAdditionalChapterIds: settings.automatismeAdditionalChapterIds,
      seed: ""
    };
    setStored((current) => ({ ...current, settings: { ...current.settings, ...nextSettings } }));
    try {
      const nextSeries = generateSeries(allAutomatismes, nextSettings, stored.disabledIds);
      setActiveFavoriteId(null);
      setActiveSeries(nextSeries);
      setActiveResult(null);
      setStage("slideshow");
      setStored((current) => ({
        ...current,
        history: [nextSeries, ...current.history].slice(0, 30)
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Génération impossible.");
      setStage("app");
    }
  };

  const saveCustomAutomatisme = (automatisme: Automatisme) => {
    setStored((current) => ({
      ...current,
      customAutomatismes: [
        automatisme,
        ...current.customAutomatismes.filter((item) => item.id !== automatisme.id)
      ]
    }));
  };

  const toggleFavoriteSlideshow = (series: GeneratedSeries) => {
    const linkedFavorite = activeFavoriteId
      ? stored.favoriteSlideshows.find((favorite) => favorite.id === activeFavoriteId)
      : stored.favoriteSlideshows.find((favorite) => favorite.series.id === series.id);

    if (linkedFavorite) {
      setStored((current) => ({
        ...current,
        favoriteSlideshows: current.favoriteSlideshows.filter((favorite) => favorite.id !== linkedFavorite.id)
      }));
      setActiveFavoriteId(null);
      return;
    }

    const favoriteId = `favorite:${series.id}`;
    setStored((current) => {
      const levels = [...new Set(series.questions.map((question) => question.level))].join(" + ");
      const favorite: FavoriteSlideshow = {
        id: favoriteId,
        name: `Diaporama ${levels} - ${series.questions.length} questions`,
        createdAt: new Date().toISOString(),
        series
      };
      return { ...current, favoriteSlideshows: [favorite, ...current.favoriteSlideshows] };
    });
    setActiveFavoriteId(favoriteId);
  };

  const renameFavoriteSlideshow = (id: string, name: string) => {
    setStored((current) => ({
      ...current,
      favoriteSlideshows: current.favoriteSlideshows.map((favorite) =>
        favorite.id === id ? { ...favorite, name } : favorite
      )
    }));
  };

  const deleteFavoriteSlideshow = (id: string) => {
    setStored((current) => ({
      ...current,
      favoriteSlideshows: current.favoriteSlideshows.filter((favorite) => favorite.id !== id)
    }));
  };

  const playFavoriteSlideshow = (favorite: FavoriteSlideshow, mode: "original" | "fresh") => {
    if (mode === "original") {
      setError("");
      setActiveFavoriteId(favorite.id);
      setActiveResult(null);
      setStored((current) => ({
        ...current,
        settings: { ...current.settings, ...favorite.series.settings }
      }));
      replaySeries(favorite.series);
      return;
    }

    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    const seed = `favorite-${Date.now().toString(36)}-${bytes[0].toString(36)}-${bytes[1].toString(36)}`;

    try {
      const questions = favorite.series.questions.map((question, index) => {
        const automatisme = allAutomatismes.find((item) => item.id === question.automatismeId);
        if (!automatisme) {
          throw new Error(`L'automatisme « ${question.title} » n'est plus disponible.`);
        }
        return generateQuestion(automatisme, `${seed}:${index}`, question.durationSeconds, question.level);
      });
      const nextSeries: GeneratedSeries = {
        ...favorite.series,
        id: `series:${seed}:${questions.length}`,
        seed,
        createdAt: new Date().toISOString(),
        settings: { ...favorite.series.settings, seed: "" },
        questions
      };

      setError("");
      setActiveFavoriteId(favorite.id);
      setActiveSeries(nextSeries);
      setActiveResult(null);
      setStage("slideshow");
      setStored((current) => ({
        ...current,
        settings: { ...current.settings, ...favorite.series.settings, seed: "" },
        history: [nextSeries, ...current.history].slice(0, 30)
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Relance du favori impossible.");
    }
  };

  const rootClassName = [
    "app-root",
    `theme-${settings.theme}`,
    settings.dysMode ? "dys-mode" : "",
    settings.reduceMotion ? "reduce-motion" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const completeSeries = (attempts: QuestionAttempt[]) => {
    if (!activeSeries) return;
    if (!activeSeries.trainingContext) {
      setActiveResult(null);
      setStage("results");
      return;
    }
    const correctCount = attempts.filter((attempt) => attempt.isCorrect).length;
    const result: SeriesResult = {
      seriesId: activeSeries.id,
      completedAt: new Date().toISOString(),
      attempts,
      correctCount,
      totalCount: attempts.length,
      percentage: attempts.length ? Math.round(correctCount / attempts.length * 100) : 0
    };
    setActiveResult(result);
    setStored((current) => {
      const context = activeSeries.trainingContext;
      if (!context) return current;
      const existing = current.beltAchievements.find(
        (achievement) => achievement.level === context.level && achievement.beltKey === context.beltKey
      );
      const achievement = {
        level: context.level,
        beltKey: context.beltKey,
        beltLabel: context.beltLabel,
        bestCorrect: Math.max(existing?.bestCorrect ?? 0, result.correctCount),
        totalQuestions: result.totalCount,
        bestPercentage: Math.max(existing?.bestPercentage ?? 0, result.percentage),
        attempts: (existing?.attempts ?? 0) + 1,
        lastCompletedAt: result.completedAt
      };
      return {
        ...current,
        seriesResults: [result, ...current.seriesResults].slice(0, 100),
        beltAchievements: [
          achievement,
          ...current.beltAchievements.filter(
            (item) => item.level !== context.level || item.beltKey !== context.beltKey
          )
        ]
      };
    });
    setStage("results");
  };

  const startBeltChallenge = (context: TrainingContext) => {
    const belt = BELT_STAGES.find((item) => item.key === context.beltKey);
    if (!belt) return;
    startPresetSeries(createBeltPreset(settings, context.level, belt), context);
  };

  const nextBeltChallenge = () => {
    const context = activeSeries?.trainingContext;
    if (!context) return;
    const beltIndex = BELT_STAGES.findIndex((item) => item.key === context.beltKey);
    const nextBelt = BELT_STAGES[beltIndex + 1];
    if (nextBelt) {
      startBeltChallenge({ ...context, beltKey: nextBelt.key, beltLabel: nextBelt.label });
      return;
    }
    const levelIndex = LEVELS.indexOf(context.level);
    const nextLevel = LEVELS[levelIndex + 1] as Level | undefined;
    if (nextLevel) {
      const firstBelt = BELT_STAGES[0];
      startBeltChallenge({ kind: "belt", level: nextLevel, beltKey: firstBelt.key, beltLabel: firstBelt.label });
    }
  };

  const hasNextBeltChallenge = (() => {
    const context = activeSeries?.trainingContext;
    if (!context) return false;
    const beltIndex = BELT_STAGES.findIndex((item) => item.key === context.beltKey);
    return beltIndex < BELT_STAGES.length - 1 || LEVELS.indexOf(context.level) < LEVELS.length - 1;
  })();

  const resetBeltProgress = () => {
    setStored((current) => ({ ...current, beltAchievements: [], seriesResults: [] }));
  };

  if (stage === "slideshow" && activeSeries) {
    return (
      <div className={rootClassName} style={{ "--font-scale": settings.fontScale } as CSSProperties}>
        <SlideshowView
          series={activeSeries}
          settings={settings}
          isFavorite={Boolean(activeFavoriteId) || stored.favoriteSlideshows.some((favorite) => favorite.series.id === activeSeries.id)}
          onToggleFavorite={() => toggleFavoriteSlideshow(activeSeries)}
          onExit={() => setStage("app")}
          onComplete={completeSeries}
        />
      </div>
    );
  }

  if (stage === "results" && activeSeries) {
    return (
      <div className={rootClassName} style={{ "--font-scale": settings.fontScale } as CSSProperties}>
        <ResultsView
          series={activeSeries}
          result={activeResult}
          isFavorite={Boolean(activeFavoriteId) || stored.favoriteSlideshows.some((favorite) => favorite.series.id === activeSeries.id)}
          onToggleFavorite={() => toggleFavoriteSlideshow(activeSeries)}
          onBack={() => {
            setPage(activeSeries.trainingContext?.kind === "belt" ? "belts" : "home");
            setStage("app");
          }}
          onReplay={() => activeSeries.trainingContext ? startBeltChallenge(activeSeries.trainingContext) : replaySeries(activeSeries)}
          onSimilar={() => startSimilarSeries(activeSeries)}
          onNextChallenge={nextBeltChallenge}
          hasNextChallenge={hasNextBeltChallenge}
        />
      </div>
    );
  }

  return (
    <div className={rootClassName} style={{ "--font-scale": settings.fontScale } as CSSProperties}>
      <AppShell activePage={page} onNavigate={setPage}>
        {page === "home" && (
          <HomePage
            settings={settings}
            automatismes={allAutomatismes}
            eligibleCount={eligibleAutomatismes.length}
            error={error}
            onSettingsChange={updateSettings}
            onStart={() => startSeries()}
            onStartPreset={startPresetSeries}
            onOpenProgression={() => setPage("progression")}
          />
        )}
        {page === "advanced" && (
          <AdvancedSettingsPage
            settings={settings}
            automatismes={allAutomatismes}
            disabledIds={stored.disabledIds}
            error={error}
            onSettingsChange={updateSettings}
            onStart={() => startSeries()}
          />
        )}
        {page === "belts" && (
          <BeltTrainingPage
            settings={settings}
            automatismes={allAutomatismes}
            achievements={stored.beltAchievements}
            error={error}
            onStartPreset={startPresetSeries}
            onResetProgress={resetBeltProgress}
          />
        )}
        {page === "favorites" && (
          <FavoritesPage
            favorites={stored.favoriteSlideshows}
            onRename={renameFavoriteSlideshow}
            onPlay={playFavoriteSlideshow}
            onDelete={deleteFavoriteSlideshow}
          />
        )}
        {page === "editor" && <EditorPage onSave={saveCustomAutomatisme} />}
        {page === "progression" && (
          <ProgressionPage
            settings={settings}
            automatismes={allAutomatismes}
            onSettingsChange={updateSettings}
          />
        )}
        {page === "progression-editor" && (
          <ProgressionEditorPage
            settings={settings}
            automatismes={rawAutomatismes}
            disabledIds={stored.disabledIds}
            onSettingsChange={updateSettings}
            onDisabledIdsChange={updateDisabledIds}
          />
        )}
        {page === "settings" && (
          <SettingsPage settings={settings} onSettingsChange={updateSettings} />
        )}
      </AppShell>
    </div>
  );
}
