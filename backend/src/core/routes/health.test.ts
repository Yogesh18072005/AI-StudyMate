import { describe, expect, it, vi } from "vitest";
import { healthRoutes } from "./health";

describe("healthRoutes", () => {
  it("registers a health endpoint with a machine-readable response", () => {
    const get = vi.fn();
    healthRoutes({ get });

    expect(get).toHaveBeenCalledOnce();
    expect(get).toHaveBeenCalledWith("/healthz", expect.any(Function));

    const handler = get.mock.calls[0][1];
    const send = vi.fn();
    handler({}, { send });

    expect(send).toHaveBeenCalledOnce();
    const payload = send.mock.calls[0][0];
    expect(payload).toMatchObject({
      ok: true,
      service: "ai-studymate-backend",
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(payload.timestamp))).toBe(false);
  });
});
