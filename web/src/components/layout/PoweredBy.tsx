import * as Conf from "@/Conf";
import {useIsDark} from "@/hooks/use-theme";
import * as Setting from "@/lib/setting";

/**
 * The default footer: the Masdoor wordmark, which has a light and a dark
 * variant. A deployment can replace the whole line through `Conf.CustomFooter`
 * or an organization's `footerHtml`.
 */
export function PoweredBy() {
  const isDark = useIsDark();

  if (Conf.CustomFooter !== null) {
    return <>{Conf.CustomFooter}</>;
  }

  return (
    <span className="inline-flex items-center">
      <img
        src={Setting.getLogo([isDark ? "dark" : "light"])}
        alt="Masdoor"
        height={20}
        className="h-5 w-auto"
      />
    </span>
  );
}
