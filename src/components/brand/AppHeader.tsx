import { Seal } from "./Seal";
import { Wordmark } from "./Wordmark";
import { NavBar, type NavItem } from "./NavBar";
import { signOut } from "@/app/login/actions";
import { IconLogout } from "@tabler/icons-react";

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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <NavBar items={nav} />
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 11,
              border: "1px solid var(--color-line)",
              background: "var(--color-surface)",
              color: "var(--color-muted)",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            }}
          >
            <IconLogout size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
