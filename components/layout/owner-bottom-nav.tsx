"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Euro, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { OWNER_ROUTES } from "@/lib/config/owner-routes";

const NAV_ITEMS = [
  {
    href: OWNER_ROUTES.dashboard.path,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: OWNER_ROUTES.properties.path,
    label: "Biens",
    icon: Building2,
  },
  {
    href: OWNER_ROUTES.money.path,
    label: "Loyers",
    icon: Euro,
  },
  {
    href: OWNER_ROUTES.contracts.path,
    label: "Plus",
    icon: MoreHorizontal,
  },
];

export function OwnerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 px-2 text-xs transition-colors",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

