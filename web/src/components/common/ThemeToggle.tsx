import i18next from "i18next";
import {Monitor, Moon, Sun} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useTheme} from "@/hooks/use-theme";
import {ACCENT_THEMES, setAccentKey, useAccentKey} from "@/lib/accent-theme";
import {cn} from "@/lib/utils";

export function ThemeToggle({className}: {className?: string}) {
  const {theme, resolvedTheme, setTheme} = useTheme();
  const accentKey = useAccentKey();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="iconSm" className={className} aria-label={i18next.t("theme:Theme")}>
          {resolvedTheme === "dark" ? <Moon /> : <Sun />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className={cn(theme === "light" && "font-semibold")} onSelect={() => setTheme("light")}>
          <Sun />
          {i18next.t("theme:Light")}
        </DropdownMenuItem>
        <DropdownMenuItem className={cn(theme === "dark" && "font-semibold")} onSelect={() => setTheme("dark")}>
          <Moon />
          {i18next.t("theme:Dark")}
        </DropdownMenuItem>
        <DropdownMenuItem className={cn(theme === "system" && "font-semibold")} onSelect={() => setTheme("system")}>
          <Monitor />
          {i18next.t("theme:System")}
        </DropdownMenuItem>

        {/* the accent themes, OpenTodo's settings tiles: the colour applies at
            once and survives a reload, per device */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="px-2 py-1.5 text-meta font-medium uppercase tracking-wider text-muted-foreground">
          {i18next.t("theme:Accent")}
        </DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1 px-2 pb-1.5" role="group" aria-label={i18next.t("theme:Accent")}>
          {ACCENT_THEMES.map((accent) => (
            <button
              key={accent.key}
              type="button"
              role="menuitemradio"
              aria-checked={accentKey === accent.key}
              className={cn(
                "flex items-center gap-2 rounded-control px-2 py-1.5 text-left text-list outline-none hover:bg-hover",
                accentKey === accent.key && "bg-selected font-medium",
              )}
              onClick={() => setAccentKey(accent.key)}
            >
              <span
                className="size-4 shrink-0 rounded-full border border-black/10 dark:border-white/20"
                style={{backgroundColor: accent.light}}
                aria-hidden
              />
              {accent.label}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
