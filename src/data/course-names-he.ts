/**
 * Course names come from the Shnaton API itself: the catalog's `name` field
 * is the official Hebrew name (see scripts/scrape-shnaton.js), with English
 * available in `nameEn`. The old hand-written translation map that lived
 * here drifted from the official names and has been removed.
 *
 * The helper is kept so existing call sites keep compiling; callers pass
 * `course.name` as the fallback, which is already the Hebrew name.
 */
export function getCourseNameHe(_id: string, fallback: string): string {
  return fallback;
}
