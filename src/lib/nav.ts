import type { NavItem } from "@/components/brand";

export function buildNav(active: string): NavItem[] {
  const items: Omit<NavItem, "active">[] = [
    { label: "Scanner", href: "/" },
    { label: "Discover", href: "/discover" },
    { label: "Finds", href: "/finds" },
    { label: "Builder", href: "/builder" },
    { label: "Listings", href: "/listings" },
    { label: "Orders", href: "/orders" },
    { label: "Inventory", href: "/inventory" },
  ];
  return items.map((item) => ({
    ...item,
    active: item.href === active,
  }));
}
