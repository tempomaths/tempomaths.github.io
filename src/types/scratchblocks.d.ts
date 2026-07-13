declare module "scratchblocks/browser.es.js" {
  type Options = { style?: string; languages?: string[]; scale?: number };
  const scratchblocks: {
    loadLanguages(languages: Record<string, unknown>): void;
    parse(code: string, options?: Options): unknown;
    render(document: unknown, options: Options): SVGElement;
  };
  export default scratchblocks;
}

declare module "scratchblocks/locales/fr.json" {
  const language: Record<string, unknown>;
  export default language;
}

declare module "scratchblocks/syntax/index.js" {
  type ParseOptions = { languages?: string[] };

  export function loadLanguages(languages: Record<string, unknown>): void;
  export function parse(code: string, options?: ParseOptions): {
    scripts: unknown[];
    stringify(): string;
  };
}
