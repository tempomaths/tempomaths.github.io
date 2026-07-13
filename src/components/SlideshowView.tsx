import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Heart, Maximize2, Pause, Play, RotateCcw, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, GeneratedSeries, QuestionAttempt } from "../types";
import { useSlideshowTimer } from "../slideshow/useSlideshowTimer";
import { isAnswerCorrect } from "../utils/answerEvaluation";
import { difficultyLabels, domainLabels, progressionShortLabels } from "../utils/labels";
import { CorrectionView } from "./CorrectionView";
import { FigureView } from "./FigureView";
import { MathText } from "./MathText";

type Props = {
  series: GeneratedSeries;
  settings: AppSettings;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onExit: () => void;
  onComplete: (attempts: QuestionAttempt[]) => void;
};

export function SlideshowView({ series, settings, isFavorite, onToggleFavorite, onExit, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const answersRef = useRef(answers);
  const completedRef = useRef(false);
  const question = series.questions[index];
  const isInteractiveTraining = series.trainingContext?.kind === "belt";
  const isMentalSlideshow = series.questions.every(
    (item) => item.subdomain === "Calcul mental pur" && !item.figure
  );
  const isLast = index === series.questions.length - 1;
  const canShowCorrection = !isInteractiveTraining;
  const stageClassName = [
    "slide-stage",
    isMentalSlideshow ? "mental-slide" : "",
    question.chapterId === "dnb-officiel" ? "dnb-question" : "",
    question.figure ? "with-figure" : "",
    question.statement.length > 70 ? "long-question" : "",
    question.statement.length > 120 ? "very-long-question" : ""
  ]
    .filter(Boolean)
    .join(" ");

  answersRef.current = answers;

  const completeSession = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete(series.questions.map((item) => {
      const userAnswer = answersRef.current[item.id]?.trim() ?? "";
      return {
        questionId: item.id,
        userAnswer,
        expectedAnswer: item.shortAnswer,
        isCorrect: isAnswerCorrect(userAnswer, item.shortAnswer)
      };
    }));
  }, [onComplete, series.questions]);

  const next = useCallback(() => {
    setShowCorrection(false);
    setPaused(settings.autoPauseBetweenQuestions);
    setIndex((current) => {
      if (current >= series.questions.length - 1) {
        completeSession();
        return current;
      }
      return current + 1;
    });
  }, [completeSession, series.questions.length, settings.autoPauseBetweenQuestions]);

  const previous = useCallback(() => {
    setShowCorrection(false);
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const { remainingSeconds } = useSlideshowTimer({
    durationSeconds: question.durationSeconds,
    active: true,
    paused,
    resetKey: question.id,
    onComplete: next
  });

  const slideProgress = useMemo(
    () => ((index + 1) / series.questions.length) * 100,
    [index, series.questions.length]
  );
  const chapterLabel = question.chapterRank
    ? `Chapitre ${question.chapterRank} - ${question.chapterTitle ?? domainLabels[question.domain]}`
    : progressionShortLabels[question.progressionStep];
  const difficultyLabel = difficultyLabels[
    question.difficulty <= 2 ? "easy" : question.difficulty >= 4 ? "hard" : "medium"
  ];
  const slideshowClassName = [
    "slideshow",
    isMentalSlideshow ? "mental-slideshow" : "",
    isInteractiveTraining ? "interactive-training" : ""
  ].filter(Boolean).join(" ");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isTyping && event.key !== "Escape") return;
      if (event.key === " ") {
        event.preventDefault();
        setPaused((current) => !current);
      }
      if (event.key === "ArrowRight") {
        next();
      }
      if (event.key === "ArrowLeft" && !isInteractiveTraining) {
        previous();
      }
      if (event.key.toLowerCase() === "c") {
        setShowCorrection((current) => (canShowCorrection ? !current : current));
      }
      if (event.key === "Escape") {
        onExit();
      }
      if (event.key.toLowerCase() === "f") {
        document.documentElement.requestFullscreen?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canShowCorrection, isInteractiveTraining, next, onExit, previous]);

  return (
    <div className={slideshowClassName}>
      <header className="slideshow-topbar">
        <div>
          <span className="slide-kicker">
            {isMentalSlideshow ? "Maths mentales" : "Projection"} - Question {index + 1}/{series.questions.length}
          </span>
          <strong>
            {question.level} - {question.chapterRank ? `Chap. ${question.chapterRank}` : progressionShortLabels[question.progressionStep]} - {domainLabels[question.domain]}
          </strong>
        </div>
        <div className="slide-actions">
          <button
            type="button"
            className={isFavorite ? "icon-button favorite active" : "icon-button favorite"}
            onClick={onToggleFavorite}
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-label={isFavorite ? "Retirer ce diaporama des favoris" : "Ajouter ce diaporama aux favoris"}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => setPaused((current) => !current)}
            title={paused ? "Reprendre" : "Pause"}
            aria-label={paused ? "Reprendre le minuteur" : "Mettre le minuteur en pause"}
          >
            {paused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => document.documentElement.requestFullscreen?.()}
            title="Plein écran"
            aria-label="Basculer en plein écran"
          >
            <Maximize2 size={20} />
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={() => {
              setIndex(0);
              setShowCorrection(false);
              setPaused(false);
              setAnswers({});
              setSubmittedIds(new Set());
              completedRef.current = false;
            }}
            title="Recommencer"
            aria-label="Recommencer la séance"
          >
            <RotateCcw size={20} />
          </button>
          <button type="button" className="icon-button danger" onClick={onExit} title="Quitter" aria-label="Quitter la projection">
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="slide-progress" aria-hidden="true">
        <span style={{ width: `${slideProgress}%` }} />
      </div>

      <main className={stageClassName}>
        <div className="slide-card">
          <div className="slide-card-head">
            <div className="slide-number" aria-label={`Question ${index + 1}`}>
              {(index + 1).toString().padStart(2, "0")}
            </div>
            <div className="slide-card-meta">
              <span>{question.level}</span>
              <strong>{chapterLabel}</strong>
              <small>
                {domainLabels[question.domain]} - {isMentalSlideshow ? "Automatisme" : question.subdomain} - {difficultyLabel}
              </small>
            </div>
          </div>

          <div className="slide-prompt-label">{isMentalSlideshow ? "Question" : "Consigne"}</div>
          <h1>
            <MathText text={question.statement} />
          </h1>
        </div>

        {question.figure && <FigureView figure={question.figure} />}

        {isInteractiveTraining && (
          <form
            className={submittedIds.has(question.id) ? "live-answer-panel saved" : "live-answer-panel"}
            onSubmit={(event) => {
              event.preventDefault();
              if (!(answers[question.id] ?? "").trim()) return;
              setSubmittedIds((current) => new Set(current).add(question.id));
            }}
          >
            <label htmlFor={`answer-${question.id}`}>Ta réponse</label>
            <div className="live-answer-row">
              <input
                id={`answer-${question.id}`}
                value={answers[question.id] ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setAnswers((current) => ({ ...current, [question.id]: value }));
                  setSubmittedIds((current) => {
                    const nextIds = new Set(current);
                    nextIds.delete(question.id);
                    return nextIds;
                  });
                }}
                placeholder="Écris ton résultat ici…"
                autoComplete="off"
                inputMode="text"
              />
              <button type="submit" disabled={!(answers[question.id] ?? "").trim()}>
                {submittedIds.has(question.id) ? <Check size={19} /> : <Send size={19} />}
                {submittedIds.has(question.id) ? "Enregistrée" : "Valider"}
              </button>
            </div>
            <small>La correction et ton score seront dévoilés dans le bilan final.</small>
          </form>
        )}

        {canShowCorrection && showCorrection && (
          <div className="correction-box">
            <CorrectionView
              answer={question.shortAnswer}
              correction={question.correction}
              detailed={settings.detailedCorrections}
            />
          </div>
        )}
      </main>

      <footer className="slideshow-footer">
        <div className={settings.timerSize === "large" ? "timer large" : "timer"}>
          {settings.showTimer && <strong>{remainingSeconds}s</strong>}
          <span
            key={question.id}
            style={{
              animationDuration: `${question.durationSeconds}s`,
              animationPlayState: paused ? "paused" : "running"
            }}
          />
        </div>

        <div className="slide-nav-buttons">
          {!isInteractiveTraining && (
            <button type="button" className="secondary-button" onClick={previous} disabled={index === 0}>
              <ArrowLeft size={18} />
              Précédente
            </button>
          )}
          {canShowCorrection && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowCorrection((current) => !current)}
              aria-label={showCorrection ? "Masquer la correction" : "Afficher la correction"}
            >
              {showCorrection ? <EyeOff size={18} /> : <Eye size={18} />}
              {showCorrection ? "Masquer" : "Correction"}
            </button>
          )}
          <button type="button" className="primary-button" onClick={isLast ? completeSession : next}>
            {isLast ? "Résultats" : "Suivante"}
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
