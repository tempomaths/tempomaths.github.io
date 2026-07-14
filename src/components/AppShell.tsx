import {
  Heart,
  Home,
  BookOpenCheck,
  ListTree,
  PencilLine,
  Medal,
  Settings,
  SlidersHorizontal,
  Sparkles,
  UserRound
} from "lucide-react";
import type { ReactNode } from "react";

export type PageKey =
  | "home"
  | "advanced"
  | "favorites"
  | "belts"
  | "progression"
  | "progression-editor"
  | "editor"
  | "profile"
  | "settings";

type NavItem = {
  key: PageKey;
  label: string;
  mobileLabel: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { key: "home", label: "Tableau de bord", mobileLabel: "Accueil", icon: <Home size={18} /> },
  { key: "favorites", label: "Favoris", mobileLabel: "Favoris", icon: <Heart size={18} /> },
  { key: "advanced", label: "Atelier séance", mobileLabel: "Atelier", icon: <SlidersHorizontal size={18} /> },
  { key: "progression", label: "Progression", mobileLabel: "Progression", icon: <ListTree size={18} /> },
  { key: "progression-editor", label: "Éditeur de progression", mobileLabel: "Programme", icon: <BookOpenCheck size={18} /> },
  { key: "editor", label: "Éditeur", mobileLabel: "Éditeur", icon: <PencilLine size={18} /> },
  { key: "profile", label: "Profil", mobileLabel: "Profil", icon: <UserRound size={18} /> },
  { key: "settings", label: "Paramètres", mobileLabel: "Réglages", icon: <Settings size={18} /> },
  { key: "belts", label: "Parcours ceintures", mobileLabel: "Ceintures", icon: <Medal size={18} /> }
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
              aria-label={item.label}
            >
              {item.icon}
              <span className="nav-label-desktop">{item.label}</span>
              <span className="nav-label-mobile">{item.mobileLabel}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className={`main-surface main-surface-${activePage}`}>{children}</main>
    </div>
  );
}
