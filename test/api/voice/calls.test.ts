import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { createTestClient } from "@test/support/client";
import { server } from "@test/msw/server";
import { TEST_CONFIG } from "@test/support/env";
import {
  voiceCallListFixture,
  voiceCallFixture
} from "@test/support/fixtures/voice";
import {
  BadParametersException,
  InternalServerErrorException
} from "@/exceptions";

describe("Voice Calls API (integration)", () => {
  it("initiates a call through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.voice.calls.create({
      fromNumber: "+18005550100",
      toNumber: "+18005550200",
      flowUrl: "https://example.com/flow",
      statusCallbackUrl: "https://example.com/status",
      record: true
    });
    expect(result.data.id).toMatch(/^cs_/);
    expect(result.message).toBeDefined();
    expect(result.data.fromNumber).toBe("+18005550100");
  });

  it("lists voice calls", async () => {
    const client = createTestClient();
    const result = await client.voice.calls.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^cs_/);
    expect(result).toHaveProperty("hasMore");
    expect(result).toHaveProperty("nextCursor");
    expect(result).toHaveProperty("previousCursor");
  });

  it("sends query params correctly on list", async () => {
    const captured: { url: URL | null } = { url: null };
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/calls`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(voiceCallListFixture());
      })
    );
    const client = createTestClient();
    await client.voice.calls.list({
      state: "completed",
      fromNumber: "+18005550100",
      toNumber: "+18005550200",
      limit: 10
    });
    expect(captured.url?.searchParams.get("state")).toBe("completed");
    expect(captured.url?.searchParams.get("from_number")).toBe("+18005550100");
    expect(captured.url?.searchParams.get("to_number")).toBe("+18005550200");
    expect(captured.url?.searchParams.get("limit")).toBe("10");
  });

  it("retrieves a voice call through the real http stack", async () => {
    const client = createTestClient();
    const call = await client.voice.calls.retrieve(
      "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    );
    expect(call.id).toBe("cs_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(call.legs).toBeInstanceOf(Array);
  });

  it("preserves arbitrary keys inside properties without case conversion", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/calls/:id`, ({ params }) =>
        HttpResponse.json(
          voiceCallFixture({
            id: params.id as string,
            properties: {
              call_sid: "abc123",
              "Some-Weird-Key": "value",
              user_data: "stays"
            }
          })
        )
      )
    );
    const client = createTestClient();
    const call = await client.voice.calls.retrieve(
      "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    );
    expect(call.properties).toEqual({
      call_sid: "abc123",
      "Some-Weird-Key": "value",
      user_data: "stays"
    });
  });

  it("fetches voice call legs through the real http stack", async () => {
    const client = createTestClient();
    const legs = await client.voice.calls.listLegs(
      "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    );
    expect(legs.data).toBeInstanceOf(Array);
    expect(legs.data[0].id).toMatch(/^cl_/);
  });

  // --- Error Contract Tests ---

  it("propagates 400 Bad Parameters / Invalid Cursor error on list", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/calls`, () =>
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
      client.voice.calls.list({ cursorAfter: "bad_cursor" })
    ).rejects.toThrow(BadParametersException);
  });

  it("propagates 403 Forbidden error when API key is missing or invalid", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/calls`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid API Key." },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.voice.calls.list()).rejects.toMatchObject({
      name: "ForbiddenException",
      status: 403,
      message: "Invalid API Key."
    });
  });

  it("propagates 404 Not Found error with exact spec message", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/calls/:id`, () =>
        HttpResponse.json(
          { success: false, message: "The requested call was not found." },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(
      client.voice.calls.retrieve("cs_missing")
    ).rejects.toMatchObject({
      name: "NotFoundException",
      status: 404,
      message: "The requested call was not found."
    });
  });

  it("propagates 500 Internal Server Error", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/voice/calls/:id`, () =>
        HttpResponse.json(
          { success: false, message: "Internal error" },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.voice.calls.retrieve("cs_broken")).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
