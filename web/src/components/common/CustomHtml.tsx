import * as React from "react";
import {getSafeHtml} from "@/lib/custom-html";
import * as Setting from "@/lib/setting";

interface CustomHtmlProps {
  html?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/** Renders application-supplied HTML after sanitizing it. */
export function CustomHtml({html, className, style}: CustomHtmlProps) {
  if (!html) {
    return null;
  }

  return <div className={className} style={style} dangerouslySetInnerHTML={{__html: getSafeHtml(html)}} />;
}

/** A `customCss` / `formCss` value, injected as a stylesheet. */
export function CustomStyle({css}: {css?: string | null}) {
  const inner = Setting.getStyleInnerCss(css);
  if (!inner || inner.trim() === "") {
    return null;
  }
  return <style dangerouslySetInnerHTML={{__html: inner}} />;
}
