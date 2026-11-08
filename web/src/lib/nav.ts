import i18next from "i18next";
import {
  Activity,
  AppWindow,
  BadgeCheck,
  Bell,
  Building2,
  FileKey,
  FolderOpen,
  Home,
  KeyRound,
  LayoutDashboard,
  Lock,
  MailPlus,
  MonitorSmartphone,
  Plug,
  ScrollText,
  Settings,
  ShieldCheck,
  Ticket,
  UserRound,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import * as Setting from "@/lib/setting";
import type {Account} from "@/hooks/use-account";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  /** rendered as an external link instead of a router link */
  href?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  /** where the group header itself navigates to */
  to: string;
  items: NavItem[];
}

/**
 * The console navigation: flat sections the sidebar always shows in full,
 * ordered by how often a deployment touches them — people first, plumbing last.
 */
export function getNavGroups(account: Account | null | undefined): NavGroup[] {
  if (!account) {
    return [];
  }

  const groups: NavGroup[] = [];

  groups.push({
    key: "/home",
    label: i18next.t("general:Home"),
    icon: Home,
    to: "/",
    items: [
      {key: "/", label: i18next.t("general:Dashboard"), icon: LayoutDashboard},
    ],
  });

  groups.push({
    key: "/orgs",
    label: i18next.t("general:User Management"),
    icon: Users,
    to: "/users",
    items: [
      {key: "/users", label: i18next.t("general:Users"), icon: UserRound},
      {key: "/groups", label: i18next.t("general:Groups"), icon: Users},
      {key: "/organizations", label: i18next.t("general:Organizations"), icon: Building2},
      {key: "/invitations", label: i18next.t("general:Invitations"), icon: MailPlus},
      {key: "/roles", label: i18next.t("general:Roles"), icon: ShieldCheck},
    ],
  });

  groups.push({
    key: "/identity",
    label: i18next.t("general:Identity"),
    icon: Lock,
    to: "/applications",
    items: [
      {key: "/applications", label: i18next.t("general:Applications"), icon: AppWindow},
      {key: "/providers", label: i18next.t("application:Providers"), icon: Plug},
      {key: "/resources", label: i18next.t("general:Resources"), icon: FolderOpen},
      {key: "/certs", label: i18next.t("general:Certs"), icon: FileKey},
      {key: "/keys", label: i18next.t("general:Keys"), icon: KeyRound},
    ],
  });

  groups.push({
    key: "/credentials",
    label: i18next.t("general:Sessions & Tokens"),
    icon: KeyRound,
    to: "/sessions",
    items: [
      {key: "/sessions", label: i18next.t("general:Sessions"), icon: MonitorSmartphone},
      {key: "/tokens", label: i18next.t("general:Tokens"), icon: Ticket},
    ],
  });

  groups.push({
    key: "/logs",
    label: i18next.t("general:Auditing"),
    icon: ScrollText,
    to: "/records",
    items: [
      {key: "/records", label: i18next.t("general:Records"), icon: ScrollText},
      {key: "/verifications", label: i18next.t("general:Verifications"), icon: BadgeCheck},
    ],
  });

  const adminItems: NavItem[] = [];
  if (Setting.isAdminUser(account)) {
    adminItems.push(
      {key: "/sysinfo", label: i18next.t("general:System Info"), icon: Activity},
      {key: "/settings", label: i18next.t("general:Global Settings"), icon: Settings},
    );
  }
  adminItems.push(
    {key: "/webhooks", label: i18next.t("general:Webhooks"), icon: Webhook},
    {key: "/webhook-events", label: i18next.t("general:Webhook Events"), icon: Bell},
  );

  groups.push({
    key: "/admin",
    label: i18next.t("general:Admin"),
    icon: Settings,
    to: Setting.isAdminUser(account) ? "/sysinfo" : "/",
    items: adminItems,
  });

  return applyNavItems(groups, account);
}

/**
 * The organization can hide navbar entries: `navItems` for admins,
 * `userNavItems` for everyone else. Either being absent, not an array, or
 * containing "all" means "show everything" — the value Masdoor stores by default.
 */
function getNavItemFilter(account: Account): string[] | null {
  const organization = account.organization;
  const navItems = Setting.isLocalAdminUser(account) ? organization?.navItems : organization?.userNavItems ?? [];
  if (!Array.isArray(navItems) || navItems.includes("all")) {
    return null;
  }
  return navItems;
}

function applyNavItems(groups: NavGroup[], account: Account): NavGroup[] {
  const navItems = getNavItemFilter(account);
  if (navItems === null) {
    return groups;
  }

  return groups
    .map((group) => ({...group, items: group.items.filter((item) => navItems.includes(item.key))}))
    .filter((group) => group.items.length > 0)
    .map((group) => {
      // the group header links somewhere that may have just been filtered out;
      // re-point it at a remaining entry, skipping the external-link ones
      if (group.items.some((item) => item.key === group.to && !item.href)) {
        return group;
      }
      const target = group.items.find((item) => !item.href);
      return target ? {...group, to: target.key} : group;
    });
}

/**
 * The header widgets an organization can hide through `widgetItems`; same
 * "absent or contains all" rule as the navbar entries.
 */
export function isWidgetVisible(account: Account | null | undefined, key: string): boolean {
  const widgetItems = account?.organization?.widgetItems;
  if (!Array.isArray(widgetItems) || widgetItems.includes("all")) {
    return true;
  }
  return widgetItems.includes(key);
}
