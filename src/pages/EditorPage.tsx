import { Check, ChevronDown, Circle, Code2, Eye, Plus, RefreshCw, Save, Shapes, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { FigureView } from "../components/FigureView";
import { MathText } from "../components/MathText";
import { generateQuestion } from "../generator/generateQuestion";
import { siteProgressionChapters } from "../data/siteProgression";
import type { Automatisme, FigureTemplate, Level, MathDomain, VariableDefinition, VariableSchema } from "../types";
import { LEVELS, domainLabels } from "../utils/labels";

type Props = { onSave: (automatisme: Automatisme) => void };
type StudioTool = "none" | "figure" | "scratch";
type VariableKind = "int" | "decimal" | "relative-int" | "relative-decimal" | "choice";
type VariableRow = { id: string; name: string; type: VariableKind; min: string; max: string; decimals: string; values: string };

const createRow = (name: string, min = "2", max = "9"): VariableRow => ({
  id: crypto.randomUUID(), name, type: "int", min, max, decimals: "1", values: "2, 3, 4, 5"
});

const starterKits = [
  { label: "Calcul", icon: WandSparkles, statement: "Calculer $[A]\\times [B]$.", answer: "[A×B]", correction: "$[A]\\times [B]=[A×B]$.", domain: "nombres-calculs" as MathDomain },
  { label: "Question flash", icon: Sparkles, statement: "Donner le résultat de $[A]+[B]$.", answer: "[A+B]", correction: "$[A]+[B]=[A+B]$.", domain: "nombres-calculs" as MathDomain },
  { label: "Géométrie", icon: Shapes, statement: "Calculer l’aire de cette figure.", answer: "[A×B] cm²", correction: "Aire : $[A]\\times [B]=[A×B]$ cm².", domain: "geometrie" as MathDomain, tool: "figure" as StudioTool },
  { label: "Scratch", icon: Code2, statement: "Quelle valeur le programme affiche-t-il ?", answer: "[A+B]", correction: "Le programme calcule $[A]+[B]=[A+B]$.", domain: "algorithmique" as MathDomain, tool: "scratch" as StudioTool }
];

function compileFriendlyTemplate(value: string): string {
  return value.replaceAll("[A×B]", "{{a*b}}").replaceAll("[A+B]", "{{a+b}}").replaceAll("[A−B]", "{{a-b}}").replaceAll("[A]", "{{a}}").replaceAll("[B]", "{{b}}");
}

function QuickTokens({ onInsert, calculations = false }: { onInsert: (token: string) => void; calculations?: boolean }) {
  const tokens = calculations ? [["Nombre A", "[A]"], ["Nombre B", "[B]"], ["A + B", "[A+B]"], ["A − B", "[A−B]"], ["A × B", "[A×B]"]] : [["Nombre A", "[A]"], ["Nombre B", "[B]"]];
  return <div className="studio-quick-tokens"><small>Insérer :</small>{tokens.map(([label, token]) => <button type="button" key={token} onClick={() => onInsert(token)}>{label}</button>)}</div>;
}

function parseChoice(value: string): string | number {
  const trimmed = value.trim();
  const numeric = Number(trimmed.replace(",", "."));
  return trimmed !== "" && Number.isFinite(numeric) ? numeric : trimmed;
}

function buildSchema(rows: VariableRow[]): VariableSchema | null {
  const entries: Array<[string, VariableDefinition]> = [];
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) return null;
    if (row.type === "choice") {
      const values = row.values.split(",").map(parseChoice).filter((value) => value !== "");
      if (!values.length) return null;
      entries.push([name, { type: "choice", values }]);
    } else {
      const min = Number(row.min.replace(",", "."));
      const max = Number(row.max.replace(",", "."));
      if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
      const decimal = row.type === "decimal" || row.type === "relative-decimal";
      entries.push([name, decimal ? { type: "decimal", min, max, decimals: Number(row.decimals) || 1 } : { type: "int", min, max }]);
    }
  }
  return Object.fromEntries(entries);
}

