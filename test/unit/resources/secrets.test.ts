import { describe, it, expect, beforeEach } from "vitest";
import { SecretResourceManager } from "@/resources/secrets";
import { createMockHttp, asHttp, type MockHttp } from "@test/support/mock-http";
import {
  secretFixture,
  secretRotatedFixture,
  secretListFixture,
  createSecretPayloadFixture,
  updateSecretPayloadFixture,
  rotateSecretPayloadFixture,
  secretFiltersFixture
} from "@test/support/fixtures/secrets";

describe("SecretResourceManager (unit)", () => {
  let http: MockHttp;
  let secrets: SecretResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    secrets = new SecretResourceManager(asHttp(http));
  });

  describe("create", () => {
    it("posts to /secrets with the payload and returns the created secret", async () => {
      const payload = createSecretPayloadFixture();
      const fixture = secretFixture({ name: payload.name });
      http.post.mockResolvedValue(fixture);

      const result = await secrets.create(payload);

      expect(http.post).toHaveBeenCalledWith("/secrets", payload);
      expect(http.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fixture);
    });

    it("returns a secret with the sk_ id prefix", async () => {
      const fixture = secretFixture();
      http.post.mockResolvedValue(fixture);

      const result = await secrets.create(createSecretPayloadFixture());

      expect(result.id).toMatch(/^sk_/);
    });

    it("returns the response object reference unchanged", async () => {
      const fixture = secretFixture();
      http.post.mockResolvedValue(fixture);

      const result = await secrets.create(createSecretPayloadFixture());

      expect(result).toBe(fixture);
    });

    it("propagates errors from the http layer", async () => {
      http.post.mockRejectedValue(new Error("Network error"));

      await expect(
        secrets.create(createSecretPayloadFixture())
      ).rejects.toThrow("Network error");
    });
  });

  describe("list", () => {
    it("gets /secrets with undefined when called without filters", async () => {
      http.get.mockResolvedValue(secretListFixture());

      await secrets.list();

      expect(http.get).toHaveBeenCalledWith("/secrets", undefined);
    });

    it("forwards all filter fields to the http layer", async () => {
      http.get.mockResolvedValue(secretListFixture());
      const filters = secretFiltersFixture();

      await secrets.list(filters);

      expect(http.get).toHaveBeenCalledWith("/secrets", filters);
    });

    it("forwards search-only filter correctly", async () => {
      http.get.mockResolvedValue(secretListFixture());

      await secrets.list({ search: "prod" });

      expect(http.get).toHaveBeenCalledWith("/secrets", { search: "prod" });
    });

    it("returns the response object reference unchanged", async () => {
      const response = secretListFixture();
      http.get.mockResolvedValue(response);

      const result = await secrets.list();

      expect(result).toBe(response);
    });

    it("returns a page with data, cursors, and hasMore", async () => {
      http.get.mockResolvedValue(secretListFixture());

      const result = await secrets.list();

      expect(result.data).toBeInstanceOf(Array);
      expect(result).toHaveProperty("hasMore");
      expect(result).toHaveProperty("nextCursor");
      expect(result).toHaveProperty("previousCursor");
    });

    it("propagates errors from the http layer", async () => {
      http.get.mockRejectedValue(new Error("Network error"));

      await expect(secrets.list()).rejects.toThrow("Network error");
    });
  });

  describe("retrieve", () => {
    it("gets the correct path for a given secret id", async () => {
      const fixture = secretFixture();
      http.get.mockResolvedValue(fixture);

      const result = await secrets.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/secrets/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it("returns the response object reference unchanged", async () => {
      const fixture = secretFixture();
      http.get.mockResolvedValue(fixture);

      const result = await secrets.retrieve(fixture.id);

      expect(result).toBe(fixture);
    });

    it("propagates errors from the http layer", async () => {
      http.get.mockRejectedValue(new Error("Network error"));

      await expect(
        secrets.retrieve("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ")
      ).rejects.toThrow("Network error");
    });
  });

  describe("update", () => {
    it("patches the correct path with the update payload", async () => {
      const payload = updateSecretPayloadFixture();
      const fixture = secretFixture({ name: payload.name });
      http.patch.mockResolvedValue(fixture);

      const result = await secrets.update(
        "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload
      );

      expect(http.patch).toHaveBeenCalledWith(
        "/secrets/sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result).toEqual(fixture);
    });

    it("patches correctly when only rotating the secret (no name change)", async () => {
      const payload = rotateSecretPayloadFixture();
      const fixture = secretRotatedFixture();
      http.patch.mockResolvedValue(fixture);

      const result = await secrets.update(
        "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload
      );

      expect(http.patch).toHaveBeenCalledWith(
        "/secrets/sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result.needsRotation).toBe(true);
    });

    it("returns the response object reference unchanged", async () => {
      const fixture = secretFixture();
      http.patch.mockResolvedValue(fixture);

      const result = await secrets.update(
        "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        updateSecretPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it("propagates errors from the http layer", async () => {
      http.patch.mockRejectedValue(new Error("Network error"));

      await expect(
        secrets.update(
          "sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
          updateSecretPayloadFixture()
        )
      ).rejects.toThrow("Network error");
    });
  });

  describe("delete", () => {
    it("deletes the correct path for a given secret id", async () => {
      const response = {
        success: true,
        message: "Secret deleted successfully."
      };
      http.delete.mockResolvedValue(response);

      const result = await secrets.delete("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ");

      expect(http.delete).toHaveBeenCalledWith(
        "/secrets/sk_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        { retry: undefined, baseRetryDelayMs: undefined }
      );
      expect(result).toEqual(response);
    });

    it("returns the response object reference unchanged", async () => {
      const response = { success: true, message: "Deleted." };
      http.delete.mockResolvedValue(response);

      const result = await secrets.delete("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ");

      expect(result).toBe(response);
    });

    it("propagates errors from the http layer", async () => {
      http.delete.mockRejectedValue(new Error("Network error"));

      await expect(
        secrets.delete("sk_01J5ABCDEFGHJKMNPQRSTVWXYZ")
      ).rejects.toThrow("Network error");
    });
  });
});
