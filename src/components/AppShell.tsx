import {
  Heart,
  Home,
  ListTree,
  PencilLine,
  Medal,
  Settings,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import type { ReactNode } from "react";

export type PageKey =
  | "home"
  | "advanced"
  | "favorites"
  | "belts"
  | "progression"
  | "editor"
  | "settings";

type NavItem = {
  key: PageKey;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { key: "home", label: "Tableau de bord", icon: <Home size={18} /> },
  { key: "favorites", label: "Favoris", icon: <Heart size={18} /> },
  { key: "advanced", label: "Atelier séance", icon: <SlidersHorizontal size={18} /> },
  { key: "progression", label: "Progression", icon: <ListTree size={18} /> },
  { key: "editor", label: "Éditeur", icon: <PencilLine size={18} /> },
  { key: "settings", label: "Paramètres", icon: <Settings size={18} /> },
  { key: "belts", label: "Parcours ceintures", icon: <Medal size={18} /> }
];

type AppShellProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
};

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navigation">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <strong>TempoMaths</strong>
            <span>v0.3</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={item.key === activePage ? "nav-button active" : "nav-button"}
              type="button"
              onClick={() => onNavigate(item.key)}
              title={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className={`main-surface main-surface-${activePage}`}>{children}</main>
    </div>
  );
}
