import { AlertTriangle, Award, Check, ChevronRight, Crown, Flame, LockKeyhole, Play, RotateCcw, ShieldCheck, Target, Trophy } from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { siteProgressionChapters } from "../data/siteProgression";
import type { AppSettings, Automatisme, BeltAchievement, DifficultyMode, Level, TrainingContext } from "../types";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  achievements: BeltAchievement[];
  error?: string;
  onStartPreset: (preset: Partial<AppSettings>, trainingContext?: TrainingContext) => void;
  onResetProgress: () => void;
};

type BeltStage = {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  accent: string;
  ratio: number;
  difficulty: DifficultyMode;
  questionCount: number;
  durationSeconds: number;
  mission: string;
  promise: string;
};

export const BELT_STAGES: BeltStage[] = [
  { key: "white", label: "Ceinture blanche", shortLabel: "Blanche", color: "#f8fafc", accent: "#94a3b8", ratio: 0.16, difficulty: "mixed", questionCount: 8, durationSeconds: 40, mission: "Installer les réflexes", promise: "Les bases essentielles, sans piège." },
  { key: "yellow", label: "Ceinture jaune", shortLabel: "Jaune", color: "#fde047", accent: "#ca8a04", ratio: 0.3, difficulty: "mixed", questionCount: 10, durationSeconds: 35, mission: "Gagner en régularité", promise: "Des méthodes simples à automatiser." },
  { key: "orange", label: "Ceinture orange", shortLabel: "Orange", color: "#fb923c", accent: "#ea580c", ratio: 0.45, difficulty: "mixed", questionCount: 10, durationSeconds: 35, mission: "Enchaîner les méthodes", promise: "Plus de variété, toujours guidée." },
  { key: "green", label: "Ceinture verte", shortLabel: "Verte", color: "#4ade80", accent: "#16a34a", ratio: 0.62, difficulty: "mixed", questionCount: 12, durationSeconds: 30, mission: "Consolider les acquis", promise: "Des automatismes sur plusieurs chapitres." },
  { key: "blue", label: "Ceinture bleue", shortLabel: "Bleue", color: "#38bdf8", accent: "#0284c7", ratio: 0.8, difficulty: "mixed", questionCount: 12, durationSeconds: 30, mission: "Résister à la difficulté", promise: "Des questions plus exigeantes et rapides." },
  { key: "black", label: "Ceinture noire", shortLabel: "Noire", color: "#111827", accent: "#a78bfa", ratio: 1, difficulty: "mixed", questionCount: 15, durationSeconds: 25, mission: "Maîtriser le parcours", promise: "Le défi complet du niveau." }
];

export const BELT_PASS_PERCENTAGE = 80;

const levelCopy: Record<Level, { title: string; subtitle: string; tone: string }> = {
  "6e": { title: "Les fondations", subtitle: "Nombres, fractions et premières constructions", tone: "#22d3ee" },
  "5e": { title: "La consolidation", subtitle: "Relatifs, proportionnalité et géométrie", tone: "#34d399" },
  "4e": { title: "La puissance", subtitle: "Calcul, théorèmes et raisonnement", tone: "#fb923c" },
  "3e": { title: "Le défi DNB", subtitle: "Maîtrise, vitesse et stratégie", tone: "#c084fc" }
};

const difficultyLabel: Record<DifficultyMode, string> = {
  easy: "Accessible",
  medium: "Intermédiaire",
  hard: "Soutenu",
  mixed: "Défi complet"
};

const beltIntensity: Record<string, string> = {
  white: "Découverte",
  yellow: "Accessible",
  orange: "Intermédiaire",
  green: "Consolidation",
  blue: "Soutenu",
  black: "Défi complet"
};

export function stageLimit(level: Level, stage: BeltStage): number {
  return Math.max(3, Math.min(siteProgressionChapters[level].length, Math.ceil(siteProgressionChapters[level].length * stage.ratio)));
}

export function beltQuestionCount(level: Level, stage: BeltStage): number {
  return Math.max(stage.questionCount, stageLimit(level, stage));
}

export function isBeltStageUnlocked(stageIndex: number, validatedKeys: ReadonlySet<string>): boolean {
  return stageIndex === 0 || BELT_STAGES.slice(0, stageIndex).every((stage) => validatedKeys.has(stage.key));
}

export function createBeltPreset(settings: AppSettings, level: Level, stage: BeltStage): Partial<AppSettings> {
  const chapterLimit = stageLimit(level, stage);
  const questionCount = beltQuestionCount(level, stage);
  const activeChapters = siteProgressionChapters[level].slice(0, chapterLimit);
  return {
    levels: [level],
    progressionByLevel: { ...settings.progressionByLevel, [level]: "end" },
    chapterLimitByLevel: { ...settings.chapterLimitByLevel, [level]: chapterLimit },
    selectedChapterIdsByLevel: {
      ...settings.selectedChapterIdsByLevel,
      [level]: activeChapters.map((chapter) => chapter.id)
    },
    selectedDomains: [],
    selectedAutomatismeIds: [],
    excludedTags: [],
    includePreviousSteps: true,
    questionCount,
    durationSeconds: stage.durationSeconds,
    durationByDifficulty: false,
    showTimer: true,
    timerSize: "large",
    correctionMode: "final",
    detailedCorrections: true,
    autoPauseBetweenQuestions: false,
    orderMode: "progressive",
    difficultyMode: stage.difficulty,
    slideshowMode: "training",
    seed: ""
  };
}

