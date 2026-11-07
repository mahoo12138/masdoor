import DOMPurify from "dompurify";

// DOMPurify drops `target`, which would open a footer's link over the page it is on;
// a link kept with it must not hand the opened page a reference back to this one
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/**
 * Application HTML slots are sanitized for every author, including global admins:
 * the backend validates them the same way, so nothing can plant a script on the
 * Masdoor origin where users type their credentials.
 */
export function getSafeHtml(html: string): string {
  return DOMPurify.sanitize(html, {FORCE_BODY: true, ADD_ATTR: ["target"]});
}
