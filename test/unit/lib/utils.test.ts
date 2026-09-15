import { describe, it, expect } from "vitest";
import { toSnakeCase, toCamelCase } from "@/lib/utils";

describe("toSnakeCase", () => {
  it("converts simple camelCase object keys to snake_case", () => {
    const input = {
      fromNumber: "+123456789",
      toNumber: "+987654321",
      flowUrl: "https://example.com/flow",
      statusCallbackUrl: "https://example.com/callback",
      record: true
    };

    const output = toSnakeCase(input);
    expect(output).toEqual({
      from_number: "+123456789",
      to_number: "+987654321",
      flow_url: "https://example.com/flow",
      status_callback_url: "https://example.com/callback",
      record: true
    });
  });

  it("handles nested objects and arrays", () => {
    const input = {
      voiceAppId: "app_123",
      vnIds: ["vn_1", "vn_2"],
      authCredential: {
        username: "user",
        password: "pwd"
      },
      authAddresses: [{ name: "primary", address: "192.168.1.1" }]
    };

    const output = toSnakeCase(input);
    expect(output).toEqual({
      voice_app_id: "app_123",
      vn_ids: ["vn_1", "vn_2"],
      auth_credential: {
        username: "user",
        password: "pwd"
      },
      auth_addresses: [{ name: "primary", address: "192.168.1.1" }]
    });
  });

  it("preserves null, undefined, primitive values, and Date", () => {
    const date = new Date();
    const input = {
      nullVal: null,
      undefVal: undefined,
      numVal: 42,
      boolVal: false,
      dateVal: date
    };

    const output = toSnakeCase(input);
    expect(output).toEqual({
      null_val: null,
      undef_val: undefined,
      num_val: 42,
      bool_val: false,
      date_val: date
    });
  });

  it("does not mangle keys inside customHeaders (opaque field)", () => {
    const input = {
      target: {
        kind: "pstn",
        number: "+18005550300",
        customHeaders: {
          "X-Trace-Id": "abc123",
          "X-Call-Reason": "sales"
        }
      }
    };

    const output = toSnakeCase(input);
    expect(output).toEqual({
      target: {
        kind: "pstn",
        number: "+18005550300",
        custom_headers: {
          "X-Trace-Id": "abc123",
          "X-Call-Reason": "sales"
        }
      }
    });
  });

  it("prevents prototype pollution via __proto__ key", () => {
    const pollutedInput = JSON.parse(
      '{"__proto__":{"polluted":true},"userId":"123"}'
    );
    delete (Object.prototype as any).polluted;
    toSnakeCase(pollutedInput);
    expect((Object.prototype as any).polluted).toBeUndefined();
  });
});

describe("toCamelCase", () => {
  it("converts simple snake_case object keys to camelCase", () => {
    const input = {
      from_number: "+123456789",
      to_number: "+987654321",
      flow_url: "https://example.com/flow",
      status_callback_url: "https://example.com/callback",
      record: true
    };

    const output = toCamelCase(input);
    expect(output).toEqual({
      fromNumber: "+123456789",
      toNumber: "+987654321",
      flowUrl: "https://example.com/flow",
      statusCallbackUrl: "https://example.com/callback",
      record: true
    });
  });

  it("handles nested objects and arrays", () => {
    const input = {
      voice_app_id: "app_123",
      vn_ids: ["vn_1", "vn_2"],
      auth_credential: {
        username: "user",
        password: "pwd"
      },
      auth_addresses: [{ name: "primary", address: "192.168.1.1" }]
    };

    const output = toCamelCase(input);
    expect(output).toEqual({
      voiceAppId: "app_123",
      vnIds: ["vn_1", "vn_2"],
      authCredential: {
        username: "user",
        password: "pwd"
      },
      authAddresses: [{ name: "primary", address: "192.168.1.1" }]
    });
  });

  it("preserves null, undefined, primitive values, and Date", () => {
    const date = new Date();
    const input = {
      null_val: null,
      undef_val: undefined,
      num_val: 42,
      bool_val: false,
      date_val: date
    };

    const output = toCamelCase(input);
    expect(output).toEqual({
      nullVal: null,
      undefVal: undefined,
      numVal: 42,
      boolVal: false,
      dateVal: date
    });
  });

  it("does not mangle keys inside properties (opaque field)", () => {
    const input = {
      id: "call_123",
      properties: {
        call_sid: "abc",
        "Weird-Key": "value",
        nested_field: "stays"
      }
    };

    const output = toCamelCase(input);
    expect(output).toEqual({
      id: "call_123",
      properties: {
        call_sid: "abc",
        "Weird-Key": "value",
        nested_field: "stays"
      }
    });
  });

  it("does not mangle keys inside payload (opaque field)", () => {
    const input = {
      id: "evt_123",
      payload: {
        call_sid: "abc",
        "Some-Weird-Key": "value",
        user_data: "stays"
      }
    };

    const output = toCamelCase(input);
    expect(output).toEqual({
      id: "evt_123",
      payload: {
        call_sid: "abc",
        "Some-Weird-Key": "value",
        user_data: "stays"
      }
    });
  });

  it("does not mangle keys inside custom_headers → customHeaders (opaque field)", () => {
    const input = {
      target: {
        kind: "pstn",
        number: "+18005550300",
        custom_headers: {
          "X-Trace-Id": "abc123",
          "X-Call-Reason": "sales"
        }
      }
    };

    const output = toCamelCase(input);
    expect(output).toEqual({
      target: {
        kind: "pstn",
        number: "+18005550300",
        customHeaders: {
          "X-Trace-Id": "abc123",
          "X-Call-Reason": "sales"
        }
      }
    });
  });

  it("uses null-prototype objects to prevent prototype pollution", () => {
    const input = {
      user_id: "123",
      user_name: "Alice",
      nested_data: {
        field_one: "value1",
        field_two: "value2"
      }
    };

    const output = toCamelCase(input) as Record<string, unknown>;
    expect(Object.getPrototypeOf(output)).toBeNull();

    const nested = output.nestedData as Record<string, unknown>;
    expect(Object.getPrototypeOf(nested)).toBeNull();
  });
});
