import { Hook } from "@hono/zod-validator";
import { Env } from "hono";

export const processBadRequest: Hook<Record<string, any>, Env, string> = (
  result,
  c
) => {
  if (!result.success) {
    return c.text("Bad Request", 400);
  }
};

export const base64ToArrayBuffer = (base64: string) =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
