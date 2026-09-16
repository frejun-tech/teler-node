import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { createTestClient } from "@test/support/client";
import { server } from "@test/msw/server";
import { TEST_CONFIG } from "@test/support/env";
import { voiceAppListFixture } from "@test/support/fixtures/voice";
import { Status } from "@/types/common";
import {
  BadParametersException,
  InternalServerErrorException
} from "@/exceptions";

describe("Voice Apps API (integration)", () => {
  it("creates a voice app through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.voice.apps.create({
      name: "Customer Support App",
      flowUrl: "https://example.com/flow",
      webhookUrl: "https://example.com/webhook"
    });
    expect(result.id).toMatch(/^va_/);
    expect(result.name).toBe("Customer Support App");
    expect(result.status).toBe(Status.ACTIVE);
  });

  it("lists voice apps", async () => {
    const client = createTestClient();
    const result = await client.voice.apps.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^va_/);
    expect(result).toHaveProperty("hasMore");
    expect(result).toHaveProperty("nextCursor");
    expect(result).toHaveProperty("previousCursor");
  });

  it("sends query params correctly on list", async () => {
    const captured: { url: URL | null } = { url: null };
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/apps`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(voiceAppListFixture());
      })
    );
    const client = createTestClient();
    await client.voice.apps.list({
      search: "Support",
      status: [Status.ACTIVE],
      limit: 10
    });
    expect(captured.url?.searchParams.get("search")).toBe("Support");
    expect(captured.url?.searchParams.get("status")).toBe("active");
    expect(captured.url?.searchParams.get("limit")).toBe("10");
  });

  it("retrieves a voice app through the real http stack", async () => {
    const client = createTestClient();
    const app = await client.voice.apps.retrieve(
      "va_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    );
    expect(app.id).toBe("va_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(app.webhookApiVersion).toBeDefined();
  });

  it("updates a voice app through the real http stack", async () => {
    const client = createTestClient();
    const updated = await client.voice.apps.update(
      "va_01J5ABCDEFGHJKMNPQRSTVWXYZ",
      {
        name: "Updated Voice App Name"
      }
    );
    expect(updated.id).toBe("va_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(updated.name).toBe("Updated Voice App Name");
  });

  it("deletes a voice app through the real http stack", async () => {
    const client = createTestClient();
    const res = await client.voice.apps.delete("va_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(res.success).toBe(true);
  });

  it("lists virtual numbers assigned to a voice app", async () => {
    const client = createTestClient();
    const result = await client.voice.apps.listVirtualNumbers(
      "va_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    );
    expect(result.data).toBeInstanceOf(Array);
    expect(result).toHaveProperty("hasMore");
  });

  // --- Error Contract Tests ---

  it("propagates 400 Bad Parameters / Invalid Cursor error on list", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/apps`, () =>
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
      client.voice.apps.list({ cursorAfter: "bad_cursor" })
    ).rejects.toThrow(BadParametersException);
  });

  it("propagates 403 Forbidden error when API key is missing or invalid", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/apps`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid API Key." },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.voice.apps.list()).rejects.toMatchObject({
      name: "ForbiddenException",
      status: 403,
      message: "Invalid API Key."
    });
  });

  it("propagates 404 Not Found error with exact spec message", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/apps/:id`, () =>
        HttpResponse.json(
          { success: false, message: "The requested voice app was not found." },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.apps.retrieve("va_missing")
    ).rejects.toMatchObject({
      name: "NotFoundException",
      status: 404,
      message: "The requested voice app was not found."
    });
  });

  it("propagates 422 Unprocessable Request error on invalid create payload", async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/voice/apps`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "Validation Error",
            errors: [
              {
                loc: ["body", "flowUrl"],
                msg: "field required",
                type: "value_error"
              }
            ]
          },
          { status: 422 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.apps.create({
        name: "Incomplete App",
        flowUrl: "",
        webhookUrl: ""
      })
    ).rejects.toMatchObject({
      name: "UnprocessableRequestException",
      status: 422,
      param: "body.flowUrl"
    });
  });

  it("propagates 500 Internal Server Error", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/apps/:id`, () =>
        HttpResponse.json(
          { success: false, message: "Internal error" },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.voice.apps.retrieve("va_broken")).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
