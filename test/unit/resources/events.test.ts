import { describe, it, expect, beforeEach } from "vitest";
import { EventResourceManager } from "@/resources/events";
import { createMockHttp, asHttp, type MockHttp } from "@test/support/mock-http";
import {
  eventFiltersFixture,
  eventFixture,
  eventListFixture,
  eventRedeliverFixture
} from "@test/support/fixtures/events";

describe("EventResourceManager (unit)", () => {
  let http: MockHttp;
  let events: EventResourceManager;

  beforeEach(() => {
    http = createMockHttp();
    events = new EventResourceManager(asHttp(http));
  });

  describe("retrieve", () => {
    it("retrieves an event by id", async () => {
      const fixture = eventFixture();
      http.get.mockResolvedValue(fixture);

      const result = await events.retrieve(fixture.id);

      expect(http.get).toHaveBeenCalledWith(`/events/${fixture.id}`);
      expect(result).toEqual(fixture);
    });

    it("propagates errors from the http layer on retrieve", async () => {
      http.get.mockRejectedValue(new Error("Network error"));
      await expect(events.retrieve("evt_123")).rejects.toThrow("Network error");
    });
  });

  describe("list", () => {
    it("calls list with no filters", async () => {
      http.get.mockResolvedValue(eventListFixture());
      await events.list();
      expect(http.get).toHaveBeenCalledWith("/events", undefined);
    });

    it("forwards all filter fields correctly", async () => {
      http.get.mockResolvedValue(eventListFixture());
      const filters = eventFiltersFixture();

      await events.list(filters);

      expect(http.get).toHaveBeenCalledWith("/events", filters);
    });

    it("propagates errors from the http layer on list", async () => {
      http.get.mockRejectedValue(new Error("Network error"));
      await expect(events.list()).rejects.toThrow("Network error");
    });

    it("returns the response object reference unchanged", async () => {
      const response = eventListFixture();
      http.get.mockResolvedValue(response);

      const result = await events.list();

      expect(result).toBe(response);
    });
  });

  describe("redeliver", () => {
    it("redelivers an event", async () => {
      const fixture = eventRedeliverFixture({ eventId: "evt_123" });
      http.post.mockResolvedValue(fixture);

      const result = await events.redeliver("evt_123");

      expect(http.post).toHaveBeenCalledWith("/events/evt_123/redeliver");
      expect(result).toEqual(fixture);
    });

    it("propagates errors from the http layer on redeliver", async () => {
      http.post.mockRejectedValue(new Error("Network error"));
      await expect(events.redeliver("evt_123")).rejects.toThrow(
        "Network error"
      );
    });

    it("returns the response object reference unchanged", async () => {
      const response = eventRedeliverFixture();
      http.post.mockResolvedValue(response);

      const result = await events.redeliver("evt_123");

      expect(result).toBe(response);
    });
  });
});
