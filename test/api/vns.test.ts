import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { createTestClient } from "@test/support/client";
import { server } from "@test/msw/server";
import { TEST_CONFIG } from "@test/support/env";
import {
  virtualNumberListFixture,
  virtualNumberListItemFixture
} from "@test/support/fixtures/vns";
import {
  BadParametersException,
  InternalServerErrorException
} from "@/exceptions";

describe("Virtual Numbers API (integration)", () => {
  it("lists virtual numbers through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^vn_/);
    expect(result).toHaveProperty("hasMore");
    expect(result).toHaveProperty("nextCursor");
    expect(result).toHaveProperty("previousCursor");
  });

  it("sends query params correctly on list", async () => {
    const captured: { url: URL | null } = { url: null };
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(virtualNumberListFixture());
      })
    );
    const client = createTestClient();
    await client.virtualNumbers.list({
      search: "800",
      location: ["US"],
      limit: 10
    });
    expect(captured.url?.searchParams.get("search")).toBe("800");
    expect(captured.url?.searchParams.get("location")).toBe("US");
    expect(captured.url?.searchParams.get("limit")).toBe("10");
  });

  it("listAutoPagination walks a real multi-page cursor loop for virtual numbers", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, ({ request }) => {
        const cursorAfter = new URL(request.url).searchParams.get(
          "cursor_after"
        );
        if (!cursorAfter) {
          return HttpResponse.json(
            virtualNumberListFixture({
              data: [virtualNumberListItemFixture({ id: "vn_page1" })],
              nextCursor: "page2_cursor",
              hasMore: true
            })
          );
        }
        return HttpResponse.json(
          virtualNumberListFixture({
            data: [virtualNumberListItemFixture({ id: "vn_page2" })],
            nextCursor: null,
            hasMore: false
          })
        );
      })
    );

    const client = createTestClient();
    const ids: string[] = [];
    for await (const vn of client.virtualNumbers.listAutoPagination()) {
      ids.push(vn.id);
    }

    expect(ids).toEqual(["vn_page1", "vn_page2"]);
  });

  it("updates a virtual number through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.update(
      "vn_01J5ABCDEFGHJKMNPQRSTVWXYZ",
      {
        name: "New VN Name"
      }
    );
    expect(result.id).toBe("vn_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(result.name).toBe("New VN Name");
  });

  it("assigns virtual numbers to a voice app", async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.assign({
      vnIds: ["vn_01J5ABCDEFGHJKMNPQRSTVWXYZ"],
      voiceAppId: "va_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    });
    expect(result.success).toBe(true);
  });

  it("assigns virtual numbers to a sip trunk", async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.assign({
      vnIds: ["vn_01J5ABCDEFGHJKMNPQRSTVWXYZ"],
      sipTrunkId: "st_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    });
    expect(result.success).toBe(true);
  });

  it("unassigns virtual numbers through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.virtualNumbers.unassign({
      vnIds: ["vn_01J5ABCDEFGHJKMNPQRSTVWXYZ"]
    });
    expect(result.success).toBe(true);
  });

  // --- Error Contract Tests ---

  it("propagates 400 Bad Parameters / Invalid Cursor error on list", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "The pagination cursor is invalid or has expired."
          },
          { status: 400 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.virtualNumbers.list({ cursorAfter: "bad_cursor" })
    ).rejects.toThrow(BadParametersException);
  });

  it("propagates 403 Forbidden error", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid API Key." },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.virtualNumbers.list()).rejects.toMatchObject({
      name: "ForbiddenException",
      status: 403,
      message: "Invalid API Key."
    });
  });

  it("propagates 404 Not Found error on update", async () => {
    server.use(
      http.patch(`${TEST_CONFIG.baseUrl}/virtual-numbers/:id`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "The requested virtual number was not found."
          },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.virtualNumbers.update("vn_missing", { name: "Test" })
    ).rejects.toMatchObject({
      name: "NotFoundException",
      status: 404,
      message: "The requested virtual number was not found."
    });
  });

  it("propagates 422 Unprocessable Request error on assign validation failure", async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/virtual-numbers/assign`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "Validation Error",
            errors: [
              {
                loc: ["body", "vnIds"],
                msg: "At least one VN ID required",
                type: "value_error"
              }
            ]
          },
          { status: 422 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.virtualNumbers.assign({})).rejects.toMatchObject({
      name: "UnprocessableRequestException",
      status: 422,
      param: "body.vnIds"
    });
  });

  it("propagates 500 Internal Server Error", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/virtual-numbers`, () =>
        HttpResponse.json(
          { success: false, message: "Internal server error" },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.virtualNumbers.list()).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
