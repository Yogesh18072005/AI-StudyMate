import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loggerMiddleware } from "./middleware";

describe("loggerMiddleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes control to the next middleware", () => {
    const response = new EventEmitter();
    const next = vi.fn();

    loggerMiddleware(
      { method: "GET", url: "/api/health" },
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it("logs the request path without query-string values after the response finishes", () => {
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
    };
    response.statusCode = 200;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    loggerMiddleware(
      { method: "GET", url: "/api/chat?token=private-value" },
      response,
      vi.fn(),
    );

    expect(log).not.toHaveBeenCalled();

    response.emit("finish");

    expect(log).toHaveBeenCalledOnce();
    const message = String(log.mock.calls[0][0]);
    expect(message).toContain("GET /api/chat 200");
    expect(message).not.toContain("token");
    expect(message).not.toContain("private-value");
  });

  it("uses safe fallbacks when request metadata is missing", () => {
    const response = new EventEmitter() as EventEmitter & {
      statusCode: number;
    };
    response.statusCode = 204;
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    loggerMiddleware({}, response, vi.fn());
    response.emit("finish");

    expect(log).toHaveBeenCalledOnce();
    expect(String(log.mock.calls[0][0])).toContain("UNKNOWN / 204");
  });
});
