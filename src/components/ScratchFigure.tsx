import { useLayoutEffect, useMemo, useRef } from "react";
import scratchblocks from "scratchblocks/browser.es.js";
import french from "scratchblocks/locales/fr.json";
import { makeScratchProgram } from "../utils/scratchSyntax";

type Props = { blocks: string[]; compact?: boolean };

scratchblocks.loadLanguages({ fr: french });

export function ScratchFigure({ blocks, compact = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const program = useMemo(() => makeScratchProgram(blocks), [blocks]);

  useLayoutEffect(() => {
    if (!host.current) return;
    const documentModel = scratchblocks.parse(program, { languages: ["fr", "en"] });
    const svg = scratchblocks.render(documentModel, {
      style: "scratch3",
      languages: ["fr", "en"],
      scale: compact ? .72 : 1
    });
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Programme Scratch");
    host.current.replaceChildren(svg);
  }, [compact, program]);

  return <figure className={`scratch-figure scratch-authentic${compact ? " compact" : ""}`} ref={host} />;
}
