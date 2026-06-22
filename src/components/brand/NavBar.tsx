import Link from "next/link";

export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
};

export function NavBar({ items }: { items: NavItem[] }) {
  return (
    <nav className="app-nav">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          style={{
            padding: "7px 14px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: it.active ? 700 : 500,
            background: it.active ? "var(--color-ink)" : "transparent",
            color: it.active ? "#fff" : "var(--color-muted)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {it.label}
          {it.badge !== undefined ? (
            <span style={{ opacity: 0.7 }}> · {it.badge}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
