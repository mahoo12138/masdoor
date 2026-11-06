import * as React from "react";
import * as Cookie from "cookie";
import * as Conf from "@/Conf";
import {useTheme} from "@/hooks/use-theme";
import {getSafeHtml} from "@/lib/custom-html";
import {getAccentTheme, useAccentKey} from "@/lib/accent-theme";
import * as Setting from "@/lib/setting";

interface ThemeData {
  themeType?: string;
  colorPrimary?: string;
  borderRadius?: number;
  isCompact?: boolean;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** "#047857" -> {h: 162.9, s: 0.933, l: 0.243}. */
function hexToHsl(hex: string): Hsl | null {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return null;
  }
  let value = match[1];
  if (value.length === 3) {
    value = value.split("").map((c) => c + c).join("");
  }
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / d + 2) / 6;
    } else {
      h = ((r - g) / d + 4) / 6;
    }
  }

  return {h: h * 360, s, l};
}

/** The triplet shadcn's CSS variables expect: "0 0% 14.9%". */
function formatHsl({h, s, l}: Hsl): string {
  const round = (n: number) => Math.round(n * 10) / 10;
  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
}

/** Black or white, whichever stays readable on top of that lightness. */
function foregroundFor(lightness: number): string {
  return lightness > 0.6 ? "0 0% 9%" : "0 0% 98%";
}

/**
 * The bright step of a brand colour, for dark-mode focus rings and accents: the
 * same hue read up to a lightness that glows against the dark surfaces, the way
 * OpenTodo's dark theme pairs its deep emerald buttons with a bright emerald
 * focus ring. Text and rings only ever sit on the page, never on a button, so
 * the usual contrast rules do not bind here.
 */
function brightVariantForDark(color: Hsl): Hsl {
  return {...color, l: Math.max(color.l, 0.72)};
}

/**
 * A brand colour is kept as-is on the dark palette — OpenTodo's buttons are the
 * same emerald in both, and white text on a deep hue only ever gets more
 * readable on a darker card. Only a neutral (a black or a grey, invisible as a
 * button on a dark panel) hands over to the palette's own near-white primary.
 */
function adaptPrimaryForDark(color: Hsl): Hsl {
  if (color.s < 0.15) {
    return {...color, l: 0.98};
  }
  return color;
}

/** "#047857" into "#ffffff" at 10% — the same mixes OpenTodo derives with color-mix. */
function mixHex(hexA: string, pct: number, hexB: string): string {
  const parse = (hex: string) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [r1, g1, b1] = parse(hexA);
  const [r2, g2, b2] = parse(hexB);
  const channel = (a: number, b: number) => Math.round(a * (pct / 100) + b * (1 - pct / 100));
  const to2 = (c: number) => c.toString(16).padStart(2, "0");
  return `#${to2(channel(r1, r2))}${to2(channel(g1, g2))}${to2(channel(b1, b2))}`;
}

/** The dark surfaces the soft steps mix into, mirror of index.css's .dark values. */
const DARK_SURFACE = "#141518";

/**
 * The seed hexes of the accent the device picked, when that accent is not the
 * stylesheet's own default.
 */
function useCustomAccent(): {light: string; bright: string; dark?: string} | null {
  const accentKey = useAccentKey();
  const accent = getAccentTheme(accentKey);
  if (accent.key === "emerald") {
    return null;
  }
  return accent;
}

/** Pushes a `themeData` object into the shadcn CSS variables for as long as it is mounted. */
export function useThemeData(themeData: ThemeData | undefined | null) {
  // the provider owns the `dark` class, so re-assert a forced dark theme whenever
  // it writes, otherwise the two would fight over the root element
  const {resolvedTheme} = useTheme();
  const customAccent = useCustomAccent();

  React.useEffect(() => {
    const root = document.documentElement;
    const primary = themeData?.colorPrimary ? hexToHsl(themeData.colorPrimary) : null;
    // an organization/application theme that only restates the default does not
    // count as a brand: the device's accent choice applies instead
    const orgBranded = primary !== null && themeData?.colorPrimary !== Conf.ThemeDefault.colorPrimary;
    const touched: string[] = [];
    // `themeType: "dark"` forces the dark palette on below, so the brand colour
    // has to be adapted for it even when the visitor asked for the light one
    const dark = themeData?.themeType === "dark" || resolvedTheme === "dark";

    if (orgBranded && primary) {
      // the un-adapted colour stays available to a subtree painted light inside a
      // dark page, see `.theme-scope-light` in index.css
      root.style.setProperty("--primary-base", formatHsl(primary));
      root.style.setProperty("--primary-base-foreground", foregroundFor(primary.l));

      const painted = dark ? adaptPrimaryForDark(primary) : primary;
      root.style.setProperty("--primary", formatHsl(painted));
      // keep the label readable whichever end of the scale the brand colour sits on
      root.style.setProperty("--primary-foreground", foregroundFor(painted.l));
      // on the dark palette the focus ring takes the bright step of the hue
      root.style.setProperty("--ring", formatHsl(dark ? brightVariantForDark(primary) : painted));
      touched.push("--primary-base", "--primary-base-foreground", "--primary", "--primary-foreground", "--ring");
    } else if (customAccent) {
      // OpenTodo's accent themes: the seeds stand in for the stylesheet's
      // emerald, and the soft steps derive from them the way its color-mix
      // derivations do
      const onAccent = "0 0% 100%";
      const lightSeed = customAccent.light;
      const buttonSeed = dark && customAccent.dark ? customAccent.dark : lightSeed;
      root.style.setProperty("--primary", formatHsl(hexToHsl(buttonSeed)));
      root.style.setProperty("--primary-foreground", onAccent);
      root.style.setProperty("--ring", formatHsl(hexToHsl(dark ? customAccent.bright : lightSeed)));
      // a subtree painted light inside a dark page keeps the un-adapted accent
      root.style.setProperty("--primary-base", formatHsl(hexToHsl(lightSeed)));
      root.style.setProperty("--primary-base-foreground", onAccent);
      root.style.setProperty(
        "--accent-soft",
        formatHsl(hexToHsl(dark ? mixHex(customAccent.bright, 14, DARK_SURFACE) : mixHex(lightSeed, 10, "#ffffff"))),
      );
      root.style.setProperty(
        "--accent-soft-foreground",
        formatHsl(hexToHsl(dark ? mixHex(customAccent.bright, 80, "#ffffff") : mixHex(lightSeed, 80, "#000000"))),
      );
      touched.push(
        "--primary",
        "--primary-foreground",
        "--ring",
        "--primary-base",
        "--primary-base-foreground",
        "--accent-soft",
        "--accent-soft-foreground",
      );
    }
    if (typeof themeData?.borderRadius === "number") {
      root.style.setProperty("--radius", `${themeData.borderRadius / 16}rem`);
      touched.push("--radius");
    }

    // "dark" is antd's darkAlgorithm and "compact" its compactAlgorithm
    const forceDark = themeData?.themeType === "dark" && resolvedTheme !== "dark";
    if (forceDark) {
      root.classList.add("dark");
    }
    const compact = themeData?.isCompact === true;
    if (compact) {
      root.classList.add("compact");
    }

    return () => {
      touched.forEach((name) => root.style.removeProperty(name));
      if (forceDark) {
        root.classList.remove("dark");
      }
      if (compact) {
        root.classList.remove("compact");
      }
    };
  }, [themeData, resolvedTheme, customAccent]);
}

