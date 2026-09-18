import { describe, it, expect, vi } from "vitest";
import { autoPaginate } from "@/lib/pagination";
import type { CursorResponse, CursorFilters } from "@/types/common";

describe("autoPaginate", () => {
  it("concatenates items across multiple pages in order", async () => {
    const pages = [
      {
        data: [{ id: "1" }, { id: "2" }],
        nextCursor: "c1",
        hasMore: true,
        previousCursor: null
      },
      {
        data: [{ id: "3" }],
        nextCursor: null,
        hasMore: false,
        previousCursor: "c1"
      }
    ];
    const fetchPage = vi
      .fn()
      .mockImplementation((filters) =>
        Promise.resolve(pages[filters?.cursorAfter ? 1 : 0])
      );

    const items = [];
    for await (const item of autoPaginate(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("stops on hasMore: false", async () => {
    const page: CursorResponse<{ id: string }> = {
      data: [{ id: "1" }],
      nextCursor: "c1",
      hasMore: false,
      previousCursor: null
    };
    const fetchPage = vi.fn().mockResolvedValue(page);

    const items = [];
    for await (const item of autoPaginate(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "1" }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("stops on nextCursor: null even if hasMore: true", async () => {
    const page: CursorResponse<{ id: string }> = {
      data: [{ id: "1" }],
      nextCursor: null,
      hasMore: true,
      previousCursor: null
    };
    const fetchPage = vi.fn().mockResolvedValue(page);

    const items = [];
    for await (const item of autoPaginate(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "1" }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("respects caller-supplied initial cursorAfter", async () => {
    const page: CursorResponse<{ id: string }> = {
      data: [{ id: "2" }],
      nextCursor: null,
      hasMore: false,
      previousCursor: "seed"
    };
    const fetchPage = vi.fn().mockResolvedValue(page);

    const items = [];
    for await (const item of autoPaginate(fetchPage, {
      cursorAfter: "seed"
    } as any)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "2" }]);
    expect(fetchPage).toHaveBeenCalledWith({ cursorAfter: "seed" });
  });

  it("continues after an empty-data page", async () => {
    const pages = [
      { data: [], nextCursor: "c1", hasMore: true, previousCursor: null },
      {
        data: [{ id: "1" }],
        nextCursor: null,
        hasMore: false,
        previousCursor: "c1"
      }
    ];
    const fetchPage = vi
      .fn()
      .mockImplementation((filters) =>
        Promise.resolve(pages[filters?.cursorAfter ? 1 : 0])
      );

    const items = [];
    for await (const item of autoPaginate(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "1" }]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("stops on non-advancing cursor (guard against infinite loop)", async () => {
    const page: CursorResponse<{ id: string }> = {
      data: [{ id: "1" }],
      nextCursor: "same",
      hasMore: true,
      previousCursor: null
    };
    const fetchPage = vi.fn().mockResolvedValue(page);

    const items = [];
    for await (const item of autoPaginate(fetchPage, {
      cursorAfter: "same"
    } as any)) {
      items.push(item);
    }

    expect(items).toEqual([{ id: "1" }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("early break does not trigger extra fetch", async () => {
    const pages = [
      {
        data: [{ id: "1" }, { id: "2" }],
        nextCursor: "c1",
        hasMore: true,
        previousCursor: null
      },
      {
        data: [{ id: "3" }],
        nextCursor: null,
        hasMore: false,
        previousCursor: "c1"
      }
    ];
    const fetchPage = vi
      .fn()
      .mockImplementation((filters) =>
        Promise.resolve(pages[filters?.cursorAfter ? 1 : 0])
      );

    const items: Array<{ id: string }> = [];
    for await (const item of autoPaginate<{ id: string }, CursorFilters>(
      fetchPage as any
    )) {
      items.push(item);
      if (item.id === "1") break;
    }

    expect(items).toEqual([{ id: "1" }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
