import { Env } from "hono";
import { Hook } from "@hono/zod-validator";

export const processBadRequest: Hook<Record<string, any>, Env, string> = (
  result,
  c
) => {
  if (!result.success) {
    return c.text("Bad Request", 400);
  }
};