export function EditorPage({ onSave }: Props) {
  const [title, setTitle] = useState("Mon automatisme");
  const [level, setLevel] = useState<Level>("6e");
  const chapters = siteProgressionChapters[level];
  const [chapterId, setChapterId] = useState(chapters[0].id);
  const chapter = chapters.find((item) => item.id === chapterId) ?? chapters[0];
  const [domain, setDomain] = useState<MathDomain>(chapter.domain);
  const [statement, setStatement] = useState("Calculer $[A]\\times [B]$.");
  const [answer, setAnswer] = useState("[A×B]");
  const [correction, setCorrection] = useState("$[A]\\times [B]=[A×B]$.");
  const [rows, setRows] = useState<VariableRow[]>([createRow("a"), createRow("b")]);
  const [tool, setTool] = useState<StudioTool>("none");
  const [figureKind, setFigureKind] = useState<Exclude<FigureTemplate["kind"], "scratch" | "solid">>("rectangle");
  const [figureLabels, setFigureLabels] = useState(["[A] cm", "[B] cm", "", "", ""]);
  const [scratch, setScratch] = useState("quand drapeau vert pressé\nmettre [résultat v] à ([A])\najouter ([B]) à [résultat v]\ndire (résultat)");
  const [seed, setSeed] = useState("studio-preview");
  const [message, setMessage] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedKit, setSelectedKit] = useState("Calcul");

  const schema = useMemo(() => buildSchema(rows), [rows]);
  const figureTemplate = useMemo<FigureTemplate | undefined>(() => {
    if (tool === "none") return undefined;
    const labels = figureLabels.map(compileFriendlyTemplate);
    if (tool === "scratch") return { kind: "scratch", blocks: compileFriendlyTemplate(scratch).split("\n").map((line) => line.trim()).filter(Boolean) };
    if (figureKind === "rectangle") return { kind: "rectangle", widthLabel: labels[0], heightLabel: labels[1] };
    if (figureKind === "triangle") return { kind: "triangle", labelA: labels[0], labelB: labels[1], labelC: labels[2] };
    if (figureKind === "right-triangle") return { kind: "right-triangle", legALabel: labels[0], legBLabel: labels[1], hypotenuseLabel: labels[2], angleLabel: labels[3] || undefined };
    if (figureKind === "circle") return { kind: "circle", radiusLabel: labels[0] };
    if (figureKind === "parallel-lines") return { kind: "parallel-lines", angleLabel: labels[0] };
    return { kind: "thales", smallLeftLabel: labels[0], bigLeftLabel: labels[1], smallRightLabel: labels[2], bigRightLabel: labels[3], parallelLabel: labels[4] };
  }, [figureKind, figureLabels, scratch, tool]);

  const draft = useMemo<Automatisme | null>(() => schema ? ({
    id: "custom-preview", title: title.trim() || "Sans titre", levels: [level], progressionStep: "start",
    chapterId: chapter.id, chapterRank: chapter.rank, chapterTitle: chapter.title, domain, subdomain: "Création personnelle",
    difficulty: 2, statementTemplate: compileFriendlyTemplate(statement), answerTemplate: compileFriendlyTemplate(answer), correctionTemplate: compileFriendlyTemplate(correction),
    variablesSchema: schema, defaultDurationSeconds: 30, tags: ["personnel", tool], figureTemplate,
    sourceNote: "Créé dans le Studio", status: "personal"
  }) : null, [answer, chapter, correction, domain, figureTemplate, level, schema, statement, title, tool]);
  const preview = useMemo(() => draft ? generateQuestion(draft, seed) : null, [draft, seed]);

  const applyKit = (kit: typeof starterKits[number]) => {
    setSelectedKit(kit.label); setStatement(kit.statement); setAnswer(kit.answer); setCorrection(kit.correction); setDomain(kit.domain); setTool(kit.tool ?? "none");
  };
  const updateLabel = (index: number, value: string) => setFigureLabels((current) => current.map((item, i) => i === index ? value : item));
  const changeLevel = (next: Level) => { setLevel(next); const first = siteProgressionChapters[next][0]; setChapterId(first.id); setDomain(first.domain); };
  const selectChapter = (id: string) => { setChapterId(id); const next = chapters.find((item) => item.id === id); if (next) setDomain(next.domain); };
  const save = () => {
    if (!draft) return setMessage("Vérifie les données aléatoires avant d’enregistrer.");
    onSave({ ...draft, id: `custom-${crypto.randomUUID()}` }); setMessage("Création enregistrée dans ta bibliothèque.");
  };

  return <div className="studio-screen">
    <header className="studio-header app-page-header">
      <div><span className="studio-badge"><Sparkles size={14}/> Studio</span><h1>Créer une diapo</h1><p>Simple à construire, prête à projeter.</p></div>
      <button className="primary-button big" type="button" onClick={save}><Save size={18}/> Enregistrer</button>
    </header>
    {message && <div className="studio-toast"><Check size={16}/>{message}</div>}

    <div className="studio-layout">
      <main className="studio-canvas">
        <section className="studio-card studio-intro">
          <div className="studio-section-title"><span>1</span><div><h2>Partir d’un modèle</h2><p>Choisis une base, puis personnalise-la.</p></div></div>
          <div className="studio-kits">{starterKits.map((kit) => <button type="button" className={selectedKit === kit.label ? "active" : ""} aria-pressed={selectedKit === kit.label} key={kit.label} onClick={() => applyKit(kit)}><kit.icon size={20}/><strong>{kit.label}</strong></button>)}</div>
        </section>

        <section className="studio-card">
          <div className="studio-section-title"><span>2</span><div><h2>Le contenu</h2><p>Écris uniquement ce que l’élève doit voir.</p></div></div>
          <label className="studio-field"><span>Titre interne</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Produit de deux entiers"/></label>
          <div className="studio-meta-grid">
            <label className="studio-field"><span>Niveau</span><select value={level} onChange={(e) => changeLevel(e.target.value as Level)}>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="studio-field"><span>Chapitre</span><select value={chapterId} onChange={(e) => selectChapter(e.target.value)}>{chapters.map((item) => <option key={item.id} value={item.id}>Chapitre {item.rank} · {item.title}</option>)}</select></label>
          </div>
          <label className="studio-field studio-main-field"><span>Question</span><textarea value={statement} onChange={(e) => setStatement(e.target.value)} /></label><QuickTokens onInsert={(token) => setStatement((value) => value + token)}/>
          <div className="studio-answer-grid">
            <label className="studio-field"><span>Réponse attendue</span><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} /><QuickTokens calculations onInsert={(token) => setAnswer((value) => value + token)}/></label>
            <label className="studio-field"><span>Correction</span><textarea value={correction} onChange={(e) => setCorrection(e.target.value)} /><QuickTokens calculations onInsert={(token) => setCorrection((value) => value + token)}/></label>
          </div>
          <p className="studio-hint">Clique sur les boutons pour insérer automatiquement les nombres et les calculs.</p>
        </section>

        <section className="studio-card">
          <div className="studio-section-title"><span>3</span><div><h2>Ajouter un visuel</h2><p>Facultatif. La figure apparaît immédiatement dans l’aperçu.</p></div></div>
          <div className="studio-tool-switch">
            <button className={tool === "none" ? "active" : ""} onClick={() => setTool("none")} type="button"><Circle size={18}/> Aucun</button>
            <button className={tool === "figure" ? "active" : ""} onClick={() => setTool("figure")} type="button"><Shapes size={18}/> Figure</button>
            <button className={tool === "scratch" ? "active" : ""} onClick={() => setTool("scratch")} type="button"><Code2 size={18}/> Scratch</button>
          </div>
          {tool === "figure" && <div className="studio-generator">
            <label className="studio-field"><span>Type de figure</span><select value={figureKind} onChange={(e) => setFigureKind(e.target.value as typeof figureKind)}>
              <option value="rectangle">Rectangle</option><option value="triangle">Triangle</option><option value="right-triangle">Triangle rectangle</option><option value="circle">Cercle</option><option value="parallel-lines">Droites parallèles</option><option value="thales">Configuration de Thalès</option>
            </select></label>
            <div className="studio-label-grid">
              {(figureKind === "rectangle" ? ["Longueur", "Largeur"] : figureKind === "circle" ? ["Rayon"] : figureKind === "parallel-lines" ? ["Angle"] : figureKind === "thales" ? ["Petit côté 1", "Grand côté 1", "Petit côté 2", "Grand côté 2", "Parallélisme"] : figureKind === "right-triangle" ? ["Côté 1", "Côté 2", "Hypoténuse", "Angle marqué"] : ["Côté 1", "Côté 2", "Côté 3"]).map((label, index) => <label className="studio-field" key={label}><span>{label}</span><input value={figureLabels[index]} onChange={(e) => updateLabel(index, e.target.value)}/></label>)}
            </div>
          </div>}
          {tool === "scratch" && <div className="studio-generator"><label className="studio-field"><span>Programme Scratch · une brique par ligne</span><textarea className="studio-code" value={scratch} onChange={(e) => setScratch(e.target.value)} /></label><p className="studio-hint">Écris les blocs en français. Les vraies briques Scratch sont générées automatiquement.</p></div>}
        </section>

        <section className="studio-card studio-advanced">
          <button type="button" className="studio-collapse" onClick={() => setAdvancedOpen(!advancedOpen)}><div><strong>Données aléatoires</strong><small>Pour obtenir une nouvelle question à chaque lancement</small></div><ChevronDown className={advancedOpen ? "open" : ""}/></button>
          {advancedOpen && <div className="studio-variables">
            {rows.map((row) => <div className="studio-variable" key={row.id}>
              <input aria-label="Nom de variable" value={row.name} onChange={(e) => setRows((all) => all.map((item) => item.id === row.id ? {...item, name:e.target.value} : item))}/>
              <select value={row.type} onChange={(e) => { const type=e.target.value as VariableKind; setRows((all) => all.map((item) => item.id === row.id ? {...item, type, min:type.startsWith("relative")?"-9":item.min, max:type.startsWith("relative")?"9":item.max} : item)); }}><option value="int">Entier positif</option><option value="decimal">Décimal positif</option><option value="relative-int">Entier relatif</option><option value="relative-decimal">Décimal relatif</option><option value="choice">Liste personnalisée</option></select>
              {row.type === "choice" ? <input value={row.values} onChange={(e) => setRows((all) => all.map((item) => item.id === row.id ? {...item, values:e.target.value} : item))}/> : <><input aria-label="Minimum" value={row.min} onChange={(e) => setRows((all) => all.map((item) => item.id === row.id ? {...item, min:e.target.value} : item))}/><span>à</span><input aria-label="Maximum" value={row.max} onChange={(e) => setRows((all) => all.map((item) => item.id === row.id ? {...item, max:e.target.value} : item))}/></>}
              <button className="icon-button danger" disabled={rows.length === 1} onClick={() => setRows((all) => all.filter((item) => item.id !== row.id))}><Trash2 size={15}/></button>
            </div>)}
            <button type="button" className="studio-add-variable" onClick={() => setRows((all) => [...all, createRow(`v${all.length + 1}`)])}><Plus size={16}/> Ajouter une variable</button>
          </div>}
        </section>
      </main>

      <aside className="studio-preview-panel">
        <div className="studio-preview-head"><div><span><Eye size={15}/> Aperçu élève</span><strong>Résultat en direct</strong></div><button type="button" onClick={() => setSeed(crypto.randomUUID())}><RefreshCw size={16}/> Nouvelles données</button></div>
        {preview ? <div className="studio-slide">
          <div className="studio-slide-meta"><span>{level}</span><span>Chapitre {chapter.rank}</span></div>
          <h2><MathText text={preview.statement}/></h2>
          {preview.figure && <FigureView figure={preview.figure} compact/>}
          <div className="studio-slide-answer"><small>Réponse</small><strong><MathText text={preview.shortAnswer}/></strong><p><MathText text={preview.correction}/></p></div>
        </div> : <div className="studio-empty">Corrige les données aléatoires pour afficher l’aperçu.</div>}
      </aside>
    </div>
  </div>;
}
