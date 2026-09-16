import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { createTestClient } from "@test/support/client";
import { server } from "@test/msw/server";
import { TEST_CONFIG } from "@test/support/env";
import { secretListFixture } from "@test/support/fixtures/secrets";
import {
  BadParametersException,
  InternalServerErrorException
} from "@/exceptions";

describe("Secrets API (integration)", () => {
  it("creates a secret through the real http stack", async () => {
    const client = createTestClient();
    const result = await client.secrets.create({
      name: "My Production Secret"
    });
    expect(result.id).toMatch(/^sk_/);
    expect(result.name).toBe("My Production Secret");
    expect(result.voiceApps).toBeInstanceOf(Array);
    expect(result.sipTrunks).toBeInstanceOf(Array);
  });

  it("lists secrets", async () => {
    const client = createTestClient();
    const result = await client.secrets.list();
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].id).toMatch(/^sk_/);
    expect(result).toHaveProperty("hasMore");
    expect(result).toHaveProperty("nextCursor");
    expect(result).toHaveProperty("previousCursor");
  });

  it("sends query params correctly on list", async () => {
    const captured: { url: URL | null } = { url: null };
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets`, ({ request }) => {
        captured.url = new URL(request.url);
        return HttpResponse.json(secretListFixture());
      })
    );
    const client = createTestClient();
    await client.secrets.list({
      search: "prod_key",
      limit: 5,
      cursorAfter: "eyJpZCI6InNrXzEifQ"
    });
    expect(captured.url?.searchParams.get("search")).toBe("prod_key");
    expect(captured.url?.searchParams.get("limit")).toBe("5");
    expect(captured.url?.searchParams.get("cursor_after")).toBe(
      "eyJpZCI6InNrXzEifQ"
    );
  });

  it("retrieves a secret through the real http stack", async () => {
    const client = createTestClient();
    const secret = await client.secrets.retrieve(
      "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ"
    );
    expect(secret.id).toBe("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(secret.needsRotation).toBe(false);
  });

  it("updates a secret through the real http stack", async () => {
    const client = createTestClient();
    const updated = await client.secrets.update(
      "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
      {
        name: "Updated Name"
      }
    );
    expect(updated.id).toBe("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(updated.name).toBe("Updated Name");
  });

  it("rotates a secret through update", async () => {
    const client = createTestClient();
    const updated = await client.secrets.update(
      "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
      {
        rotate: true
      }
    );
    expect(updated.id).toBe("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ");
  });

  it("deletes a secret through the real http stack", async () => {
    const client = createTestClient();
    const res = await client.secrets.delete("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ");
    expect(res.success).toBe(true);
  });

  // --- Error Contract Tests ---

  it("propagates 400 Bad Parameters / Invalid Cursor error", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets`, () =>
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
      client.secrets.list({ cursorAfter: "invalid" })
    ).rejects.toThrow(BadParametersException);
  });

  it("propagates 403 Forbidden error when API key is missing or invalid", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets`, () =>
        HttpResponse.json(
          { success: false, message: "Invalid API Key." },
          { status: 403 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.list()).rejects.toMatchObject({
      name: "ForbiddenException",
      status: 403,
      message: "Invalid API Key."
    });
  });

  it("propagates 404 Not Found error with exact spec error message", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets/:id`, () =>
        HttpResponse.json(
          { success: false, message: "The requested secret was not found." },
          { status: 404 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.retrieve("sk_missing")).rejects.toMatchObject({
      name: "NotFoundException",
      status: 404,
      message: "The requested secret was not found."
    });
  });

  it("propagates 422 Unprocessable Request error on validation failure", async () => {
    server.use(
      http.post(`${TEST_CONFIG.baseUrl}/secrets`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "Validation Error",
            errors: [
              {
                loc: ["body", "name"],
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
    await expect(client.secrets.create({ name: "" })).rejects.toMatchObject({
      name: "UnprocessableRequestException",
      status: 422,
      param: "body.name"
    });
  });

  it("propagates 500 Internal Server Error", async () => {
    server.use(
      http.get(`${TEST_CONFIG.baseUrl}/secrets/:id`, () =>
        HttpResponse.json(
          { success: false, message: "Internal server error" },
          { status: 500 }
        )
      )
    );
    const client = createTestClient();
    await expect(client.secrets.retrieve("sk_broken")).rejects.toThrow(
      InternalServerErrorException
    );
  });
});
