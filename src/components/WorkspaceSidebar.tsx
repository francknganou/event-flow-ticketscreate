import { Link, useLocation } from "react-router-dom";
import { Activity, CalendarDays, Compass, Plus, QrCode, Ticket, UserRound, CreditCard, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import type { TranslationKey } from "@/lib/translations";

const items: {key:TranslationKey;to:string;icon:LucideIcon;roles:string[]}[] = [
  { key: "sidebar.overview", to: "/dashboard", icon: Activity, roles: ["admin", "organizer"] },
  { key: "sidebar.reports", to: "/reports", icon: Activity, roles: ["admin", "organizer"] },
  { key: "sidebar.requests", to: "/organizer-requests", icon: UserRound, roles: ["admin"] },
  { key: "sidebar.moderation", to: "/events", icon: CalendarDays, roles: ["admin"] },
  { key: "sidebar.manageEvents", to: "/events", icon: CalendarDays, roles: ["organizer"] },
  { key: "sidebar.sales", to: "/reports", icon: Ticket, roles: ["organizer"] },
  { key: "sidebar.subscription", to: "/subscription", icon: CreditCard, roles: ["organizer"] },
  { key: "sidebar.messages", to: "/messages", icon: MessageCircle, roles: ["organizer", "user"] },
  { key: "sidebar.subscribers", to: "/subscription", icon: CreditCard, roles: ["admin"] },
  { key: "sidebar.messages", to: "/messages", icon: MessageCircle, roles: ["admin"] },
  { key: "sidebar.create", to: "/create-event", icon: Plus, roles: ["admin", "organizer"] },
  { key: "sidebar.access", to: "/scanner", icon: QrCode, roles: ["admin", "organizer", "staff"] },
  { key: "sidebar.reservations", to: "/my-tickets", icon: Ticket, roles: ["organizer", "user"] },
  { key: "sidebar.discover", to: "/events", icon: CalendarDays, roles: ["user"] },
  { key: "sidebar.requestOrganizer", to: "/organizer-request", icon: UserRound, roles: ["user"] },
  { key: "sidebar.scan", to: "/scanner", icon: QrCode, roles: ["staff"] },
  { key: "sidebar.explore", to: "/events", icon: CalendarDays, roles: ["visitor"] },
  { key: "nav.about", to: "/about", icon: Compass, roles: ["admin", "organizer", "staff", "user", "visitor"] },
];

export const WorkspaceSidebar = () => {
  const { pathname } = useLocation();
  const { t } = useApp();
  const role = localStorage.getItem("isLoggedIn") === "true" ? localStorage.getItem("userRole") || "user" : "visitor";
  const visibleItems = items.filter((item) => item.roles.includes(role));
  const roleKey = role === "admin" ? "sidebar.admin" : role === "organizer" ? "sidebar.organizer" : role === "staff" ? "sidebar.staff" : role === "visitor" ? "sidebar.visitor" : "sidebar.participant";
  const roleLabel=t(roleKey);
  const nav = (mobile = false) => <nav aria-label={`Menu ${roleLabel}`} className={mobile ? "flex w-max min-w-full gap-2" : "space-y-1"}>
    {visibleItems.map(({ key, to, icon: Icon }) => {
      const active = pathname === to.split("#")[0] && (!to.includes("#") || window.location.hash === `#${to.split("#")[1]}`);
      return <Link key={`${key}-${to}`} to={to} aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${mobile ? "shrink-0 border border-white/10 bg-black/35 text-white/80 hover:bg-white/10 hover:text-white" : ""} ${active ? "bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100" : mobile ? "" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
        <Icon className="h-4 w-4 shrink-0"/><span>{t(key)}</span>
      </Link>;
    })}
  </nav>;
  return <>
    <div className="sticky top-16 z-40 w-full overflow-x-auto border-b border-white/10 bg-black px-4 py-2 lg:hidden">
      <span className="sr-only">{t("sidebar.navigation")}</span>{nav(true)}
    </div>
    <aside className="sticky top-24 hidden h-[calc(100vh-7rem)] w-60 shrink-0 flex-col border-r border-white/10 bg-black py-5 pr-4 text-white lg:flex">
      <div className="mb-5 px-3"><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/55">Menu {roleLabel}</p><p className="mt-1 text-sm font-semibold">{t("sidebar.workspace")}</p></div>
      {nav()}
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-sm font-semibold">EventFlow</p><p className="mt-1 text-xs leading-relaxed text-white/60">{t("sidebar.footer")}</p></div>
    </aside>
  </>;
};
