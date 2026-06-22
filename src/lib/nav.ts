import type { NavItem } from "@/components/brand";

export function buildNav(active: string): NavItem[] {
  const items: Omit<NavItem, "active">[] = [
    { label: "Scanner", href: "/" },
    { label: "Builder", href: "/builder" },
    { label: "Listings", href: "/listings", badge: 47 },
    { label: "Orders", href: "/orders", badge: 3 },
    { label: "Inventory", href: "/inventory" },
  ];
  return items.map((item) => ({
    ...item,
    active: item.href === active,
  }));
}