/**
 * Applies the organization/application `themeData` to the shadcn CSS variables.
 * Before the application has loaded, the backend's `organizationTheme` cookie
 * (set by routers/theme_filter.go) supplies the same values, which is what keeps
 * a branded sign-in page from flashing the default palette first.
 *
 * `enabled` is false for the application editor's preview: the previewed
 * application must not restyle the console it is embedded in.
 */
export function useApplicationTheme(application: any, enabled = true) {
  const themeData: ThemeData = React.useMemo(() => {
    if (application) {
      return Setting.getThemeData(application.organizationObj, application);
    }
    const cookieTheme = readCookie("organizationTheme");
    if (cookieTheme && cookieTheme !== "null") {
      try {
        return JSON.parse(cookieTheme);
      } catch {
        // fall through to the default
      }
    }
    return Conf.ThemeDefault;
  }, [application]);

  useThemeData(enabled ? themeData : undefined);
  return themeData;
}

function readCookie(name: string): string | undefined {
  try {
    return Cookie.parse(document.cookie)[name];
  } catch {
    return undefined;
  }
}

/** The logo the backend put in a cookie, used until the application loads. */
export function getOrganizationCookieChrome() {
  const logo = readCookie("organizationLogo");
  const logoDark = readCookie("organizationLogoDark");
  return {
    logo: logo ? logo : undefined,
    logoDark: logoDark ? logoDark : undefined,
  };
}

/**
 * Sets the tab title and favicon from the application, falling back to the
 * organization. Port of Setting.renderHelmet(), which used react-helmet.
 */
export function useApplicationHelmet(application: any) {
  React.useEffect(() => {
    const organization = application?.organizationObj;
    if (!application || !organization) {
      return;
    }

    // the application's own title/favicon win over the organization's
    const title = application.title || organization.displayName;
    const favicon = application.favicon || organization.favicon;

    const previousTitle = document.title;
    if (title) {
      document.title = title;
    }

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    const previousHref = link?.getAttribute("href") ?? null;
    if (favicon) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = favicon;
    }

    return () => {
      document.title = previousTitle;
      if (favicon && link) {
        if (previousHref === null) {
          link.remove();
        } else {
          link.href = previousHref;
        }
      }
    };
  }, [application]);
}

/** what the tab shows before an organization has been loaded */
const DEFAULT_FAVICON = "/img/favicon.png";

/**
 * The console's tab title and favicon, which follow the signed-in user's
 * organization. Signed out, the favicon falls back to Masdoor's own — the same
 * two <Helmet> blocks web/src/App.js renders.
 */
export function useAccountHelmet(account: any) {
  const organization = account?.organization;
  const title = organization?.displayName;
  const favicon = organization?.favicon || DEFAULT_FAVICON;

  React.useEffect(() => {
    if (title) {
      document.title = title;
    }

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [title, favicon]);
}

const customHeadLoadedIds = new Set<string>();

/**
 * Appends an application's custom HTML (`headerHtml` / `pageHtml`) to <head>,
 * re-creating <script> nodes of trusted applications so the browser actually
 * executes them. Port of web/src/basic/CustomHead.js — like it, each id is
 * injected only once per page load, since the injected markup is not tracked for
 * removal.
 */
export function useCustomHead(html: string | undefined | null, id = "default", trusted = false) {
  React.useEffect(() => {
    if (!html || customHeadLoadedIds.has(id)) {
      return;
    }

    const container = document.createElement("div");
    container.innerHTML = getSafeHtml(html, trusted);

    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }
      let element = node as Element;
      if (trusted && element.localName === "script") {
        const script = document.createElement("script");
        Array.from(element.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.text = element.textContent ?? "";
        element = script;
      }
      element.setAttribute("app-custom-head", id);
      document.head.appendChild(element);
    });

    customHeadLoadedIds.add(id);
  }, [html, id, trusted]);
}
