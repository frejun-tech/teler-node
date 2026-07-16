import type { CursorResponse } from "../types/common";

export interface RawCursorResponse<TRaw> extends CursorResponse {
  data: TRaw[];
}

export function toCursorResponse<TRaw, TResource>(
    body: RawCursorResponse<TRaw>,
    mapItem: (item: TRaw) => TResource
): CursorResponse & { data: TResource[] } {
    return {
        data: body.data.map(mapItem),
        next_cursor: body.next_cursor,
        previous_cursor: body.previous_cursor,
        has_more: body.has_more,
    };
}