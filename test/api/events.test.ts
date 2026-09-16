import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { createTestClient } from "@test/support/client";
import { server } from "@test/msw/server";
import { TEST_CONFIG } from "@test/support/env";
import { eventListFixture, eventFixture } from "@test/support/fixtures/events";

describe("Events API (integration)", () => {
  it("retrieves an event through the real http stack", async () => {
    const client = createTestClient();
    const event = await client.events.retrieve("evt_42");
    expect(event.id).toBe("evt_42");
  });

  it("lists events", async () => {
    const client = createTestClient();
    const result = await client.events.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result).toHaveProperty("hasMore");
    expect(result).toHaveProperty("nextCursor");
    expect(result).toHaveProperty("previousCursor");
  });

  it("sends query params correctly on list", async () => {
    const captured: { url: URL | null } = { url: null };
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(eventListFixture());
      })
    );
    const client = createTestClient();
    await client.events.list({ callId: "call_1" });
    expect(captured.url?.searchParams.get("call_id")).toBe("call_1");
  });

  it("propagates 404 errors from the backend", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events/:id`, () =>
        HttpResponse.json(
          { success: false, message: "Event not found" },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.events.retrieve("evt_missing")).rejects.toMatchObject({
      name: "NotFoundException",
      status: 404
    });
  });

  it("propagates 500 errors from the backend", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events/:id`, () =>
        HttpResponse.json(
          { success: false, message: "Internal server error" },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.events.retrieve("evt_broken")).rejects.toMatchObject({
      name: "InternalServerErrorException"
    });
  });

  it("redelivers an event through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.events.redeliver("evt_123");
    expect(result.eventId).toBe("evt_123");
  });

  it("preserves arbitrary keys inside payload without case conversion", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events/:id`, () =>
        HttpResponse.json(
          {
            id: "evt_123",
            accountId: "acc_123",
            callId: "call_123",
            sipTrunkId: "st_123",
            legId: "leg_123",
            type: "call.created",
            apiVersion: "2024-01-01",
            occurredAt: "2024-01-01T00:00:00Z",
            payload: {
              call_sid: "abc123",
              "Some-Weird-Key": "value",
              user_data: "stays"
            },
            deliveryStatus: "delivered",
            attemptCount: 1,
            lastAttemptAt: "2024-01-01T00:00:00Z",
            lastStatusCode: 200,
            lastError: "",
            deliveredAt: "2024-01-01T00:00:00Z",
            createdAt: "2024-01-01T00:00:00Z"
          },
          { status: 200 }
        )
      )
    );
    const client = createTestClient();
    const event = await client.events.retrieve("evt_123");
    expect(event.payload).toEqual({
      call_sid: "abc123",
      "Some-Weird-Key": "value",
      user_data: "stays"
    });
  });

  it("listAutoPagination walks a real multi-page cursor loop", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events`, ({ request }) => {
        const cursorAfter = new URL(request.url).searchParams.get(
          "cursor_after"
        );
        if (!cursorAfter) {
          return HttpResponse.json(
            eventListFixture({
              data: [eventFixture({ id: "evt_page1" })],
              nextCursor: "page2_cursor",
              hasMore: true
            })
          );
        }
        return HttpResponse.json(
          eventListFixture({
            data: [eventFixture({ id: "evt_page2" })],
            nextCursor: null,
            hasMore: false
          })
        );
      })
    );

    const client = createTestClient();
    const ids: string[] = [];
    for await (const event of client.events.listAutoPagination()) {
      ids.push(event.id);
    }

    expect(ids).toEqual(["evt_page1", "evt_page2"]);
  });

  it("listAutoPagination propagates errors from page 1 fetch", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events`, () =>
        HttpResponse.json(
          { success: false, message: "Internal server error" },
          { status: 500 }
        )
      )
    );

    const client = createTestClient();
    await expect(
      (async () => {
        for await (const event of client.events.listAutoPagination()) {
          expect(event).toBeDefined();
          break; // Error occurs on first fetch
        }
      })()
    ).rejects.toMatchObject({
      name: "InternalServerErrorException",
      status: 500
    });
  });

  it("listAutoPagination propagates errors from page 2 fetch", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/events`, ({ request }) => {
        const cursorAfter = new URL(request.url).searchParams.get(
          "cursor_after"
        );
        if (!cursorAfter) {
          return HttpResponse.json(
            eventListFixture({
              data: [eventFixture({ id: "evt_page1" })],
              nextCursor: "page2_cursor",
              hasMore: true
            })
          );
        }
        // Page 2 fetch fails
        return HttpResponse.json(
          { success: false, message: "Service temporarily unavailable" },
          { status: 503 }
        );
      })
    );

    const client = createTestClient();
    await expect(
      (async () => {
        for await (const event of client.events.listAutoPagination()) {
          // Gets page 1 items fine, but fails on page 2 fetch
          if (event.id === "evt_page1") {
            // After yielding page 1 item, next iteration should fail
          }
        }
      })()
    ).rejects.toMatchObject({
      name: "InternalServerErrorException",
      status: 503
    });
  });
});
