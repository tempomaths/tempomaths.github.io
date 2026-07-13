import { Award, CheckCircle2, ChevronRight, Eye, EyeOff, Heart, MinusCircle, Play, Printer, RefreshCw, RotateCcw, Trophy, Undo2, XCircle } from "lucide-react";
import { useState } from "react";
import type { GeneratedSeries, SeriesResult } from "../types";
import { BELT_PASS_PERCENTAGE } from "../pages/BeltTrainingPage";
import { domainLabels } from "../utils/labels";
import { CorrectionView } from "./CorrectionView";
import { FigureView } from "./FigureView";
import { MathText } from "./MathText";

type Props = {
  series: GeneratedSeries;
  result: SeriesResult | null;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onReplay: () => void;
  onSimilar: () => void;
  onNextChallenge: () => void;
  hasNextChallenge: boolean;
};

export function ResultsView({ series, result, isFavorite, onToggleFavorite, onBack, onReplay, onSimilar, onNextChallenge, hasNextChallenge }: Props) {
  const [showDetails, setShowDetails] = useState(true);
  const isBeltResult = series.trainingContext?.kind === "belt" && Boolean(result);
  const isValidated = isBeltResult && (result?.percentage ?? 0) >= BELT_PASS_PERCENTAGE;

  return (
    <div className="results-screen">
      <header className="results-header">
        <div>
          <p className="eyebrow">Correction finale</p>
          <h1>Série de {series.questions.length} questions</h1>
          <span>Seed : {series.seed}</span>
        </div>
        <div className="toolbar">
          {isBeltResult ? <>
            <button type="button" className="secondary-button" onClick={onBack}><Undo2 size={18} />Retour au parcours</button>
            <button type="button" className="secondary-button" onClick={onReplay}><RotateCcw size={18} />Réessayer</button>
            {isValidated && hasNextChallenge && <button type="button" className="primary-button" onClick={onNextChallenge}>Défi suivant<ChevronRight size={18} /></button>}
          </> : <>
            <button type="button" className={isFavorite ? "secondary-button favorite-button active" : "secondary-button favorite-button"} onClick={onToggleFavorite}>
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />{isFavorite ? "En favori" : "Favori"}
            </button>
            <button type="button" className="secondary-button" onClick={onBack}><Undo2 size={18} />Accueil</button>
            <button type="button" className="secondary-button" onClick={() => setShowDetails((current) => !current)}>
              {showDetails ? <EyeOff size={18} /> : <Eye size={18} />}{showDetails ? "Masquer" : "Afficher"}
            </button>
            <button type="button" className="secondary-button" onClick={onReplay}><Play size={18} />Même série</button>
            <button type="button" className="primary-button" onClick={onSimilar}><RefreshCw size={18} />Série similaire</button>
          </>}
        </div>
      </header>

      {isBeltResult && result && (
        <section className="training-result-hero">
          <div className="training-result-score"><Trophy size={30} /><strong>{result.percentage} %</strong></div>
          <div>
            <span>{series.trainingContext?.beltLabel ?? "Parcours terminé"}</span>
            <h2>{result.correctCount} bonne{result.correctCount > 1 ? "s" : ""} réponse{result.correctCount > 1 ? "s" : ""} sur {result.totalCount}</h2>
            <p>Ton résultat est enregistré. Tu peux revoir chaque réponse et sa correction ci-dessous.</p>
          </div>
        </section>
      )}

      {isValidated && series.trainingContext && result && (
        <section className="belt-diploma" aria-label="Diplôme de réussite">
          <div className="belt-diploma-corner corner-one" /><div className="belt-diploma-corner corner-two" />
          <Award className="belt-diploma-seal" size={58} />
          <p>TempoMaths Academy</p>
          <h2>Diplôme de réussite</h2>
          <span>Ce diplôme certifie la validation de la</span>
          <strong>{series.trainingContext.beltLabel}</strong>
          <em>Niveau {series.trainingContext.level} · Score {result.percentage} % · {new Date(result.completedAt).toLocaleDateString("fr-FR")}</em>
          <button type="button" className="secondary-button belt-diploma-print" onClick={() => window.print()}><Printer size={17} />Imprimer le diplôme</button>
        </section>
      )}

      {isBeltResult && !isValidated && (
        <section className="belt-retry-card">
          <RotateCcw size={24} />
          <div><strong>Encore un effort</strong><span>Il faut {BELT_PASS_PERCENTAGE} % pour valider cette ceinture. Tu peux recommencer autant de fois que tu veux.</span></div>
          <button type="button" className="primary-button" onClick={onReplay}>Nouvelle tentative</button>
        </section>
      )}

      <div className="result-list">
        {series.questions.map((question, index) => {
          const attempt = result?.attempts.find((item) => item.questionId === question.id);
          return <article className={`result-item ${attempt ? (attempt.isCorrect ? "answer-correct" : "answer-wrong") : ""}`} key={question.id}>
            <div className="result-index">{index + 1}</div>
            <div>
              <div className="result-meta">
                <span>{question.level}</span>
                <span>{domainLabels[question.domain]}</span>
                {question.chapterRank && <span>Chap {question.chapterRank}</span>}
                <span>Difficulté {question.difficulty}</span>
              </div>
              <h2>
                <MathText text={question.statement} />
              </h2>
              {question.figure && <FigureView figure={question.figure} compact />}
              {attempt && (
                <div className="result-answer-comparison">
                  <div className={attempt.isCorrect ? "attempt-status correct" : "attempt-status wrong"}>
                    {attempt.isCorrect ? <CheckCircle2 size={20} /> : attempt.userAnswer ? <XCircle size={20} /> : <MinusCircle size={20} />}
                    <span>{attempt.isCorrect ? "Réponse juste" : attempt.userAnswer ? "À retravailler" : "Sans réponse"}</span>
                  </div>
                  <div><span>Ta réponse</span><strong>{attempt.userAnswer || "—"}</strong></div>
                  <div><span>Réponse attendue</span><strong><MathText text={question.shortAnswer} /></strong></div>
                </div>
              )}
              <CorrectionView
                answer={question.shortAnswer}
                correction={question.correction}
                detailed={showDetails}
                compact
              />
            </div>
          </article>;
        })}
      </div>
    </div>
  );
}
