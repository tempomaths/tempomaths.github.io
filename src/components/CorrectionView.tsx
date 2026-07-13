import { CheckCircle2 } from "lucide-react";
import { MathText } from "./MathText";

type Props = {
  answer: string;
  correction?: string;
  detailed?: boolean;
  compact?: boolean;
  showAnswer?: boolean;
};

const splitCorrection = (text: string) =>
  text
    .replace(/[,;]?\s+donc\s+/gi, ". Donc ")
    .replace(/[,;]?\s+puis\s+/gi, ". Puis ")
    .replace(/[,;]?\s+car\s+/gi, ". Car ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

const stepLabel = (index: number, total: number) => {
  if (total === 1) {
    return "Méthode";
  }
  if (index === total - 1) {
    return "Conclusion";
  }
  return index === 0 ? "Méthode" : "Calcul";
};

export function CorrectionView({ answer, correction = "", detailed = true, compact = false, showAnswer = true }: Props) {
  const steps = splitCorrection(correction);
  const visibleSteps = detailed || !showAnswer ? steps : [];

  return (
    <div className={compact ? "correction-view compact" : "correction-view"}>
      {showAnswer && (
        <div className="correction-answer">
          <span>
            <CheckCircle2 size={compact ? 16 : 19} />
            Réponse
          </span>
          <strong>
            <MathText text={answer} />
          </strong>
        </div>
      )}

      {visibleSteps.length > 0 && (
        <div className="correction-steps">
          {visibleSteps.map((step, index) => (
            <div className={`correction-step step-${Math.min(index + 1, 3)}`} key={`${step}-${index}`}>
              <span>{stepLabel(index, visibleSteps.length)}</span>
              <p>
                <MathText text={step} />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
