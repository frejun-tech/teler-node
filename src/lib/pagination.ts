import type { CursorFilters, CursorResponse } from "../types/common";

/**
 * Lazily walks a cursor-paginated list endpoint, yielding one item at a
 * time and fetching the next page only as the caller consumes past the
 * current one. Breaking out of a `for await` loop early never triggers
 * an extra fetch.
 *
 * Stops when `hasMore` is false, `nextCursor` is null/undefined, or a
 * page's `nextCursor` is identical to the `cursorAfter` just requested
 * (guards against an unattended infinite loop on a non-advancing or
 * malformed server response).
 *
 * @param fetchPage - The list method to page through, e.g. `(f) => resource.list(f)`.
 * @param filters - Optional initial filters. `cursorAfter`, if set, seeds the first request.
 */
export async function* autoPaginate<T, F extends CursorFilters>(
  fetchPage: (filters?: F) => Promise<CursorResponse<T>>,
  filters?: F
): AsyncGenerator<T, void, undefined> {
  let cursorAfter = filters?.cursorAfter;

  for (;;) {
    const page = await fetchPage({ ...filters, cursorAfter } as F);

    for (const item of page.data) {
      yield item;
    }

    if (!page.hasMore || !page.nextCursor || page.nextCursor === cursorAfter) {
      return;
    }
    cursorAfter = page.nextCursor;
  }
}
