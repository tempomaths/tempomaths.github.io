export type Level = "6e" | "5e" | "4e" | "3e";

export type ProgressionStep = "start" | "trimester1" | "trimester2" | "end";

export type MathDomain =
  | "nombres-calculs"
  | "fractions"
  | "decimaux"
  | "proportionnalite"
  | "grandeurs-mesures"
  | "geometrie"
  | "calcul-litteral"
  | "equations"
  | "puissances"
  | "statistiques"
  | "probabilites"
  | "algorithmique"
  | "fonctions"
  | "trigonometrie"
  | "pythagore"
  | "thales";

export type AutomatismeStatus = "official" | "personal" | "draft";

export type ChapterInfo = {
  id: string;
  level: Level;
  rank: number;
  title: string;
  domain: MathDomain;
  sourcePath: string;
  savoirs: string[];
  competences: string[];
};

export type FigureTemplate =
  | {
      kind: "rectangle";
      widthLabel: string;
      heightLabel: string;
    }
  | {
      kind: "right-triangle";
      legALabel: string;
      legBLabel: string;
      hypotenuseLabel?: string;
      variant?: number;
      vertexLabels?: [string, string, string];
      angleLabel?: string;
    }
  | {
      kind: "triangle";
      labelA: string;
      labelB: string;
      labelC: string;
      variant?: number;
    }
  | {
      kind: "parallel-lines";
      angleLabel: string;
      anglePair?: "corresponding" | "alternate-interior";
    }
  | {
      kind: "thales";
      smallLeftLabel: string;
      bigLeftLabel: string;
      smallRightLabel: string;
      bigRightLabel: string;
      parallelLabel?: string;
      variant?: number;
      configuration?: "triangle" | "papillon";
    }
  | {
      kind: "circle";
      radiusLabel: string;
    }
  | {
      kind: "chart";
      chartType: "bar" | "pie" | "line";
      title: string;
      labels: string[];
      values: string[];
      unit?: string;
      colors?: string[];
    }
  | {
      kind: "solid";
      solid: "pave" | "prisme" | "pyramide" | "cone" | "cylindre" | "sphere";
      labels: string[];
      variant?: number;
    }
  | {
      kind: "scratch";
      blocks: string[];
    };

export type GeneratedFigure = FigureTemplate;

export type VariableDefinition =
  | {
      type: "int";
      min: number;
      max: number;
      exclude?: number[];
    }
  | {
      type: "decimal";
      min: number;
      max: number;
      decimals: number;
    }
  | {
      type: "choice";
      values: Array<string | number>;
    };

export type VariableSchema = Record<string, VariableDefinition>;

export type Automatisme = {
  id: string;
  title: string;
  levels: Level[];
  progressionStep: ProgressionStep;
  chapterId?: string;
  chapterRank?: number;
  chapterTitle?: string;
  domain: MathDomain;
  subdomain: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  statementTemplate: string;
  correctionTemplate: string;
  answerTemplate: string;
  variablesSchema: VariableSchema;
  defaultDurationSeconds: number;
  tags: string[];
  figureTemplate?: FigureTemplate;
  sourceNote?: string;
  status: AutomatismeStatus;
};

export type GeneratedQuestion = {
  id: string;
  automatismeId: string;
  title: string;
  level: Level;
  progressionStep: ProgressionStep;
  chapterId?: string;
  chapterRank?: number;
  chapterTitle?: string;
  domain: MathDomain;
  subdomain: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  statement: string;
  correction: string;
  shortAnswer: string;
  durationSeconds: number;
  variables: Record<string, string | number>;
  figure?: GeneratedFigure;
};

export type DifficultyMode = "easy" | "medium" | "hard" | "mixed";

export type AppTheme = "light" | "dark";

export type CorrectionMode = "final" | "immediate";

export type TimerSize = "discreet" | "large";

export type SlideshowMode = "ritual" | "training" | "evaluation";

export type ChapterSelectionByLevel = Record<Level, string[]>;

export type ChapterOrderByLevel = Record<Level, string[]>;

export type ChapterLevelOverrides = Record<string, Level>;

export type GeneratorSettings = {
  levels: Level[];
  progressionByLevel: Record<Level, ProgressionStep>;
  chapterLimitByLevel: Record<Level, number>;
  selectedChapterIdsByLevel: ChapterSelectionByLevel;
  chapterOrderByLevel: ChapterOrderByLevel;
  chapterLevelOverrides: ChapterLevelOverrides;
  chapterTitleOverrides: Record<string, string>;
  hiddenChapterIds: string[];
  automatismeChapterOverrides: Record<string, string>;
  includePreviousSteps: boolean;
  selectedDomains: MathDomain[];
  questionCount: number;
  durationSeconds: number;
  durationByDifficulty: boolean;
  readingSeconds: number;
  showTimer: boolean;
  timerSize: TimerSize;
  autoPauseBetweenQuestions: boolean;
  correctionMode: CorrectionMode;
  detailedCorrections: boolean;
  orderMode: "random" | "progressive";
  difficultyMode: DifficultyMode;
  selectedAutomatismeIds: string[];
  excludedTags: string[];
  avoidSeenQuestions: boolean;
  slideshowMode: SlideshowMode;
  seed: string;
};

export type AccessibilitySettings = {
  theme: AppTheme;
  dysMode: boolean;
  fontScale: number;
  reduceMotion: boolean;
};

export type AppSettings = GeneratorSettings & AccessibilitySettings;

export type GeneratedSeries = {
  id: string;
  seed: string;
  createdAt: string;
  settings: GeneratorSettings;
  questions: GeneratedQuestion[];
  trainingContext?: TrainingContext;
};

export type TrainingContext = {
  kind: "belt";
  level: Level;
  beltKey: string;
  beltLabel: string;
};

export type QuestionAttempt = {
  questionId: string;
  userAnswer: string;
  expectedAnswer: string;
  isCorrect: boolean;
};

export type SeriesResult = {
  seriesId: string;
  completedAt: string;
  attempts: QuestionAttempt[];
  correctCount: number;
  totalCount: number;
  percentage: number;
};

export type BeltAchievement = {
  level: Level;
  beltKey: string;
  beltLabel: string;
  bestCorrect: number;
  totalQuestions: number;
  bestPercentage: number;
  attempts: number;
  lastCompletedAt: string;
};

export type FavoriteSlideshow = {
  id: string;
  name: string;
  createdAt: string;
  series: GeneratedSeries;
};

export type CurriculumEntry = {
  level: Level;
  progressionStep: ProgressionStep;
  domains: MathDomain[];
  recommendedAutomatisms: string[];
  prerequisites: string[];
  excludedBefore: string[];
};

export type StoredPayload = {
  version: 1;
  settings: AppSettings;
  customAutomatismes: Automatisme[];
  favoriteIds: string[];
  favoriteSlideshows: FavoriteSlideshow[];
  disabledIds: string[];
  history: GeneratedSeries[];
  seriesResults: SeriesResult[];
  beltAchievements: BeltAchievement[];
};
