import * as React from "react";
import i18next from "i18next";
import {useLocation} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import * as Provider from "@/auth/Provider";
import * as Setting from "@/lib/setting";

interface ProviderButtonsProps {
  application: any;
  /** "signup" | "signin" | "link" */
  method: "signup" | "signin" | "link";
  /** the item rule: "big" for a labelled button per provider, "small" for a logo grid */
  rule?: string;
  /** return false to swallow the click, e.g. on an unaccepted agreement */
  onBeforeClick?: () => boolean;
  /** return true when the page handles the provider itself instead of leaving for it */
  onProvider?: (providerItem: any) => boolean;
}

/** The providers an application offers for that method, in the order it lists them. */
export function getVisibleProviders(application: any, method: "signup" | "signin" | "link") {
  return (application?.providers ?? []).filter((item: any) =>
    method === "signup" ? Setting.isProviderVisibleForSignUp(item) : Setting.isProviderVisibleForSignIn(item),
  );
}


export function ProviderButtons({application, method, rule, onBeforeClick, onProvider}: ProviderButtonsProps) {
  const location = useLocation();
  const items = getVisibleProviders(application, method);

  const goTo = (providerItem: any) => {
    const provider = providerItem.provider;


    const url = Provider.getAuthUrl(application, provider, method);
    if (url) {
      Setting.setSigninLanguage(Setting.getLanguage());
      Setting.goToLink(url);
    }
  };

  /**
   * `?provider_hint=<name>` skips the picker and goes straight to that provider.
   * `routers/lightweight_auth_filter.go` serves a static page that makes the same
   * hop without downloading the bundle; this is what happens when that page is
   * unavailable or hands the request back, and it is what the antd login page did
   * inline while rendering the buttons.
   */
  const hint = method === "link" ? null : new URLSearchParams(location.search).get("provider_hint");
  const hintedName = items.find((item: any) => item.provider?.name === hint)?.provider?.name;
  const goToRef = React.useRef(goTo);
  goToRef.current = goTo;

  React.useEffect(() => {
    if (!hintedName) {
      return;
    }
    goToRef.current(items.find((item: any) => item.provider?.name === hintedName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hintedName]);

  const onClick = (providerItem: any) => {
    if (onBeforeClick && onBeforeClick() === false) {
      return;
    }
    goTo(providerItem);
  };

  if (items.length === 0) {
    return null;
  }

  // "big" is a labelled button per provider, "small" a grid of logos; without a
  // rule a short list still gets the buttons and a long one the grid.
  const big = rule === "big" || (rule !== "small" && items.length <= 3);
  if (big) {
    // gaps are the buttons' own margins, so the default "Providers" CSS (.provider-big-img margin-bottom) applies to every gap
    return (
      <div className="flex flex-col">
        {items.map((item: any) => (
          <Button
            key={item.name}
            type="button"
            variant="outline"
            className="provider-big-img mb-2 w-full justify-start gap-3 px-4 font-normal last:mb-0"
            onClick={() => onClick(item)}
          >
            <img
              src={Setting.getProviderLogoURL(item.provider)}
              alt={item.provider.displayName}
              className="h-5 w-5 shrink-0 object-contain"
            />
            <span className="min-w-0 flex-1 truncate text-center">
              {i18next.t("login:Sign in with {type}").replace("{type}", item.provider.displayName || item.provider.type)}
            </span>
            {/* balances the logo, so the label stays centred in the button */}
            <span className="h-5 w-5 shrink-0" aria-hidden />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {items.map((item: any) => (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onClick(item)}
              className="flex h-11 w-11 items-center justify-center rounded-control border bg-card transition-colors hover:bg-hover"
            >
              <img
                src={Setting.getProviderLogoURL(item.provider)}
                alt={item.provider.displayName}
                className="provider-img h-6 w-6 object-contain"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>{item.provider.displayName || item.provider.type}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
