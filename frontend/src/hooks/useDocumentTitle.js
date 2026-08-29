/** Shared hooks will live here in later phases. */
export function useDocumentTitle(title) {
  if (typeof document !== 'undefined' && title) {
    document.title = title;
  }
}
