import { Seal } from "./Seal";
import { Wordmark } from "./Wordmark";
import { NavBar, type NavItem } from "./NavBar";

type AppHeaderProps = {
  tagline: string;
  nav: NavItem[];
};

export function AppHeader({ tagline, nav }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Seal size={38} />
        <Wordmark tagline={tagline} />
      </div>
      <NavBar items={nav} />
    </header>
  );
}
