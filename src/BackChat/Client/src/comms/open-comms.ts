import { UMB_EDIT_DOCUMENT_WORKSPACE_PATH_PATTERN } from "@umbraco-cms/backoffice/document";

const PENDING_KEY = "backchat:open-comms";

/**
 * Opens a document on its comms tab. A link can't name the tab directly, because the
 * variant (culture) comes between the document and the tab in the URL and the caller
 * doesn't know it. So this opens the document and leaves a note; the document workspace
 * picks it up once it has routed to a variant and moves to the tab.
 */
export function openDocumentComms(documentKey: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, documentKey);
  } catch {
    // Without storage the document still opens, just on its first tab
  }
  window.history.pushState({}, "", UMB_EDIT_DOCUMENT_WORKSPACE_PATH_PATTERN.generateAbsolute({ unique: documentKey }));
}

/** Called by the document workspace. Moves to the comms tab if a link asked for it. */
export function takePendingComms(documentKey: string, viewPathname: string) {
  let pending: string | null = null;
  try {
    pending = sessionStorage.getItem(PENDING_KEY);
  } catch {
    return;
  }
  if (pending !== documentKey) return;

  // Wait for the workspace to add the variant to the URL, then go to the tab under it
  const marker = `/edit/${documentKey}/`;
  let tries = 0;
  const move = () => {
    const path = window.location.pathname;
    const index = path.indexOf(marker);
    const variant = index >= 0 ? path.substring(index + marker.length).split("/")[0] : "";
    if (variant) {
      sessionStorage.removeItem(PENDING_KEY);
      window.history.replaceState({}, "", `${path.substring(0, index + marker.length)}${variant}/view/${viewPathname}`);
    } else if (tries++ < 20) {
      setTimeout(move, 100);
    }
  };
  move();
}