export function BeltTrainingPage({ settings, automatismes, achievements, error, onStartPreset, onResetProgress }: Props) {
  const initialLevel = settings.levels.length === 1 ? settings.levels[0] : "6e";
  const [level, setLevel] = useState<Level>(initialLevel);
  const [selectedBelt, setSelectedBelt] = useState(BELT_STAGES[0].key);
  const roadmapRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const stage = BELT_STAGES.find((item) => item.key === selectedBelt) ?? BELT_STAGES[0];
  const chapters = siteProgressionChapters[level];
  const chapterLimit = stageLimit(level, stage);
  const questionCount = beltQuestionCount(level, stage);
  const activeChapters = chapters.slice(0, chapterLimit);

  const levelAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.level === level),
    [achievements, level]
  );
  const attemptedKeys = useMemo(
    () => new Set(levelAchievements.map((achievement) => achievement.beltKey)),
    [levelAchievements]
  );
  const validatedKeys = useMemo(
    () => new Set(levelAchievements.filter((achievement) => achievement.bestPercentage >= BELT_PASS_PERCENTAGE).map((achievement) => achievement.beltKey)),
    [levelAchievements]
  );
  const selectedAchievement = levelAchievements.find((achievement) => achievement.beltKey === stage.key);
  const selectedStageIndex = BELT_STAGES.findIndex((item) => item.key === stage.key);
  const selectedStageUnlocked = isBeltStageUnlocked(selectedStageIndex, validatedKeys);

  const availableQuestions = automatismes.filter((item) =>
    item.levels.includes(level) && activeChapters.some((chapter) => chapter.id === item.chapterId)
  ).length;
  const progress = Math.round(validatedKeys.size / BELT_STAGES.length * 100);

  const reveal = (target: HTMLElement | null) => {
    window.requestAnimationFrame(() => target?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const selectLevel = (nextLevel: Level) => {
    setLevel(nextLevel);
    setSelectedBelt("white");
    reveal(roadmapRef.current);
  };

  const selectBelt = (beltKey: string) => {
    const beltIndex = BELT_STAGES.findIndex((item) => item.key === beltKey);
    if (!isBeltStageUnlocked(beltIndex, validatedKeys)) return;
    setSelectedBelt(beltKey);
    reveal(missionRef.current);
  };

  const startBelt = () => {
    if (!selectedStageUnlocked) return;
    onStartPreset(createBeltPreset(settings, level, stage), {
      kind: "belt",
      level,
      beltKey: stage.key,
      beltLabel: stage.label
    });
  };

  return (
    <div className="belt-page">
      <header className="belt-hero">
        <div className="belt-hero-orbit belt-hero-orbit-one" />
        <div className="belt-hero-orbit belt-hero-orbit-two" />
        <div className="belt-hero-copy">
          <p className="eyebrow">TempoMaths Academy</p>
          <h1>Le dojo des automatismes</h1>
          <p>Un parcours progressif par niveau. Choisissez une ceinture, entraînez les bons chapitres et avancez jusqu’au défi noir.</p>
        </div>
        <div className="belt-hero-trophy" aria-hidden="true">
          <div className="belt-trophy-glow" />
          <Trophy size={76} />
          <span>4 parcours</span>
          <strong>24 défis</strong>
        </div>
      </header>

      <section className="belt-level-selector" aria-label="Choisir un niveau">
        {(["6e", "5e", "4e", "3e"] as Level[]).map((item) => {
          const copy = levelCopy[item];
          return (
            <button
              type="button"
              key={item}
              className={item === level ? "belt-level-card active" : "belt-level-card"}
              style={{ "--level-tone": copy.tone } as CSSProperties}
              aria-pressed={item === level}
              onClick={() => selectLevel(item)}
            >
              <span className="belt-level-number">{item}</span>
              <div><strong>{copy.title}</strong><small>{copy.subtitle}</small></div>
              <ChevronRight className="belt-level-arrow" size={20} />
            </button>
          );
        })}
      </section>

      <section className="belt-overview">
        <div>
          <span className="belt-section-kicker"><ShieldCheck size={16} /> Parcours {level}</span>
          <h2>{levelCopy[level].title}</h2>
          <p>{levelCopy[level].subtitle}</p>
        </div>
        <div className="belt-progress-card">
          <div><span>Parcours exploré</span><strong>{progress} %</strong></div>
          <div className="belt-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>{validatedKeys.size} ceinture{validatedKeys.size > 1 ? "s" : ""} validée{validatedKeys.size > 1 ? "s" : ""} · objectif {BELT_PASS_PERCENTAGE} %</small>
        </div>
      </section>

      <div className="belt-layout">
        <section ref={roadmapRef} className="belt-roadmap" aria-label={`Ceintures du parcours ${level}`}>
          <div className="belt-roadmap-line" aria-hidden="true" />
          {BELT_STAGES.map((item, index) => {
            const selected = item.key === stage.key;
            const trained = validatedKeys.has(item.key);
            const attempted = attemptedKeys.has(item.key);
            const unlocked = isBeltStageUnlocked(index, validatedKeys);
            const limit = stageLimit(level, item);
            const beltQuestions = beltQuestionCount(level, item);
            return (
              <button
                type="button"
                key={item.key}
                className={`belt-step ${selected ? "selected" : ""} ${trained ? "trained" : ""} ${attempted && !trained ? "attempted" : ""} ${unlocked ? "unlocked" : "locked"}`}
                style={{ "--belt-color": item.color, "--belt-accent": item.accent } as CSSProperties}
                aria-pressed={selected}
                aria-label={unlocked ? item.label : `${item.label}, verrouillée`}
                disabled={!unlocked}
                onClick={() => selectBelt(item.key)}
              >
                <span className="belt-step-index">{trained ? <Check size={18} /> : unlocked ? index + 1 : <LockKeyhole size={16} />}</span>
                <span className="belt-knot"><span /><span /><span /></span>
                <span className="belt-step-copy">
                  <small>{item.mission}</small>
                  <strong>{item.label}</strong>
                  <em>{unlocked ? `${limit} chapitres · ${beltQuestions} questions` : `Valide d’abord la ${BELT_STAGES[index - 1].label.toLowerCase()}`}</em>
                </span>
                {unlocked
                  ? item.key === "black" ? <Crown className="belt-step-icon" size={23} /> : <Award className="belt-step-icon" size={22} />
                  : <LockKeyhole className="belt-step-icon" size={21} />}
              </button>
            );
          })}
        </section>

        <aside ref={missionRef} className="belt-mission-card" style={{ "--belt-color": stage.color, "--belt-accent": stage.accent } as CSSProperties}>
          <div className="belt-mission-shine" />
          <div className="belt-mission-top">
            <span className="belt-mission-badge">{stage.shortLabel}</span>
            <span className="belt-mission-status">{!selectedStageUnlocked ? <><LockKeyhole size={15} /> Ceinture verrouillée</> : validatedKeys.has(stage.key) ? <><Check size={15} /> Ceinture validée</> : attemptedKeys.has(stage.key) ? <><Flame size={15} /> À retenter</> : <><Flame size={15} /> Nouveau défi</>}</span>
          </div>
          <div className="belt-mission-emblem"><Target size={38} /></div>
          <p className="eyebrow">Mission {level}</p>
          <h2>{stage.mission}</h2>
          <p>{stage.promise}</p>

          <div className="belt-mission-metrics">
            <div><span>Questions</span><strong>{questionCount}</strong></div>
            <div><span>Temps</span><strong>{stage.durationSeconds} s</strong></div>
            <div><span>Intensité</span><strong>{beltIntensity[stage.key] ?? difficultyLabel[stage.difficulty]}</strong></div>
          </div>

          {selectedAchievement && (
            <div className="belt-personal-best">
              <Trophy size={19} />
              <span><small>Ton meilleur exploit</small><strong>{selectedAchievement.bestPercentage} % · {selectedAchievement.bestCorrect}/{selectedAchievement.totalQuestions}</strong></span>
              <em>{selectedAchievement.attempts} tentative{selectedAchievement.attempts > 1 ? "s" : ""}</em>
            </div>
          )}

          <div className="belt-chapter-preview">
            <span>Territoire couvert</span>
            <div>
              {activeChapters.slice(-3).map((chapter) => <span key={chapter.id}>{chapter.rank}. {chapter.title}</span>)}
            </div>
            <small>{chapterLimit} chapitres · {availableQuestions} automatismes disponibles</small>
          </div>

          {error && <div className="belt-launch-error" role="alert"><AlertTriangle size={18} /><span>{error}</span></div>}

          <button type="button" className="belt-launch" disabled={!selectedStageUnlocked} onClick={startBelt}>
            <span><Play size={20} fill="currentColor" /></span>
            Lancer l’entraînement
            <ChevronRight size={21} />
          </button>
        </aside>
      </div>

      <section className="belt-reset-zone">
        <div><strong>Recommencer les parcours</strong><span>Efface les ceintures validées, les meilleurs scores et le nombre de tentatives.</span></div>
        <button
          type="button"
          disabled={achievements.length === 0}
          onClick={() => {
            if (window.confirm("Remettre à zéro tous les parcours de ceintures ?")) {
              setSelectedBelt("white");
              onResetProgress();
            }
          }}
        >
          <RotateCcw size={17} /> Remise à zéro
        </button>
      </section>
    </div>
  );
}
