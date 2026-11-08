import * as React from "react";
import {Link, useLocation} from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {getNavGroups, type NavGroup, type NavItem} from "@/lib/nav";
import * as Setting from "@/lib/setting";
import {useAccount} from "@/hooks/use-account";
import {useIsDark} from "@/hooks/use-theme";
import {cn} from "@/lib/utils";

/**
 * An external nav entry opens in a new tab; everything else is a router link.
 *
 * It forwards its ref and spreads what it is given, because every caller renders
 * it under an `asChild` slot — Radix merges the menu item's own class names and
 * handlers onto this element, and a plain function component would swallow them.
 */
const NavLink = React.forwardRef<
  HTMLAnchorElement,
  {item: NavItem; onNavigate?: () => void} & React.ComponentPropsWithoutRef<"a">
    >(({item, onNavigate, onClick, ...props}, ref) => {
      const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        onNavigate?.();
      };

      // Vercel-style rows: a 16px icon leads every entry, in the row's own color
      const Icon = item.icon;
      const content = (
        <>
          <Icon />
          <span>{item.label}</span>
        </>
      );

      if (item.href) {
        return (
          <a ref={ref} href={item.href} target="_blank" rel="noreferrer" onClick={handleClick} {...props}>
            {content}
          </a>
        );
      }
      return (
        <Link ref={ref} to={item.key} onClick={handleClick} {...props}>
          {content}
        </Link>
      );
    });
NavLink.displayName = "NavLink";

/**
 * A section rendered as an icon while the rail is collapsed. Collapsing used to
 * drop the second level entirely and leave the section icon pointing at one
 * arbitrary page; the menu keeps every destination reachable at 3rem wide.
 */
function CollapsedSection({
  group,
  active,
  isItemActive,
  onNavigate,
}: {
  group: NavGroup;
  active: boolean;
  isItemActive: (key: string) => boolean;
  onNavigate?: () => void;
}) {
  const Icon = group.icon;
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton tooltip={group.label} isActive={active}>
            <Icon />
            <span>{group.label}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-52">
          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {group.items.map((item) => (
            <DropdownMenuItem key={item.key} asChild className={cn(isItemActive(item.key) && "font-medium")}>
              <NavLink item={item} onNavigate={onNavigate} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

export function AppSidebar({onNavigate}: {onNavigate?: () => void}) {
  const {account} = useAccount();
  const location = useLocation();
  const isDark = useIsDark();
  const {state, isMobile} = useSidebar();
  // the rail only shrinks to icons on a desktop; the mobile sheet is always full width
  const collapsed = state === "collapsed" && !isMobile;

  const organization = account?.organization;
  // the organization brands its own console, and may brand light and dark apart
  const siderLogo = Setting.getThemedLogo(organization?.logo, organization?.logoDark, [isDark ? "dark" : "light"]);
  // recomputed every render on purpose: the labels come from i18next, which
  // changes language without re-rendering this component's inputs
  const groups = getNavGroups(account);

  const isItemActive = (key: string) =>
    key === "/" ? location.pathname === "/" : location.pathname === key || location.pathname.startsWith(key + "/");

  const activeSectionKey = React.useMemo(() => {
    const match = groups.find((group) =>
      group.items.some((item) => item.key !== "/" && location.pathname.startsWith(item.key)),
    );
    if (match) {
      return match.key;
    }
    return location.pathname === "/" ? "/home" : groups[0]?.key;
  }, [groups, location.pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center">
        <Link to="/" onClick={onNavigate} className="flex items-center overflow-hidden px-1">
          {/* collapsed the organization's favicon fits where its wordmark does not */}
          <img
            src={collapsed ? organization?.favicon || siderLogo : siderLogo}
            alt={organization?.displayName || "Masdoor"}
            className={cn("object-contain", collapsed ? "h-6 w-6 rounded" : "h-8 max-w-[160px]")}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {collapsed ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {groups.map((group) => (
                  <CollapsedSection
                    key={group.key}
                    group={group}
                    active={activeSectionKey === group.key}
                    isItemActive={isItemActive}
                    onNavigate={onNavigate}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          groups.map((group, index) => (
            // sections have no names: a hairline carries the grouping, the
            // washed row carries the location
            <React.Fragment key={group.key}>
              {index > 0 && <SidebarSeparator className="mx-2.5" />}
              <SidebarGroup className="py-0.5">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        {/* inactive entries sit a step dimmer so the filled current row leads;
                          hover and the active state restore the full foreground */}
                        <SidebarMenuButton
                          asChild
                          isActive={isItemActive(item.key)}
                          className="text-sidebar-foreground/65 hover:text-sidebar-foreground data-[active=true]:text-accent-soft-foreground"
                        >
                          <NavLink item={item} onNavigate={onNavigate} />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </React.Fragment>
          ))
        )}
      </SidebarContent>

      {/* the thin strip along the border: click or drag it to collapse the rail */}
      <SidebarRail />
    </Sidebar>
  );
}
