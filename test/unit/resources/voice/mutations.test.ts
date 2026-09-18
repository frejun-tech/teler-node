import { describe, it, expect, beforeEach } from "vitest";
import { MutationResourceManager } from "@/resources/voice/mutations";
import { createMockHttp, asHttp, type MockHttp } from "@test/support/mock-http";
import {
  hangupPayloadFixture,
  mutePayloadFixture,
  dtmfPayloadFixture,
  playPayloadFixture,
  mutationResponseFixture
} from "@test/support/fixtures/voice";

describe("MutationResourceManager (unit)", () => {
  let http: MockHttp;
  let mutations: MutationResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    mutations = new MutationResourceManager(asHttp(http));
  });

  // --- hangup ---

  describe("hangup", () => {
    it("posts to /voice/calls/:id/hangup with payload and default Idempotency-Key header", async () => {
      const payload = hangupPayloadFixture();
      const fixture = mutationResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await mutations.hangup(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/hangup",
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": expect.any(String)
          })
        })
      );
      expect(result).toEqual(fixture);
    });

    it("passes custom idempotencyKey when provided", async () => {
      const payload = hangupPayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.hangup(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "custom_idem_123"
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/hangup",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "custom_idem_123" }
        })
      );
    });

    it("passes retry and baseRetryDelayMs through when provided", async () => {
      const payload = hangupPayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.hangup(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "custom_idem_123",
        true,
        2500
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/hangup",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "custom_idem_123" },
          retry: true,
          baseRetryDelayMs: 2500
        })
      );
    });

    it("returns the response object reference unchanged", async () => {
      const fixture = mutationResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await mutations.hangup(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        hangupPayloadFixture()
      );

      expect(result).toBe(fixture);
    });

    it("propagates errors from the http layer", async () => {
      http.post.mockRejectedValue(new Error("Network error"));

      await expect(
        mutations.hangup(
          "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
          hangupPayloadFixture()
        )
      ).rejects.toThrow("Network error");
    });
  });

  // --- mute ---

  describe("mute", () => {
    it("posts to /voice/calls/:id/mute with payload and Idempotency-Key header", async () => {
      const payload = mutePayloadFixture();
      const fixture = mutationResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await mutations.mute(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/mute",
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": expect.any(String)
          })
        })
      );
      expect(result).toEqual(fixture);
    });

    it("passes custom idempotencyKey when provided", async () => {
      const payload = mutePayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.mute(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "mute_idem_456"
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/mute",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "mute_idem_456" }
        })
      );
    });

    it("passes retry and baseRetryDelayMs through when provided", async () => {
      const payload = mutePayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.mute(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "mute_idem_456",
        true,
        1500
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/mute",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "mute_idem_456" },
          retry: true,
          baseRetryDelayMs: 1500
        })
      );
    });

    it("propagates errors from the http layer", async () => {
      http.post.mockRejectedValue(new Error("Network error"));

      await expect(
        mutations.mute("cs_01J5ABCDEFGHJKMNPQRSTVWXYZ", mutePayloadFixture())
      ).rejects.toThrow("Network error");
    });
  });

  // --- dtmf ---

  describe("dtmf", () => {
    it("posts to /voice/calls/:id/dtmf with payload and Idempotency-Key header", async () => {
      const payload = dtmfPayloadFixture();
      const fixture = mutationResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await mutations.dtmf(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/dtmf",
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": expect.any(String)
          })
        })
      );
      expect(result).toEqual(fixture);
    });

    it("passes custom idempotencyKey when provided", async () => {
      const payload = dtmfPayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.dtmf(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "dtmf_idem_789"
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/dtmf",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "dtmf_idem_789" }
        })
      );
    });

    it("passes retry and baseRetryDelayMs through when provided", async () => {
      const payload = dtmfPayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.dtmf(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "dtmf_idem_789",
        true,
        4000
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/dtmf",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "dtmf_idem_789" },
          retry: true,
          baseRetryDelayMs: 4000
        })
      );
    });

    it("propagates errors from the http layer", async () => {
      http.post.mockRejectedValue(new Error("Network error"));

      await expect(
        mutations.dtmf("cs_01J5ABCDEFGHJKMNPQRSTVWXYZ", dtmfPayloadFixture())
      ).rejects.toThrow("Network error");
    });
  });

  // --- play ---

  describe("play", () => {
    it("posts to /voice/calls/:id/play with payload and Idempotency-Key header", async () => {
      const payload = playPayloadFixture();
      const fixture = mutationResponseFixture();
      http.post.mockResolvedValue(fixture);

      const result = await mutations.play(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/play",
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Idempotency-Key": expect.any(String)
          })
        })
      );
      expect(result).toEqual(fixture);
    });

    it("passes custom idempotencyKey when provided", async () => {
      const payload = playPayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.play(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "play_idem_abc"
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/play",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "play_idem_abc" }
        })
      );
    });

    it("passes retry and baseRetryDelayMs through when provided", async () => {
      const payload = playPayloadFixture();
      http.post.mockResolvedValue(mutationResponseFixture());

      await mutations.play(
        "cs_01J5ABCDEFGHJKMNPQRSTVWXYZ",
        payload,
        "play_idem_abc",
        true,
        3500
      );

      expect(http.post).toHaveBeenCalledWith(
        "/voice/calls/cs_01J5ABCDEFGHJKMNPQRSTVWXYZ/play",
        payload,
        expect.objectContaining({
          headers: { "Idempotency-Key": "play_idem_abc" },
          retry: true,
          baseRetryDelayMs: 3500
        })
      );
    });

    it("propagates errors from the http layer", async () => {
      http.post.mockRejectedValue(new Error("Network error"));

      await expect(
        mutations.play("cs_01J5ABCDEFGHJKMNPQRSTVWXYZ", playPayloadFixture())
      ).rejects.toThrow("Network error");
    });
  });
});
